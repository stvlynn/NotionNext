import {
  getDataFromCache,
  getOrSetDataWithCache,
  setDataToCache
} from '@/lib/cache/cache_manager'
import { deepClone, delay } from '@/lib/utils'
import notionAPI from '@/lib/db/notion/getNotionAPI'
import { getBlockValue } from 'notion-utils'
import type { Block, ExtendedRecordMap, NotionMapBox } from 'notion-types'
import type { SignedUrlRequest } from 'notion-client'
import pLimit from 'p-limit'
import { normalizeNotionBlockType } from '@/lib/utils/notion.util'
import { normalizeExternalMediaBlock } from '@/lib/db/notion/normalizeExternalMediaBlock'

interface FetchNotionPageBlocksOptions {
  cacheVersion?: string | number | Date
}

interface LooseNotionBlockProperties {
  source?: string[][]
  language?: string[][]
  [key: string]: unknown
}

interface LooseNotionBlockFormat {
  page_cover?: string
  embed_variant?: string
  html_artifact_content?: string
  [key: string]: unknown
}

interface LooseNotionFile {
  url?: string
  [key: string]: unknown
}

interface LooseNotionBlockValue {
  id?: string | number
  type?: string
  properties?: LooseNotionBlockProperties
  format?: LooseNotionBlockFormat
  content?: string[]
  children?: LooseNotionBlockEntry[]
  parent_id?: string
  file?: LooseNotionFile
  crdt_data?: unknown
  crdt_format_version?: unknown
  [key: string]: unknown
}

interface LooseNestedNotionBlockValue {
  role?: unknown
  value?: LooseNotionBlockValue
  id?: string | number
  [key: string]: unknown
}

interface LooseNotionBlockBox {
  value?: LooseNotionBlockValue | LooseNestedNotionBlockValue
  role?: unknown
  [key: string]: unknown
}

type LooseNotionBlockEntry = LooseNotionBlockBox | LooseNotionBlockValue
type LooseNotionBlockMap = Record<string, LooseNotionBlockEntry>
type LooseRecordMap = Partial<Omit<ExtendedRecordMap, 'block' | 'signed_urls'>> & {
  block?: LooseNotionBlockMap
  signed_urls?: Record<string, string>
}

type HtmlArtifactFile = SignedUrlRequest & {
  block: LooseNotionBlockValue
}

const limit = pLimit(15)

const REQUEST_INTERVAL = 50 // ms
const HTML_ARTIFACT_MAX_BYTES = 512 * 1024

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object'
}

function asBlockBox(
  entry: LooseNotionBlockEntry | undefined
): LooseNotionBlockBox | undefined {
  return isObjectRecord(entry) ? (entry as LooseNotionBlockBox) : undefined
}

function getDirectBlockValue(
  entry: LooseNotionBlockBox | undefined
): LooseNotionBlockValue | undefined {
  if (!isObjectRecord(entry?.value)) return undefined
  return entry.value as LooseNotionBlockValue
}

function getNestedBlockValue(
  entry: LooseNotionBlockBox | undefined
): LooseNotionBlockValue | undefined {
  const value = entry?.value
  if (!isObjectRecord(value) || !isObjectRecord(value.value)) return undefined
  return value.value as LooseNotionBlockValue
}

function hasRoleWrappedValue(entry: LooseNotionBlockBox | undefined): boolean {
  const value = entry?.value
  return isObjectRecord(value) && 'role' in value
}

function getEntryValueOrEntry(
  entry: LooseNotionBlockEntry | undefined
): LooseNotionBlockValue | undefined {
  if (!isObjectRecord(entry)) return undefined
  return isObjectRecord(entry.value)
    ? (entry.value as LooseNotionBlockValue)
    : (entry as LooseNotionBlockValue)
}

function getLooseBlockValue(entry: unknown): LooseNotionBlockValue | undefined {
  const block = getBlockValue(
    entry as Block | NotionMapBox<Block> | undefined
  ) as unknown
  return isObjectRecord(block) ? (block as LooseNotionBlockValue) : undefined
}

