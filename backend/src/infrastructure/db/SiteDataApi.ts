import BLOG from '@/blog.config'
import { getOrSetDataWithCache } from '../cache/cache_manager'
import { getAllCategories } from '@/lib/db/notion/getAllCategories'
import getAllPageIds from '@/lib/db/notion/getAllPageIds'
import { getAllTags } from '@/lib/db/notion/getAllTags'
import { getConfigMapFromConfigPage } from '@/lib/db/notion/getNotionConfig'
import getPageProperties, {
  adjustPageProperties
} from '@/lib/db/notion/getPageProperties'
import {
  fetchInBatches,
  fetchNotionPageBlocks,
  formatNotionBlock
} from '@/lib/db/notion/getPostBlocks'
import { compressImage, mapImgUrl } from '@/lib/db/notion/mapImage'
import { deepClone } from '@/lib/utils'
import { idToUuid } from 'notion-utils'
import { siteConfig } from '@/lib/config'
import { extractLangId, extractLangPrefix, getShortId } from '@/lib/utils/pageId'
import {
  normalizeNotionMetadata,
  normalizeCollection,
  normalizeSchema,
  normalizePageBlock
} from './notion/normalizeUtil'
import { filterCollectionViewData } from './notion/filterCollectionViewData'
import { fetchPageFromNotion } from './notion/getNotionPost'
import { processPostData } from '@/lib/utils/post'
import { adapterNotionBlockMap } from '@/lib/utils/notion.util'
import { sortPinnedPostsByLatestUpdate } from '@/lib/utils/pinnedPosts'
import { fetchMembersFromOfficialAPI } from './notion/memberDataSource'
import {
  getPublishedTypedPages,
  sortTypedPagesByPublishDate
} from '@/lib/site/typedCollections'
import type { PageDate, SiteInfo, TagItem } from '../../domain'

type NotionRecord = Record<string, unknown>
type MutableRecord = Record<string, any>
type NotionSchema = Record<string, NotionSchemaProperty>
type NotionBlockRecord = Record<string, NotionBlockEntry>

interface NotionSchemaProperty extends NotionRecord {
  name: string
  type: string
  options?: SelectOption[]
}

interface SelectOption extends MutableRecord {
  id?: string | number | undefined
  value?: string | undefined
  color?: string | undefined
  source?: string | undefined
  name?: string | undefined
}

interface SiteTagItem extends TagItem {
  color?: string | undefined
}

interface SitePage extends MutableRecord {
  id?: string | number | undefined
  short_id?: string | undefined
  title?: string | undefined
  name?: string | undefined
  slug?: string | undefined
  href?: string | undefined
  target?: string | undefined
  pageIcon?: string | undefined
  icon?: string | null | undefined
  pageCover?: string | null | undefined
  pageCoverThumbnail?: string | null | undefined
  date?: (PageDate & MutableRecord) | undefined
  publishDate?: number | string | null | undefined
  publishDay?: string | undefined
  lastEditedDate?: number | string | Date | null | undefined
  lastEditedDay?: string | undefined
  category?: string | null | undefined
  tags?: string[] | null | undefined
  tagItems?: SiteTagItem[] | undefined
  summary?: string | null | undefined
  description?: string | undefined
  type?: string | undefined
  status?: string | undefined
  password?: string | undefined
  readTime?: number | undefined
  wordCount?: number | undefined
  ext?: MutableRecord | undefined
  blockMap?: NotionBlockMap | null | undefined
  content?: unknown
  subMenus?: SitePage[] | undefined
  show?: boolean | undefined
  to?: string | undefined
}

interface NavPageSummary extends MutableRecord {
  id?: string | number | undefined
  short_id?: string | undefined
  title: string
  type?: string | undefined
  slug?: string | undefined
  summary?: string | null | undefined
  category?: string | null | undefined
  tags?: string[] | null | undefined
  pageCoverThumbnail?: string | undefined
  pageIcon?: string | undefined
  href?: string | undefined
  publishDate?: number | string | null | undefined
  lastEditedDate?: number | string | Date | null | undefined
  ext?: MutableRecord | undefined
}

interface CustomNavItem {
  icon: string | null
  name: string
  href?: string | undefined
  target?: string | undefined
  show: boolean
}

interface MemberSummary extends MutableRecord {
  id: string | number
  title: string
  type: string
  status: string
  slug: string
  summary: string
  avatar: unknown
  quote: unknown
  role: unknown
  bio: unknown
  featured: unknown
  verified: unknown
  sortOrder: number | string | null
  joinedAtText: unknown
  pageIcon: string
  pageCoverThumbnail: string
  pageCover: string
  publishDate: number | string | null
}

interface SiteDataResult extends MutableRecord {
  NOTION_CONFIG?: MutableRecord | undefined
  notice?: SitePage | null | undefined
  siteInfo?: SiteInfo | undefined
  allPages?: SitePage[] | undefined
  allNavPages?: NavPageSummary[] | undefined
  allLinkPages?: NavPageSummary[] | undefined
  collection?: unknown
  collectionQuery?: unknown
  collectionId?: string | null | undefined
  collectionView?: unknown
  viewIds?: string[] | undefined
  block?: NotionBlockRecord | undefined
  schema?: NotionSchema | undefined
  tagOptions?: SelectOption[] | null | undefined
  categoryOptions?: SelectOption[] | undefined
  rawMetadata?: MutableRecord | undefined
  customNav?: CustomNavItem[] | undefined
  customMenu?: SitePage[] | undefined
  allMembers?: MemberSummary[] | undefined
  allEvents?: SitePage[] | undefined
  postCount?: number | undefined
  pageIds?: string[] | undefined
  latestPosts?: SitePage[] | undefined
  post?: SitePage | null | undefined
  prev?: SitePage | undefined
  next?: SitePage | undefined
  recommendPosts?: SitePage[] | undefined
}

