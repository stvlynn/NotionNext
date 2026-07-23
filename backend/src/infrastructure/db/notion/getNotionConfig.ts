import { getDateValue, getTextContent } from 'notion-utils'
import { deepClone } from '@/lib/utils'
import getAllPageIds from './getAllPageIds'
import { fetchNotionPageBlocks } from './getPostBlocks'
import { encryptEmail } from '@/lib/plugins/mailEncrypt'
import {
  normalizeCollection,
  normalizePageBlock,
  normalizeSchema
} from './normalizeUtil'
import type { Decoration, FormattedDate } from 'notion-types'

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue }

type NotionConfigValue = unknown
export type NotionConfigMap = Record<string, NotionConfigValue>

interface ConfigPageCandidate {
  id?: unknown
  type?: unknown
  title?: unknown
  [key: string]: unknown
}

type NotionRecord = Record<string, unknown>
type NotionRecordTable = Record<string, unknown>
type NotionSchema = Record<string, NotionSchemaProperty | undefined>

interface NotionSchemaProperty extends NotionRecord {
  name: string
  type: string
}

interface ConfigPageData {
  pageRecordMap: {
    block?: NotionRecordTable
    collection?: NotionRecordTable
    collection_query?: NotionRecordTable
    collection_view?: NotionRecordTable
  }
  content: string[]
}

interface ParsedConfigRow {
  id: string
  [key: string]: unknown
}

/**
 * Read the Config table from a Notion CONFIG page.
 */
export async function getConfigMapFromConfigPage(
  allPages: ConfigPageCandidate[] | null | undefined
): Promise<NotionConfigMap | null> {
  if (!allPages?.length) {
    console.warn('[Notion配置] 忽略的配置')
    return null
  }

  const configPage = findConfigPage(allPages)
  if (!configPage) return null

  const data = await fetchConfigPageData(getString(configPage.id) ?? undefined)
  if (!data) return null

  return parseConfigFromPage(data.pageRecordMap, data.content)
}

function normalizeId(id: unknown): string {
  return String(id || '').replace(/-/g, '')
}

export function findConfigPage(
  allPages: ConfigPageCandidate[] | null | undefined
): ConfigPageCandidate | null {
  void normalizeId
  const configPages = (allPages || []).filter(post =>
    post?.type && ['CONFIG', 'config', 'Config'].includes(String(post.type))
  )

  if (!configPages.length) {
    console.warn('[Notion配置] 未找到配置页面')
    return null
  }

  const selected = configPages[0]
  if (!selected) return null

  console.warn('[Notion配置] ✅:', {
    id: selected.id,
    title: selected.title
  })

  return selected
}

export async function fetchConfigPageData(
  configPageId: string | undefined
): Promise<ConfigPageData | null> {
  if (!configPageId) return null

  let pageRecordMap = await fetchNotionPageBlocks(configPageId, 'config-table')
  if (!pageRecordMap) return null

  const pageBlock = pageRecordMap?.block?.[configPageId]?.value
  let content = getStringArray(normalizePageBlock(pageBlock)?.content)

  for (const table of ['Config-Table', 'CONFIG-TABLE']) {
    if (content) break
    pageRecordMap = await fetchNotionPageBlocks(configPageId, table)
    if (!pageRecordMap) return null
    content = getStringArray(
      getRecord(getRecord(pageRecordMap.block?.[configPageId])?.value)?.content
    )
  }

  if (!content) {
    console.warn('[Notion配置] 未找到配置表')
    return null
  }

  return { pageRecordMap, content }
}

