import type { BasePage } from './page'

export interface Post extends BasePage {
  type: 'Post'
  category?: string
  tags?: string[]
  wordCount?: number
  readTime?: number
  password?: string
  content?: unknown[]
  blockMap?: unknown
}

export interface PostAggregate {
  post: Post
  category?: string
  tags: string[]
}
