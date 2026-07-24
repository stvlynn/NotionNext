import BLOG from '@/blog.config'
import { DynamicLayout } from '@/themes/theme'
import type { GetStaticPaths, GetStaticProps, NextPage } from 'next'
import PropTypes from 'prop-types'
import { siteConfig as resolveSiteConfig, staticPropsResult } from '@/lib/page/runtime'
import { resolvePostProps } from '@/lib/page/server-data'
import type { PageProps } from '@/lib/page/runtime'

/**
 * Dashboard catch-all route.
 */
const Dashboard: NextPage<PageProps> = props => {
  const theme = resolveSiteConfig('THEME', BLOG.THEME, props.NOTION_CONFIG)
  return <DynamicLayout theme={theme} layoutName='LayoutDashboard' {...props} />
}

Dashboard.propTypes = {
  NOTION_CONFIG: PropTypes.object
}

export const getStaticProps: GetStaticProps<PageProps> = async ({ locale }) => {
  const prefix = 'dashboard'
  const props = await resolvePostProps({
    prefix,
    locale,
  })

  return staticPropsResult(props, props.NOTION_CONFIG)
}

export const getStaticPaths: GetStaticPaths = () => {
  return {
    paths: [
      { params: { index: [] } },
      { params: { index: ['membership'] } },
      { params: { index: ['balance'] } },
      { params: { index: ['user-profile'] } },
      { params: { index: ['user-profile', 'security'] } },
      { params: { index: ['order'] } },
      { params: { index: ['affiliate'] } }
    ],
    fallback: 'blocking'
  }
}

export default Dashboard
