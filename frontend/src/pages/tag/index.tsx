import BLOG from '@/blog.config'
import { DynamicLayout } from '@/themes/theme'
import type { GetStaticProps, NextPage } from 'next'
import { siteConfig, staticPropsResult } from '@/lib/page/runtime'
import { fetchGlobalAllData } from '@/lib/page/server-data'
import type { PageProps } from '@/lib/page/runtime'

/**
 * Tag index page.
 */
const TagIndex: NextPage<PageProps> = props => {
  const theme = siteConfig('THEME', BLOG.THEME, props.NOTION_CONFIG)
  return <DynamicLayout theme={theme} layoutName='LayoutTagIndex' {...props} />
}

export const getStaticProps: GetStaticProps<PageProps> = async ({ locale }) => {
  const from = 'tag-index-props'
  const props = await fetchGlobalAllData({ from, locale })
  delete props.allPages
  return staticPropsResult(props, props.NOTION_CONFIG)
}

export default TagIndex
