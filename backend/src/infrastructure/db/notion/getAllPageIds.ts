import BLOG from '@/blog.config'
import { idToUuid } from 'notion-utils'

type NotionRecordTable = Record<string, unknown>

interface CollectionQueryViewData {
  collection_group_results?: {
    blockIds?: string[]
  }
  reducerResults?: {
    collection_group_results?: {
      blockIds?: string[]
    }
  }
  results?: {
    blockIds?: string[]
  }
  blockIds?: string[]
}

interface CollectionViewRecord {
  value?: {
    value?: {
      page_sort?: string[]
    }
  }
}

export default function getAllPageIds(
  collectionQuery: NotionRecordTable | undefined,
  collectionId: string | undefined,
  collectionView: NotionRecordTable | undefined,
  viewIds: string[] | undefined,
  block: NotionRecordTable = {}
): string[] {
  void block
  const pageSet = new Set<string>()
  const targetViewId = viewIds?.[(BLOG.NOTION_INDEX || 0) as number]

  const viewQuery = getRecordById(collectionQuery, collectionId) as
    | NotionRecordTable
    | null
  let hasQueryData = false
  if (viewQuery) {
    const selectedViewData = getRecordById(
      viewQuery,
      targetViewId
    ) as CollectionQueryViewData | null
    const queryData = selectedViewData
      ? [selectedViewData]
      : targetViewId
        ? []
        : (Object.values(viewQuery) as CollectionQueryViewData[])
    hasQueryData = queryData.length > 0
    queryData.forEach(viewData => {
      const collectionGroupBlockIds =
        viewData?.collection_group_results?.blockIds ??
        viewData?.reducerResults?.collection_group_results?.blockIds
      ;[
        collectionGroupBlockIds,
        viewData?.results?.blockIds,
        viewData?.blockIds
      ].forEach(ids => {
        if (Array.isArray(ids) && ids.length > 0) {
          ids.forEach(id => pageSet.add(id))
        }
      })
    })
  }

  if (!hasQueryData) {
    const selectedCollectionView = getRecordById(
      collectionView,
      targetViewId
    ) as CollectionViewRecord | null
    const pageSort = selectedCollectionView?.value?.value?.page_sort
    if (Array.isArray(pageSort) && pageSort.length > 0) {
      pageSort.forEach(id => pageSet.add(id))
    }
  }

  return Array.from(pageSet)
}

function getRecordById(
  record: NotionRecordTable | undefined,
  id: unknown
): unknown | null {
  if (!record || !id) return null

  for (const candidate of getIdCandidates(id)) {
    const value = record[candidate]
    if (value) return value
  }

  return null
}

function getIdCandidates(id: unknown): string[] {
  const candidates = new Set<string>([String(id)])

  if (typeof id === 'string') {
    candidates.add(id.replace(/-/g, ''))
    candidates.add(toUuid(id))
    try {
      candidates.add(idToUuid(id))
    } catch {
      // Keep the original id candidates when notion-utils cannot normalize it.
    }
  }

  return Array.from(candidates)
}

function toUuid(id: string): string {
  const compactId = id.replace(/-/g, '')
  if (!/^[0-9a-fA-F]{32}$/.test(compactId)) return id

  return [
    compactId.slice(0, 8),
    compactId.slice(8, 12),
    compactId.slice(12, 16),
    compactId.slice(16, 20),
    compactId.slice(20)
  ].join('-')
}
