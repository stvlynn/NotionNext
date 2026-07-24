import BLOG from '@/blog.config'
import type { NextApiRequest, NextApiResponse } from 'next'
import { cleanCache } from '@/lib/cache/local_file_cache'

interface RevalidateResult {
  path: string
  revalidated: boolean
  error?: string
}

interface RevalidateResponse {
  ok: boolean
  message: string
  results?: RevalidateResult[]
  error?: string
}

/**
 * On-Demand Revalidation API
 *
 * Keeps Notion updates in sync with generated pages.
 *
 * Usage:
 *   POST /api/revalidate
 *   Authorization: Bearer <REVALIDATION_TOKEN>
 *   Body: { "path": "/article/my-post" }        — 刷新单个页面
 *   Body: { "paths": ["/", "/article/post-1"] }  — 批量刷新
 *   Body: { "all": true }                        — 全站刷新
 *
 * Environment:
 *   REVALIDATION_TOKEN — API 鉴权 Token（必须设置）
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<RevalidateResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      ok: false,
      message: 'Method Not Allowed. Use POST.'
    })
  }

  // Token authentication.
  const token = process.env.REVALIDATION_TOKEN || BLOG.REVALIDATION_TOKEN
  if (!token) {
    return res.status(503).json({
      ok: false,
      message: 'Revalidation is disabled: REVALIDATION_TOKEN not set'
    })
  }

  const authHeader = req.headers.authorization || ''
  const receivedToken = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : req.body?.token || ''

  if (receivedToken !== token) {
    return res.status(401).json({ ok: false, message: 'Unauthorized' })
  }

  const { path, paths, all } = req.body || {}

  try {
    if (all) {
      cleanCache()
      const results: RevalidateResult[] = []
      try {
        await res.revalidate('/')
        results.push({ path: '/', revalidated: true })
      } catch (e) {
        results.push({
          path: '/',
          revalidated: false,
          error: getErrorMessage(e)
        })
      }
      return res.status(200).json({
        ok: true,
        message: 'Full site cache cleared. Homepage revalidated. Other pages will refresh on next visit.',
        results
      })
    }

    const targetPaths = paths || (path ? [path] : ['/'])
    const results: RevalidateResult[] = []

    for (const p of targetPaths as unknown[]) {
      const normalizedPath = normalizePath(p)
      try {
        await res.revalidate(normalizedPath)
        results.push({ path: normalizedPath, revalidated: true })
      } catch (e) {
        results.push({
          path: normalizedPath,
          revalidated: false,
          error: getErrorMessage(e)
        })
      }
    }

    return res.status(200).json({
      ok: true,
      message: `Revalidated ${results.filter(r => r.revalidated).length}/${results.length} paths`,
      results
    })
  } catch (error) {
    console.error('[revalidate] Error:', error)
    return res.status(500).json({
      ok: false,
      message: 'Revalidation failed',
      error: getErrorMessage(error)
    })
  }
}

/**
 * Normalize paths by enforcing a leading slash and removing a trailing slash.
 */
function normalizePath(p: unknown) {
  if (!p || typeof p !== 'string') return '/'
  let normalized = p.trim()
  if (!normalized.startsWith('/')) normalized = '/' + normalized
  if (normalized.length > 1 && normalized.endsWith('/')) {
    normalized = normalized.slice(0, -1)
  }
  return normalized
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error)
}
