import type { BasePage, NavPage } from './page'

export interface SiteInfo {
  title: string
  description: string
  pageCover: string
  icon: string
  link: string
}

export interface MenuItem {
  name: string
  icon?: string | null
  href?: string
  target?: string
  show: boolean
  subMenus?: MenuItem[]
}

export interface SiteData {
  NOTION_CONFIG: Record<string, unknown>

  siteInfo: SiteInfo
  notice: BasePage | null

  allPages: BasePage[]
  allNavPages: NavPage[]
  allLinkPages: NavPage[]
  latestPosts: BasePage[]

  categoryOptions: Array<Record<string, unknown>>
  tagOptions: Array<Record<string, unknown>>

  customNav: MenuItem[]
  customMenu: MenuItem[]

  postCount: number

  block?: unknown
  schema?: unknown
  rawMetadata?: unknown
  pageIds?: string[]
}

export interface SiteConfigIntegration {
  provider: string
  config: Record<string, unknown>
}

export interface SiteConfig {
  title: string
  description: string
  author: string
  lang: string
  theme: string
  domain: string
  path: string
  since: number
  analytics?: SiteConfigIntegration
  comment?: SiteConfigIntegration
  search?: SiteConfigIntegration
}
