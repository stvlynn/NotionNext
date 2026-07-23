import BLOG from '@/blog.config'
import { DynamicLayout } from '@/themes/theme'
import type { GetStaticPaths, GetStaticProps, NextPage } from 'next'
import { fetchGlobalAllData, siteConfig, staticPropsResult } from '@/pages/_runtime'
import type { PageProps } from '@/pages/_runtime'

/**
 * Sign-up page.
 */
const SignUp: NextPage<PageProps> = props => {
  const theme = siteConfig('THEME', BLOG.THEME, props.NOTION_CONFIG)
  return <DynamicLayout theme={theme} layoutName='LayoutSignUp' {...props} />
}

export const getStaticProps: GetStaticProps<PageProps> = async ({ locale }) => {
  const from = 'SignIn'
  const props = await fetchGlobalAllData({ from, locale })

  delete props.allPages
  return staticPropsResult(props, props.NOTION_CONFIG)
}

/**
 * Catch-all route for Clerk.
 */
export const getStaticPaths: GetStaticPaths = () => {
  return {
    paths: [
      { params: { index: [] } },
      { params: { index: ['sign-up'] } }
    ],
    fallback: 'blocking'
  }
}
export default SignUp
