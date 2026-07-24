import fs from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'
import pLimit from 'p-limit'
import {
  fetchNotionPageBlocks,
  getPageBlockCacheKey
} from '@/lib/db/notion/getPostBlocks'
import { getDataFromCache } from '@/lib/cache/cache_manager'
import { getBuildSessionPath } from '@/lib/cache/build_session'
import {
  getBuildPrefetchConcurrency,
  isBuildPrefetchEnabled,
  logBuildEnvSummary
} from '@/lib/build/buildEnv'

interface PrefetchPage {
  id: string
  type?: string | undefined
  status?: string | undefined
  publishDate?: string | number | Date | undefined
  lastEditedDate?: string | number | Date | undefined
}

interface PrefetchLockPayload {
  token: string | null
  pid: number
  acquiredAt: number
  heartbeatAt: number
}

type PrefetchLockAttempt =
  | { acquired: true; payload: PrefetchLockPayload }
  | { acquired: false; cleaned: boolean }

type PrefetchTurn =
  | { done: true }
  | { skipped: true }
  | { done: false; payload: PrefetchLockPayload }

const PREFETCH_STALE_LOCK_MS = 5 * 60 * 1000
const PREFETCH_WAIT_TIMEOUT_MS = 15 * 60 * 1000
const PREFETCH_HEARTBEAT_INTERVAL_MS = 15 * 1000
const PREFETCH_WAIT_POLL_MS = 200

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object'
}

