import BLOG from '@/blog.config'
import FileCache from './local_file_cache'
import MemoryCache from './memory_cache'
import RedisCache from './redis_cache'
import { withFileLock } from './file_lock'

interface CacheStoreStats {
  hit: number
  set: number
}

interface CacheStats {
  hit: number
  miss: number
  set: number
  error: number
  total: number
  perStore: Record<string, CacheStoreStats>
}

interface CacheApi {
  getCache(
    key: string
  ): unknown | null | undefined | Promise<unknown | null | undefined>
  setCache(
    key: string,
    data: unknown,
    customCacheTime?: number | null
  ): void | Promise<void>
  delCache(key: string): void | Promise<void>
}

interface CacheStore {
  name: string
  api: CacheApi
}

const cacheStats: CacheStats = {
  hit: 0,
  miss: 0,
  set: 0,
  error: 0,
  total: 0,
  perStore: {}
}

const isBuildPhase =
  process.env.npm_lifecycle_event === 'build' ||
  process.env.npm_lifecycle_event === 'export'

const enableLocalCache = isBuildPhase || !BLOG.isProd
const hasRedis = !!BLOG.REDIS_URL
const inflightMap = new Map<string, Promise<unknown | null>>()
const BUILD_LOCK_TIMEOUT_MS = 120000
const BUILD_LOCK_MAX_WAIT_MS = 600000

function cacheReadsEnabled(force?: boolean): boolean {
  if (force) return true
  const v = BLOG.ENABLE_CACHE
  if (v === true) return true
  if (v === false) return false
  if (typeof v === 'string') {
    const s = v.trim()
    if (s === '' || s === 'false' || s === '0') return false
    if (s === 'true' || s === '1') return true
    try {
      return Boolean(JSON.parse(s))
    } catch {
      return true
    }
  }
  return Boolean(v)
}

function cacheLog(action: string, key: string, extra: string = ''): void {
  const type = getCacheType()
  console.log(
    `[Cache][${type.toUpperCase()}][pid:${process.pid}] ${action} key:${key} ${extra}`
  )
}

