import BLOG from '@/blog.config'
import type { BasePage, SiteInfo, TagItem } from '@/backend/domain'
import { siteConfig as siteConfigRaw } from '@/lib/config'
import { GlobalContextProvider, useGlobal } from '@/lib/global'
import { getPageTableOfContents as getPageTableOfContentsRaw } from '@/lib/db/notion/getPageTableOfContents'
import {
  getPasswordQuery,
  getPasswordStoragePath,
  sha256Digest
} from '@/lib/utils/password'

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

export const getPageTableOfContents = getPageTableOfContentsRaw as any

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

export {
  GlobalContextProvider,
  getPasswordQuery,
  getPasswordStoragePath,
  sha256Digest,
  useGlobal
}

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