function asNodeError(error: unknown): NodeJS.ErrnoException {
  return error as NodeJS.ErrnoException
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function getPrefetchDoneFile(): string {
  return path.join(getBuildSessionPath('prefetch'), 'block-prefetch.done')
}

function getPrefetchSkippedFile(): string {
  return path.join(getBuildSessionPath('prefetch'), 'block-prefetch.skipped')
}

function getPrefetchLockFile(): string {
  return path.join(getBuildSessionPath('prefetch'), 'block-prefetch.lock')
}

function hasMarker(file: string): boolean {
  try {
    return fs.existsSync(file)
  } catch {
    return false
  }
}

function isDone(doneFile: string): boolean {
  return hasMarker(doneFile)
}

function isSkipped(skippedFile: string): boolean {
  return hasMarker(skippedFile)
}

function markDone(doneFile: string): void {
  fs.mkdirSync(path.dirname(doneFile), { recursive: true })
  fs.writeFileSync(doneFile, String(process.pid), 'utf8')
}

function markSkipped(skippedFile: string, reason: string): void {
  fs.mkdirSync(path.dirname(skippedFile), { recursive: true })
  fs.writeFileSync(
    skippedFile,
    JSON.stringify({ pid: process.pid, reason, at: Date.now() }),
    'utf8'
  )
}

function clearMarker(file: string): void {
  try {
    fs.rmSync(file, { force: true })
  } catch {}
}

function createPrefetchLockPayload(): PrefetchLockPayload {
  return {
    token: randomUUID(),
    pid: process.pid,
    acquiredAt: Date.now(),
    heartbeatAt: Date.now()
  }
}

function readPrefetchLock(lockFile: string): PrefetchLockPayload | null {
  try {
    if (!fs.existsSync(lockFile)) {
      return null
    }

    const raw = fs.readFileSync(lockFile, 'utf8').trim()
    if (!raw) {
      return null
    }

    try {
      const payload = JSON.parse(raw) as unknown
      if (isRecord(payload)) {
        return payload as unknown as PrefetchLockPayload
      }
    } catch {}

    const legacyPid = Number(raw)
    if (Number.isInteger(legacyPid) && legacyPid > 0) {
      const stat = fs.statSync(lockFile)
      return {
        token: null,
        pid: legacyPid,
        acquiredAt: stat.mtimeMs,
        heartbeatAt: stat.mtimeMs
      }
    }

    return null
  } catch (error) {
    if (asNodeError(error).code === 'ENOENT') {
      return null
    }
    throw error
  }
}

function writePrefetchLock(
  lockFile: string,
  payload: PrefetchLockPayload,
  flag = 'w'
): void {
  fs.mkdirSync(path.dirname(lockFile), { recursive: true })
  fs.writeFileSync(lockFile, JSON.stringify(payload), { flag })
}

function isProcessAlive(pid: number): boolean {
  if (!Number.isInteger(pid) || pid <= 0) {
    return false
  }

  try {
    process.kill(pid, 0)
    return true
  } catch (error) {
    if (asNodeError(error).code === 'EPERM') {
      return true
    }
    if (asNodeError(error).code === 'ESRCH') {
      return false
    }
    return true
  }
}

function maybeCleanupPrefetchStaleLock(
  lockFile: string,
  staleLockMs: number
): boolean {
  try {
    const stat = fs.statSync(lockFile)
    const ageMs = Date.now() - stat.mtimeMs

    if (ageMs < staleLockMs) {
      return false
    }

    const payload = readPrefetchLock(lockFile)
    if (!payload) {
      fs.rmSync(lockFile, { force: true })
      console.warn(
        `[Prefetch][pid:${process.pid}] removed malformed stale lock`
      )
      return true
    }

    if (!isProcessAlive(Number(payload.pid))) {
      fs.rmSync(lockFile, { force: true })
      console.warn(
        `[Prefetch][pid:${process.pid}] removed dead-owner lock owner:${payload.pid}`
      )
      return true
    }
  } catch (error) {
    if (asNodeError(error).code === 'ENOENT') {
      return true
    }
    console.warn('[Prefetch] failed to inspect lock', getErrorMessage(error))
  }

  return false
}

function tryAcquirePrefetchLock(
  lockFile: string,
  staleLockMs = PREFETCH_STALE_LOCK_MS
): PrefetchLockAttempt {
  const payload = createPrefetchLockPayload()

  try {
    writePrefetchLock(lockFile, payload, 'wx')
    return { acquired: true, payload }
  } catch (error) {
    if (asNodeError(error).code !== 'EEXIST') {
      throw error
    }

    const cleaned = maybeCleanupPrefetchStaleLock(lockFile, staleLockMs)
    return { acquired: false, cleaned }
  }
}

function startPrefetchHeartbeat(
  lockFile: string,
  payload: PrefetchLockPayload
): NodeJS.Timeout {
  const timer = setInterval(() => {
    try {
      const current = readPrefetchLock(lockFile)
      if (!current || current.token !== payload.token) {
        return
      }

      current.heartbeatAt = Date.now()
      writePrefetchLock(lockFile, current)
    } catch (error) {
      console.warn('[Prefetch] heartbeat failed', getErrorMessage(error))
    }
  }, PREFETCH_HEARTBEAT_INTERVAL_MS)

  if (typeof timer.unref === 'function') {
    timer.unref()
  }

  return timer
}

function releasePrefetchLock(
  lockFile: string,
  payload: PrefetchLockPayload
): void {
  try {
    const current = readPrefetchLock(lockFile)
    if (!current) {
      return
    }

    if (payload?.token && current.token && current.token !== payload.token) {
      console.warn('[Prefetch] skip release because ownership changed')
      return
    }

    fs.unlinkSync(lockFile)
  } catch (error) {
    if (asNodeError(error).code !== 'ENOENT') {
      console.warn('[Prefetch] release failed', getErrorMessage(error))
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function waitForPrefetchTurn(
  doneFile: string,
  skippedFile: string,
  lockFile: string
): Promise<PrefetchTurn> {
  const deadline = Date.now() + PREFETCH_WAIT_TIMEOUT_MS

  while (Date.now() < deadline) {
    if (isDone(doneFile)) {
      return { done: true }
    }

    const attempt = tryAcquirePrefetchLock(lockFile)
    if (attempt.acquired) {
      return { done: false, payload: attempt.payload }
    }

    if (attempt.cleaned) {
      continue
    }

    if (isSkipped(skippedFile)) {
      return { skipped: true }
    }

    await sleep(PREFETCH_WAIT_POLL_MS)
  }

  console.warn(
    `[Prefetch][pid:${process.pid}] timed out waiting for shared prefetch, skip warming for this worker`
  )
  return { skipped: true }
}

async function runPrefetchAsLockHolder(
  allPages: PrefetchPage[],
  concurrency: number,
  doneFile: string,
  skippedFile: string,
  lockFile: string,
  payload: PrefetchLockPayload
): Promise<void> {
  const heartbeat = startPrefetchHeartbeat(lockFile, payload)

  try {
    if (isDone(doneFile)) {
      console.log(`[Prefetch][pid:${process.pid}] reuse warmed cache`)
      return
    }

    clearMarker(skippedFile)

    try {
      await doPrefetch(allPages, concurrency)
    } catch (error) {
      markSkipped(
        skippedFile,
        `owner-error:${process.pid}:${getErrorMessage(error)}`
      )
      console.warn(
        `[Prefetch][pid:${process.pid}] prefetch aborted, skip warming for this build`,
        getErrorMessage(error)
      )
      return
    }

    clearMarker(skippedFile)
    markDone(doneFile)
    console.log(`[Prefetch][pid:${process.pid}] marked done`)
  } finally {
    clearInterval(heartbeat)
    releasePrefetchLock(lockFile, payload)
  }
}

/**
 * Return pages that should be generated first.
 * - First 5 in the default Notion order.
 * - Latest 5 by publishDate.
 * - Merged with duplicate pages removed for initial ISR paths.
 */
export function getPriorityPages<TPage extends PrefetchPage>(
  allPages: TPage[] | null | undefined
): TPage[] {
  const published = (allPages ?? []).filter(
    page => page.type === 'Post' && page.status === 'Published'
  )

  const top5Default = published.slice(0, 5)
  const top5Latest = [...published]
    .sort(
      (a, b) =>
        new Date(b.publishDate as string | number | Date).getTime() -
        new Date(a.publishDate as string | number | Date).getTime()
    )
    .slice(0, 5)

  const seen = new Set<string>()
  return [...top5Default, ...top5Latest].filter(page => {
    if (seen.has(page.id)) return false
    seen.add(page.id)
    return true
  })
}

async function doPrefetch(
  allPages: PrefetchPage[],
  concurrency = 8
): Promise<void> {
  const limit = pLimit(concurrency)
  let hit = 0
  let fetched = 0
  let failed = 0

  console.log(
    `[Prefetch][pid:${process.pid}] start ${allPages.length} page blocks concurrency=${concurrency}`
  )
  const start = Date.now()

  await Promise.all(
    allPages.map(page =>
      limit(async () => {
        const cacheKey = getPageBlockCacheKey(page.id, page.lastEditedDate)

        if (await getDataFromCache(cacheKey)) {
          hit++
          return
        }

        try {
          const block = await fetchNotionPageBlocks(page.id, 'prefetch', {
            cacheVersion: page.lastEditedDate
          } as { cacheVersion: string | number | Date })
          if (block) fetched++
        } catch (error) {
          console.warn(
            `[Prefetch][pid:${process.pid}] failed page:${page.id}`,
            getErrorMessage(error)
          )
          failed++
        }
      })
    )
  )

  const elapsed = ((Date.now() - start) / 1000).toFixed(1)
  console.log(
    `[Prefetch][pid:${process.pid}] done hit=${hit} fetched=${fetched} failed=${failed} elapsed=${elapsed}s`
  )
}

/**
 * Warm all page blocks with cross-process protection.
 * Only one worker performs warming during the same build/export session.
 */
export async function prefetchAllBlockMaps(
  allPages: PrefetchPage[],
  concurrency?: number
): Promise<void> {
  logBuildEnvSummary()

  if (!isBuildPrefetchEnabled()) {
    console.log(
      `[Prefetch][pid:${process.pid}] skip (BUILD_PREFETCH_ENABLED=false)`
    )
    return
  }

  if (!Array.isArray(allPages) || allPages.length === 0) {
    console.log(`[Prefetch][pid:${process.pid}] skip empty page list`)
    return
  }

  const resolvedConcurrency = concurrency ?? getBuildPrefetchConcurrency()

  const doneFile = getPrefetchDoneFile()
  const skippedFile = getPrefetchSkippedFile()
  const lockFile = getPrefetchLockFile()
  if (isDone(doneFile)) {
    console.log(`[Prefetch][pid:${process.pid}] reuse warmed cache`)
    return
  }

  const attempt = tryAcquirePrefetchLock(lockFile)
  if (attempt.acquired) {
    await runPrefetchAsLockHolder(
      allPages,
      resolvedConcurrency,
      doneFile,
      skippedFile,
      lockFile,
      attempt.payload
    )
    return
  }

  if (isSkipped(skippedFile)) {
    console.warn(
      `[Prefetch][pid:${process.pid}] skip shared prefetch for this build`
    )
    return
  }

  console.log(
    `[Prefetch][pid:${process.pid}] waiting for shared prefetch completion`
  )
  const turn = await waitForPrefetchTurn(doneFile, skippedFile, lockFile)

  if ('done' in turn && turn.done) {
    console.log(`[Prefetch][pid:${process.pid}] reuse warmed cache`)
    return
  }

  if ('skipped' in turn && turn.skipped) {
    console.warn(
      `[Prefetch][pid:${process.pid}] skip shared prefetch for this build`
    )
    return
  }

  if ('payload' in turn) {
    await runPrefetchAsLockHolder(
      allPages,
      resolvedConcurrency,
      doneFile,
      skippedFile,
      lockFile,
      turn.payload
    )
  }
}
