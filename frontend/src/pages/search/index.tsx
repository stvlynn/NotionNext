import BLOG from '@/blog.config'
import { DynamicLayout } from '@/themes/theme'
import type { GetStaticProps, NextPage } from 'next'
import { useRouter } from 'next/router'
import { siteConfig, staticPropsResult } from '@/lib/page/runtime'
import { fetchGlobalAllData } from '@/lib/page/server-data'
import type { PageProps, SitePage } from '@/lib/page/runtime'

/**
 * Client-side search route.
 */
const Search: NextPage<PageProps> = props => {
  const { posts } = props

  const router = useRouter()
  const keyword = router?.query?.s

  let filteredPosts: SitePage[]
  if (typeof keyword === 'string') {
    filteredPosts = (posts || []).filter((post: SitePage) => {
      const tagContent = post?.tags ? post?.tags.join(' ') : ''
      const categoryContent = Array.isArray(post.category)
        ? post.category.join(' ')
        : post.category || ''
      const searchContent =
        post.title + post.summary + tagContent + categoryContent
      return searchContent.toLowerCase().includes(keyword.toLowerCase())
    })
  } else {
    filteredPosts = []
  }

  props = { ...props, posts: filteredPosts }

  const theme = siteConfig('THEME', BLOG.THEME, props.NOTION_CONFIG)
  return <DynamicLayout theme={theme} layoutName='LayoutSearch' {...props} />
}

/**
 * Browser-side search data.
 */
export const getStaticProps: GetStaticProps<PageProps> = async ({ locale }) => {
  const props = await fetchGlobalAllData({
    from: 'search-props',
    locale
  })
  const { allPages } = props
  props.posts = allPages?.filter(
    (page: SitePage) => page.type === 'Post' && page.status === 'Published'
  )
  return staticPropsResult(props, props.NOTION_CONFIG)
}

export default Search