interface FetchGlobalAllDataParams {
  pageId?: string | undefined
  from?: string | undefined
  locale?: string | undefined
}

interface SiteDataByPageIdParams {
  pageId: string
  from?: string | undefined
}

interface ResolvePostPropsParams {
  prefix?: string | undefined
  slug?: string | undefined
  suffix?: string[] | undefined
  locale?: string | undefined
  from?: string | undefined
}

interface NotionBlockValue extends MutableRecord {
  id?: string | undefined
  type?: string | undefined
  parent_id?: string | undefined
  collection_id?: string | undefined
  view_ids?: string[] | undefined
  content?: string[] | undefined
  format?: MutableRecord | undefined
  value?: NotionBlockValue | undefined
}

type NotionBlockEntry = NotionBlockValue | { value?: NotionBlockValue | undefined } & MutableRecord

interface NotionBlockMap extends MutableRecord {
  block?: NotionBlockRecord | undefined
  collection?: MutableRecord | undefined
  collection_view?: MutableRecord | undefined
  collection_query?: MutableRecord | undefined
  notion_user?: MutableRecord | undefined
  __version__?: unknown
}

interface NotionCollection extends MutableRecord {
  name?: string[][] | undefined
  description?: string[][] | undefined
  cover?: string | undefined
  icon?: string | undefined
  schema?: Record<string, unknown> | undefined
}

interface SiteInfoParams {
  collection?: NotionCollection | undefined
  block?: NotionBlockRecord | undefined
  rawMetadata?: MutableRecord | null | undefined
  NOTION_CONFIG?: MutableRecord | undefined
}

export { getAllTags } from './notion/getAllTags'
export { fetchPageFromNotion as getPost } from './notion/getNotionPost'
export { fetchNotionPageBlocks as getPostBlocks } from './notion/getPostBlocks'

/**
 * Fetch global site data from Notion.
 * Supports multi-site ids separated by commas and locale prefixes.
 */
export async function fetchGlobalAllData({
  pageId = BLOG.NOTION_PAGE_ID,
  from,
  locale
}: FetchGlobalAllDataParams): Promise<SiteDataResult> {
  if (BLOG.BUNDLE_ANALYZER) {
    return EmptyData(pageId)
  }

  const cacheKey = getGlobalDataCacheKey({ pageId, locale })
  const cachedData = (await getOrSetDataWithCache(cacheKey, async () => {
    const siteIds = pageId?.split(',') || []
    let data = EmptyData(pageId)

    try {
      for (let index = 0; index < siteIds.length; index++) {
        const siteId = siteIds[index] as string
        const id = extractLangId(siteId)
        const prefix = extractLangPrefix(siteId)

        if (index === 0 || locale === prefix) {
          data = await getSiteDataByPageId({ pageId: id, from })
        }
      }
    } catch (error) {
      console.error('异常', error)
    }

    return handleDataBeforeReturn(deepClone(data) as SiteDataResult)
  })) as SiteDataResult

  const data = deepClone(cachedData) as SiteDataResult
  data.latestPosts = cleanPostSummaries(data.latestPosts) as SitePage[]
  data.notice = cleanNoticeForClient(data.notice)
  return data
}

function getGlobalDataCacheKey({
  pageId,
  locale
}: FetchGlobalAllDataParams): string {
  const safePageId = String(pageId || BLOG.NOTION_PAGE_ID).replace(
    /[^a-z0-9,_:-]/gi,
    '_'
  )
  const safeLocale = String(locale || 'default').replace(/[^a-z0-9_-]/gi, '_')
  return `global_data_${safeLocale}_${safePageId}`
}

/**
 * Fetch one Notion collection with stampede-protected cache.
 */
export async function getSiteDataByPageId({
  pageId,
  from
}: SiteDataByPageIdParams): Promise<SiteDataResult> {
  const cacheKey = `site_${pageId}`

  const data = (await getOrSetDataWithCache(cacheKey, async () => {
    console.log('获取全站数据 ', pageId)
    const originalPageRecordMap = await fetchNotionPageBlocks(pageId, from)
    const r = await convertNotionToSiteData(
      pageId,
      from,
      originalPageRecordMap as unknown as NotionBlockMap
    )
    return r
  })) as SiteDataResult

  if (process.env.NODE_ENV === 'development') {
    console.log(
      '[ThemeResolver][site-data]',
      JSON.stringify({
        from,
        pageId,
        notionTheme: data?.NOTION_CONFIG?.THEME || null,
        configTheme: BLOG.THEME,
        cacheEnabled: BLOG.ENABLE_CACHE
      })
    )
  }
  return data
}

/**
 * Fetch the notice block and normalize its block map shape.
 */
async function getNotice(post: SitePage | undefined): Promise<SitePage | null> {
  if (!post) return null

  try {
    const rawBlockMap = await fetchNotionPageBlocks(post.id as string, 'data-notice', {
      cacheVersion: post.lastEditedDate
    } as { cacheVersion: string | number | Date })
    const adapted = adapterNotionBlockMap(rawBlockMap) as NotionBlockMap
    post.blockMap = {
      ...adapted,
      block: formatNotionBlock(adapted.block as any)
    } as NotionBlockMap
  } catch (e) {
    console.warn('[getNotice] fetchNotionPageBlocks failed:', post.id, e)
    post.blockMap = null
  }

  return post
}

const CLIENT_POST_SUMMARY_FIELDS = [
  'id',
  'short_id',
  'title',
  'name',
  'slug',
  'href',
  'target',
  'pageIcon',
  'icon',
  'pageCover',
  'pageCoverThumbnail',
  'date',
  'publishDate',
  'publishDay',
  'lastEditedDate',
  'lastEditedDay',
  'category',
  'tags',
  'tagItems',
  'summary',
  'description',
  'type',
  'status',
  'password',
  'readTime',
  'wordCount',
  'ext'
] as const

