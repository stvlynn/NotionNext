/**
 * Extract the language prefix from a Notion page id string.
 * The supported format is `en:xxxxx`.
 */
export function extractLangPrefix(str: unknown): string {
  const value = String(str ?? '')
  const match = value.match(/^(.+?):/)
  if (match?.[1]) {
    return match[1]
  } else {
    return ''
  }
}

/**
 * Extract the page id part from a localized Notion page id string.
 * The supported format is `en:xxxxx`.
 */
export function extractLangId(str: unknown): string {
  const value = String(str ?? '')
  const match = value.match(/:\s*(.+)/)
  if (match?.[1]) {
    return match[1]
  } else {
    return value
  }
}

/**
 * Return the short id used to distinguish pages in compact maps.
 */
export function getShortId(uuid: unknown): string {
  const value = String(uuid ?? '')
  if (!value.includes('-')) {
    return value
  }
  return value.substring(14)
}
