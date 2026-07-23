import BLOG from '@/blog.config'
import { DynamicLayout } from '@/themes/theme'
import type { GetStaticPaths, GetStaticProps, NextPage } from 'next'
import { fetchGlobalAllData, siteConfig, staticPropsResult } from '@/pages/_runtime'
import type { PageProps, SiteOption, SitePage } from '@/pages/_runtime'

const Tag: NextPage<PageProps> = props => {
  const theme = siteConfig('THEME', BLOG.THEME, props.NOTION_CONFIG)
  return <DynamicLayout theme={theme} layoutName='LayoutPostList' {...props} />
}

export const getStaticProps: GetStaticProps<PageProps> = async ({
  params,
  locale
}) => {
  const tag = String(params?.tag || '')
  const page = String(params?.page || '')
  const pageNumber = Number(page)
  const from = 'tag-page-props'
  const props = await fetchGlobalAllData({ from, locale })
  props.posts = props.allPages
    ?.filter((page: SitePage) => page.type === 'Post' && page.status === 'Published')
    .filter((post: SitePage) => post && post?.tags && post?.tags.includes(tag))
  props.postCount = props.posts?.length || 0
  const POSTS_PER_PAGE = siteConfig('POSTS_PER_PAGE', 12, props?.NOTION_CONFIG)
  props.posts = (props.posts || []).slice(
    POSTS_PER_PAGE * (pageNumber - 1),
    POSTS_PER_PAGE * pageNumber
  )

  props.tag = tag
  props.page = page
  delete props.allPages
  return staticPropsResult(props, props.NOTION_CONFIG)
}

export const getStaticPaths: GetStaticPaths = async () => {
  const from = 'tag-page-static-path'
  const { tagOptions, allPages, NOTION_CONFIG } = await fetchGlobalAllData({ from })
  const paths: Array<{ params: { tag: string; page: string } }> = []
  tagOptions?.forEach((tag: SiteOption) => {
    const tagPosts = allPages
      ?.filter((page: SitePage) => page.type === 'Post' && page.status === 'Published')
      .filter((post: SitePage) => post && post?.tags && post?.tags.includes(tag.name))
    const postCount = tagPosts?.length || 0
    const postsPerPage = siteConfig<number | null>(
      'POSTS_PER_PAGE',
      null,
      NOTION_CONFIG
    ) || 1
    const totalPages = Math.ceil(postCount / postsPerPage)
    if (totalPages > 1) {
      for (let i = 1; i <= totalPages; i++) {
        paths.push({ params: { tag: tag.name, page: '' + i } })
      }
    }
  })
  return {
    paths: paths,
    fallback: true
  }
}

export default Tag