export function cleanPostSummary(
  post: SitePage | null | undefined
): SitePage | null | undefined {
  if (!post || typeof post !== 'object') return post

  const result: SitePage = {}
  CLIENT_POST_SUMMARY_FIELDS.forEach(field => {
    if (post[field] !== undefined) (result as MutableRecord)[field] = post[field]
  })
  return result
}

export function cleanPostSummaries(
  posts: SitePage[] | null | undefined
): SitePage[] | null | undefined {
  if (!Array.isArray(posts)) return posts
  return posts.map(cleanPostSummary) as SitePage[]
}

function cleanPostForClient(
  post: SitePage | null | undefined
): SitePage | null | undefined {
  if (!post?.blockMap) return post
  const cleanedPost = cleanBlock(post)
  delete cleanedPost.content
  cleanRecordMapMetadata(cleanedPost.blockMap)
  filterCollectionViewData(cleanedPost.blockMap as any)
  pruneUnusedCollectionRecords(cleanedPost.blockMap)
  return cleanedPost
}

function cleanNoticeForClient(
  notice: SitePage | null | undefined
): SitePage | null | undefined {
  if (!notice?.blockMap) return notice
  const cleanedNotice = cleanBlock(notice)
  pruneBlockMapToRootPage(cleanedNotice.blockMap as NotionBlockMap, cleanedNotice.id)
  cleanRecordMapMetadata(cleanedNotice.blockMap)
  filterCollectionViewData(cleanedNotice.blockMap as any)
  pruneUnusedCollectionRecords(cleanedNotice.blockMap)
  return cleanedNotice
}

function pruneBlockMapToRootPage(
  blockMap: NotionBlockMap,
  rootId: string | number | undefined
): void {
  if (!blockMap?.block) return

  const rootBlockId = rootId || findRootPageBlockId(blockMap.block)
  if (!rootBlockId) return

  const keepIds = new Set([String(rootBlockId)])
  let changed = true
  while (changed) {
    changed = false
    Object.entries(blockMap.block).forEach(([id, entry]) => {
      const block = getEntryValue(entry)
      if (!keepIds.has(id) && keepIds.has(String(block?.parent_id))) {
        keepIds.add(id)
        changed = true
      }
    })
  }

  Object.keys(blockMap.block).forEach(id => {
    if (!keepIds.has(id)) delete blockMap.block?.[id]
  })
}

function findRootPageBlockId(blockRecord: NotionBlockRecord): string | undefined {
  return Object.values(blockRecord)
    .map(entry => getEntryValue(entry))
    .find(block => block?.type === 'page' && Array.isArray(block.content))
    ?.id
}

function cleanRecordMapMetadata(blockMap: NotionBlockMap | null | undefined): void {
  if (!blockMap) return

  delete blockMap.__version__
  if (blockMap.notion_user && Object.keys(blockMap.notion_user).length === 0) {
    delete blockMap.notion_user
  }

  cleanRecordEntries(blockMap.collection)
  cleanRecordEntries(blockMap.collection_view)
}

function pruneUnusedCollectionRecords(
  blockMap: NotionBlockMap | null | undefined
): void {
  if (!blockMap?.block) return

  const collectionIds = new Set<string>()
  const viewIds = new Set<string>()
  Object.values(blockMap.block).forEach(entry => {
    const block = getEntryValue(entry)
    if (!block || typeof block !== 'object') return
    if (block.collection_id) collectionIds.add(block.collection_id)
    block.view_ids?.forEach(viewId => viewIds.add(viewId))
  })

  pruneRecordByIds(blockMap.collection, collectionIds)
  pruneRecordByIds(blockMap.collection_view, viewIds)
  pruneRecordByIds(blockMap.collection_query, collectionIds)
}

function pruneRecordByIds(
  record: MutableRecord | undefined,
  ids: Set<string>
): void {
  if (!record || typeof record !== 'object') return
  Object.keys(record).forEach(id => {
    if (!ids.has(id)) delete record[id]
  })
}

function cleanRecordEntries(record: MutableRecord | undefined): void {
  if (!record || typeof record !== 'object') return

  Object.values(record).forEach(entry => {
    const value = getEntryValue(entry)
    if (!value || typeof value !== 'object') return

    delete value.version
    delete value.created_by_table
    delete value.created_by_id
    delete value.last_edited_by_table
    delete value.last_edited_by_id
    delete value.space_id
    delete value.parent_table
    delete value.permissions
    delete value.alive
    delete value.role
    delete value.copied_from_pointer
    delete value.copied_from
    delete value.created_time
    delete value.last_edited_time
  })
}

function getEntryValue(entry: unknown): NotionBlockValue | undefined {
  if (!entry || typeof entry !== 'object') return undefined
  const record = entry as MutableRecord
  return (record.value || record) as NotionBlockValue
}

/**
 * Empty default data used when Notion data cannot be fetched.
 */
const EmptyData = (pageId: string): SiteDataResult => ({
  notice: null,
  siteInfo: getSiteInfo({}),
  allPages: [
    {
      id: 1,
      title: `无法获取Notion数据，请检查Notion_ID： \n 当前 ${pageId}`,
      summary:
        '访问文档获取帮助 → https://docs.tangly1024.com/article/vercel-deploy-notion-next',
      status: 'Published',
      type: 'Post',
      slug: 'oops',
      publishDay: '2024-11-13',
      pageCoverThumbnail: (BLOG as MutableRecord).HOME_BANNER_IMAGE || '/bg_image.jpg',
      date: {
        start_date: '2023-04-24',
        lastEditedDay: '2023-04-24',
        tagItems: []
      }
    }
  ],
  allNavPages: [],
  allLinkPages: [],
  collection: [],
  collectionQuery: {},
  collectionId: null,
  collectionView: {},
  viewIds: [],
  block: {},
  schema: {},
  tagOptions: [],
  categoryOptions: [],
  rawMetadata: {},
  customNav: [],
  customMenu: [],
  allMembers: [],
  allEvents: [],
  postCount: 1,
  pageIds: [],
  latestPosts: []
})

