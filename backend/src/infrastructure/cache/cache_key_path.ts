import { createHash } from 'crypto'

/**
 * Stable short name for cache/lock files. Raw keys (e.g. long multi-locale
 * NOTION_PAGE_ID strings) must not be used as path segments — ENAMETOOLONG.
 */
export function hashForCachePath(key: unknown): string {
  return createHash('sha256').update(String(key)).digest('base64url')
}
