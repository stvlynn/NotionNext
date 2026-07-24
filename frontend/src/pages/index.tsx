import BLOG from '@/blog.config'
import { staticPropsResult, siteConfig } from '@/lib/page/runtime'
import { cleanPostSummaries, fetchGlobalAllData, getPostBlocks } from '@/lib/page/server-data'
import { formatNotionBlock } from '@/lib/db/notion/getPostBlocks'
import { generateRedirectJson } from '@/lib/utils/redirect'
import { generateRobotsTxt } from '@/lib/utils/robots.txt'
import { generateRss, shouldGenerateRssForLocale } from '@/lib/utils/rss'
import { generateSitemapXml } from '@/lib/utils/sitemap.xml'
import { adapterNotionBlockMap } from '@/lib/utils/notion.util'
import { checkDataFromAlgolia } from '@/lib/plugins/algolia'
import { DynamicLayout } from '@/themes/theme'
import pLimit from 'p-limit'
import type { GetStaticProps, NextPage } from 'next'
import type { PageProps, SitePage } from '@/lib/page/runtime'

/**
 * Home page layout.
 */
const Index: NextPage<PageProps> = props => {
  const theme = siteConfig('THEME', BLOG.THEME, props.NOTION_CONFIG)
  return <DynamicLayout theme={theme} layoutName='LayoutIndex' {...props} />
}

/**
 * Fetch static home page data.
 */
export const getStaticProps: GetStaticProps<PageProps> = async ({ locale }) => {
  const from = 'index'
  const props = await fetchGlobalAllData({ from, locale })
  if (process.env.NODE_ENV === 'development') {
    const configTheme = BLOG.THEME
    const notionTheme = props?.NOTION_CONFIG?.THEME || null
    const finalTheme = siteConfig('THEME', BLOG.THEME, props?.NOTION_CONFIG)
    const source = notionTheme ? 'notion:config' : 'blog/env:config'
    console.log(
      '[ThemeResolver][server-static-props]',
      JSON.stringify({
        route: '/',
        configTheme,
        notionTheme,
        finalTheme,
        source
      })
    )
  }
  const POST_PREVIEW_LINES = siteConfig(
    'POST_PREVIEW_LINES',
    8,
    props?.NOTION_CONFIG
  )
  const POST_PREVIEW_MAX_COUNT = siteConfig(
    'POST_PREVIEW_MAX_COUNT',
    4,
    props?.NOTION_CONFIG
  )
  const POST_LIST_PREVIEW = siteConfig(
    'POST_LIST_PREVIEW',
    false,
    props?.NOTION_CONFIG
  )
  props.posts = (props.allPages || []).filter(
    (page: SitePage) => page.type === 'Post' && page.status === 'Published'
  )

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

  if (POST_LIST_PREVIEW) {
    const previewLimit = pLimit(
      siteConfig('POST_PREVIEW_CONCURRENCY', 5, props?.NOTION_CONFIG)
    )
    const previewTargets = (props.posts || []).filter(
      (post: SitePage) => !post.password || post.password === ''
    ).slice(0, POST_PREVIEW_MAX_COUNT)
    await Promise.all(
      previewTargets.map((post: SitePage) =>
        previewLimit(async () => {
          const rawBlockMap = await getPostBlocks(post.id, 'slug', POST_PREVIEW_LINES)
          post.blockMap = adapterNotionBlockMap(rawBlockMap)
          if (post.blockMap?.block) {
            post.blockMap.block = formatNotionBlock(post.blockMap.block)
          }
        })
      )
    )
  }
  const isBuildLifecycle = ['build', 'export'].includes(
    process.env.npm_lifecycle_event || ''
  )
  if (isBuildLifecycle) {
    generateRobotsTxt(props)
    if (shouldGenerateRssForLocale(locale ? { locale } : {})) {
      await generateRss(props)
    }
    generateSitemapXml(props)
    await checkDataFromAlgolia(props)
    if (siteConfig('UUID_REDIRECT', false, props?.NOTION_CONFIG)) {
      generateRedirectJson(props)
    }
  }

  if (!POST_LIST_PREVIEW) {
    props.posts = cleanPostSummaries(props.posts) || undefined
  }
  props.latestPosts = cleanPostSummaries(props.latestPosts)
  delete props.allPages

  return staticPropsResult(props, props.NOTION_CONFIG)
}

export default Index