/**
 * Resolve server-side props for one post.
 * Supports any prefix / slug / suffix combination.
 */
export async function resolvePostProps({
  prefix,
  slug,
  suffix,
  locale,
  from
}: ResolvePostPropsParams): Promise<SiteDataResult> {
  const segments = [prefix, slug].filter(Boolean) as string[]
  if (Array.isArray(suffix)) segments.push(...suffix)
  const fullSlug = segments.join('/')
  const lastSegment = segments.at(-1)
  const source = from || `slug-props-${fullSlug}`
  const taskId = `${fullSlug || lastSegment}-${Date.now()}`

  const startTime = Date.now()
  console.log(`[${taskId}] 🕒 开始解析文章: ${fullSlug || lastSegment} @ ${new Date().toISOString()}`)

  const step1Start = Date.now()
  const props = await fetchGlobalAllData({ from: source, locale })
  const step1End = Date.now()
  console.log(`[${taskId}] ⏱ fetchGlobalAllData 耗时: ${step1End - step1Start}ms @ ${new Date().toISOString()}`)

  const findPost = (): SitePage | null => {
    if (!props?.allPages) return null
    return (
      props.allPages.find(p => p && !p.type?.includes('Menu') && p.slug === fullSlug) ||
      props.allPages.find(p => p?.id === fullSlug) ||
      null
    )
  }

  let post = findPost()

  if (!post && typeof lastSegment === 'string' && /^[a-f0-9-]{32,36}$/i.test(lastSegment)) {
    const step3Start = Date.now()
    try {
      post = (await fetchPageFromNotion(lastSegment)) as unknown as SitePage
    } catch (e) {
      console.warn(`[${taskId}] [resolvePostProps] fetchPageFromNotion failed:`, lastSegment, e)
    }
    const step3End = Date.now()
    console.log(`[${taskId}] ⏱ fetchPageFromNotion 耗时: ${step3End - step3Start}ms @ ${new Date().toISOString()}`)
  }

  const ensureBlockMap = async (postToEnsure: SitePage): Promise<SitePage> => {
    if (!postToEnsure?.id || postToEnsure?.blockMap) return postToEnsure
    const step4Start = Date.now()
    try {
      const rawBlockMap = await fetchNotionPageBlocks(postToEnsure.id as string, source, {
        cacheVersion: postToEnsure.lastEditedDate
      } as { cacheVersion: string | number | Date })
      const adapted = adapterNotionBlockMap(rawBlockMap) as NotionBlockMap
      postToEnsure.blockMap = {
        ...adapted,
        block: formatNotionBlock(adapted.block as any)
      } as NotionBlockMap
    } catch (e) {
      console.warn(`[${taskId}] [resolvePostProps] fetchNotionPageBlocks failed:`, postToEnsure.id, e)
    }
    const step4End = Date.now()
    console.log(`[${taskId}] ⏱ ensureBlockMap 耗时: ${step4End - step4Start}ms @ ${new Date().toISOString()}`)
    return postToEnsure
  }

  if (post) {
    post = await ensureBlockMap(post)
    props.post = post
    try {
      await processPostData(props as MutableRecord, source)
    } catch (e) {
      console.warn(`[${taskId}] [resolvePostProps] processPostData failed`, e)
    }
    props.post = cleanPostForClient(props.post)
    props.prev = cleanPostSummary(props.prev) as SitePage | undefined
    props.next = cleanPostSummary(props.next) as SitePage | undefined
    props.recommendPosts = cleanPostSummaries(props.recommendPosts) as SitePage[]
  } else {
    props.post = null
  }

  props.latestPosts = cleanPostSummaries(props.latestPosts) as SitePage[]
  delete props.allPages
  const endTime = Date.now()
  console.log(`[${taskId}] ✅ 完成解析文章: ${fullSlug || lastSegment}, 总耗时: ${endTime - startTime}ms @ ${new Date().toISOString()}`)

  return props
}

