interface ExternalMediaBlock {
  type?: string
  properties?: {
    source?: unknown
  }
  [key: string]: unknown
}

function isExternalMediaBlock(value: unknown): value is ExternalMediaBlock {
  return value !== null && typeof value === 'object'
}

function getSourceValue(blockValue: ExternalMediaBlock): unknown {
  const source = blockValue.properties?.source
  if (!Array.isArray(source)) return undefined

  const firstSourceItem = source[0]
  if (!Array.isArray(firstSourceItem)) return undefined

  return firstSourceItem[0]
}

export function normalizeExternalMediaBlock(blockValue: unknown): void {
  if (!isExternalMediaBlock(blockValue)) return

  const source = getSourceValue(blockValue)
  if (blockValue.type !== 'video' || typeof source !== 'string') return

  // Apple Music single-track embeds can arrive as `video` blocks from Notion.
  // react-notion-x treats unknown `video` sources as native <video>, which breaks playback.
  if (isAppleMusicEmbedUrl(source) || isExternalVideoEmbedUrl(source)) {
    blockValue.type = 'embed'
  }
}

export function isAppleMusicEmbedUrl(url: string): boolean {
  return /^https:\/\/embed\.music\.apple\.com\/.+\/song\//i.test(url)
}

export function isExternalVideoEmbedUrl(url: string): boolean {
  try {
    const { protocol, pathname } = new URL(url)
    return /^https?:$/.test(protocol) && /\.html?$/i.test(pathname)
  } catch {
    return false
  }
}
