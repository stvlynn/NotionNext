import BLOG from '@/blog.config'
import { getOrSetDataWithCache } from '@/lib/cache/cache_manager'
import { fetchGlobalAllData } from '@/lib/db/SiteDataApi'
import { getPriorityPages, prefetchAllBlockMaps } from '@/lib/build/prefetch'
import { isExport } from '@/lib/utils/buildMode'

interface StaticPathPage {
  id: string
  type?: string | undefined
  status?: string | undefined
  slug?: string | undefined
  [key: string]: unknown
}

interface StaticPathsCacheParams {
  pageId?: string | undefined
  locale?: string | undefined
}

interface SharedAllPagesParams extends StaticPathsCacheParams {
  from?: string | undefined
}

interface StaticPathsBaseParams<TPage extends StaticPathPage, TParams> {
  filterFn?: ((page: TPage) => boolean) | undefined
  mapPageToParams: (page: TPage) => TParams
  from?: string | undefined
  pageId?: string | undefined
  locale?: string | undefined
}

const inProcessAllPagesPromises = new Map<string, Promise<StaticPathPage[]>>()

function getStaticPathsCacheKey({
  pageId = BLOG.NOTION_PAGE_ID,
  locale
}: StaticPathsCacheParams): string {
  const safePageId = String(pageId || BLOG.NOTION_PAGE_ID).replace(
    /[^a-z0-9,_:-]/gi,
    '_'
  )
  const safeLocale = String(locale || 'default').replace(/[^a-z0-9_-]/gi, '_')
  return `build_static_paths_all_pages_${safeLocale}_${safePageId}`
}

export function getSharedAllPages({
  from = 'slug-paths',
  pageId = BLOG.NOTION_PAGE_ID,
  locale
}: SharedAllPagesParams = {}): Promise<StaticPathPage[]> {
  const cacheKey = getStaticPathsCacheKey({ pageId, locale })

  if (!inProcessAllPagesPromises.has(cacheKey)) {
    const promise = getOrSetDataWithCache(cacheKey, async () => {
      const { allPages = [] } = await fetchGlobalAllData({
        pageId,
        from,
        locale
      })
      return Array.isArray(allPages) ? allPages : []
    }) as Promise<StaticPathPage[]>
    promise.catch(() => {
      inProcessAllPagesPromises.delete(cacheKey)
    })
    inProcessAllPagesPromises.set(cacheKey, promise)
  }

  return inProcessAllPagesPromises.get(cacheKey)!
}

export async function getStaticPathsBase<
  TPage extends StaticPathPage,
  TParams
>({
  filterFn = () => true,
  mapPageToParams,
  from = 'slug-paths',
  pageId = BLOG.NOTION_PAGE_ID,
  locale
}: StaticPathsBaseParams<TPage, TParams>): Promise<{
  paths: TParams[]
  fallback: false | 'blocking'
}> {
  const allPages = (await getSharedAllPages({ from, pageId, locale })) as TPage[]

  if (isExport()) {
    await prefetchAllBlockMaps(allPages)
    return {
      paths: allPages.filter(filterFn).map(mapPageToParams),
      fallback: false
    }
  }

  const priorityPages = getPriorityPages(allPages) || []
  return {
    paths: priorityPages.filter(filterFn).map(mapPageToParams),
    fallback: 'blocking'
  }
}
