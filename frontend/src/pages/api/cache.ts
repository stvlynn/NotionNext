import type { NextApiRequest, NextApiResponse } from 'next'
import { cleanCache } from '@/lib/cache/local_file_cache'

type CacheResponse = {
  status: 'success' | 'error'
  message: string
}

/**
 * Clear the local file cache.
 */
export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<CacheResponse>
) {
  if (req.method !== 'POST') {
    return res
      .status(405)
      .json({ status: 'error', message: 'Method not allowed' })
  }

  const token = process.env.CACHE_REVALIDATION_TOKEN
  if (!token) {
    return res.status(503).json({
      status: 'error',
      message: 'Cache invalidation is disabled'
    })
  }

  if (req.headers.authorization !== `Bearer ${token}`) {
    return res.status(401).json({ status: 'error', message: 'Unauthorized' })
  }

  try {
    cleanCache()
    res
      .status(200)
      .json({ status: 'success', message: 'Clean cache successful!' })
  } catch (error) {
    console.error('Cache clean error:', error)
    res.status(400).json({ status: 'error', message: 'Clean cache failed!' })
  }
}
