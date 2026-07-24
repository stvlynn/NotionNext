/**
 * Notion 数据格式清理工具
 * 旧版 block:{ value:{}}
 * 新版 block:{ spaceId:{ id:{ value:{} } } }
 * 强制解包成旧版
 * @param {*} blockMap 
 * @returns 
 */
type NotionRecord = Record<string, unknown>

interface NotionBlockMapLike extends NotionRecord {
  block?: Record<string, unknown>
  collection?: Record<string, unknown>
}

function isRecord(value: unknown): value is NotionRecord {
  return typeof value === 'object' && value !== null
}

export function adapterNotionBlockMap<T extends NotionBlockMapLike | null | undefined>(
  blockMap: T
): T {
  if (!blockMap) return blockMap

  const cleanedBlocks: Record<string, { value: unknown }> = {}
  const cleanedCollection: Record<string, { value: unknown }> = {}

  for (const [id, block] of Object.entries(blockMap.block || {})) {
    cleanedBlocks[id] = { value: unwrapValue(block) }
  }

  for (const [id, collection] of Object.entries(blockMap.collection || {})) {
    cleanedCollection[id] = { value: unwrapValue(collection) }
  }

  return {
    ...blockMap,
    block: cleanedBlocks,
    collection: cleanedCollection,
  } as T
}

export function normalizeNotionBlockType(type: string | undefined): string {
  switch (type) {
    case 'heading_1':
      return 'header'
    case 'heading_2':
      return 'sub_header'
    case 'heading_3':
      return 'sub_sub_header'
    case 'heading_4':
    case 'header_4':
      return 'header_4'
    default:
      return type || ''
  }
}


function unwrapValue(obj: unknown): unknown {
  if (!obj) return obj

  if (!isRecord(obj)) return obj
  const value = obj.value

  // 新格式特征：外层有 role 或 spaceId，value 里才是真实 block（有 id 和 type）
  // { spaceId, value: { value: { id, type, ... }, role } }
  if (isRecord(value) && isRecord(value.value) && value.value.id && value.role) {
    return value.value
  }

  // 次新格式：{ value: { id, type, ... }, role }
  if (isRecord(value) && value.id && obj.role !== undefined) {
    return value
  }

  // 旧格式：{ value: { id, type, ... } } 直接取 value
  if (isRecord(value) && value.id) {
    return value
  }

  // 兜底：原样返回
  return value ?? obj
}
