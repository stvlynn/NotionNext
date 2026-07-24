import BLOG from '@/blog.config'
import { DynamicLayout } from '@/themes/theme'
import type { GetStaticProps, NextPage } from 'next'
import { useEffect } from 'react'
import {
  fetchGlobalAllData,
  formatDateFmt,
  siteConfig,
  staticPropsResult
} from '@/lib/page/runtime'
import type { PageProps, SitePage } from '@/lib/page/runtime'

/**
 * Archive index page.
 */
const ArchiveIndex: NextPage<PageProps> = props => {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const anchor = window.location.hash
      if (anchor) {
        setTimeout(() => {
          const anchorElement = document.getElementById(anchor.substring(1))
          if (anchorElement) {
            anchorElement.scrollIntoView({ block: 'start', behavior: 'smooth' })
          }
        }, 300)
      }
    }
  }, [])

  const theme = siteConfig('THEME', BLOG.THEME, props.NOTION_CONFIG)
  return <DynamicLayout theme={theme} layoutName='LayoutArchive' {...props} />
}

export const getStaticProps: GetStaticProps<PageProps> = async ({ locale }) => {
  const props = await fetchGlobalAllData({ from: 'archive-index', locale })
  props.posts = props.allPages?.filter(
    (page: SitePage) => page.type === 'Post' && page.status === 'Published'
  )
  delete props.allPages

  const postsSortByDate = [...(props.posts || [])]

  postsSortByDate.sort((a: SitePage, b: SitePage) => {
    return Number(b?.publishDate || 0) - Number(a?.publishDate || 0)
  })

  const archivePosts: Record<string, SitePage[]> = {}

  postsSortByDate.forEach((post: SitePage) => {
    const date = formatDateFmt(post.publishDate, 'yyyy-MM')
    if (archivePosts[date]) {
      archivePosts[date].push(post)
    } else {
      archivePosts[date] = [post]
    }
  })

  props.archivePosts = archivePosts
  delete props.allPages

  return staticPropsResult(props, props.NOTION_CONFIG)
}

export default ArchiveIndex