async function convertNotionToSiteData(
  SITE_DATABASE_PAGE_ID: string,
  from: string | undefined,
  pageRecordMap: NotionBlockMap | null | undefined
): Promise<SiteDataResult> {
  const traceId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const overallStart = Date.now()
  console.log(`[${traceId}] 🕒 开始 convertNotionToSiteData from: ${from} @ ${new Date().toISOString()}`)

  if (!pageRecordMap) {
    console.error(`[${traceId}] can't get Notion Data ; pageId:`, SITE_DATABASE_PAGE_ID)
    return {}
  }

  SITE_DATABASE_PAGE_ID = idToUuid(SITE_DATABASE_PAGE_ID)

  const stepStart2 = Date.now()
  let block = (adapterNotionBlockMap({ block: pageRecordMap.block || {} }) as NotionBlockMap).block || {}
  const stepEnd2 = Date.now()
  console.log(`[${traceId}] ⏱ adapterNotionBlockMap 耗时: ${stepEnd2 - stepStart2}ms @ ${new Date().toISOString()}`)

  const rawMetadata = normalizeNotionMetadata(
    block as Record<string, { value?: unknown } | undefined>,
    SITE_DATABASE_PAGE_ID
  ) as MutableRecord | null

  if (rawMetadata?.type !== 'collection_view_page' && rawMetadata?.type !== 'collection_view') {
    console.error(`[${traceId}] pageId "${SITE_DATABASE_PAGE_ID}" is not a database`)
    return EmptyData(SITE_DATABASE_PAGE_ID)
  }

  const stepStart4 = Date.now()
  const collectionMap = (pageRecordMap.collection || {}) as MutableRecord
  const inferredCollectionId =
    Object.keys(collectionMap).length === 1 ? Object.keys(collectionMap)[0] : null
  const collectionId = (rawMetadata?.collection_id || inferredCollectionId) as string | null
  const collectionIdKey = collectionId as string
  const rawCollection =
    collectionMap?.[collectionIdKey] ||
    collectionMap?.[idToUuid(collectionIdKey)] ||
    {}
  const collection = normalizeCollection(rawCollection) as NotionCollection
  const collectionQuery = pageRecordMap.collection_query
  const collectionView = pageRecordMap.collection_view
  const schema = normalizeSchema(collection?.schema || {}) as NotionSchema
  const viewIds = rawMetadata?.view_ids as string[] | undefined
  const collectionData: SitePage[] = []
  const stepEnd4 = Date.now()
  console.log(`[${traceId}] ⏱ Collection 初始化耗时: ${stepEnd4 - stepStart4}ms @ ${new Date().toISOString()}`)

  const pageIds = getAllPageIds(collectionQuery, collectionIdKey, collectionView, viewIds, block)

  const blockIdsNeedFetch = pageIds.filter(id => !normalizePageBlock(block[id]))

  const stepStart7 = Date.now()
  if (blockIdsNeedFetch.length > 0) {
    const fetchedBlocks = await fetchInBatches(blockIdsNeedFetch)
    const adaptedFetchedBlocks = (adapterNotionBlockMap({ block: fetchedBlocks }) as NotionBlockMap).block || {}
    block = { ...block, ...adaptedFetchedBlocks }
  }
  const stepEnd7 = Date.now()
  console.log(`[${traceId}] ⏱ fetchInBatches + adapter 耗时: ${stepEnd7 - stepStart7}ms @ ${new Date().toISOString()}`)

  const stepStart8 = Date.now()
  for (const id of pageIds) {
    const pageBlock = normalizePageBlock(block[id]) as MutableRecord | null
    if (!pageBlock) continue
    if (pageBlock.parent_id !== collectionId) continue
    const properties = (await getPageProperties(id, pageBlock, schema, null, getTagOptions(schema) as any)) || null
    if (properties) collectionData.push(properties as SitePage)
  }
  const stepEnd8 = Date.now()
  console.log(`[${traceId}] ⏱ collectionData 构建耗时: ${stepEnd8 - stepStart8}ms @ ${new Date().toISOString()}`)

  const stepStart9 = Date.now()
  const NOTION_CONFIG = ((await getConfigMapFromConfigPage(collectionData)) || {}) as MutableRecord
  if (process.env.NODE_ENV === 'development') {
    console.log(
      '[ThemeResolver][notion-config]',
      JSON.stringify({
        from,
        pageId: SITE_DATABASE_PAGE_ID,
        notionTheme: NOTION_CONFIG?.THEME || null,
        configTheme: BLOG.THEME,
        note: 'If notionTheme exists, it will override configTheme unless URL ?theme is provided.'
      })
    )
  }
  collectionData.forEach(element => adjustPageProperties(element as any, NOTION_CONFIG))

  const officialMembers = await fetchMembersFromOfficialAPI({
    typeProperty: BLOG.NOTION_PROPERTY_NAME.type,
    statusProperty: BLOG.NOTION_PROPERTY_NAME.status,
    typeValue: BLOG.NOTION_PROPERTY_NAME.type_member,
    statusValue: BLOG.NOTION_PROPERTY_NAME.status_publish
  })
  if (officialMembers.length > 0) {
    const existingMembers = new Set(
      collectionData
        .filter(item => item?.type === 'Member')
        .flatMap(item => [item.id, item.slug].filter(Boolean))
    )
    officialMembers.forEach(member => {
      if (!existingMembers.has(member.id) && !existingMembers.has(member.slug)) {
        collectionData.push(member as SitePage)
      }
    })
  }

  const siteInfo = getSiteInfo({ collection, block, rawMetadata, NOTION_CONFIG })
  const stepEnd9 = Date.now()
  console.log(`[${traceId}] ⏱ 配置站点信息耗时: ${stepEnd9 - stepStart9}ms @ ${new Date().toISOString()}`)

  let postCount = 0
  let allPages = collectionData.filter(post => {
    if (post?.type === 'Post' && post.status === 'Published') postCount++
    return post?.slug && (post?.status === 'Invisible' || post?.status === 'Published')
  })
  const sortBy = siteConfig('POSTS_SORT_BY', null, NOTION_CONFIG)
  if (sortBy === 'date') {
    allPages.sort((a, b) => Number(b?.publishDate ?? 0) - Number(a?.publishDate ?? 0))
  }

  const topTag = siteConfig('TOP_TAG', '', NOTION_CONFIG)
  if (topTag) {
    allPages = sortPinnedPostsByLatestUpdate(allPages as any, topTag as string) as SitePage[]
  }

  const stepStart11 = Date.now()
  const notice = await getNotice(collectionData.find(post => post?.type === 'Notice' && post.status === 'Published'))
  const categoryOptions = getAllCategories({ allPages: allPages as any, categoryOptions: getCategoryOptions(schema) as any })
  const tagSchemaOptions = getTagOptions(schema)
  const tagOptions = getAllTags({ allPages: allPages as any, tagOptions: tagSchemaOptions as any, NOTION_CONFIG }) ?? null
  const customNav = getCustomNav({ allPages: collectionData.filter(post => post?.type === 'Page' && post.status === 'Published') })
  const customMenu = getCustomMenu({ collectionData, NOTION_CONFIG })
  const latestPosts = getLatestPosts({
    allPages,
    from,
    latestPostCount: siteConfig('LATEST_POST_COUNT', 6, NOTION_CONFIG) as number
  })
  const allNavPages = getNavPages({ allPages })
  const allLinkPages = getLinkPages({ allPages })

  const allMembers = getAllMembers({ allPages })
  const allEvents = getAllEvents({ allPages })

  const stepEnd11 = Date.now()
  console.log(`[${traceId}] ⏱ 其他数据生成耗时: ${stepEnd11 - stepStart11}ms @ ${new Date().toISOString()}`)
  const overallEnd = Date.now()
  console.log(`[${traceId}] ✅ convertNotionToSiteData 完成，总耗时: ${overallEnd - overallStart}ms @ ${new Date().toISOString()}`)

  return {
    NOTION_CONFIG,
    notice,
    siteInfo,
    allPages,
    allMembers,
    allEvents,
    allNavPages,
    allLinkPages,
    collection,
    collectionQuery,
    collectionId,
    collectionView,
    viewIds,
    block,
    schema,
    tagOptions: tagOptions as unknown as SelectOption[],
    categoryOptions: categoryOptions as unknown as SelectOption[],
    rawMetadata: rawMetadata || {},
    customNav,
    customMenu,
    postCount,
    pageIds,
    latestPosts
  }
}

