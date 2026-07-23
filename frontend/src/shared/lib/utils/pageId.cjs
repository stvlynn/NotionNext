/**
 * CJS bridge for next.config.js — Node cannot require the TypeScript module.
 * Keep in sync with pageId.ts.
 */
function extractLangPrefix(str) {
  const value = String(str ?? '')
  const match = value.match(/^(.+?):/)
  if (match?.[1]) {
    return match[1]
  }
  return ''
}

function extractLangId(str) {
  const value = String(str ?? '')
  const match = value.match(/:\s*(.+)/)
  if (match?.[1]) {
    return match[1]
  }
  return value
}

module.exports = {
  extractLangPrefix,
  extractLangId
}
