import { getCache } from '@vercel/functions'
import type { RuntimeCache } from '@vercel/functions'

const cache: RuntimeCache = getCache()

const VercelCache = {
  async getCache(key: string): Promise<unknown | null> {
    const data = await cache.get(key)
    return data || null
  },

  async setCache(
    key: string,
    data: unknown,
    ttl: number = 3600
  ): Promise<void> {
    await cache.set(key, data, {
      ttl,
      tags: ['notion']
    })
  },

  delCache(key: string): void {
    console.warn('[VercelCache] delete is not supported; use tag invalidation')
  }
}

export default VercelCache
