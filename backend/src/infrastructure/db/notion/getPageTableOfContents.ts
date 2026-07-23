import { getTextContent } from 'notion-utils'

interface TocPage {
  id?: string
  content?: string[]
}

interface TocBlock {
  type?: string
  content?: string[]
  properties?: {
    title?: Parameters<typeof getTextContent>[0]
    [key: string]: unknown
  }
  format?: {
    transclusion_reference_pointer?: {
      id?: string
    }
    [key: string]: unknown
  }
  parent_id?: string
}

interface TocRecordMap {
  block: Record<string, { value?: TocBlock } | undefined>
}

interface TocItem {
  id: string
  type: string
  text: string
  indentLevel: number
}

interface IndentStackItem {
  actual: number
  effective: number
}

const indentLevels: Record<string, number> = {
  header: 0,
  sub_header: 1,
  sub_sub_header: 2,
  heading_1: 0,
  heading_2: 1,
  heading_3: 2,
  heading_4: 3,
  header_4: 3
}

const unknownHeadingStats = new Map<string, number>()

/**
 * @see https://github.com/NotionX/react-notion-x/blob/master/packages/notion-utils/src/get-page-table-of-contents.ts
 * Gets the metadata for a table of contents block by parsing the page's
 * H1, H2, and H3 elements.
 */
export const getPageTableOfContents = (
  page: TocPage,
  recordMap: TocRecordMap
): TocItem[] => {
  const pageId = page?.id
  if (process.env.NODE_ENV !== 'production' && pageId) {
    unknownHeadingStats.set(pageId, 0)
  }
  const contents = page.content ?? []
  const toc = getBlockHeader(contents, recordMap, [], pageId)
  const indentLevelStack: IndentStackItem[] = [
    {
      actual: -1,
      effective: -1
    }
  ]

  for (const tocItem of toc) {
    const actual = Number.isInteger(tocItem.indentLevel) ? tocItem.indentLevel : 0

    do {
      const prevIndent = indentLevelStack[indentLevelStack.length - 1]
      if (!prevIndent) {
        tocItem.indentLevel = 0
        indentLevelStack.push({
          actual,
          effective: 0
        })
        break
      }
      const { actual: prevActual, effective: prevEffective } = prevIndent

      if (actual > prevActual) {
        tocItem.indentLevel = prevEffective + 1
        indentLevelStack.push({
          actual,
          effective: tocItem.indentLevel
        })
      } else if (actual === prevActual) {
        tocItem.indentLevel = prevEffective
        break
      } else {
        indentLevelStack.pop()
      }
    } while (true)
  }

  if (process.env.NODE_ENV !== 'production' && pageId) {
    const unknownCount = unknownHeadingStats.get(pageId) || 0
    if (unknownCount > 0) {
      console.warn('[TOC] unknown heading summary', { pageId, unknownCount })
    }
    unknownHeadingStats.delete(pageId)
  }

  return toc
}

function getBlockHeader(
  contents: string[] | undefined,
  recordMap: TocRecordMap,
  toc: TocItem[],
  pageId?: string
): TocItem[] {
  if (!toc) {
    toc = []
  }
  if (!contents) {
    return toc
  }

  for (const blockId of contents) {
    const block = recordMap.block[blockId]?.value
    if (!block) {
      continue
    }
    const { type } = block
    const isHeading =
      typeof type === 'string' &&
      (type.indexOf('header') >= 0 || /^heading_[1234]$/.test(type))

    const blockContent = block.content
    if (blockContent && blockContent.length > 0) {
      getBlockHeader(blockContent, recordMap, toc, pageId)
    } else {
      if (isHeading && type) {
        const existed = toc.find(e => e.id === blockId)
        const indentLevel = indentLevels[type]
        if (!Number.isInteger(indentLevel)) {
          if (process.env.NODE_ENV !== 'production') {
            if (pageId) {
              unknownHeadingStats.set(
                pageId,
                (unknownHeadingStats.get(pageId) || 0) + 1
              )
            }
            console.warn('[TOC] unknown heading type', {
              pageId,
              blockId,
              type,
              title: getTextContent(block.properties?.title),
              parentId: block.parent_id
            })
          }
          continue
        }
        if (!existed) {
          toc.push({
            id: blockId,
            type,
            text: getTextContent(block.properties?.title),
            indentLevel: indentLevel!
          })
        }
      } else if (
        type === 'transclusion_reference' &&
        block.format?.transclusion_reference_pointer?.id
      ) {
        getBlockHeader(
          [block.format.transclusion_reference_pointer.id],
          recordMap,
          toc,
          pageId
        )
      } else if (type === 'transclusion_container') {
        getBlockHeader(block.content, recordMap, toc, pageId)
      }
    }
  }

  return toc
}
