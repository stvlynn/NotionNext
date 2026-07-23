import BLOG from '@/blog.config'
import type { BasePage, SiteInfo, TagItem } from '@/backend/domain'
import type { ComponentType, ReactNode } from 'react'

export type MutableRecord = Record<string, any>

export type SitePage = Omit<
  BasePage,
  'category' | 'id' | 'status' | 'type'
> &
  MutableRecord & {
  id: string
  slug: string
  title: string
  type: string
  status: string
  category?: string | string[] | undefined
  tags?: string[] | undefined
  publishDate?: number | undefined
  publishDay?: string | undefined
  lastEditedDate?: number | undefined
  password?: string | undefined
  blockMap?: MutableRecord | undefined
  content?: string[] | undefined
  toc?: unknown[] | undefined
  results?: string[] | undefined
}

export interface SiteOption extends TagItem, MutableRecord {
  name: string
}

export interface SiteDataProps extends MutableRecord {
  NOTION_CONFIG?: MutableRecord | undefined
  siteInfo?: SiteInfo | undefined
  allPages?: SitePage[] | undefined
  latestPosts?: SitePage[] | null | undefined
  posts?: SitePage[] | undefined
  post?: SitePage | null | undefined
  postCount?: number | undefined
  categoryOptions?: SiteOption[] | undefined
  tagOptions?: SiteOption[] | undefined
}

export type PageProps = SiteDataProps

export interface NotionBlockMap extends MutableRecord {
  block?: MutableRecord | undefined
  collection?: MutableRecord | undefined
}

export interface RssContent {
  xml: string
  atomXml: string
  json: string
}

type WidenConfigValue<T> = T extends string
  ? string
  : T extends number
    ? number
    : T extends boolean
      ? boolean
      : T

type SiteConfig = <T>(
  key: string,
  defaultValue?: T | undefined,
  extendConfig?: MutableRecord | undefined
) => WidenConfigValue<T>

const loadModule = <T>(path: string): T => require(path) as T

export const { siteConfig } = loadModule<{
  siteConfig: SiteConfig
}>('@/lib/config')

/** ISR revalidate seconds for getStaticProps; omit when static export. */
export function getStaticRevalidateSeconds(
  notionConfig?: MutableRecord | undefined,
  isStaticExport = Boolean(process.env.EXPORT)
): number | undefined {
  if (isStaticExport) {
    return undefined
  }
  const raw = siteConfig(
    'NEXT_REVALIDATE_SECOND',
    BLOG.NEXT_REVALIDATE_SECOND,
    notionConfig
  )
  const value = typeof raw === 'number' ? raw : Number(raw)
  return Number.isFinite(value) ? value : undefined
}

/** Build getStaticProps return value with correct revalidate typing. */
export function staticPropsResult<P extends object>(
  props: P,
  notionConfig?: MutableRecord | undefined,
  isStaticExport = Boolean(process.env.EXPORT)
): { props: P; revalidate: number } | { props: P } {
  const revalidate = getStaticRevalidateSeconds(notionConfig, isStaticExport)
  if (revalidate === undefined) {
    return { props }
  }
  return { props, revalidate }
}

export const {
  cleanPostSummaries,
  fetchGlobalAllData,
  getPostBlocks,
  resolvePostProps
} = loadModule<{
  cleanPostSummaries: (
    posts: SitePage[] | null | undefined
  ) => SitePage[] | null | undefined
  fetchGlobalAllData: (params: {
    pageId?: string | undefined
    from?: string | undefined
    locale?: string | undefined
    pageType?: string[] | undefined
  }) => Promise<SiteDataProps>
  getPostBlocks: (
    id: string,
    from?: string | undefined,
    options?: MutableRecord | number | undefined
  ) => Promise<NotionBlockMap>
  resolvePostProps: (params: {
    prefix?: string | undefined
    slug?: string | undefined
    suffix?: string[] | undefined
    locale?: string | undefined
    from?: string | undefined
  }) => Promise<SiteDataProps>
}>('@/lib/db/SiteDataApi')

export const { formatNotionBlock } = loadModule<{
  formatNotionBlock: (block: MutableRecord) => MutableRecord
}>('@/lib/db/notion/getPostBlocks')

export const { getPageContentText } =
  loadModule<{
    getPageContentText: (post: SitePage, pageBlockMap: NotionBlockMap) => string
  }>('@/lib/db/notion/getPageContentText')

export const { getPageTableOfContents } =
  loadModule<{
    getPageTableOfContents: (
      post: SitePage,
      blockMap: NotionBlockMap
    ) => unknown[]
  }>('@/lib/db/notion/getPageTableOfContents')

export const {
  buildSitemapLoc,
  normalizeSitemapBaseUrl,
  normalizeSitemapLocale,
  toSitemapDateString
} = loadModule<{
  buildSitemapLoc: (params: {
    baseUrl: string
    locale?: string | undefined
    slug?: string | undefined
  }) => string
  normalizeSitemapBaseUrl: (url?: string | undefined) => string
  normalizeSitemapLocale: (locale?: string | undefined) => string
  toSitemapDateString: (
    value?: string | number | Date,
    fallback?: string | undefined
  ) => string
}>('@/lib/sitemap-utils')

