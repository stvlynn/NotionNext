import BLOG from '@/blog.config'
import type { BasePage, SiteInfo, TagItem } from '@/backend/domain'
import { getStaticPathsBase as getStaticPathsBaseRaw } from '@/lib/build/staticPaths'
import {
  cleanPostSummaries as cleanPostSummariesRaw,
  fetchGlobalAllData as fetchGlobalAllDataRaw,
  getPostBlocks as getPostBlocksRaw,
  resolvePostProps as resolvePostPropsRaw
} from '@/lib/db/SiteDataApi'
import {
  formatNotionBlock as formatNotionBlockRaw,
  getPageBlockCacheKey as getPageBlockCacheKeyRaw
} from '@/lib/db/notion/getPostBlocks'
import { getPageContentText as getPageContentTextRaw } from '@/lib/db/notion/getPageContentText'
import { getPageTableOfContents as getPageTableOfContentsRaw } from '@/lib/db/notion/getPageTableOfContents'
import { getDataFromCache as getDataFromCacheRaw } from '@/lib/cache/cache_manager'
import { cleanCache as cleanCacheRaw } from '@/lib/cache/local_file_cache'
import { siteConfig as siteConfigRaw } from '@/lib/config'
import { GlobalContextProvider, useGlobal } from '@/lib/global'
import { checkDataFromAlgolia as checkDataFromAlgoliaRaw } from '@/lib/plugins/algolia'
import subscribeToMailchimpApiRaw from '@/lib/plugins/mailchimp'
import {
  formatNotionComment as formatNotionCommentRaw,
  getPlainText as getPlainTextRaw,
  isPublicComment as isPublicCommentRaw,
  PUBLIC_COMMENT_STATUS,
  validateCommentPayload as validateCommentPayloadRaw
} from '@/lib/plugins/notionComments'
import { markContributionCacheDirty as markContributionCacheDirtyRaw } from '@/lib/server/contributionStore'
import {
  buildSitemapLoc,
  normalizeSitemapBaseUrl,
  normalizeSitemapLocale,
  toSitemapDateString
} from '@/lib/sitemap-utils'
import { formatDateFmt as formatDateFmtRaw } from '@/lib/utils/formatDate'
import {
  adapterNotionBlockMap,
  normalizeNotionBlockType
} from '@/lib/utils/notion.util'
import { extractLangId, extractLangPrefix } from '@/lib/utils/pageId'
import {
  getPasswordQuery,
  getPasswordStoragePath,
  sha256Digest
} from '@/lib/utils/password'
import {
  checkSlugHasMorThanTwoSlash,
  checkSlugHasNoSlash,
  checkSlugHasOneSlash
} from '@/lib/utils/post'
import { generateRedirectJson as generateRedirectJsonRaw } from '@/lib/utils/redirect'
import { generateRobotsTxt as generateRobotsTxtRaw } from '@/lib/utils/robots.txt'
import {
  generateRss as generateRssRaw,
  shouldGenerateRssForLocale as shouldGenerateRssForLocaleRaw
} from '@/lib/utils/rss'
import { generateSitemapXml as generateSitemapXmlRaw } from '@/lib/utils/sitemap.xml'
import ErrorHandler from '@/lib/utils/errorHandler'

export type MutableRecord = Record<string, any>

export type SitePage = Omit<BasePage, 'category' | 'id' | 'status' | 'type'> &
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

/**
 * Page-layer facade over shared/backend modules.
 * Uses static imports so webpack can bundle them, with intentionally loose
 * casts so existing page handlers keep compiling during the TS migration.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
type WidenConfigValue<T> = T extends string
  ? string
  : T extends number
    ? number
    : T extends boolean
      ? boolean
      : T

export const siteConfig = siteConfigRaw as <T>(
  key: string,
  defaultValue?: T | undefined,
  extendConfig?: MutableRecord | undefined
) => WidenConfigValue<T>

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
  // Next.js cannot serialize `undefined` in getStaticProps; coerce to null.
  const serializableProps = JSON.parse(JSON.stringify(props)) as P
  const revalidate = getStaticRevalidateSeconds(notionConfig, isStaticExport)
  if (revalidate === undefined) {
    return { props: serializableProps }
  }
  return { props: serializableProps, revalidate }
}

export const cleanPostSummaries = cleanPostSummariesRaw as any
export const fetchGlobalAllData = fetchGlobalAllDataRaw as any
export const getPostBlocks = getPostBlocksRaw as any
export const resolvePostProps = resolvePostPropsRaw as any
export const formatNotionBlock = formatNotionBlockRaw as any
export const getPageContentText = getPageContentTextRaw as any
export const getPageTableOfContents = getPageTableOfContentsRaw as any

export {
  buildSitemapLoc,
  normalizeSitemapBaseUrl,
  normalizeSitemapLocale,
  toSitemapDateString,
  extractLangId,
  extractLangPrefix,
  adapterNotionBlockMap,
  normalizeNotionBlockType,
  GlobalContextProvider,
  useGlobal,
  getPasswordQuery,
  getPasswordStoragePath,
  sha256Digest,
  checkSlugHasMorThanTwoSlash,
  checkSlugHasNoSlash,
  checkSlugHasOneSlash,
  PUBLIC_COMMENT_STATUS
}

export const generateRobotsTxt = generateRobotsTxtRaw as any
export const generateRss = generateRssRaw as any
export const shouldGenerateRssForLocale = shouldGenerateRssForLocaleRaw as any
export const generateSitemapXml = generateSitemapXmlRaw as any
export const generateRedirectJson = generateRedirectJsonRaw as any
export const checkDataFromAlgolia = checkDataFromAlgoliaRaw as any
export const formatDateFmt = formatDateFmtRaw as any

export { ErrorHandler }

export const getDataFromCache = getDataFromCacheRaw as any
export const cleanCache = cleanCacheRaw as any
export const getPageBlockCacheKey = getPageBlockCacheKeyRaw as any
export const getStaticPathsBase = getStaticPathsBaseRaw as <
  TPage extends SitePage,
  TParams
>(params: {
  filterFn?: ((page: TPage) => boolean) | undefined
  mapPageToParams: (page: TPage) => TParams
  from?: string | undefined
  pageId?: string | undefined
  locale?: string | undefined
}) => Promise<{ paths: TParams[]; fallback: false | 'blocking' }>

export const subscribeToMailchimpApi = subscribeToMailchimpApiRaw as any

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

export const formatNotionComment = formatNotionCommentRaw as (
  page: unknown
) => NotionComment
export const getPlainText = getPlainTextRaw as (property: unknown) => string
export const isPublicComment = isPublicCommentRaw as (
  comment: NotionComment
) => boolean
export const validateCommentPayload = validateCommentPayloadRaw as (
  body: unknown
) => CommentValidationSuccess | CommentValidationError
export const markContributionCacheDirty = markContributionCacheDirtyRaw as any
/* eslint-enable @typescript-eslint/no-explicit-any */
