const MAX_POST_ID_LENGTH = 200
const MAX_CONTENT_LENGTH = 2000
const MAX_EMAIL_LENGTH = 254
const MAX_NICKNAME_LENGTH = 40
const PUBLIC_COMMENT_STATUS = 'Approved'

type NotionTextItem = { plain_text?: string }
type NotionTextProperty = {
  type?: string
  title?: NotionTextItem[]
  rich_text?: NotionTextItem[]
}
type NotionStatusProperty = {
  type?: string
  select?: { name?: string } | null
  status?: { name?: string } | null
}
type NotionCommentProperties = Record<
  string,
  NotionTextProperty &
    NotionStatusProperty & {
      email?: string
      number?: number | null
      date?: { start?: string } | null
    }
>
interface NotionCommentPage {
  id: string
  created_time: string
  properties?: NotionCommentProperties
}
interface CommentPayload {
  postId?: unknown
  content?: unknown
  author?: unknown
  nickname?: unknown
  parentId?: unknown
  website?: unknown
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
  children?: NotionComment[]
}
type ValidCommentPayload =
  | { ok: true; spam: true; value: Record<string, never> }
  | {
      ok: true
      value: {
        postId: string
        content: string
        author: string
        nickname: string
        parentId: string
      }
    }
  | { ok: false; error: string }

export const getPlainText = (property?: NotionTextProperty): string => {
  if (!property) return ''
  const items =
    property.type === 'title'
      ? property.title || []
      : property.type === 'rich_text'
        ? property.rich_text || []
        : []
  return items.map(item => item.plain_text || '').join('')
}

const isEmail = (value: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

export const normalizeEmail = (email: string): string => email.trim().toLowerCase()

const getCommentStatus = (props: NotionCommentProperties): string => {
  const status = props.Status
  if (!status) return ''
  if (status.type === 'select') return status.select?.name || ''
  if (status.type === 'status') return status.status?.name || ''
  return ''
}

export const validateCommentPayload = (body: CommentPayload): ValidCommentPayload => {
  const postId = String(body?.postId || '').trim()
  const content = String(body?.content || '').trim()
  const author = String(body?.author || '').trim()
  const nickname = String(body?.nickname || '').trim()
  const parentId = body?.parentId ? String(body.parentId).trim() : ''
  const website = String(body?.website || '').trim()

  if (website) {
    return { ok: true, spam: true, value: {} }
  }
  if (!postId || postId.length > MAX_POST_ID_LENGTH) {
    return { ok: false, error: 'Invalid postId' }
  }
  if (!content || content.length > MAX_CONTENT_LENGTH) {
    return { ok: false, error: 'Invalid content' }
  }
  if (!author || author.length > MAX_EMAIL_LENGTH || !isEmail(author)) {
    return { ok: false, error: 'Invalid author email' }
  }
  if (nickname.length > MAX_NICKNAME_LENGTH) {
    return { ok: false, error: 'Invalid nickname' }
  }
  if (parentId && parentId.length > 100) {
    return { ok: false, error: 'Invalid parentId' }
  }

  return {
    ok: true,
    value: {
      postId,
      content,
      author: normalizeEmail(author),
      nickname,
      parentId
    }
  }
}

export const formatNotionComment = (page: NotionCommentPage): NotionComment => {
  const props = page?.properties || {}
  const author = props.Author?.type === 'email' ? props.Author.email : ''
  const nickname = getPlainText(props.Nickname)

  return {
    id: page.id,
    postId: getPlainText(props.PostId),
    parentId: getPlainText(props.ParentId) || null,
    content: getPlainText(props.Content),
    author: nickname || (author ? author.split('@')[0] || 'anonymous' : 'anonymous'),
    emailHash: getPlainText(props.EmailHash),
    level: props.Level?.type === 'number' ? props.Level.number || 1 : 1,
    status: getCommentStatus(props),
    createdTime:
      props.CreatedAt?.type === 'date'
        ? props.CreatedAt.date?.start || page.created_time
        : page.created_time
  }
}

export const isPublicComment = (comment: NotionComment): boolean =>
  !comment.status || comment.status === PUBLIC_COMMENT_STATUS

export const buildCommentTree = (comments: NotionComment[]): NotionComment[] => {
  const map = new Map<string, NotionComment>()
  const roots: NotionComment[] = []

  comments.forEach(comment => map.set(comment.id, { ...comment, children: [] }))
  comments.forEach(comment => {
    const node = map.get(comment.id)
    if (!node) return
    const parent = comment.parentId ? map.get(comment.parentId) : undefined
    if (parent) {
      parent.children?.push(node)
    } else {
      roots.push(node)
    }
  })

  return roots
}

export const countReplies = (comment: NotionComment): number =>
  (comment.children || []).reduce(
    (count, child) => count + 1 + countReplies(child),
    0
  )

export { MAX_CONTENT_LENGTH, MAX_NICKNAME_LENGTH, PUBLIC_COMMENT_STATUS }
