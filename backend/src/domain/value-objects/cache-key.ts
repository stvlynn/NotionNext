declare const cacheKeyBrand: unique symbol

export type CacheKey = string & {
  readonly [cacheKeyBrand]: 'CacheKey'
}

export type CacheKeyVersion = string | number | Date | null | undefined

interface SiteScopedCacheKeyParams {
  pageId?: string | null
  locale?: string | null
  defaultPageId?: string
}

const PAGE_ID_CACHE_SEGMENT_PATTERN = /[^a-z0-9,_:-]/gi
const LOCALE_CACHE_SEGMENT_PATTERN = /[^a-z0-9_-]/gi
const VERSION_CACHE_SEGMENT_PATTERN = /[^a-z0-9_.:-]/gi

function toCacheKey(value: string): CacheKey {
  return value as CacheKey
}

function sanitizeCacheSegment(value: string, pattern: RegExp): string {
  return value.replace(pattern, '_')
}

export function normalizePageBlockCacheVersion(
  cacheVersion: CacheKeyVersion
): string {
  if (cacheVersion == null || cacheVersion === '') {
    return ''
  }

  if (cacheVersion instanceof Date) {
    const time = cacheVersion.getTime()
    return Number.isFinite(time) ? String(time) : ''
  }

  if (typeof cacheVersion === 'number') {
    return Number.isFinite(cacheVersion) ? String(cacheVersion) : ''
  }

  const raw = String(cacheVersion).trim()
  if (!raw) {
    return ''
  }

  const parsed = Date.parse(raw)
  if (Number.isFinite(parsed)) {
    return String(parsed)
  }

  return sanitizeCacheSegment(raw, VERSION_CACHE_SEGMENT_PATTERN)
}

export function createPageBlockCacheKey(
  pageId: string,
  cacheVersion?: CacheKeyVersion
): CacheKey {
  const normalizedVersion = normalizePageBlockCacheVersion(cacheVersion)

  return toCacheKey(
    normalizedVersion
      ? `page_block_${pageId}_${normalizedVersion}`
      : `page_block_${pageId}`
  )
}

export function createSiteDataCacheKey(pageId: string): CacheKey {
  return toCacheKey(`site_${pageId}`)
}

export function createSiteRecordMapCacheKey(pageId: string): CacheKey {
  return toCacheKey(`site_data_${pageId}`)
}

export function createGlobalDataCacheKey({
  pageId,
  locale,
  defaultPageId = ''
}: SiteScopedCacheKeyParams): CacheKey {
  const safePageId = sanitizeCacheSegment(
    String(pageId || defaultPageId),
    PAGE_ID_CACHE_SEGMENT_PATTERN
  )
  const safeLocale = sanitizeCacheSegment(
    String(locale || 'default'),
    LOCALE_CACHE_SEGMENT_PATTERN
  )

  return toCacheKey(`global_data_${safeLocale}_${safePageId}`)
}

export function createStaticPathsCacheKey({
  pageId,
  locale,
  defaultPageId = ''
}: SiteScopedCacheKeyParams): CacheKey {
  const safePageId = sanitizeCacheSegment(
    String(pageId || defaultPageId),
    PAGE_ID_CACHE_SEGMENT_PATTERN
  )
  const safeLocale = sanitizeCacheSegment(
    String(locale || 'default'),
    LOCALE_CACHE_SEGMENT_PATTERN
  )

  return toCacheKey(`build_static_paths_all_pages_${safeLocale}_${safePageId}`)
}
