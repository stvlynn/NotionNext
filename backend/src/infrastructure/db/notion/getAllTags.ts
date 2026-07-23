import { siteConfig } from '@/lib/config'
import { isIterable } from '@/lib/utils'

interface TagOption {
  id: string
  value: string
  color: string
}

interface PageWithTags {
  type?: string
  status?: string
  tags?: string[]
}

interface GetAllTagsParams {
  allPages?: PageWithTags[]
  sliceCount?: number
  tagOptions?: TagOption[]
  NOTION_CONFIG?: Record<string, unknown>
}

interface TagInfo {
  count: number
  source?: string | undefined
}

interface TagItem extends TagInfo {
  id: string
  name: string
  color: string
}

export function getAllTags({
  allPages,
  sliceCount = 0,
  tagOptions,
  NOTION_CONFIG
}: GetAllTagsParams): TagItem[] {
  const allPosts = allPages?.filter(
    page => page.type === 'Post' && page.status === 'Published'
  )

  if (!allPosts || !tagOptions) {
    return []
  }
  const allTagInfos: Record<string, TagInfo> = {}
  allPosts.forEach(post => {
    post?.tags?.forEach(tag => {
      if (allTagInfos[tag]) {
        allTagInfos[tag].count++
      } else {
        allTagInfos[tag] = {
          count: 1,
          source: post.status
        }
      }
    })
  })

  const list: TagItem[] = []
  const IS_TAG_COLOR_DISTINGUISHED = siteConfig(
    'IS_TAG_COLOR_DISTINGUISHED',
    false,
    NOTION_CONFIG
  )
  const TAG_SORT_BY_COUNT = siteConfig('TAG_SORT_BY_COUNT', true, NOTION_CONFIG)
  if (isIterable(tagOptions)) {
    if (!IS_TAG_COLOR_DISTINGUISHED) {
      const savedTagNames = new Set<string>()
      tagOptions.forEach(c => {
        if (!savedTagNames.has(c.value)) {
          const tagInfo = allTagInfos[c.value]
          if (tagInfo) {
            list.push({ id: c.id, name: c.value, color: c.color, ...tagInfo })
          }
          savedTagNames.add(c.value)
        }
      })
    } else {
      tagOptions.forEach(c => {
        const tagInfo = allTagInfos[c.value]
        if (tagInfo) {
          list.push({ id: c.id, name: c.value, color: c.color, ...tagInfo })
        }
      })
    }
  }

  if (TAG_SORT_BY_COUNT) {
    list.sort((a, b) => b.count - a.count)
  }

  if (sliceCount && sliceCount > 0) {
    return list.slice(0, sliceCount)
  } else {
    return list
  }
}