/**
 * Clean data before returning it to the browser.
 */
function handleDataBeforeReturn(db: SiteDataResult): SiteDataResult {
  delete db.block
  delete db.schema
  delete db.rawMetadata
  delete db.pageIds
  delete db.viewIds
  delete db.collection
  delete db.collectionQuery
  delete db.collectionId
  delete db.collectionView

  if (db?.notice) {
    db.notice = cleanNoticeForClient(db?.notice)
    delete db.notice?.id
  }

  db.categoryOptions = cleanIds(db?.categoryOptions as any) as SelectOption[]
  db.customMenu = cleanIds(db?.customMenu as any) as SitePage[]
  db.allNavPages = shortenIds(db?.allNavPages as any) as NavPageSummary[]
  db.allLinkPages = shortenIds(db?.allLinkPages as any) as NavPageSummary[]

  db.tagOptions = cleanTagOptions(db?.tagOptions)
  db.allNavPages = cleanPages(db?.allNavPages, db.tagOptions)
  db.allLinkPages = cleanPages(db?.allLinkPages, db.tagOptions)
  db.allPages = cleanPages(db.allPages, db.tagOptions)
  db.allMembers = cleanPages(db.allMembers, db.tagOptions) as MemberSummary[]
  db.allEvents = cleanPages(db.allEvents, db.tagOptions)
  db.latestPosts = cleanPostSummaries(cleanPages(db.latestPosts, db.tagOptions)) as SitePage[]

  const POST_SCHEDULE_PUBLISH = siteConfig(
    'POST_SCHEDULE_PUBLISH',
    null,
    db.NOTION_CONFIG
  )
  if (POST_SCHEDULE_PUBLISH) {
    db.allPages?.forEach(p => {
      if (p.type === 'Event' || p.type === 'Member') return
      if (!isInRange(p.title, p.date)) {
        console.log('[定时发布] 隐藏-->', p.title, p.date)
        p.status = 'Invisible'
      }
    })
  }

  return db
}

function cleanPages<T extends SitePage>(
  allPages: T[] | null | undefined,
  tagOptions: SelectOption[] | null | undefined
): T[] {
  if (!Array.isArray(allPages) || !Array.isArray(tagOptions)) {
    console.warn('Invalid input: allPages and tagOptions should be arrays.')
    return allPages || []
  }
  const validTags = new Set(
    tagOptions
      .map(tag => (typeof tag.name === 'string' ? tag.name : null))
      .filter((tag): tag is string => Boolean(tag))
  )
  allPages.forEach(page => {
    if (Array.isArray(page.tagItems)) {
      page.tagItems = page.tagItems.filter(
        tagItem => typeof tagItem?.name === 'string' && validTags.has(tagItem.name)
      )
    }
  })
  return allPages
}

function shortenIds<T extends { id?: string | number | undefined } & MutableRecord>(
  items: T[] | null | undefined
): Array<Omit<T, 'id'> & { short_id: string }> | null | undefined {
  if (items && Array.isArray(items)) {
    return items.map(item => {
      const { id, ...rest } = item
      return {
        ...rest,
        short_id: getShortId(id)
      }
    })
  }
  return items
}

function cleanIds<T extends { id?: string | number | undefined } & MutableRecord>(
  items: T[] | null | undefined
): Array<Omit<T, 'id'>> | null | undefined {
  if (items && Array.isArray(items)) {
    return items.map(({ id, ...rest }) => rest)
  }
  return items
}

function cleanTagOptions(
  tagOptions: SelectOption[] | null | undefined
): SelectOption[] | null | undefined {
  if (tagOptions && Array.isArray(tagOptions)) {
    return tagOptions
      .filter(tagOption => tagOption.source === 'Published')
      .map(({ id, source, ...rest }) => rest as SelectOption)
  }
  return tagOptions
}

function cleanBlock<T>(item: T): T {
  const post = deepClone(item) as T & { blockMap?: NotionBlockMap | null }
  const pageBlock = post?.blockMap?.block
  if (pageBlock) {
    for (const i in pageBlock) {
      const blockEntry = pageBlock[i]
      if (blockEntry) pageBlock[i] = cleanBlock(blockEntry)
      delete pageBlock[i]?.role
      delete pageBlock[i]?.value?.version
      delete pageBlock[i]?.value?.created_by_table
      delete pageBlock[i]?.value?.created_by_id
      delete pageBlock[i]?.value?.last_edited_by_table
      delete pageBlock[i]?.value?.last_edited_by_id
      delete pageBlock[i]?.value?.space_id
      delete pageBlock[i]?.value?.created_time
      delete pageBlock[i]?.value?.last_edited_time
      delete pageBlock[i]?.value?.format?.copied_from_pointer
      delete pageBlock[i]?.value?.format?.block_locked_by
      delete pageBlock[i]?.value?.parent_table
      delete pageBlock[i]?.value?.copied_from_pointer
      delete pageBlock[i]?.value?.copied_from
      delete pageBlock[i]?.value?.permissions
      delete pageBlock[i]?.value?.alive
    }
  }
  return post
}

