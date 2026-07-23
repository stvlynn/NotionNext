/** Minimal shapes the Navy Ink theme reads off NotionNext's page objects. */

export interface TagItem {
  name: string
  count?: number
  color?: string
}

export interface CategoryItem {
  name: string
  count?: number
}

export interface Post {
  id: string
  title: string
  href?: string
  slug?: string
  type?: string
  category?: string
  summary?: string
  pageCoverThumbnail?: string
  date?: { start_date?: string }
  lastEditedDay?: string
  tagItems?: TagItem[]
  results?: string[]
  password?: string
}

export interface ThemeLayoutProps {
  post?: Post
  posts?: Post[]
  postCount?: number
  page?: number
  children?: React.ReactNode
  slotTop?: React.ReactNode
  className?: string
  keyword?: string
  currentSearch?: string
  category?: string
  tag?: string
  archivePosts?: Record<string, Post[]>
  categoryOptions?: CategoryItem[]
  tagOptions?: TagItem[]
  siteInfo?: { title?: string; description?: string; pageCover?: string }
  lock?: boolean
  validPassword?: (password: string) => boolean
  prev?: Post
  next?: Post
  latestPosts?: Post[]
}
