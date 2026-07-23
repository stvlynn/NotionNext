import BLOG from '@/blog.config'
import { siteConfig } from '@/lib/config'
import Redis from 'ioredis'

export const redisClient: Redis | Record<string, never> = BLOG.REDIS_URL
  ? new Redis(String(BLOG.REDIS_URL))
  : {}

const cacheTime = Math.trunc(
  Number(siteConfig('NEXT_REVALIDATE_SECOND', BLOG.NEXT_REVALIDATE_SECOND)) *
    1.5
)

export async function getCache(
  key: string
): Promise<unknown | null | undefined> {
  try {
    const data = await (redisClient as Redis).get(key)
    return data ? (JSON.parse(data) as unknown) : null
  } catch (e) {
    console.error(`redisClient read failed ${String(e)}`)
    return undefined
  }
}

export async function setCache(
  key: string,
  data: unknown,
  customCacheTime?: number | null
): Promise<void> {
  try {
    await (redisClient as Redis).set(
      key,
      JSON.stringify(data),
      'EX',
      customCacheTime || cacheTime
    )
  } catch (e) {
    console.error(`redisClient write failed ${String(e)}`)
  }
}

export async function delCache(key: string): Promise<void> {
  try {
    await (redisClient as Redis).del(key)
  } catch (e) {
    console.error(`redisClient delete failed ${String(e)}`)
  }
}

export default { getCache, setCache, delCache }
