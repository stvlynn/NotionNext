import BLOG from '@/blog.config'
import {
  adapterNotionBlockMap,
  fetchGlobalAllData,
  formatNotionBlock,
  getPostBlocks,
  staticPropsResult,
  siteConfig
} from '@/pages/_runtime'
import { DynamicLayout } from '@/themes/theme'
import type { GetStaticPaths, GetStaticProps, NextPage } from 'next'
import type { PageProps, SitePage } from '@/pages/_runtime'

/**
 * Paginated post list.
 */
const Page: NextPage<PageProps> = props => {
  const theme = siteConfig('THEME', BLOG.THEME, props.NOTION_CONFIG)
  return <DynamicLayout theme={theme} layoutName='LayoutPostList' {...props} />
}

export const getStaticPaths: GetStaticPaths = async (ctx: any) => {
  const { locale } = ctx
  const from = 'page-paths'
  const { postCount, NOTION_CONFIG } = await fetchGlobalAllData({ from, locale })
  const postsPerPage = siteConfig<number | null>(
    'POSTS_PER_PAGE',
    null,
    NOTION_CONFIG
  ) || 1
  const totalPages = Math.ceil(
    (postCount || 0) / postsPerPage
  )
  return {
    // remove first page, we 're not gonna handle that.
    paths: Array.from({ length: totalPages - 1 }, (_, i) => ({
      params: { page: '' + (i + 2) }
    })),
    fallback: true
  }
}

export const getStaticProps: GetStaticProps<PageProps> = async ({
  params,
  locale
}) => {
  const page = String(params?.page || '')
  const pageNumber = Number(page)
  const from = `page-${page}`
  const props = await fetchGlobalAllData({ from, locale })
  const { allPages } = props
  const POST_PREVIEW_LINES = siteConfig(
    'POST_PREVIEW_LINES',
    12,
    props?.NOTION_CONFIG
  )

  const allPosts = (allPages || []).filter(
    (page: SitePage) => page.type === 'Post' && page.status === 'Published'
  )
  const POSTS_PER_PAGE = siteConfig('POSTS_PER_PAGE', 12, props?.NOTION_CONFIG)
  // Keep the original route-param arithmetic semantics.
  props.posts = allPosts.slice(
    POSTS_PER_PAGE * (pageNumber - 1),
    POSTS_PER_PAGE * pageNumber
  )
  props.page = page

  if (siteConfig('POST_LIST_PREVIEW', false, props?.NOTION_CONFIG)) {
    for (const post of props.posts || []) {
      if (post.password && post.password !== '') {
        continue
      }
      const rawBlockMap = await getPostBlocks(post.id, 'slug', POST_PREVIEW_LINES)
      post.blockMap = adapterNotionBlockMap(rawBlockMap)
      if (post.blockMap?.block) {
        post.blockMap.block = formatNotionBlock(post.blockMap.block)
      }
    }
  }

  delete props.allPages
  return staticPropsResult(props, props.NOTION_CONFIG)
}

export default Page
