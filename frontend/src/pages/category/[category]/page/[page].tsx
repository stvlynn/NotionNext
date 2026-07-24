import BLOG from '@/blog.config'
import { DynamicLayout } from '@/themes/theme'
import type { GetStaticPaths, GetStaticProps, NextPage } from 'next'
import { siteConfig, staticPropsResult } from '@/lib/page/runtime'
import { fetchGlobalAllData } from '@/lib/page/server-data'
import type { PageProps, SiteOption, SitePage } from '@/lib/page/runtime'

/**
 * Paginated category post list page.
 */

const Category: NextPage<PageProps> = props => {
  const theme = siteConfig('THEME', BLOG.THEME, props.NOTION_CONFIG)
  return <DynamicLayout theme={theme} layoutName='LayoutPostList' {...props} />
}

export const getStaticProps: GetStaticProps<PageProps> = async ({ params }) => {
  const category = String(params?.category || '')
  const page = String(params?.page || '')
  const pageNumber = Number(page)
  const from = 'category-page-props'
  let props = await fetchGlobalAllData({ from })

  props.posts = props.allPages
    ?.filter((page: SitePage) => page.type === 'Post' && page.status === 'Published')
    .filter((post: SitePage) => post && post.category && post.category.includes(category))
  props.postCount = props.posts?.length || 0
  const POSTS_PER_PAGE = siteConfig('POSTS_PER_PAGE', 12, props?.NOTION_CONFIG)
  props.posts = (props.posts || []).slice(
    POSTS_PER_PAGE * (pageNumber - 1),
    POSTS_PER_PAGE * pageNumber
  )

  delete props.allPages
  props.page = page

  props = { ...props, category, page }

  return staticPropsResult(props, props.NOTION_CONFIG)
}

export const getStaticPaths: GetStaticPaths = async () => {
  const from = 'category-paths'
  const { categoryOptions, allPages, NOTION_CONFIG } = await fetchGlobalAllData({
    from
  })
  const paths: Array<{ params: { category: string; page: string } }> = []

  categoryOptions?.forEach((category: SiteOption) => {
    const categoryPosts = allPages
      ?.filter((page: SitePage) => page.type === 'Post' && page.status === 'Published')
      .filter(
        (post: SitePage) => post && post.category && post.category.includes(category.name)
      )
    const postCount = categoryPosts?.length || 0
    const postsPerPage = siteConfig<number | null>(
      'POSTS_PER_PAGE',
      null,
      NOTION_CONFIG
    ) || 1
    const totalPages = Math.ceil(postCount / postsPerPage)
    if (totalPages > 1) {
      for (let i = 1; i <= totalPages; i++) {
        paths.push({ params: { category: category.name, page: '' + i } })
      }
    }
  })

  return {
    paths,
    fallback: true
  }
}

export default Category
