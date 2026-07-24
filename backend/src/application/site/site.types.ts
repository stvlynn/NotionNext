export type {
  BasePage,
  MenuItem,
  NavPage,
  PageDate,
  PageStatus,
  PageType,
  SiteData,
  SiteInfo,
  TagItem
} from '../../domain'

export interface FetchSiteParams {
  pageId: string
  from?: string
  locale?: string
}
