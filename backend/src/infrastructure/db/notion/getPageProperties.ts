import BLOG from '@/blog.config'
import { getDateValue, getTextContent } from 'notion-utils'
import formatDate from '@/lib/utils/formatDate'
// import { createHash } from 'crypto'
import { siteConfig } from '@/lib/config'
import {
  convertUrlStartWithOneSlash,
  getLastSegmentFromUrl,
  isHttpLink,
  isMailOrTelLink
} from '@/lib/utils'
import { extractLangPrefix } from '@/lib/utils/pageId'
import {
  isMd5Digest,
  isSHA256Digest,
  sha256Digest
} from '@/lib/utils/password'
import { mapImgUrl } from './mapImage'
import notionAPI from '@/lib/db/notion/getNotionAPI'
import type { Decoration, FormattedDate } from 'notion-types'
import type { BasePage, PageDate, PageStatus, PageType, Tag } from '@/backend/domain'

type NotionPageType = PageType | 'Member' | 'Event' | ''
type LinkTarget = '_blank' | '_self'
type JsonObject = Record<string, unknown>

interface NotionSchemaProperty {
  name: string
  type: string
  options?: TagOption[]
  [key: string]: unknown
}

type NotionSchema = Record<string, NotionSchemaProperty | undefined>
type NotionPropertyValue = unknown[]

interface NotionPageFormat {
  page_full_width?: boolean
  page_icon?: string
  page_cover?: string
  block_width?: unknown
  [key: string]: unknown
}

interface NotionPageBlock {
  id?: string | number
  type?: string
  parent_id?: string
  properties?: Record<string, NotionPropertyValue>
  created_time?: string | number | Date
  last_edited_time?: string | number | Date
  format?: NotionPageFormat
  content?: string[]
  [key: string]: unknown
}

interface NotionImageBlock {
  id: string
  type?: string
  format?: NotionPageFormat
}

interface TagOption {
  value?: string | undefined
  color?: string | undefined
  [key: string]: unknown
}

interface NotionUser {
  id?: string | undefined
  first_name?: string | undefined
  last_name?: string | undefined
  profile_photo?: string | undefined
}

interface NotionUsersResponse {
  recordMapWithRoles?: {
    notion_user?: Record<
      string,
      {
        value?: {
          id?: string
          given_name?: string
          family_name?: string
          profile_photo?: string
        }
      }
    >
  }
}

type PageTagItem = Pick<Tag, 'name' | 'color'>

export type PageProperties = Omit<
  Partial<BasePage>,
  'date' | 'href' | 'lastEditedDate' | 'slug' | 'status' | 'tagItems' | 'type'
> & {
  id: string
  title?: string
  slug?: string | undefined
  type?: NotionPageType | undefined
  status?: PageStatus | '' | undefined
  category?: string | undefined
  comment?: string | undefined
  tags?: string[]
  date?: (PageDate & JsonObject) | null
  password?: string
  publishDate?: number
  publishDay?: string
  lastEditedDate?: Date
  lastEditedDay?: string
  fullWidth?: boolean
  pageIcon?: string
  pageCover?: string
  pageCoverThumbnail?: string
  ext?: JsonObject
  content?: string[]
  tagItems?: PageTagItem[]
  href?: string | undefined
  target?: LinkTarget | undefined
  name?: string | undefined
  [key: string]: unknown
}

type NotionConfig = Record<string, unknown>

export type AdjustablePageProperties = Record<string, unknown> & {
  id?: string | number | null | undefined
  title?: string | null | undefined
  slug?: string | null | undefined
  type?: string | null | undefined
  status?: string | null | undefined
  category?: string | null | undefined
  href?: string | number | null | undefined
  target?: LinkTarget | string | undefined
  name?: string | null | undefined
  password?: string | null | undefined
  publishDay?: string | number | Date | null | undefined
}

/**
 * Resolve page member properties from a Notion block and collection schema.
 */
