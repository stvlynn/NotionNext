import BLOG from '@/blog.config'
import { DynamicLayout } from '@/themes/theme'
import type { GetStaticPaths, GetStaticProps, NextPage } from 'next'
import { siteConfig, staticPropsResult } from '@/lib/page/runtime'
import { fetchGlobalAllData } from '@/lib/page/server-data'
import type { PageProps, SiteOption, SitePage } from '@/lib/page/runtime'

/**
 * Tag post list page.
 */
const Tag: NextPage<PageProps> = props => {
  const theme = siteConfig('THEME', BLOG.THEME, props.NOTION_CONFIG)
  return <DynamicLayout theme={theme} layoutName='LayoutPostList' {...props} />
}

export const getStaticProps: GetStaticProps<PageProps> = async ({
  params,
  locale
}) => {
  const tag = String(params?.tag || '')
  const from = 'tag-props'
  const props = await fetchGlobalAllData({ from, locale })

  props.posts = props.allPages
    ?.filter((page: SitePage) => page.type === 'Post' && page.status === 'Published')
    .filter((post: SitePage) => post && post?.tags && post?.tags.includes(tag))

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

  props.tag = tag
  delete props.allPages
  return staticPropsResult(props, props.NOTION_CONFIG)
}

/**
 * Get tag names from Notion select options.
 */
function getTagNames(tags: SiteOption[] | undefined) {
  if (!Array.isArray(tags)) {
    return []
  }
  const tagNames: string[] = []
  tags.forEach((tag: SiteOption) => {
    tagNames.push(tag.name)
  })
  return tagNames
}

export const getStaticPaths: GetStaticPaths = async () => {
  const from = 'tag-static-path'
  const { tagOptions } = await fetchGlobalAllData({ from })
  const tagNames = getTagNames(tagOptions)

  return {
    paths: tagNames.map((tag: string) => ({
      params: { tag }
    })),
    fallback: true
  }
}

export default Tag
