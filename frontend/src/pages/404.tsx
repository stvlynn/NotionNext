import BLOG from '@/blog.config'
import { DynamicLayout } from '@/themes/theme'
import type { GetStaticProps, NextPage } from 'next'
import { fetchGlobalAllData, siteConfig } from '@/pages/_runtime'
import type { PageProps } from '@/pages/_runtime'

/**
 * 404
 */
const NoFound: NextPage<PageProps> = props => {
  const theme = siteConfig('THEME', BLOG.THEME, props.NOTION_CONFIG)
  return <DynamicLayout theme={theme} layoutName='Layout404' {...props} />
}

export const getStaticProps: GetStaticProps<PageProps> = async ({ locale }) => {
  const props = (await fetchGlobalAllData({ from: '404', locale })) || {}
  return { props }
}

export default NoFound