function isUsableCacheValue(data: unknown): boolean {
  if (data == null) return false
  if (Array.isArray(data)) return data.length > 0
  return true
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function getStoreStats(name: string): CacheStoreStats {
  const existing = cacheStats.perStore[name]
  if (existing) {
    return existing
  }

  const created = { hit: 0, set: 0 }
  cacheStats.perStore[name] = created
  return created
}

export async function getOrSetDataWithCache<T, TArgs extends unknown[]>(
  key: string,
  getDataFunction: (...args: unknown[]) => Promise<T>,
  ...getDataArgs: TArgs
): Promise<T | null> {
  return getOrSetDataWithCustomCache(key, null, getDataFunction, ...getDataArgs)
}

export async function getOrSetDataWithCustomCache<T, TArgs extends unknown[]>(
  key: string,
  customCacheTime: number | null,
  getDataFunction: (...args: unknown[]) => Promise<T>,
  ...getDataArgs: TArgs
): Promise<T | null> {
  const dataFromCache = await getDataFromCache<T>(key)
  if (dataFromCache) {
    return dataFromCache
  }

  if (inflightMap.has(key)) {
    return inflightMap.get(key) as Promise<T | null>
  }

  cacheLog('MISS', key, 'cache miss, fetch from source')

  if (isBuildPhase) {
    const promise = withFileLock<T | null>(
      key,
      async () => {
        const doubleCheck = await getDataFromCache<T>(key)
        if (doubleCheck) {
          cacheLog('DOUBLE-CHECK-HIT', key, 'lock holder found cached value')
          return doubleCheck
        }

        const data = await getDataFunction(...getDataArgs)
        if (data) {
          await setDataToCache(key, data, customCacheTime)
          cacheLog('SET', key, 'cache stored by lock holder')
        }

        return data || null
      },
      () => getDataFromCache<T>(key),
      {
        timeout: BUILD_LOCK_TIMEOUT_MS,
        staleLockMs: BUILD_LOCK_TIMEOUT_MS,
        timeoutStrategy: 'wait',
        maxWaitMs: BUILD_LOCK_MAX_WAIT_MS
      }
    ).catch(err => {
      cacheLog('ERROR', key, getErrorMessage(err))
      throw err
    })

    inflightMap.set(key, promise)
    promise.finally(() => inflightMap.delete(key))
    return promise
  }

  const promise = getDataFunction(...getDataArgs)
    .then(async (data): Promise<T | null> => {
      if (data) {
        await setDataToCache(key, data, customCacheTime)
        cacheLog('SET', key, 'cache stored')
      }

      inflightMap.delete(key)
      return data || null
    })
    .catch(err => {
      inflightMap.delete(key)
      cacheLog('ERROR', key, getErrorMessage(err))
      throw err
    })

  inflightMap.set(key, promise)
  return promise
}

export async function setDataToCache(
  key: string,
  data: unknown,
  customCacheTime?: number | null
): Promise<void> {
  if (!data) return

  const chain = getCacheChain()

  for (const { name, api } of chain) {
    try {
      await api.setCache(key, data, customCacheTime)

      cacheStats.set++
      getStoreStats(name).set++

      return
    } catch (e) {
      console.warn(`[Cache] ${name} set failed key:${key}`, getErrorMessage(e))
      cacheStats.error++
    }
  }

  console.warn(`[Cache] ALL set failed key:${key}`)
}

export async function getDataFromCache<T = unknown>(
  key: string,
  force?: boolean
): Promise<T | null> {
  if (!cacheReadsEnabled(force)) return null

  cacheStats.total++
  const chain = getCacheChain()

  for (const { name, api } of chain) {
    try {
      const data = await api.getCache(key)

      if (isUsableCacheValue(data)) {
        cacheStats.hit++
        getStoreStats(name).hit++
        return data as T
      }
    } catch (e) {
      cacheStats.error++
      console.warn(`[Cache] ${name} get failed key:${key}`, getErrorMessage(e))
    }
  }

  cacheStats.miss++
  return null
}

export async function delCacheData(key: string): Promise<void> {
  const chain = getCacheChain()

  for (const { name, api } of chain) {
    try {
      await api.delCache(key)
    } catch (e) {
      console.warn(`[Cache] ${name} del failed key:${key}`, getErrorMessage(e))
    }
  }
}

function getCacheType(): string {
  if (hasRedis) return 'redis'
  if (isBuildPhase) return 'file'
  return 'memory'
}

export function getApi(): CacheApi {
  const type = getCacheType()

  switch (type) {
    case 'redis':
      return RedisCache
    case 'file':
      return FileCache
    default:
      return MemoryCache
  }
}

function getCacheChain(): CacheStore[] {
  const chain: CacheStore[] = []

  if (hasRedis) {
    chain.push({ name: 'redis', api: RedisCache })
  }

  if (enableLocalCache) {
    chain.push({ name: 'file', api: FileCache })
  }

  chain.push({ name: 'memory', api: MemoryCache })

  return chain
}

function printCacheSummary(): void {
  const hitRate = cacheStats.total
    ? ((cacheStats.hit / cacheStats.total) * 100).toFixed(1)
    : 0

  console.log('\n[Cache Summary]')
  console.log(
    'Strategy:',
    getCacheChain()
      .map(c => c.name)
      .join(' -> ')
  )
  console.log(
    `Stats: HIT ${hitRate}% | MISS ${cacheStats.miss} | ERROR ${cacheStats.error} | total ${cacheStats.total}`
  )
  console.log('[Per Store]')

  Object.entries(cacheStats.perStore).forEach(([name, stat]) => {
    console.log(`  ${name}: hit=${stat.hit || 0}, set=${stat.set || 0}`)
  })

  console.log('----------------------------------\n')
}

if (typeof process !== 'undefined') {
  process.on('exit', printCacheSummary)
}
