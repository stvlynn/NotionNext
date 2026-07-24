import {
  formatNotionComment as formatNotionCommentRaw,
  getPlainText as getPlainTextRaw,
  isPublicComment as isPublicCommentRaw,
  PUBLIC_COMMENT_STATUS,
  validateCommentPayload as validateCommentPayloadRaw
} from '@/lib/plugins/notionComments'
import type {
  CommentValidationError,
  CommentValidationSuccess,
  NotionComment
} from './runtime'

export { PUBLIC_COMMENT_STATUS }

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
