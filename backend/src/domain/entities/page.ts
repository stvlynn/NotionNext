export type PageStatus = 'Published' | 'Invisible'

export type PageType = 'Post' | 'Page' | 'Notice' | 'Menu' | 'SubMenu'

export interface PageDate {
  start_date?: string
  start_time?: string
  end_date?: string
  end_time?: string
  time_zone?: string
  lastEditedDay?: string
}

export interface TagItem {
  name: string
}

export interface BasePage {
  id?: string
  title: string
  slug: string
  type: PageType
  status: PageStatus
  summary?: string
  category?: string
  tags?: string[]
  tagItems?: TagItem[]
  date?: PageDate
  publishDate?: number
  lastEditedDate?: number
  pageCoverThumbnail?: string
  pageIcon?: string
  href?: string
  ext?: Record<string, unknown>
}

export interface Page extends BasePage {
  type: 'Page'
}

export interface NoticePage extends BasePage {
  type: 'Notice'
}

export interface MenuPage extends BasePage {
  type: 'Menu' | 'SubMenu'
}

export interface NavPage {
  id?: string
  short_id?: string
  title: string
  type?: PageType
  slug: string
  summary?: string
  category?: string
  tags?: string[]
  pageCoverThumbnail?: string
  pageIcon?: string
  href?: string
  publishDate?: number
  lastEditedDate?: number
  ext?: Record<string, unknown>
}
