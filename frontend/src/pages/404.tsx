import BLOG from '@/blog.config'
import { DynamicLayout } from '@/themes/theme'
import type { GetStaticProps, NextPage } from 'next'
import { siteConfig, staticPropsResult } from '@/lib/page/runtime'
import { fetchGlobalAllData } from '@/lib/page/server-data'
import type { PageProps } from '@/lib/page/runtime'

/**
 * 404
 */
const NoFound: NextPage<PageProps> = props => {
  const theme = siteConfig('THEME', BLOG.THEME, props.NOTION_CONFIG)
  return <DynamicLayout theme={theme} layoutName='Layout404' {...props} />
}

export const getStaticProps: GetStaticProps<PageProps> = async ({ locale }) => {
  const props = (await fetchGlobalAllData({ from: '404', locale })) || {}
  return staticPropsResult(props, props.NOTION_CONFIG)
}

export default NoFound
