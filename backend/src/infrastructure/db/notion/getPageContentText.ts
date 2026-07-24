type Decoration = [unknown, unknown?]
type TextProperty = Decoration[] | string

interface NotionBlock {
  type?: string
  properties?: Record<string, TextProperty>
  content?: string[]
  format?: {
    transclusion_reference_pointer?: {
      id?: string
    }
    [key: string]: unknown
  }
  [key: string]: unknown
}

interface PageBlockMap {
  block: Record<string, { value?: NotionBlock } | undefined>
}

interface PostWithContent {
  id: string
  content?: string[]
  password?: unknown
}

function getPropertyValue(
  properties: Record<string, TextProperty>,
  keys: string[],
  overrides: Record<string, TextProperty> = {},
  defaultValue: TextProperty = ''
): TextProperty {
  for (const key of keys) {
    if (overrides[key]) return overrides[key]
    if (properties[key]) return properties[key]
  }
  return defaultValue
}

function getFullTextContent(text: unknown): string {
  if (!text) return ''

  if (!Array.isArray(text)) return String(text)

  return text.reduce<string>((result, item) => {
    const tuple = item as Decoration
    const value = tuple[0]
    const decorations = tuple[1]

    if (value === '⁍') {
      const equation = Array.isArray(decorations)
        ? decorations.find(decoration => decoration?.[0] === 'e')
        : undefined
      if (equation) {
        return result + equation[1]
      }
      return result
    }

    if (value === '‣') {
      const ref = Array.isArray(decorations) ? decorations[0] : null
      const type = Array.isArray(ref) ? ref[0] : undefined
      const data =
        Array.isArray(ref) && ref[1] !== null && typeof ref[1] === 'object'
          ? (ref[1] as Record<string, unknown>)
          : undefined
      switch (type) {
        case 'd': {
          const date =
            data?.start_date ||
            data?.start_time ||
            data?.end_date ||
            data?.end_time ||
            '[Date]'
          return result + date
        }
        case 'lm': {
          const title = data?.title || data?.href || '[Link]'
          return result + title
        }
        case 'u':
        default:
          return result
      }
    }

    return result + value
  }, '')
}

export function getPageContentText(
  post: PostWithContent,
  pageBlockMap: PageBlockMap
): string {
  function getText(block: NotionBlock, customKeys = ['title', 'caption']): string {
    const result: string[] = []
    const properties = block.properties
    if (!properties) {
      return ''
    }
    const textArray = getPropertyValue(properties, customKeys)
    result.push(getTextArray(textArray))
    const blockContentList = block.content
    if (block.type !== 'page' && blockContentList && blockContentList.length > 0) {
      for (const blockContent of blockContentList) {
        result.push(getBlockContentText(blockContent))
      }
    }
    return result.join(' ')
  }

  function getTextArray(textArray: unknown): string {
    const text = textArray ? getFullTextContent(textArray) : ''
    if (text && text !== 'Untitled') {
      return text
    }
    return ''
  }

  function getTransclusionReference(block: NotionBlock): string {
    const result: string[] = []
    const blockPointer = block.format!.transclusion_reference_pointer!
    const blockPointerId = blockPointer.id!
    if (blockPointer && pageBlockMap.block[blockPointerId]!.value) {
      const blockContentList = pageBlockMap.block[blockPointerId]!.value!.content!
      for (const blockContent of blockContentList) {
        result.push(getBlockContentText(blockContent))
      }
    }
    return result.join(' ')
  }

  function getBlockContentText(id: string): string {
    const block = pageBlockMap?.block[id]?.value
    if (!block) {
      return ''
    }
    const blockType = block.type
    switch (blockType) {
      case 'transclusion_reference':
        return getTransclusionReference(block)
      case 'table':
        return getTableText(block.content!)
      case 'page':
        if (id !== postId) {
          return getText(block)
        }
        return ''
      case 'breadcrumb':
      case 'external_object_instance':
      case 'divider':
        return ''
      case 'image':
        return getText(block, ['alt_text', 'title'])
      case 'bookmark':
      case 'quote':
      case 'callout':
      case 'header':
      case 'sub_header':
      case 'code':
      case 'equation':
      case 'text':
      default:
        return getText(block)
    }
  }

  function getTableText(tableRowIds: string[]): string {
    const result: string[] = []
    for (const blockRowId of tableRowIds) {
      if (pageBlockMap.block[blockRowId]) {
        const blockRow = pageBlockMap.block[blockRowId]!.value!
        const blockRowProperties = blockRow.properties
        if (blockRowProperties && typeof blockRowProperties === 'object') {
          for (const blockRowPropertyValue of Object.values(blockRowProperties)) {
            const text = getTextArray(blockRowPropertyValue)
            if (text) result.push(text)
          }
        }
      }
    }
    return result.join(' ')
  }

  const postId = post.id
  const postContent = post.content
  const contentTextList: string[] = []
  if (postContent && postContent.length > 0 && !post.password) {
    for (const postContentId of postContent) {
      const blockContentText = getBlockContentText(postContentId)
      if (blockContentText) {
        contentTextList.push(blockContentText)
      }
    }
  }
  return contentTextList.join('')
}
