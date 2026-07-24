import BLOG from '@/blog.config'

interface MemoryCacheStore {
  get(key: string): unknown | null | undefined
  put(key: string, value: unknown, duration?: number): unknown
  del(key: string): unknown
}

const cache = require('memory-cache') as MemoryCacheStore
const cacheTime = BLOG.isProd ? 10 * 60 : 120 * 60 // 120 minutes for dev,10 minutes for prod

export async function getCache(
  key: string,
  options?: unknown
): Promise<unknown | null | undefined> {
  return await cache.get(key)
}

export async function setCache(
  key: string,
  data: unknown,
  customCacheTime?: number | null
): Promise<void> {
  await cache.put(key, data, (customCacheTime || cacheTime) * 1000)
}

export async function delCache(key: string): Promise<void> {
  await cache.del(key)
}

export default { getCache, setCache, delCache }