export function parseConfigFromPage(
  pageRecordMap: ConfigPageData['pageRecordMap'],
  content: string[]
): NotionConfigMap | null {
  const notionConfig: NotionConfigMap = {}

  const configTableId = content.find(contentId => {
    const blockItem = getRecord(pageRecordMap.block)?.[contentId]
    return normalizePageBlock(blockItem)?.type === 'collection_view'
  })

  if (!configTableId) return null

  const block = pageRecordMap.block || {}
  const rawMetadata = normalizePageBlock(pageRecordMap.block?.[configTableId])

  if (
    rawMetadata?.type !== 'collection_view_page' &&
    rawMetadata?.type !== 'collection_view'
  ) {
    console.error(`pageId "${configTableId}" is not a database`)
    return null
  }

  const collectionMap = pageRecordMap.collection || {}
  const inferredCollectionId =
    Object.keys(collectionMap).length === 1 ? Object.keys(collectionMap)[0] : null
  const collectionId = getString(rawMetadata?.collection_id) || inferredCollectionId
  const rawCollection =
    (collectionId
      ? collectionMap?.[collectionId] ||
        collectionMap?.[collectionId.replace(/-/g, '')]
      : undefined) || {}
  const collection = normalizeCollection(rawCollection)
  const schema = normalizeSchema(getRecord(collection?.schema) || {}) as NotionSchema

  const rowPageIds = getAllPageIds(
    pageRecordMap.collection_query,
    collectionId ?? undefined,
    pageRecordMap.collection_view,
    getStringArray(rawMetadata.view_ids)
  )

  for (const id of rowPageIds) {
    const value = getRecord(getRecord(block[id])?.value)
    if (!value) continue

    const temp = normalizePageBlock(value)
    const tempProperties = getRecord(temp?.properties)
    if (!tempProperties) continue

    const rawProperties = Object.entries(tempProperties)
    const exclude = ['date', 'select', 'multi_select', 'person']

    const properties: ParsedConfigRow = { id }

    for (const [key, val] of rawProperties) {
      const schemaProperty = schema[key]
      if (schemaProperty?.type && !exclude.includes(schemaProperty.type)) {
        properties[schemaProperty.name] = getTextContent(
          val as Decoration[] | undefined
        )
      } else {
        switch (schemaProperty?.type) {
          case 'date': {
            const date = stripDateType(getDateValue(val as unknown[]))
            properties[schemaProperty.name] = date
            break
          }
          case 'select':
          case 'multi_select': {
            const selects = getTextContent(val as Decoration[] | undefined)
            if (selects) {
              properties[schemaProperty.name] = selects.split(',')
            }
            break
          }
        }
      }
    }

    const config = {
      enable: (properties['启用'] || properties.Enable) === 'Yes',
      key: properties['配置名'] || properties.Name,
      value: properties['配置值'] || properties.Value
    }

    if (config.enable && typeof config.key === 'string' && config.key) {
      if (config.key === 'CONTACT_EMAIL') {
        notionConfig[config.key] =
          (typeof config.value === 'string' && encryptEmail(config.value)) || null
      } else {
        notionConfig[config.key] =
          parseTextToJson(config.value) ||
          toConfigValue(config.value) ||
          null
      }
    }
  }

  try {
    const inlineConfig = getRecord(notionConfig?.INLINE_CONFIG) as
      | NotionConfigMap
      | null
    return {
      ...(deepClone(notionConfig) as NotionConfigMap),
      ...(inlineConfig || {})
    }
  } catch (err) {
    console.warn('INLINE_CONFIG 解析失败', err)
    return notionConfig
  }
}

/**
 * Parse text as JSON when a config value stores structured data.
 */
export function parseTextToJson(text: unknown): JsonValue | null {
  if (typeof text !== 'string') return null

  try {
    return JSON.parse(text) as JsonValue
  } catch (error) {
    return null
  }
}

function stripDateType(
  date: FormattedDate | null
): Omit<FormattedDate, 'type'> | null {
  if (!date) return null
  const { type: _type, ...dateWithoutType } = date
  return dateWithoutType
}

function getRecord(value: unknown): NotionRecord | null {
  return value !== null && typeof value === 'object'
    ? (value as NotionRecord)
    : null
}

function getString(value: unknown): string | null {
  return typeof value === 'string' ? value : null
}

function getStringArray(value: unknown): string[] | undefined {
  return Array.isArray(value) && value.every(item => typeof item === 'string')
    ? value
    : undefined
}

function toConfigValue(value: unknown): NotionConfigValue | null {
  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    Array.isArray(value) ||
    (value !== null && typeof value === 'object')
  ) {
    return value as NotionConfigValue
  }

  return null
}
