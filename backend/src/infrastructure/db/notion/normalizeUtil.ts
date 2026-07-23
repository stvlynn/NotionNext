type NotionRecord = Record<string, unknown>
type NotionRecordMap = Record<string, { value?: unknown } | undefined>

interface NotionSchemaProperty extends NotionRecord {
  name?: string
  type?: string
}

function isRecord(value: unknown): value is NotionRecord {
  return value !== null && typeof value === 'object'
}

function getRecordValue(value: unknown): NotionRecord | null {
  return isRecord(value) ? value : null
}

/**
 * Normalize Notion metadata across legacy and upgraded API shapes.
 */
export function normalizeNotionMetadata(
  block: NotionRecordMap | null | undefined,
  pageId: string
): NotionRecord | null {
  const rawValue = block?.[pageId]?.value
  if (!rawValue) return null

  const rawRecord = getRecordValue(rawValue)
  if (!rawRecord) return null

  const nestedValue = rawRecord.value
  return rawRecord.type
    ? rawRecord
    : getRecordValue(nestedValue) ?? (nestedValue as NotionRecord | null) ?? null
}

/**
 * Return the collection value that owns the schema, unwrapping known containers.
 */
export function normalizeCollection(collection: unknown): NotionRecord {
  let current = collection

  for (let i = 0; i < 3; i++) {
    if (!current) break

    const currentRecord = getRecordValue(current)
    if (!currentRecord) break

    if (currentRecord.schema) {
      return currentRecord
    }

    if (currentRecord.value) {
      current = currentRecord.value
      continue
    }

    break
  }

  return getRecordValue(current) ?? {}
}

/**
 * Normalize Notion schema while keeping the original property id as the key.
 */
export function normalizeSchema(
  schema: Record<string, unknown> = {}
): Record<string, NotionSchemaProperty> {
  const result: Record<string, NotionSchemaProperty> = {}

  Object.entries(schema).forEach(([key, value]) => {
    const property = getRecordValue(value) ?? {}
    result[key] = {
      ...property,
      name: typeof property.name === 'string' ? property.name : '',
      type: typeof property.type === 'string' ? property.type : ''
    }
  })

  return result
}

/**
 * Normalize Notion page blocks across legacy and upgraded API shapes.
 */
export function normalizePageBlock(blockItem: unknown): NotionRecord | null {
  if (!blockItem) return null

  let current = blockItem

  for (let i = 0; i < 5; i++) {
    if (!current) return null

    const currentRecord = getRecordValue(current)
    if (!currentRecord) return null

    if (
      (currentRecord.type === 'collection_view_page' ||
        currentRecord.type === 'collection_view') &&
      currentRecord.collection_id
    ) {
      return currentRecord
    }

    if (currentRecord.type || currentRecord.properties) {
      return currentRecord
    }

    if (currentRecord.value) {
      current = currentRecord.value
      continue
    }

    break
  }

  return null
}
