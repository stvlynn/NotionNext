import fs from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'
import { hashForCachePath } from './cache_key_path'
import { getNotionCacheRoot } from './build_session'

const CACHE_DIR = path.join(getNotionCacheRoot(), 'data')

interface CacheEntry {
  key: string
  expireTime: number | null
  updatedAt: number
  value?: unknown
}

function ensureCacheDir(): void {
  fs.mkdirSync(CACHE_DIR, { recursive: true })
}

function getCacheFilePath(key: string): string {
  const fileName = `${hashForCachePath(key)}.json`
  return path.join(CACHE_DIR, fileName)
}

function isCacheEntry(value: unknown): value is CacheEntry {
  return typeof value === 'object' && value !== null
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function readCacheEntry(cacheFile: string): CacheEntry | null {
  try {
    if (!fs.existsSync(cacheFile)) {
      return null
    }

    const raw = fs.readFileSync(cacheFile, 'utf8')
    if (!raw) {
      return null
    }

    const entry = JSON.parse(raw) as unknown
    return isCacheEntry(entry) ? entry : null
  } catch (error) {
    console.error(
      '[FileCache] Failed to read cache entry',
      cacheFile,
      getErrorMessage(error)
    )
    return null
  }
}

export function getCache(key: string): unknown | null {
  const cacheFile = getCacheFilePath(key)
  const entry = readCacheEntry(cacheFile)
  if (!entry) return null

  if (entry.expireTime && entry.expireTime <= Date.now()) {
    try {
      fs.rmSync(cacheFile, { force: true })
    } catch {}
    return null
  }

  return entry.value ?? null
}

/**
 * Persist one cache key per file so concurrent workers never overwrite
 * unrelated cache entries during a shared build.
 */
export function setCache(
  key: string,
  data: unknown,
  customCacheTime?: number | null
): void {
  ensureCacheDir()
  const cacheFile = getCacheFilePath(key)
  const expireTime =
    typeof customCacheTime === 'number' &&
    Number.isFinite(customCacheTime) &&
    customCacheTime > 0
      ? Date.now() + customCacheTime * 1000
      : null

  const payload = {
    key,
    expireTime,
    updatedAt: Date.now(),
    value: data
  }

  const tempFile = `${cacheFile}.${process.pid}.${randomUUID()}.tmp`

  try {
    fs.writeFileSync(tempFile, JSON.stringify(payload))
    fs.renameSync(tempFile, cacheFile)
  } catch (error) {
    fs.rmSync(tempFile, { force: true })
    throw error
  }
}

export function delCache(key: string): void {
  const cacheFile = getCacheFilePath(key)
  fs.rmSync(cacheFile, { force: true })
}

export function cleanCache(): void {
  fs.rmSync(CACHE_DIR, { recursive: true, force: true })
  ensureCacheDir()
}

const LocalFileCache = { getCache, setCache, delCache, cleanCache }

export default LocalFileCache