export default async function getPageProperties(
  id: string,
  value: NotionPageBlock,
  schema: Record<string, unknown>,
  authToken?: string | null,
  tagOptions?: TagOption[]
): Promise<PageProperties> {
  void authToken
  const notionSchema = schema as NotionSchema
  const rawProperties = Object.entries(value?.properties || {})
  const excludeProperties = ['date', 'select', 'multi_select', 'person']
  const properties: PageProperties = { id }
  for (let i = 0; i < rawProperties.length; i++) {
    const [key, val] = rawProperties[i]!
    properties.id = id
    const schemaProperty = notionSchema[key]
    if (schemaProperty?.type && !excludeProperties.includes(schemaProperty.type)) {
      properties[schemaProperty.name] = getTextContent(
        val as Decoration[] | undefined
      )
    } else {
      switch (schemaProperty?.type) {
        case 'date': {
          properties[schemaProperty.name] = stripDateType(
            getDateValue(val as unknown[])
          )
          break
        }
        case 'select':
        case 'multi_select': {
          const selects = getTextContent(val as Decoration[] | undefined)
          if (selects[0]?.length) {
            properties[schemaProperty.name] = selects.split(',')
          }
          break
        }
        case 'person': {
          const rawUsers = val.flat()
          const users: NotionUser[] = []

          for (let i = 0; i < rawUsers.length; i++) {
            const userId = getUserIdTuple(rawUsers[i])
            if (userId?.[1]) {
              const res = (await notionAPI.getUsers(userId)) as NotionUsersResponse
              const resValue =
                res?.recordMapWithRoles?.notion_user?.[userId[1]]?.value
              const user = {
                id: resValue?.id,
                first_name: resValue?.given_name,
                last_name: resValue?.family_name,
                profile_photo: resValue?.profile_photo
              }
              users.push(user)
            }
          }
          properties[schemaProperty.name] = users
          break
        }
        default:
          break
      }
    }
  }

  const fieldNames = BLOG.NOTION_PROPERTY_NAME as Record<string, string>
  if (fieldNames) {
    Object.keys(fieldNames).forEach(key => {
      const fieldName = fieldNames[key]
      if (fieldName && properties[fieldName]) {
        properties[key] = properties[fieldName]
      }
    })
  }

  properties.type = firstSelectValue(properties.type) as NotionPageType
  properties.status = firstSelectValue(properties.status) as PageStatus | ''
  properties.category = firstSelectValue(properties.category)
  properties.comment = firstSelectValue(properties.comment)

  mapProperties(properties)

  properties.publishDate = new Date(
    (properties?.date?.start_date || value.created_time) as
      | string
      | number
      | Date
  ).getTime()
  properties.publishDay = formatDate(properties.publishDate, BLOG.LANG)
  properties.lastEditedDate = new Date(value?.last_edited_time as
    | string
    | number
    | Date)
  properties.lastEditedDay = formatDate(
    new Date(value?.last_edited_time as string | number | Date),
    BLOG.LANG
  )
  properties.fullWidth = value?.format?.page_full_width ?? false
  const imageBlock = getImageBlock(value, id)
  properties.pageIcon = mapImgUrl(value?.format?.page_icon, imageBlock) ?? ''
  properties.pageCover = mapImgUrl(value?.format?.page_cover, imageBlock) ?? ''
  properties.pageCoverThumbnail =
    mapImgUrl(value?.format?.page_cover, imageBlock, 'block') ?? ''
  properties.ext = convertToJSON(properties?.ext)
  properties.content = value.content ?? []
  properties.tagItems =
    properties?.tags?.map(tag => {
      return {
        name: tag,
        color: tagOptions?.find(t => t.value === tag)?.color || 'gray'
      }
    }) || []
  delete properties.content
  return properties
}

/**
 * Convert the page extension string to JSON.
 */
function convertToJSON(str: unknown): JsonObject {
  if (!str) {
    return {}
  }
  try {
    return JSON.parse(String(str).replace(/\s/g, '')) as JsonObject
  } catch (error) {
    console.warn('无效JSON', str)
    return {}
  }
}

/**
 * Map customized Notion property values to the internal identifiers.
 */
function mapProperties(properties: PageProperties): void {
  const typeMap: Record<string, Exclude<NotionPageType, ''>> = {
    [BLOG.NOTION_PROPERTY_NAME.type_post]: 'Post',
    [BLOG.NOTION_PROPERTY_NAME.type_page]: 'Page',
    [BLOG.NOTION_PROPERTY_NAME.type_notice]: 'Notice',
    [BLOG.NOTION_PROPERTY_NAME.type_menu]: 'Menu',
    [BLOG.NOTION_PROPERTY_NAME.type_sub_menu]: 'SubMenu',
    [BLOG.NOTION_PROPERTY_NAME.type_member]: 'Member',
    [BLOG.NOTION_PROPERTY_NAME.type_event]: 'Event'
  }

  const statusMap: Record<string, PageStatus> = {
    [BLOG.NOTION_PROPERTY_NAME.status_publish]: 'Published',
    [BLOG.NOTION_PROPERTY_NAME.status_invisible]: 'Invisible'
  }

  const mappedType = properties?.type ? typeMap[properties.type] : undefined
  if (mappedType) {
    properties.type = mappedType
  }

  const mappedStatus = properties?.status
    ? statusMap[properties.status]
    : undefined
  if (mappedStatus) {
    properties.status = mappedStatus
  }
}

/**
 * Filter and adjust page data using values from NOTION_CONFIG.
 */
