import BLOG from '@/blog.config'
import { DynamicLayout } from '@/themes/theme'
import type { GetStaticPaths, GetStaticProps, NextPage } from 'next'
import {
  fetchGlobalAllData,
  getDataFromCache,
  getPageBlockCacheKey,
  staticPropsResult,
  siteConfig
} from '@/lib/page/runtime'
import type { MutableRecord, PageProps, SitePage } from '@/lib/page/runtime'

const Index: NextPage<PageProps> = props => {
  const { keyword } = props
  props = { ...props, currentSearch: keyword }

  const theme = siteConfig('THEME', BLOG.THEME, props.NOTION_CONFIG)
  return <DynamicLayout theme={theme} layoutName='LayoutSearch' {...props} />
}

/**
 * Server-side paginated search.
 */
export const getStaticProps: GetStaticProps<PageProps> = async ({
  params,
  locale
}) => {
  const keyword = String(params?.keyword || '')
  const page = String(params?.page || '')
  const pageNumber = Number(page)
  const props = await fetchGlobalAllData({
    from: 'search-props',
    pageType: ['Post'],
    locale
  })
  const { allPages } = props
  const allPosts = allPages?.filter(
    (page: SitePage) => page.type === 'Post' && page.status === 'Published'
  )
  props.posts = await filterByMemCache(allPosts || [], keyword)
  props.postCount = props.posts.length
  const POSTS_PER_PAGE = siteConfig('POSTS_PER_PAGE', 12, props?.NOTION_CONFIG)
  props.posts = props.posts.slice(
    POSTS_PER_PAGE * (pageNumber - 1),
    POSTS_PER_PAGE * pageNumber
  )
  props.keyword = keyword
  props.page = page
  delete props.allPages
  return staticPropsResult(props, props.NOTION_CONFIG)
}

export const getStaticPaths: GetStaticPaths = () => {
  return {
    paths: [{ params: { keyword: 'NotionNext', page: '1' } }],
    fallback: true
  }
}

/**
 * Append a Notion text property to an index string list.
 */
function appendText(
  sourceTextArray: string[],
  targetObj: MutableRecord | undefined,
  key: string
) {
  if (!targetObj) {
    return sourceTextArray
  }
  const textArray = targetObj[key]
  const text = textArray ? getTextContent(textArray) : ''
  if (text && text !== 'Untitled') {
    return sourceTextArray.concat(text)
  }
  return sourceTextArray
}

/**
 * Recursively flatten Notion text arrays.
 */
function getTextContent(textArray: unknown): string | undefined {
  if (typeof textArray === 'object' && isIterable(textArray)) {
    let result = ''
    for (const textObj of Array.from(textArray)) {
      result = result + getTextContent(textObj)
    }
    return result
  } else if (typeof textArray === 'string') {
    return textArray
  }
  return ''
}

/**
 * Check whether a value is iterable.
 */
const isIterable = (obj: unknown): obj is Iterable<unknown> =>
  obj != null &&
  typeof obj === 'object' &&
  typeof (obj as { [Symbol.iterator]?: unknown })[Symbol.iterator] === 'function'

/**
 * Search the full-text index stored in memory cache.
 */
async function filterByMemCache(allPosts: SitePage[], keyword: string) {
  const filterPosts: SitePage[] = []
  if (keyword) {
    keyword = keyword.trim()
  }
  for (const post of allPosts) {
    const cacheKey = getPageBlockCacheKey(post.id, post.lastEditedDate)
    const page = await getDataFromCache(cacheKey, true)
    const tagContent =
      post?.tags && Array.isArray(post?.tags) ? post?.tags.join(' ') : ''
    const categoryContent =
      post.category && Array.isArray(post.category)
        ? post.category.join(' ')
        : ''
    const articleInfo = post.title + post.summary + tagContent + categoryContent
    let hit = articleInfo.indexOf(keyword) > -1
    let indexContent = [post.summary || '']
    const block = page?.block
    if (block) {
      const contentIds = Object.keys(block)
      contentIds.forEach(id => {
        const properties = block[id]?.value?.properties
        indexContent = appendText(indexContent, properties, 'title')
        indexContent = appendText(indexContent, properties, 'caption')
      })
    }
    // console.log('Full-text search cache', cacheKey, page != null)
    post.results = []
    let hitCount = 0
    for (const i of indexContent) {
      const c = indexContent[i as unknown as number]
      if (!c) {
        continue
      }
      const index = c.toLowerCase().indexOf(keyword.toLowerCase())
      if (index > -1) {
        hit = true
        hitCount += 1
        post.results.push(c)
      } else {
        if ((post.results.length - 1) / hitCount < 3 || (i as unknown) === 0) {
          post.results.push(c)
        }
      }
    }
    if (hit) {
      filterPosts.push(post)
    }
  }
  return filterPosts
}

export default Index
