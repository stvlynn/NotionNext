export interface NotionHtmlArtifactBlock {
  type?: unknown
  properties?: {
    source?: unknown
    [key: string]: unknown
  }
  format?: {
    embed_variant?: unknown
    [key: string]: unknown
  }
  [key: string]: unknown
}

const HTML_ATTACHMENT_PATTERN = /^attachment:[^:]+:.+\.html?$/i

function getAttachmentSource(block: NotionHtmlArtifactBlock): string | null {
  const source = block.properties?.source
  if (!Array.isArray(source)) return null

  const firstRow = source[0]
  if (!Array.isArray(firstRow)) return null

  const value = firstRow[0]
  return typeof value === 'string' ? value.trim() : null
}

/**
 * Detect Notion HTML artifacts across both known API representations.
 *
 * Notion normally marks these blocks with `embed_variant=html_artifact`, but
 * public page responses can omit that marker and expose only an uploaded
 * `attachment:<id>:<name>.html` source. The attachment fallback deliberately
 * requires an embed block and an exact .html/.htm suffix so ordinary files and
 * remote iframe URLs are not promoted to executable HTML.
 */
export function isNotionHtmlArtifactBlock(
  block: NotionHtmlArtifactBlock | null | undefined
): boolean {
  if (block?.type !== 'embed') return false
  if (block.format?.embed_variant === 'html_artifact') return true

  const source = getAttachmentSource(block)
  return source !== null && HTML_ATTACHMENT_PATTERN.test(source)
}
