// pages/sitemap.xml.js
import type { GetStaticProps, NextPage } from 'next'
import { useRouter } from 'next/router'
import Slug from '../[prefix]'
import { staticPropsResult } from '@/lib/page/runtime'
import { fetchGlobalAllData } from '@/lib/page/server-data'
import type { PageProps } from '@/lib/page/runtime'

/**
 * Build the auth result page props.
 */
export const getStaticProps: GetStaticProps<PageProps> = async () => {
  const from = `auth`
  const props = await fetchGlobalAllData({ from })

  delete props.allPages
  return staticPropsResult(props, props.NOTION_CONFIG)
}

/**
 * Render the auth result message inside the slug layout.
 */
const UI: NextPage<PageProps> = props => {
  const router = useRouter()
  return <Slug {...props} msg={router?.query?.msg} title={'授权结果'} />
}

export default UI
