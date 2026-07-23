// pages/sitemap.xml.js
import type { GetStaticProps, NextPage } from 'next'
import { useRouter } from 'next/router'
import Slug from '../[prefix]'
import { fetchGlobalAllData } from '@/pages/_runtime'
import type { PageProps } from '@/pages/_runtime'

/**
 * Build the auth result page props.
 */
export const getStaticProps: GetStaticProps<PageProps> = async () => {
  const from = `auth`
  const props = await fetchGlobalAllData({ from })

  delete props.allPages
  return {
    props
  }
}

/**
 * Render the auth result message inside the slug layout.
 */
const UI: NextPage<PageProps> = props => {
  const router = useRouter()
  return <Slug {...props} msg={router?.query?.msg} title={'授权结果'} />
}

export default UI
