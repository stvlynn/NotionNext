import BLOG from '@/blog.config'
import { idToUuid } from 'notion-utils'
import * as ReactNotionX from 'react-notion-x'
import formatDate from '@/lib/utils/formatDate'
import { fetchNotionPageBlocks, formatNotionBlock } from './getPostBlocks'
import { checkStrIsNotionId, checkStrIsUuid } from '@/lib/utils'
import { adapterNotionBlockMap } from '@/lib/utils/notion.util'
import type { Decoration } from 'notion-types'

interface NotionPageFormat {
  page_cover?: string
  [key: string]: unknown
}

interface NotionPageProperties {
  title?: Decoration[]
  [key: string]: unknown
}

interface NotionPageBlock {
  type?: string
  properties?: NotionPageProperties
  created_time?: string | number | Date
  last_edited_time?: string | number | Date
  fullWidth?: boolean
  format?: NotionPageFormat
  [key: string]: unknown
}

interface NotionBlockBox {
  value?: NotionPageBlock
  [key: string]: unknown
}

interface AdaptedBlockMap {
  block?: Record<string, NotionBlockBox>
  [key: string]: unknown
}

export interface NotionPostPage {
  id: string
  type: string | undefined
  category: string
  tags: string[]
  title: unknown
  status: 'Published'
  createdTime: string
  lastEditedDay: string
  fullWidth: boolean
  page_cover: string | null
  date: {
    start_date: string
  }
  blockMap: AdaptedBlockMap
}

/**
 * Fetch a page from Notion and log the time spent on the request.
 */
export async function fetchPageFromNotion(
  pageId: string
): Promise<NotionPostPage | null> {
  const start = Date.now()

  const rawBlockMap = await fetchNotionPageBlocks(pageId, 'slug')
  const fetchEnd = Date.now()
  console.log(
    `⏱ [Notion] pageId: ${pageId} fetch blocks耗时: ${fetchEnd - start}ms`
  )

  if (!rawBlockMap) {
    return null
  }
  const blockMap = adapterNotionBlockMap(rawBlockMap) as AdaptedBlockMap
  if (blockMap?.block) {
    blockMap.block = formatNotionBlock(blockMap.block) as Record<
      string,
      NotionBlockBox
    >
  }
  if (checkStrIsNotionId(pageId)) {
    pageId = idToUuid(pageId)
  }
  if (!checkStrIsUuid(pageId)) {
    return null
  }

  const postInfo = blockMap?.block?.[pageId]?.value
  if (!postInfo) {
    return null
  }

  const result: NotionPostPage = {
    id: pageId,
    type: postInfo.type,
    category: '',
    tags: [],
    title: postInfo?.properties?.title?.[0] || null,
    status: 'Published',
    createdTime: formatDate(
      toDateString(postInfo.created_time),
      BLOG.LANG
    ),
    lastEditedDay: formatDate(
      toDateString(postInfo?.last_edited_time),
      BLOG.LANG
    ),
    fullWidth: postInfo?.fullWidth || false,
    page_cover: getPageCover(postInfo) || getBlogString('HOME_BANNER_IMAGE') || null,
    date: {
      start_date: formatDate(
        toDateString(postInfo?.last_edited_time),
        BLOG.LANG
      )
    },
    blockMap
  }

  const end = Date.now()
  console.log(`✅ [Notion] pageId: ${pageId} total处理耗时: ${end - start}ms`)

  return result
}

/**
 * Resolve the page cover in Notion page cover, site default cover, null order.
 */
function getPageCover(postInfo: NotionPageBlock): string | null | undefined {
  const pageCover = postInfo.format?.page_cover
  if (pageCover) {
    if (pageCover.startsWith('/')) return BLOG.NOTION_HOST + pageCover
    if (pageCover.startsWith('http')) {
      console.log('ReactNotionX', ReactNotionX)
      return pageCover
    }
    // return defaultMapImageUrl(pageCover, postInfo)
    return null
  }
  return undefined
}

function toDateString(value: string | number | Date | undefined): string {
  return new Date(value as string | number | Date).toString()
}

function getBlogString(key: string): string | null {
  const value = (BLOG as Record<string, unknown>)[key]
  return typeof value === 'string' ? value : null
}