/**
 * Return latest posts by last edit time.
 */
function getLatestPosts({
  allPages,
  from,
  latestPostCount
}: {
  allPages?: SitePage[]
  from?: string | undefined
  latestPostCount: number
}): SitePage[] {
  void from
  const allPosts = allPages?.filter(
    page => page.type === 'Post' && page.status === 'Published'
  )
  return [...(allPosts ?? [])]
    .sort((a, b) => {
      const dateA = new Date(
        (a?.lastEditedDate || a?.publishDate) as string | number | Date
      )
      const dateB = new Date(
        (b?.lastEditedDate || b?.publishDate) as string | number | Date
      )
      return dateB.getTime() - dateA.getTime()
    })
    .slice(0, latestPostCount)
}

function getCustomNav({ allPages }: { allPages?: SitePage[] }): CustomNavItem[] {
  const customNav: CustomNavItem[] = []
  if (allPages && allPages.length > 0) {
    allPages.forEach(p => {
      p.to = p.slug
      customNav.push({
        icon: p.icon || null,
        name: p.title || p.name || '',
        href: p.href,
        target: p.target,
        show: true
      })
    })
  }
  return customNav
}

function getCustomMenu({
  collectionData,
  NOTION_CONFIG
}: {
  collectionData: SitePage[]
  NOTION_CONFIG: MutableRecord
}): SitePage[] {
  void NOTION_CONFIG
  const menuPages = collectionData.filter(
    post =>
      post.status === 'Published' &&
      (post?.type === 'Menu' || post?.type === 'SubMenu')
  )
  const menus: SitePage[] = []
  if (menuPages && menuPages.length > 0) {
    menuPages.forEach(e => {
      e.show = true
      if (e.type === 'Menu') {
        menus.push(e)
      } else if (e.type === 'SubMenu') {
        const parentMenu = menus[menus.length - 1]
        if (parentMenu) {
          if (parentMenu.subMenus) {
            parentMenu.subMenus.push(e)
          } else {
            parentMenu.subMenus = [e]
          }
        }
      }
    })
  }
  return menus
}

function getTagOptions(schema: NotionSchema | null | undefined): SelectOption[] | Record<string, never> {
  if (!schema) return {}
  const tagSchema = Object.values(schema).find(
    e => e.name === BLOG.NOTION_PROPERTY_NAME.tags
  )
  return tagSchema?.options || []
}

function getCategoryOptions(schema: NotionSchema | null | undefined): SelectOption[] | Record<string, never> {
  if (!schema) return {}
  const categorySchema = Object.values(schema).find(
    e => e.name === BLOG.NOTION_PROPERTY_NAME.category
  )
  return categorySchema?.options || []
}

function getSiteInfo({
  collection,
  block,
  rawMetadata,
  NOTION_CONFIG
}: SiteInfoParams): SiteInfo {
  void block
  const defaultTitle = (NOTION_CONFIG?.TITLE || 'NotionNext BLOG') as string
  const defaultDescription =
    (NOTION_CONFIG?.DESCRIPTION || '这是一个由NotionNext生成的站点') as string
  const defaultPageCover = (NOTION_CONFIG?.HOME_BANNER_IMAGE || '/bg_image.jpg') as string
  const defaultIcon = (NOTION_CONFIG?.AVATAR || '/avatar.svg') as string
  const defaultLink = (NOTION_CONFIG?.LINK || BLOG.LINK) as string

  if (!collection && !block) {
    return {
      title: defaultTitle,
      description: defaultDescription,
      pageCover: defaultPageCover,
      icon: defaultIcon,
      link: defaultLink
    }
  }

  const title = collection?.name?.[0]?.[0] || defaultTitle
  const description = collection?.description
    ? (Object.assign(collection).description[0][0] as string)
    : defaultDescription
  const pageCover = (collection?.cover
    ? mapImgUrl(collection?.cover, collection as any, 'collection')
    : rawMetadata?.format?.page_cover
      ? mapImgUrl(rawMetadata?.format?.page_cover, rawMetadata as any, 'block')
      : defaultPageCover) as string

  let icon = compressImage(
    collection?.icon
      ? mapImgUrl(collection?.icon, collection as any, 'collection')
      : defaultIcon
  ) as string
  const link = (NOTION_CONFIG?.LINK || defaultLink) as string
  const emojiPattern = /\uD83C[\uDF00-\uDFFF]|\uD83D[\uDC00-\uDE4F]/g
  if (!icon || emojiPattern.test(icon)) icon = defaultIcon

  return { title, description, pageCover, icon, link }
}

function isInRange(
  title: string | undefined,
  date: (PageDate & MutableRecord) | undefined = {}
): boolean {
  void title
  const {
    start_date,
    start_time = '00:00',
    end_date,
    end_time = '23:59',
    time_zone = 'Asia/Shanghai'
  } = date

  const currentTimestamp = Date.now()
  const startTimestamp = getTimestamp(start_date, start_time, time_zone)
  const endTimestamp = getTimestamp(end_date, end_time, time_zone)

  if (startTimestamp && currentTimestamp < startTimestamp) return false
  if (endTimestamp && currentTimestamp > endTimestamp) return false
  return true
}