export const {
  extractLangId,
  extractLangPrefix
} = loadModule<{
  extractLangId: (value: string) => string
  extractLangPrefix: (value: string) => string
}>('@/lib/utils/pageId')

export const {
  adapterNotionBlockMap,
  normalizeNotionBlockType
} = loadModule<{
  adapterNotionBlockMap: <T>(blockMap: T) => T
  normalizeNotionBlockType: (type: string) => string
}>('@/lib/utils/notion.util')

export const { generateRobotsTxt } = loadModule<{
  generateRobotsTxt: (props: SiteDataProps) => void
}>('@/lib/utils/robots.txt')

export const {
  generateRss,
  shouldGenerateRssForLocale
} = loadModule<{
  generateRss: (props: SiteDataProps) => Promise<void>
  shouldGenerateRssForLocale: (params: {
    locale?: string | undefined
    defaultLocale?: string | undefined
  }) => boolean
}>('@/lib/utils/rss')

export const { generateSitemapXml } = loadModule<{
  generateSitemapXml: (props: SiteDataProps) => void
}>('@/lib/utils/sitemap.xml')

export const { generateRedirectJson } = loadModule<{
  generateRedirectJson: (props: SiteDataProps) => void
}>('@/lib/utils/redirect')

export const { checkDataFromAlgolia } = loadModule<{
  checkDataFromAlgolia: (props: SiteDataProps) => Promise<void>
}>('@/lib/plugins/algolia')

export const { formatDateFmt } = loadModule<{
  formatDateFmt: (date: string | number | Date | undefined, format: string) => string
}>('@/lib/utils/formatDate')

export const { GlobalContextProvider, useGlobal } = loadModule<{
  GlobalContextProvider: ComponentType<SiteDataProps & { children?: ReactNode }>
  useGlobal: () => MutableRecord
}>('@/lib/global')

export const ErrorHandler = loadModule<{
  createErrorBoundary: (fallback: ReactNode) => ComponentType<{
    children?: ReactNode
  }>
}>('@/lib/utils/errorHandler')

export const { getDataFromCache } = loadModule<{
  getDataFromCache: (
    key: string,
    force?: boolean
  ) => Promise<NotionBlockMap | null>
}>('@/lib/cache/cache_manager')

export const { cleanCache } = loadModule<{
  cleanCache: () => void
}>('@/lib/cache/local_file_cache')

export const { getPageBlockCacheKey } =
  loadModule<{
    getPageBlockCacheKey: (id: string, lastEditedDate?: number | undefined) => string
  }>('@/lib/db/notion/getPostBlocks')

export const { getStaticPathsBase } = loadModule<{
  getStaticPathsBase: <TPage extends SitePage, TParams>(params: {
    filterFn?: ((page: TPage) => boolean) | undefined
    mapPageToParams: (page: TPage) => TParams
    from?: string | undefined
    pageId?: string | undefined
    locale?: string | undefined
  }) => Promise<{ paths: TParams[]; fallback: false | 'blocking' }>
}>('@/lib/build/staticPaths')

export const { getPasswordQuery, getPasswordStoragePath, sha256Digest } =
  loadModule<{
    getPasswordQuery: (path: string) => string[]
    getPasswordStoragePath: (path: string) => string
    sha256Digest: (value: string) => string
  }>('@/lib/utils/password')

export const {
  checkSlugHasMorThanTwoSlash,
  checkSlugHasNoSlash,
  checkSlugHasOneSlash
} = loadModule<{
  checkSlugHasMorThanTwoSlash: (row: SitePage) => boolean
  checkSlugHasNoSlash: (row: SitePage) => boolean
  checkSlugHasOneSlash: (row: SitePage) => boolean
}>('@/lib/utils/post')

export const subscribeToMailchimpApi = loadModule<
  (params: {
    email: string
    first_name?: string | undefined
    last_name?: string | undefined
  }) => Promise<Response>
>('@/lib/plugins/mailchimp')

export interface NotionComment {
  id: string
  postId: string
  parentId: string | null
  content: string
  author: string
  emailHash: string
  level: number
  status: string
  createdTime: string
}

export interface CommentValidationSuccess {
  ok: true
  spam?: boolean | undefined
  value: {
    postId: string
    content: string
    author: string
    nickname?: string | undefined
    parentId?: string | undefined
  }
}

export interface CommentValidationError {
  ok: false
  error: string
}

export const {
  formatNotionComment,
  getPlainText,
  isPublicComment,
  PUBLIC_COMMENT_STATUS,
  validateCommentPayload
} = loadModule<{
  formatNotionComment: (page: unknown) => NotionComment
  getPlainText: (property: unknown) => string
  isPublicComment: (comment: NotionComment) => boolean
  PUBLIC_COMMENT_STATUS: string
  validateCommentPayload: (
    body: unknown
  ) => CommentValidationSuccess | CommentValidationError
}>('@/lib/plugins/notionComments')

export const { markContributionCacheDirty } =
  loadModule<{
    markContributionCacheDirty: () => void
  }>('@/lib/server/contributionStore')
