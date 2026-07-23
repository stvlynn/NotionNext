import BLOG from '@/blog.config'
import { DynamicLayout } from '@/themes/theme'
import type { GetStaticPaths, GetStaticProps, NextPage } from 'next'
import { fetchGlobalAllData, siteConfig, staticPropsResult } from '@/pages/_runtime'
import type { PageProps, SiteOption, SitePage } from '@/pages/_runtime'

/**
 * Category post list page.
 */
const Category: NextPage<PageProps> = props => {
  const theme = siteConfig('THEME', BLOG.THEME, props.NOTION_CONFIG)
  return <DynamicLayout theme={theme} layoutName='LayoutPostList' {...props} />
}

export const getStaticProps: GetStaticProps<PageProps> = async ({
  params,
  locale
}) => {
  const category = String(params?.category || '')
  const from = 'category-props'
  let props = await fetchGlobalAllData({ from, locale })

  props.posts = props.allPages?.filter(
    (page: SitePage) => page.type === 'Post' && page.status === 'Published'
  )
  props.posts = props.posts?.filter(
    (post: SitePage) => post && post.category && post.category.includes(category)
  )

  props.postCount = props.posts?.length || 0
  const POST_LIST_STYLE = siteConfig(
    'POST_LIST_STYLE',
    'page',
    props?.NOTION_CONFIG
  )
  if (POST_LIST_STYLE === 'scroll') {
    // Infinite scrolling receives the full post list.
  } else if (POST_LIST_STYLE === 'page') {
    props.posts = props.posts?.slice(
      0,
      siteConfig('POSTS_PER_PAGE', 12, props?.NOTION_CONFIG)
    )
  }

  delete props.allPages

  props = { ...props, category }

  return staticPropsResult(props, props.NOTION_CONFIG)
}

export const getStaticPaths: GetStaticPaths = async () => {
  const from = 'category-paths'
  const { categoryOptions } = await fetchGlobalAllData({ from })
  const categories = Array.isArray(categoryOptions) ? categoryOptions : []
  return {
    paths: categories.map((category: SiteOption) => ({
      params: { category: category?.name }
    })),
    fallback: true
  }
}

export default Category