function convertToUTC(dateStr: string, timeZone = 'Asia/Shanghai'): Date {
  const timeZoneOffsets: Record<string, number> = {
    UTC: 0, 'Etc/GMT': 0, 'Etc/GMT+0': 0,
    'Asia/Shanghai': 8, 'Asia/Taipei': 8, 'Asia/Tokyo': 9, 'Asia/Seoul': 9,
    'Asia/Kolkata': 5.5, 'Asia/Jakarta': 7, 'Asia/Singapore': 8,
    'Asia/Hong_Kong': 8, 'Asia/Bangkok': 7, 'Asia/Dubai': 4,
    'Asia/Tehran': 3.5, 'Asia/Riyadh': 3,
    'Europe/London': 0, 'Europe/Paris': 1, 'Europe/Berlin': 1,
    'Europe/Moscow': 3, 'Europe/Amsterdam': 1,
    'America/New_York': -5, 'America/Chicago': -6, 'America/Denver': -7,
    'America/Los_Angeles': -8, 'America/Sao_Paulo': -3,
    'America/Argentina/Buenos_Aires': -3,
    'Africa/Johannesburg': 2, 'Africa/Cairo': 2, 'Africa/Nairobi': 3,
    'Australia/Sydney': 10, 'Australia/Perth': 8,
    'Pacific/Auckland': 13, 'Pacific/Fiji': 12,
    'Antarctica/Palmer': -3, 'Antarctica/McMurdo': 13
  }
  const continentDefaults: Record<string, string> = {
    Asia: 'Asia/Shanghai', Europe: 'Europe/London', America: 'America/New_York',
    Africa: 'Africa/Cairo', Australia: 'Australia/Sydney',
    Pacific: 'Pacific/Auckland', Antarctica: 'Antarctica/Palmer', UTC: 'UTC'
  }

  let offsetHours = timeZoneOffsets[timeZone]
  if (offsetHours === undefined) {
    const continent = timeZone.split('/')[0] as string
    const fallbackZone = continentDefaults[continent] || 'UTC'
    offsetHours = timeZoneOffsets[fallbackZone]
    console.warn(
      `Warning: Unsupported time zone "${timeZone}". Using default "${fallbackZone}".`
    )
  }

  const localDate = new Date(`${dateStr.replace(' ', 'T')}Z`)
  if (isNaN(localDate.getTime())) {
    throw new Error(`Invalid date string: ${dateStr}`)
  }
  return new Date(localDate.getTime() - (offsetHours as number) * 3600 * 1000)
}

function getTimestamp(
  date: string | undefined,
  time = '00:00',
  time_zone?: string
): number | null {
  if (!date) return null
  return convertToUTC(`${date} ${time}:00`, time_zone).getTime()
}

export function getNavPages({
  allPages
}: {
  allPages?: SitePage[]
}): NavPageSummary[] {
  const allNavPages = allPages?.filter(
    post =>
      post &&
      post?.slug &&
      post?.type === 'Post' &&
      post?.status === 'Published'
  )
  return (allNavPages as SitePage[]).map(item => ({
    id: item.id,
    title: item.title || '',
    pageCoverThumbnail: item.pageCoverThumbnail || '',
    category: item.category || null,
    tags: item.tags || null,
    summary: item.summary || null,
    slug: item.slug,
    href: item.href,
    pageIcon: item.pageIcon || '',
    lastEditedDate: item.lastEditedDate,
    publishDate: item.publishDate,
    ext: item.ext || {}
  }))
}

/**
 * Notion content links can target both posts and standalone pages. Keep this
 * list separate from allNavPages because themes use allNavPages as a post list.
 */
export function getLinkPages({
  allPages
}: {
  allPages?: SitePage[]
}): NavPageSummary[] {
  const allLinkPages = (allPages || []).filter(
    post =>
      post &&
      post?.slug &&
      (post?.type === 'Post' || post?.type === 'Page') &&
      post?.status === 'Published'
  )
  return allLinkPages.map(item => ({
    id: item.id,
    title: item.title || '',
    type: item.type,
    slug: item.slug,
    href: item.href,
    short_id: item.short_id
  }))
}

/**
 * Return all published community members.
 */
export function getAllMembers({
  allPages
}: {
  allPages?: SitePage[]
}): MemberSummary[] {
  const published = getPublishedTypedPages({
    allPages: allPages as any,
    type: 'Member'
  }) as SitePage[]

  const slim = published.map(m => ({
    id: m.id || '',
    title: m.title || '',
    type: m.type || 'Member',
    status: m.status || 'Published',
    slug: m.slug || '',
    summary: m.summary || '',
    avatar: m.avatar || '',
    quote: m.quote || '',
    role: m.role || '',
    bio: m.bio || '',
    featured: m.featured || '',
    verified: m.verified || '',
    sortOrder: (m.sortOrder as number | string | null | undefined) ?? null,
    joinedAtText: m.joinedAtText || '',
    pageIcon: m.pageIcon || '',
    pageCoverThumbnail: m.pageCoverThumbnail || '',
    pageCover: m.pageCover || '',
    publishDate: m.publishDate ?? null
  })) as MemberSummary[]

  return slim.sort((a, b) => {
    const aFeatured = Boolean(a.featured)
    const bFeatured = Boolean(b.featured)
    if (aFeatured !== bFeatured) return bFeatured ? 1 : -1
    const aVerified = Boolean(a.verified)
    const bVerified = Boolean(b.verified)
    if (aVerified !== bVerified) return bVerified ? 1 : -1
    if (a.sortOrder != null && b.sortOrder != null) {
      return Number(a.sortOrder) - Number(b.sortOrder)
    }
    return Number(b?.publishDate ?? 0) - Number(a?.publishDate ?? 0)
  })
}

/**
 * Return all published community events.
 */
export function getAllEvents({
  allPages
}: {
  allPages?: SitePage[]
}): SitePage[] {
  return sortTypedPagesByPublishDate(
    getPublishedTypedPages({ allPages: allPages as any, type: 'Event' })
  ) as SitePage[]
}
