interface TypedCollectionItem {
  type?: string
  status?: string
  publishDate?: number | null
  [key: string]: unknown
}

interface GetTypedPagesParams<T extends TypedCollectionItem> {
  allPages?: T[] | undefined
  type?: string | undefined
  status?: string | undefined
}

export function getTypedPages<T extends TypedCollectionItem = TypedCollectionItem>({
  allPages,
  type,
  status
}: GetTypedPagesParams<T> = {}): T[] {
  if (!Array.isArray(allPages) || !type) return []

  return allPages.filter(page => {
    if (page?.type !== type) return false
    if (status === undefined) return true
    return page?.status === status
  })
}

export function getPublishedTypedPages<
  T extends TypedCollectionItem = TypedCollectionItem
>({ allPages, type }: GetTypedPagesParams<T> = {}): T[] {
  return getTypedPages({ allPages, type, status: 'Published' })
}

export function sortTypedPagesByPublishDate<
  T extends TypedCollectionItem = TypedCollectionItem
>(items: T[] | unknown): T[] {
  if (!Array.isArray(items)) return []

  return [...items].sort(
    (a, b) => (b?.publishDate ?? 0) - (a?.publishDate ?? 0)
  )
}
