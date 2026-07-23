declare const notionPageIdBrand: unique symbol
declare const langPrefixBrand: unique symbol

export type NotionPageId = string & {
  readonly [notionPageIdBrand]: 'NotionPageId'
}

export type LangPrefix = string & {
  readonly [langPrefixBrand]: 'LangPrefix'
}

const COMPACT_NOTION_PAGE_ID_PATTERN = /^[a-zA-Z0-9]{32}$/
const UUID_NOTION_PAGE_ID_PATTERN =
  /^[a-f0-9]{8}-?[a-f0-9]{4}-?[a-f0-9]{4}-?[a-f0-9]{4}-?[a-f0-9]{12}$/i

export function isCompactNotionPageId(value: unknown): value is NotionPageId {
  return (
    typeof value === 'string' && COMPACT_NOTION_PAGE_ID_PATTERN.test(value.trim())
  )
}

export function isNotionPageId(value: unknown): value is NotionPageId {
  if (typeof value !== 'string') return false

  const normalized = value.trim()
  return (
    COMPACT_NOTION_PAGE_ID_PATTERN.test(normalized) ||
    UUID_NOTION_PAGE_ID_PATTERN.test(normalized)
  )
}

export function createNotionPageId(value: string): NotionPageId {
  const normalized = value.trim()

  if (!isNotionPageId(normalized)) {
    throw new Error('Invalid Notion page ID')
  }

  return normalized
}

export function extractLangPrefix(value: string): LangPrefix | '' {
  const match = value.match(/^(.+?):/)
  return match?.[1] ? (match[1] as LangPrefix) : ''
}

export function extractLangId(value: string): string {
  const match = value.match(/:\s*(.+)/)
  return match?.[1] ?? value
}

export function getShortNotionPageId(value: string): string {
  if (!value.includes('-')) {
    return value
  }

  return value.substring(14)
}
