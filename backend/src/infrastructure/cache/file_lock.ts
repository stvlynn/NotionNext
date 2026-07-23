import fs from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'
import { hashForCachePath } from './cache_key_path'
import { getBuildSessionPath } from './build_session'

const LOCK_MISS = Symbol('lock_miss')
const DEFAULT_TIMEOUT_MS = 30000
const DEFAULT_STALE_LOCK_MS = 120000
const HEARTBEAT_INTERVAL_MS = 15000
const DEFAULT_MAX_WAIT_MS = 600000
const VALID_TIMEOUT_STRATEGIES = new Set<string>(['bypass', 'wait', 'throw'])

type LockMiss = typeof LOCK_MISS
type TimeoutStrategy = 'bypass' | 'wait' | 'throw'

interface LockPayload {
  token?: string | null
  pid?: unknown
  acquiredAt?: unknown
  heartbeatAt?: unknown
}

interface OwnedLockPayload extends LockPayload {
  token: string
  pid: number
  acquiredAt: number
  heartbeatAt: number
}

interface LockOptions {
  timeout?: number
  staleLockMs?: number
  timeoutStrategy?: TimeoutStrategy
  maxWaitMs?: number
}

interface NormalizedLockOptions {
  timeout: number
  staleLockMs: number
  timeoutStrategy: TimeoutStrategy
  maxWaitMs: number
}

type LockFunction<T> = (payload?: OwnedLockPayload) => T | Promise<T>
type ReadCache<T> = () => T | null | undefined | Promise<T | null | undefined>

type LockAttempt =
  | { acquired: true; payload: OwnedLockPayload }
  | { acquired: false; cleaned: boolean }

interface WaitForLockResultParams<T> {
  key: string
  lockPath: string
  fn: LockFunction<T>
  readCache: ReadCache<T>
  staleLockMs: number
  maxWaitMs: number
}

function getLockPath(key: string): string {
  return path.join(
    getBuildSessionPath('locks'),
    `${hashForCachePath(key)}.lock`
  )
}

function createLockPayload(): OwnedLockPayload {
  return {
    token: randomUUID(),
    pid: process.pid,
    acquiredAt: Date.now(),
    heartbeatAt: Date.now()
  }
}

