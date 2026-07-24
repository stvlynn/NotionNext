import BLOG from '@/blog.config'
import { DynamicLayout } from '@/themes/theme'
import type { GetStaticPaths, GetStaticProps, NextPage } from 'next'
import {
  fetchGlobalAllData,
  getDataFromCache,
  getPageBlockCacheKey,
  getPageContentText,
  staticPropsResult,
  siteConfig
} from '@/lib/page/runtime'
import type { PageProps, SitePage } from '@/lib/page/runtime'

const Index: NextPage<PageProps> = props => {
  const theme = siteConfig('THEME', BLOG.THEME, props.NOTION_CONFIG)
  return <DynamicLayout theme={theme} layoutName='LayoutSearch' {...props} />
}

/**
 * Server-side search.
 */
export const getStaticProps: GetStaticProps<PageProps> = async ({
  params,
  locale
}) => {
  const keyword = String(params?.keyword || '')
  const props = await fetchGlobalAllData({
    from: 'search-props',
    locale
  })
  const { allPages } = props
  const allPosts = allPages?.filter(
    (page: SitePage) => page.type === 'Post' && page.status === 'Published'
  )
  props.posts = await filterByMemCache(allPosts || [], keyword)
  props.postCount = props.posts.length
  const POST_LIST_STYLE = siteConfig(
    'POST_LIST_STYLE',
    'Page',
    props?.NOTION_CONFIG
  )
  const POSTS_PER_PAGE = siteConfig('POSTS_PER_PAGE', 12, props?.NOTION_CONFIG)

  if (POST_LIST_STYLE === 'scroll') {
    // Infinite scrolling receives the full post list.
  } else if (POST_LIST_STYLE) {
    props.posts = props.posts?.slice(0, POSTS_PER_PAGE)
  }
  props.keyword = keyword
  return staticPropsResult(props, props.NOTION_CONFIG)
}

export const getStaticPaths: GetStaticPaths = () => {
  return {
    paths: [{ params: { keyword: 'NotionNext' } }],
    fallback: true
  }
}

/**
 * Search the full-text index stored in memory cache.
 */
async function filterByMemCache(allPosts: SitePage[], keyword: string) {
  const filterPosts: SitePage[] = []
  if (keyword) {
    keyword = keyword.trim().toLowerCase()
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
    let hit = articleInfo.toLowerCase().indexOf(keyword) > -1
    const contentTextList = page ? getPageContentText(post, page) : ''
    // console.log('Full-text search cache', cacheKey, page != null)
    post.results = []
    let hitCount = 0
    for (const i of contentTextList) {
      const c = contentTextList[i as unknown as number]
      if (!c) {
        continue
      }
      const index = c.toLowerCase().indexOf(keyword)
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
