import { isIterable } from '@/lib/utils'

interface CategoryOption {
  id: string
  value: string
  color: string
}

interface PageWithCategory {
  type?: string
  status?: string
  category?: string | string[]
}

interface GetAllCategoriesParams {
  allPages?: PageWithCategory[]
  categoryOptions?: CategoryOption[]
  sliceCount?: number
}

interface CategoryItem {
  id: string
  name: string
  color: string
  count: number
}

export function getAllCategories({
  allPages,
  categoryOptions,
  sliceCount = 0
}: GetAllCategoriesParams): CategoryItem[] {
  const allPosts = allPages?.filter(
    page => page.type === 'Post' && page.status === 'Published'
  )
  if (!allPosts || !categoryOptions) {
    return []
  }
  let categories = allPosts?.map(p => p.category)
  categories = [...categories.flat()]
  const categoryObj: Record<string, number> = {}
  categories.forEach(category => {
    const categoryKey = String(category)
    categoryObj[categoryKey] = (categoryObj[categoryKey] ?? 0) + 1
  })
  const list: CategoryItem[] = []
  if (isIterable(categoryOptions)) {
    for (const c of categoryOptions) {
      const count = categoryObj[c.value]
      if (count) {
        list.push({ id: c.id, name: c.value, color: c.color, count })
      }
    }
  }

  if (sliceCount && sliceCount > 0) {
    return list.slice(0, sliceCount)
  } else {
    return list
  }
}