function isErrnoException(error: unknown): error is NodeJS.ErrnoException {
  return typeof error === 'object' && error !== null && 'code' in error
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function isLockPayloadObject(value: unknown): value is LockPayload {
  return typeof value === 'object' && value !== null
}

function readLockPayload(lockPath: string): LockPayload | null {
  try {
    if (!fs.existsSync(lockPath)) {
      return null
    }

    const raw = fs.readFileSync(lockPath, 'utf8').trim()
    if (!raw) {
      return null
    }

    try {
      const payload = JSON.parse(raw) as unknown
      if (isLockPayloadObject(payload)) {
        return payload
      }
    } catch {}

    const legacyPid = Number(raw)
    if (Number.isInteger(legacyPid) && legacyPid > 0) {
      const stat = fs.statSync(lockPath)
      return {
        token: null,
        pid: legacyPid,
        acquiredAt: stat.mtimeMs,
        heartbeatAt: stat.mtimeMs
      }
    }

    return null
  } catch (error) {
    if (isErrnoException(error) && error.code === 'ENOENT') {
      return null
    }
    throw error
  }
}

function writeLockPayload(
  lockPath: string,
  payload: LockPayload,
  flag: string = 'w'
): void {
  fs.mkdirSync(path.dirname(lockPath), { recursive: true })
  fs.writeFileSync(lockPath, JSON.stringify(payload), { flag })
}

function isProcessAlive(pid: number): boolean {
  if (!Number.isInteger(pid) || pid <= 0) {
    return false
  }

  try {
    process.kill(pid, 0)
    return true
  } catch (error) {
    if (isErrnoException(error) && error.code === 'EPERM') {
      return true
    }
    if (isErrnoException(error) && error.code === 'ESRCH') {
      return false
    }
    return true
  }
}

function maybeCleanupStaleLock(lockPath: string, staleLockMs: number): boolean {
  try {
    const stat = fs.statSync(lockPath)
    const ageMs = Date.now() - stat.mtimeMs

    if (ageMs < staleLockMs) {
      return false
    }

    const payload = readLockPayload(lockPath)
    if (!payload) {
      fs.rmSync(lockPath, { force: true })
      console.warn(
        `[FileLock][pid:${process.pid}] removed malformed stale lock ${lockPath}`
      )
      return true
    }

    if (!isProcessAlive(Number(payload.pid))) {
      fs.rmSync(lockPath, { force: true })
      console.warn(
        `[FileLock][pid:${process.pid}] removed dead-owner lock key:${path.basename(lockPath)} owner:${payload.pid}`
      )
      return true
    }
  } catch (error) {
    if (isErrnoException(error) && error.code === 'ENOENT') {
      // The lock was released while checking it; retry acquisition immediately.
      return true
    }
    console.warn(
      `[FileLock] failed to check stale lock ${lockPath}`,
      getErrorMessage(error)
    )
  }
  return false
}

function tryAcquire(lockPath: string, staleLockMs: number): LockAttempt {
  const payload = createLockPayload()

  try {
    writeLockPayload(lockPath, payload, 'wx')
    return { acquired: true, payload }
  } catch (error) {
    if (!isErrnoException(error) || error.code !== 'EEXIST') {
      throw error
    }

    const cleaned = maybeCleanupStaleLock(lockPath, staleLockMs)
    return { acquired: false, cleaned }
  }
}

function startHeartbeat(
  lockPath: string,
  payload: OwnedLockPayload
): NodeJS.Timeout {
  const timer = setInterval(() => {
    try {
      const current = readLockPayload(lockPath)
      if (!current || current.token !== payload.token) {
        return
      }

      current.heartbeatAt = Date.now()
      writeLockPayload(lockPath, current)
    } catch (error) {
      console.warn(
        `[FileLock][pid:${process.pid}] heartbeat failed key:${path.basename(lockPath)}`,
        getErrorMessage(error)
      )
    }
  }, HEARTBEAT_INTERVAL_MS)

  if (typeof timer.unref === 'function') {
    timer.unref()
  }

  return timer
}

function release(lockPath: string, payload: LockPayload): void {
  try {
    const current = readLockPayload(lockPath)
    if (!current) {
      return
    }

    if (payload?.token && current.token && current.token !== payload.token) {
      console.warn(
        `[FileLock][pid:${process.pid}] skip release, ownership changed key:${path.basename(lockPath)}`
      )
      return
    }

    fs.unlinkSync(lockPath)
  } catch (error) {
    if (!isErrnoException(error) || error.code !== 'ENOENT') {
      console.warn(
        `[FileLock][pid:${process.pid}] release failed key:${path.basename(lockPath)}`,
        getErrorMessage(error)
      )
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function waitForUnlock<T>(
  lockPath: string,
  readCache: ReadCache<T>,
  key: string,
  timeout: number
): Promise<T | LockMiss> {
  const start = Date.now()

  while (Date.now() - start < timeout) {
    const cached = await readCache()
    if (cached) {
      console.log(`[FileLock][pid:${process.pid}] wait-hit key:${key}`)
      return cached
    }

    if (!fs.existsSync(lockPath)) {
      const unlockedCached = await readCache()
      if (unlockedCached) {
        console.log(`[FileLock][pid:${process.pid}] unlock-hit key:${key}`)
        return unlockedCached
      }
      return LOCK_MISS
    }

    await sleep(200)
  }

  const cached = await readCache()
  if (cached) {
    console.log(`[FileLock][pid:${process.pid}] timeout-hit key:${key}`)
    return cached
  }

  return LOCK_MISS
}

function normalizeOptions(
  timeoutOrOptions: number | LockOptions
): NormalizedLockOptions {
  if (typeof timeoutOrOptions === 'number') {
    return {
      timeout: timeoutOrOptions,
      staleLockMs: DEFAULT_STALE_LOCK_MS,
      timeoutStrategy: 'bypass',
      maxWaitMs: DEFAULT_MAX_WAIT_MS
    }
  }

  const timeoutStrategy: TimeoutStrategy =
    timeoutOrOptions.timeoutStrategy &&
    VALID_TIMEOUT_STRATEGIES.has(timeoutOrOptions.timeoutStrategy)
      ? timeoutOrOptions.timeoutStrategy
      : 'bypass'

  return {
    timeout: timeoutOrOptions?.timeout ?? DEFAULT_TIMEOUT_MS,
    staleLockMs: timeoutOrOptions?.staleLockMs ?? DEFAULT_STALE_LOCK_MS,
    timeoutStrategy,
    maxWaitMs: timeoutOrOptions?.maxWaitMs ?? DEFAULT_MAX_WAIT_MS
  }
}

async function runWithOwnedLock<T>(
  lockPath: string,
  payload: OwnedLockPayload,
  fn: LockFunction<T>
): Promise<T> {
  const heartbeat = startHeartbeat(lockPath, payload)

  try {
    return await fn(payload)
  } finally {
    clearInterval(heartbeat)
    release(lockPath, payload)
  }
}

async function waitForLockResult<T>({
  key,
  lockPath,
  fn,
  readCache,
  staleLockMs,
  maxWaitMs
}: WaitForLockResultParams<T>): Promise<T> {
  const waitStartedAt = Date.now()
  let lastLogAt = 0

  while (Date.now() - waitStartedAt < maxWaitMs) {
    const cached = await readCache()
    if (cached) {
      console.log(`[FileLock][pid:${process.pid}] extended-wait-hit key:${key}`)
      return cached
    }

    const attempt = tryAcquire(lockPath, staleLockMs)
    if (attempt.acquired) {
      const cachedAfterAcquire = await readCache()
      if (cachedAfterAcquire) {
        release(lockPath, attempt.payload)
        console.log(`[FileLock][pid:${process.pid}] acquire-hit key:${key}`)
        return cachedAfterAcquire
      }

      console.warn(
        `[FileLock][pid:${process.pid}] acquired after extended wait key:${key}`
      )
      return runWithOwnedLock(lockPath, attempt.payload, fn)
    }

    if (attempt.cleaned) {
      console.warn(
        `[FileLock][pid:${process.pid}] retry after stale cleanup key:${key}`
      )
      continue
    }

    const now = Date.now()
    if (now - lastLogAt >= 5000) {
      lastLogAt = now
      console.warn(`[FileLock][pid:${process.pid}] extended waiting key:${key}`)
    }

    await sleep(500)
  }

  throw new Error(
    `[FileLock] timed out waiting for cache key:${key} after ${maxWaitMs}ms`
  )
}

/**
 * Attempts to acquire a cross-process file lock and lets the owner run `fn`.
 *
 * This is not an absolute exclusive lock. To avoid deadlocks in distributed
 * build environments, it uses a lock-first strategy with configurable timeout
 * behavior. When timeout behavior allows bypassing, `fn` should be idempotent
 * or perform its own double-check.
 */
export async function withFileLock<T>(
  key: string,
  fn: LockFunction<T>,
  readCache: ReadCache<T>,
  timeoutOrOptions: number | LockOptions = DEFAULT_TIMEOUT_MS
): Promise<T> {
  const { timeout, staleLockMs, timeoutStrategy, maxWaitMs } =
    normalizeOptions(timeoutOrOptions)
  const lockPath = getLockPath(key)
  const absoluteDeadline = Date.now() + timeout

  while (Date.now() < absoluteDeadline) {
    const attempt = tryAcquire(lockPath, staleLockMs)

    if (attempt.acquired) {
      return runWithOwnedLock(lockPath, attempt.payload, fn)
    }

    if (attempt.cleaned) {
      console.warn(
        `[FileLock][pid:${process.pid}] retry after stale cleanup key:${key}`
      )
      continue
    }

    console.log(`[FileLock][pid:${process.pid}] waiting key:${key}`)

    const remainingTimeout = absoluteDeadline - Date.now()
    if (remainingTimeout <= 0) break

    const result = await waitForUnlock(
      lockPath,
      readCache,
      key,
      remainingTimeout
    )
    if (result !== LOCK_MISS) {
      return result
    }

    console.warn(`[FileLock][pid:${process.pid}] retry lock key:${key}`)
  }

  if (timeoutStrategy === 'throw') {
    throw new Error(
      `[FileLock] timed out acquiring key:${key} after ${timeout}ms`
    )
  }

  if (timeoutStrategy === 'wait') {
    console.warn(
      `[FileLock][pid:${process.pid}] timeout (${timeout}ms) key:${key}. Waiting for cache instead of bypassing.`
    )
    return waitForLockResult({
      key,
      lockPath,
      fn,
      readCache,
      staleLockMs,
      maxWaitMs
    })
  }

  console.warn(
    `[FileLock][pid:${process.pid}] ABSOLUTE TIMEOUT (${timeout}ms) key:${key}. Bypassing lock as fallback.`
  )
  return await fn()
}