function getBlockSource(block: LooseNotionBlockValue | undefined): string | undefined {
  const source = block?.properties?.source?.[0]?.[0]
  return typeof source === 'string' ? source : undefined
}

function setBlockSource(block: LooseNotionBlockValue, source: string): void {
  const sourceRow = block.properties?.source?.[0]
  if (sourceRow) {
    sourceRow[0] = source
  }
}

function getPageCoverSource(
  block: LooseNotionBlockValue | undefined
): string | undefined {
  const pageCover = block?.format?.page_cover
  return typeof pageCover === 'string' ? pageCover : undefined
}

function getMessageProperty(error: unknown): unknown {
  return isObjectRecord(error) ? error.message : undefined
}

export function normalizePageBlockCacheVersion(cacheVersion: unknown): string {
  if (cacheVersion == null || cacheVersion === '') {
    return ''
  }

  if (cacheVersion instanceof Date) {
    const time = cacheVersion.getTime()
    return Number.isFinite(time) ? String(time) : ''
  }

  if (typeof cacheVersion === 'number') {
    return Number.isFinite(cacheVersion) ? String(cacheVersion) : ''
  }

  const raw = String(cacheVersion).trim()
  if (!raw) {
    return ''
  }

  const parsed = Date.parse(raw)
  if (Number.isFinite(parsed)) {
    return String(parsed)
  }

  return raw.replace(/[^a-z0-9_.:-]/gi, '_')
}

export function getPageBlockCacheKey(
  id: string | number,
  cacheVersion?: unknown
): string {
  const normalizedVersion = normalizePageBlockCacheVersion(cacheVersion)
  return normalizedVersion
    ? `page_block_${id}_${normalizedVersion}`
    : `page_block_${id}`
}

export async function fetchNotionPageBlocks(
  id: string,
  from: string | undefined = undefined,
  options: FetchNotionPageBlocksOptions | null = {}
): Promise<LooseRecordMap | null> {
  const cacheKey = getPageBlockCacheKey(id, options?.cacheVersion)

  const pageBlock = await getOrSetDataWithCache<LooseRecordMap | null, []>(
    cacheKey,
    () => limit(() => getPageWithRetry(id, from, 3, cacheKey))
  )

  if (!pageBlock) {
    console.warn('[getPage] empty pageBlock:', id)
    return null
  }

  if (hasExpiredSignedUrls(pageBlock)) {
    await refreshSignedUrls(pageBlock, cacheKey)
  }
  preferStablePdfSignedUrls(pageBlock)

  return pageBlock
}

export function hasExpiredSignedUrls(
  recordMap: LooseRecordMap | null | undefined,
  bufferMs = 10 * 60 * 1000
): boolean {
  const signedUrls = Object.values(recordMap?.signed_urls || {})
  const now = Date.now()

  return signedUrls.some(url => {
    try {
      const expires = Number(new URL(url).searchParams.get('expirationTimestamp'))
      return Number.isFinite(expires) && expires <= now + bufferMs
    } catch {
      return false
    }
  })
}

async function refreshSignedUrls(
  recordMap: LooseRecordMap,
  cacheKey: string
): Promise<void> {
  const files = getNotionFileInstances(recordMap)
  if (!files.length) return

  try {
    const { signedUrls } = await notionAPI.getSignedFileUrls(files)
    if (!signedUrls?.length) return

    recordMap.signed_urls = recordMap.signed_urls || {}
    files.forEach((file, index) => {
      const signedUrl = signedUrls[index]
      if (signedUrl) {
        recordMap.signed_urls![file.permissionRecord.id] = signedUrl
      }
    })
    await setDataToCache(cacheKey, recordMap, null)
  } catch (err) {
    console.warn('[Notion signed URLs] refresh failed:', err)
  }
}

