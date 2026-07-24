export type EntityId = string | number

export type Timestamp = string | number | Date

export type CommentStatus = 'approved' | 'pending' | 'spam' | 'trash'

export interface CommentAuthor {
  name: string
  email: string
  avatar?: string
  website?: string
}

export interface Comment {
  id: EntityId
  postId: EntityId
  parentId?: EntityId
  author: CommentAuthor
  content: string
  status: CommentStatus
  createdAt: Timestamp
  updatedAt: Timestamp
  replies?: Comment[]
}
