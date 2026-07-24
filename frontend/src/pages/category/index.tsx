import BLOG from '@/blog.config'
import { DynamicLayout } from '@/themes/theme'
import type { GetStaticProps, NextPage } from 'next'
import { fetchGlobalAllData, siteConfig, staticPropsResult } from '@/lib/page/runtime'
import type { PageProps } from '@/lib/page/runtime'

/**
 * Category index page.
 */
const Category: NextPage<PageProps> = props => {
  const theme = siteConfig('THEME', BLOG.THEME, props.NOTION_CONFIG)
  return (
    <DynamicLayout theme={theme} layoutName='LayoutCategoryIndex' {...props} />
  )
}

export const getStaticProps: GetStaticProps<PageProps> = async ({ locale }) => {
  const props = await fetchGlobalAllData({ from: 'category-index-props', locale })
  delete props.allPages
  return staticPropsResult(props, props.NOTION_CONFIG)
}

export default Category