function getNotionFileInstances(recordMap: LooseRecordMap): SignedUrlRequest[] {
  return Object.values(recordMap?.block || {}).flatMap(entry => {
    const block = getLooseBlockValue(entry)
    if (
      !block ||
      typeof block.type !== 'string' ||
      !['pdf', 'audio', 'image', 'video', 'file', 'page'].includes(block.type)
    ) {
      return []
    }

    const source =
      block.type === 'page' ? getPageCoverSource(block) : getBlockSource(block)
    const url = getNotionFileSource(source)

    return url
      ? [
          {
            permissionRecord: {
              table: 'block',
              id: block.id as string
            },
            url
          }
        ]
      : []
  })
}

function getNotionFileSource(source: string | undefined): string | null {
  if (!source) return null

  if (source.includes('notion.so/signed/')) {
    try {
      return decodeURIComponent(new URL(source).pathname.replace(/^\/signed\//, ''))
    } catch {
      return source
    }
  }

  return isNotionHostedFileUrl(source) || source.includes('attachment:')
    ? source
    : null
}

function isNotionHostedFileUrl(source: string): boolean {
  try {
    const hostname = new URL(source).hostname
    return (
      hostname === 'secure.notion-static.com' ||
      /^prod-files-secure(?:-[a-z0-9]+)?\.s3[.-]/.test(hostname)
    )
  } catch {
    return false
  }
}

export function preferStablePdfSignedUrls(recordMap: LooseRecordMap): void {
  Object.values(recordMap?.block || {}).forEach(entry => {
    const block = getLooseBlockValue(entry)
    const source = getBlockSource(block)
    if (block?.type !== 'pdf' || !source) return

    recordMap.signed_urls = recordMap.signed_urls || {}
    recordMap.signed_urls[block.id as string] = source.includes('notion.so/signed/')
      ? source
      : `https://notion.so/signed/${encodeURIComponent(source)}?table=block&id=${block.id}`
  })
}

export async function getPageWithRetry(
  id: string,
  from?: string,
  retryAttempts = 3,
  cacheKey = getPageBlockCacheKey(id)
): Promise<LooseRecordMap | null> {
  if (!retryAttempts || retryAttempts <= 0) {
    console.error('[请求失败]:', `from:${from}`, `id:${id}`)
    return null
  }

  console.log(
    '[API-->>请求]',
    `from:${from}`,
    `id:${id}`,
    retryAttempts < 3 ? `剩余重试次数:${retryAttempts}` : ''
  )

  try {
    const start = Date.now()
    const pageData = (await notionAPI.getPage(id)) as LooseRecordMap
    await addHtmlArtifactSignedUrls(pageData)
    const end = Date.now()
    console.log('[API<<--响应]', `耗时:${end - start}ms - from:${from}`)
    return pageData
  } catch (e) {
    console.warn('[API<<--异常]:', e)

    // Concurrency is controlled through the limiter instead of a global delay.
    const pageBlock = await getDataFromCache<LooseRecordMap>(cacheKey)
    if (pageBlock) {
      return pageBlock
    }

    return getPageWithRetry(id, from, retryAttempts - 1, cacheKey)
  }
}

async function addHtmlArtifactSignedUrls(
  recordMap: LooseRecordMap | null | undefined
): Promise<void> {
  if (!recordMap?.block) return

  const files: HtmlArtifactFile[] = []
  for (const entry of Object.values(recordMap.block)) {
    const block = getLooseBlockValue(entry)
    const source = getBlockSource(block)
    if (
      block?.type === 'embed' &&
      block.format?.embed_variant === 'html_artifact' &&
      source?.includes('attachment:') &&
      !recordMap.signed_urls?.[block.id as string]
    ) {
      files.push({
        block,
        permissionRecord: {
          table: 'block',
          id: block.id as string
        },
        url: source
      })
    }
  }

  if (!files.length) return

  try {
    const { signedUrls } = await notionAPI.getSignedFileUrls(
      files.map(({ block, ...file }) => file)
    )
    if (!signedUrls?.length) return

    recordMap.signed_urls = recordMap.signed_urls || {}
    await Promise.all(
      files.map(async (file, index) => {
        const signedUrl = signedUrls[index]
        if (!signedUrl) return

        recordMap.signed_urls![file.permissionRecord.id] = signedUrl
        const html = await fetchHtmlArtifactContent(signedUrl)
        if (html) {
          file.block.format = file.block.format || {}
          file.block.format.html_artifact_content = html
        }
      })
    )
  } catch (err) {
    console.warn('[Notion HTML artifact] getSignedFileUrls failed:', err)
  }
}

async function fetchHtmlArtifactContent(url: string): Promise<string | null> {
  try {
    const response = await fetch(url)
    if (!response.ok) return null

    const length = Number(response.headers.get('content-length'))
    if (Number.isFinite(length) && length > HTML_ARTIFACT_MAX_BYTES) {
      console.warn('[Notion HTML artifact] skipped large file:', length)
      return null
    }

    const html = await response.text()
    return html.length <= HTML_ARTIFACT_MAX_BYTES ? html : null
  } catch (err) {
    console.warn('[Notion HTML artifact] fetch failed:', err)
    return null
  }
}

export function formatNotionBlock(
  block: LooseNotionBlockMap | null | undefined
): LooseNotionBlockMap | null | undefined {
  const clonedBlock = deepClone(block) as LooseNotionBlockMap | null | undefined
  if (!clonedBlock) return clonedBlock

  const blocksToProcess = Object.keys(clonedBlock)

  for (let i = 0; i < blocksToProcess.length; ) {
    const blockId = blocksToProcess[i]
    if (blockId === undefined) break

    let entry = clonedBlock[blockId]
    let box = asBlockBox(entry)

    // Normalize newer double-wrapped Notion values to the legacy shape.
    const nestedValue = getNestedBlockValue(box)
    if (nestedValue?.id) {
      clonedBlock[blockId] = { value: nestedValue }
      entry = clonedBlock[blockId]
      box = asBlockBox(entry)
    } else if (!getDirectBlockValue(box)?.id && hasRoleWrappedValue(box)) {
      i++
      continue
    }

    const value = getDirectBlockValue(box)

    // Remove CRDT metadata that react-notion-x does not understand.
    if (value) {
      delete value.crdt_data
      delete value.crdt_format_version
      value.type = normalizeNotionBlockType(value.type)
    }

    sanitizeBlockUrls(value)
    normalizeExternalMediaBlock(value)

    if (value?.type === 'sync_block') {
      const childBlockIds: string[] = []

      // Case 1: inline children in the original response shape.
      if (Array.isArray(value.children) && value.children.length > 0) {
        value.children.forEach((childBlock, index) => {
          const newBlockId = `${blockId}_child_${index}`
          clonedBlock[newBlockId] = childBlock
          reparentBlock(clonedBlock[newBlockId], newBlockId, value.parent_id)
          childBlockIds.push(newBlockId)
        })
        replaceContentReference(clonedBlock, blockId, childBlockIds)
        delete clonedBlock[blockId]
        blocksToProcess.splice(i, 1, ...childBlockIds)
        continue
      }

      // Case 2: content array with child block IDs in some Notion responses.
      if (Array.isArray(value.content) && value.content.length > 0) {
        value.content.forEach((childId, index) => {
          const childBlock = clonedBlock[childId]
          if (childBlock) {
            const newBlockId = `${blockId}_child_${index}`
            clonedBlock[newBlockId] = childBlock
            reparentBlock(clonedBlock[newBlockId], newBlockId, value.parent_id)
            childBlockIds.push(newBlockId)
            delete clonedBlock[childId]
          }
        })
        if (childBlockIds.length > 0) {
          replaceContentReference(clonedBlock, blockId, childBlockIds)
          delete clonedBlock[blockId]
          blocksToProcess.splice(i, 1, ...childBlockIds)
          continue
        }
      }

      // Case 3: no children or content, so react-notion-x handles the block.
    }

    if (value?.type === 'code') {
      const languageRow = value.properties?.language?.[0]
      const language = languageRow?.[0]
      if (languageRow && language === 'C++') {
        languageRow[0] = 'cpp'
      }
      if (languageRow && language === 'C#') {
        languageRow[0] = 'csharp'
      }
      if (languageRow && language === 'Assembly') {
        languageRow[0] = 'asm6502'
      }
    }

    const source = getBlockSource(value)
    if (
      ['file', 'pdf', 'video', 'audio'].includes(value?.type || '') &&
      source &&
      (source.startsWith('attachment') ||
        isNotionHostedFileUrl(source) ||
        source.indexOf('amazonaws.com') > 0)
    ) {
      const newUrl = `https://notion.so/signed/${encodeURIComponent(source)}?table=block&id=${value?.id}`
      if (value) {
        setBlockSource(value, newUrl)
      }
    }

    i++
  }

  return clonedBlock
}

function replaceContentReference(
  blockMap: LooseNotionBlockMap,
  oldId: string,
  newIds: string[]
): void {
  Object.values(blockMap || {}).forEach(entry => {
    const block = getEntryValueOrEntry(entry)
    if (!Array.isArray(block?.content)) return
    block.content = block.content.flatMap(id => (id === oldId ? newIds : [id]))
  })
}

function reparentBlock(
  entry: LooseNotionBlockEntry | undefined,
  id: string,
  parentId: string | undefined
): void {
  const block = getEntryValueOrEntry(entry)
  if (!block) return
  block.id = id
  if (parentId) block.parent_id = parentId
}

export const fetchInBatches = async (
  ids: string | string[],
  batchSize = 30
): Promise<LooseNotionBlockMap> => {
  const normalizedIds = Array.isArray(ids) ? ids : [ids]
  let fetchedBlocks: LooseNotionBlockMap = {}

  if (normalizedIds.length === 0) {
    return fetchedBlocks
  }

  console.log('[Batch] START total ids:', normalizedIds.length)

  for (let i = 0; i < normalizedIds.length; i += batchSize) {
    const batch = normalizedIds.slice(i, i + batchSize)

    console.log(`\n[Batch] processing ${i} ~ ${i + batch.length}`)

    try {
      const result = await limit(async () => {
        await delay(REQUEST_INTERVAL)

        console.log('[API-->>批量请求]', batch.length)

        const start = Date.now()

        const pageChunk = await notionAPI.getBlocks(batch)

        const end = Date.now()

        const blocks = (pageChunk?.recordMap?.block || {}) as LooseNotionBlockMap

        console.log(
          `[API<<--批量响应] size:${batch.length} 耗时:${end - start}ms blocks:${Object.keys(blocks).length}`
        )

        return blocks
      })

      fetchedBlocks = {
        ...fetchedBlocks,
        ...result
      }
    } catch (err) {
      console.warn('[Batch API异常]', getMessageProperty(err))
    }
  }

  return fetchedBlocks
}

function sanitizeBlockUrls(blockValue: LooseNotionBlockValue | undefined): void {
  if (!blockValue) return

  const fixUrl = (url: string): string => {
    if (
      blockValue.type === 'embed' &&
      blockValue.format?.embed_variant === 'html_artifact' &&
      url.startsWith('attachment:')
    ) {
      return url
    }

    if (url.startsWith('/')) {
      return url
    }

    if (url.startsWith('http:') && !url.startsWith('http://')) {
      url = `http://${url.slice(5)}`
    } else if (url.startsWith('https:') && !url.startsWith('https://')) {
      url = `https://${url.slice(6)}`
    }

    try {
      new URL(url)
      return url
    } catch {
      console.warn('[Sanitize URL] Invalid URL replaced:', url)
      return 'https://via.placeholder.com/1x1?text=Invalid+Image'
    }
  }

  const source = getBlockSource(blockValue)
  if (source) {
    setBlockSource(blockValue, fixUrl(source))
  }

  if (blockValue.file?.url && typeof blockValue.file.url === 'string') {
    blockValue.file.url = fixUrl(blockValue.file.url)
  }

  if (
    blockValue.format?.page_cover &&
    typeof blockValue.format.page_cover === 'string'
  ) {
    blockValue.format.page_cover = fixUrl(blockValue.format.page_cover)
  }
}