export function adjustPageProperties(
  properties: AdjustablePageProperties,
  NOTION_CONFIG: NotionConfig
): void {
  if (properties.type === 'Post') {
    properties.slug = generateCustomizeSlug(properties, NOTION_CONFIG)
    properties.href = properties.slug ?? properties.id
  } else if (properties.type === 'Page') {
    properties.href = properties.slug ?? properties.id
  } else if (properties.type === 'Menu' || properties.type === 'SubMenu') {
    properties.href = properties.slug ?? '#'
    properties.name = properties.title ?? ''
  }

  if (isHttpLink(properties?.href)) {
    properties.href = properties?.slug
    properties.target = '_blank'
  } else if (isMailOrTelLink(properties?.href)) {
    properties.href = properties?.slug
    properties.target = '_self'
  } else {
    properties.target = '_self'
    if (siteConfig('PSEUDO_STATIC', false, NOTION_CONFIG)) {
      if (
        !(properties?.href as string | undefined)?.endsWith('.html') &&
        properties?.href !== '' &&
        properties?.href !== '#' &&
        properties?.href !== '/'
      ) {
        properties.href = `${properties.href}.html`
      }
    }

    properties.href = convertUrlStartWithOneSlash(properties?.href)
  }

  if (BLOG.NOTION_PAGE_ID.indexOf(',') > 0) {
    const siteIds = BLOG.NOTION_PAGE_ID.split(',')
    for (let index = 0; index < siteIds.length; index++) {
      const siteId = siteIds[index]
      const prefix = extractLangPrefix(siteId)
      if (getLastSegmentFromUrl(properties.href) === prefix) {
        properties.target = '_blank'
      }
    }
  }

  if (!properties.password) {
    properties.password = ''
  } else if (isSHA256Digest(properties.password)) {
    properties.password = properties.password.trim()
  } else if (isMd5Digest(properties.password)) {
    properties.password = properties.password.trim()
  } else {
    properties.password = sha256Digest(properties.password)
  }
}

/**
 * Generate a customized URL from variables such as category, date, and slug.
 */
function generateCustomizeSlug(
  postProperties: AdjustablePageProperties,
  NOTION_CONFIG: NotionConfig
): string {
  if (postProperties.slug && isHttpLink(postProperties.slug)) {
    return postProperties.slug
  }
  let fullPrefix = ''
  let allSlugPatterns = NOTION_CONFIG?.POST_URL_PREFIX
  if (allSlugPatterns === undefined || allSlugPatterns === null) {
    allSlugPatterns = siteConfig(
      'POST_URL_PREFIX',
      BLOG.POST_URL_PREFIX,
      NOTION_CONFIG
    ).split('/')
  } else {
    allSlugPatterns = String(allSlugPatterns).split('/')
  }

  const POST_URL_PREFIX_MAPPING_CATEGORY = siteConfig(
    'POST_URL_PREFIX_MAPPING_CATEGORY',
    {},
    NOTION_CONFIG
  ) as Record<string, string>

  ;(allSlugPatterns as string[]).forEach((pattern, idx) => {
    if (pattern === '%year%' && postProperties?.publishDay) {
      const formatPostCreatedDate = new Date(postProperties?.publishDay)
      fullPrefix += formatPostCreatedDate.getUTCFullYear()
    } else if (pattern === '%month%' && postProperties?.publishDay) {
      const formatPostCreatedDate = new Date(postProperties?.publishDay)
      fullPrefix += String(formatPostCreatedDate.getUTCMonth() + 1).padStart(
        2,
        '0'
      )
    } else if (pattern === '%day%' && postProperties?.publishDay) {
      const formatPostCreatedDate = new Date(postProperties?.publishDay)
      fullPrefix += String(formatPostCreatedDate.getUTCDate()).padStart(2, '0')
    } else if (pattern === '%slug%') {
      fullPrefix += postProperties.slug ?? postProperties.id
    } else if (pattern === '%category%' && postProperties?.category) {
      let categoryPrefix = postProperties.category
      if (POST_URL_PREFIX_MAPPING_CATEGORY[postProperties?.category]) {
        categoryPrefix =
          POST_URL_PREFIX_MAPPING_CATEGORY[postProperties?.category] ||
          categoryPrefix
      }
      fullPrefix += categoryPrefix
    } else if (!pattern.includes('%')) {
      fullPrefix += pattern
    } else {
      return
    }
    if (idx !== (allSlugPatterns as string[]).length - 1) {
      fullPrefix += '/'
    }
  })
  if (fullPrefix.startsWith('/')) {
    fullPrefix = fullPrefix.substring(1)
  }
  if (fullPrefix.endsWith('/')) {
    fullPrefix = fullPrefix.substring(0, fullPrefix.length - 1)
  }

  if (fullPrefix) {
    return `${fullPrefix}/${postProperties.slug ?? postProperties.id}`
  } else {
    return `${postProperties.slug ?? postProperties.id}`
  }
}

function stripDateType(
  date: FormattedDate | null
): (PageDate & JsonObject) | null {
  if (!date) return null
  const { type: _type, ...dateWithoutType } = date
  return dateWithoutType
}

function getUserIdTuple(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null

  const candidate = value[0]
  return Array.isArray(candidate) && candidate.every(item => typeof item === 'string')
    ? candidate
    : null
}

function firstSelectValue(value: unknown): string {
  const firstValue = (value as { 0?: unknown } | null | undefined)?.[0]
  return firstValue ? String(firstValue) : ''
}

function getImageBlock(value: NotionPageBlock, fallbackId: string): NotionImageBlock {
  const block: NotionImageBlock = {
    id:
      typeof value.id === 'string' || typeof value.id === 'number'
        ? String(value.id)
        : fallbackId
  }
  if (value.type !== undefined) {
    block.type = value.type
  }
  if (value.format !== undefined) {
    block.format = value.format
  }
  return block
}
