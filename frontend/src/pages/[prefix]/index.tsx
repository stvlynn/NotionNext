import BLOG from '@/blog.config'
import useNotification from '@/components/Notification'
import TechGrow from '@/components/TechGrow'
import {
  checkSlugHasNoSlash,
  getPageTableOfContents,
  getPasswordQuery,
  getPasswordStoragePath,
  getStaticPathsBase,
  resolvePostProps,
  sha256Digest,
  staticPropsResult,
  siteConfig,
  useGlobal
} from '@/pages/_runtime'
import { DynamicLayout } from '@/themes/theme'
import { md5 } from 'js-md5'
import type { GetStaticPaths, GetStaticProps, NextPage } from 'next'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import type { PageProps, SitePage } from '@/pages/_runtime'

const isStaticExport = process.env.EXPORT === 'true'

/**
 * Resolve a first-level Notion slug such as /about.
 */
const Slug: NextPage<PageProps> = props => {
  const { post } = props
  const router = useRouter()
  const { locale } = useGlobal() as unknown as {
    locale: { COMMON: { ARTICLE_UNLOCK_TIPS: string } }
  }

  const [lock, setLock] = useState(Boolean(post?.password && post?.password !== ''))
  const { showNotification, Notification } = useNotification()
  const TechGrowWithLock = TechGrow as (props: { lock: boolean }) => JSX.Element

  /**
   * Validate the article password.
   */
  const validPassword = (passInput: string) => {
    if (!post) {
      return false
    }
    const legacy = md5(String(post?.slug ?? '') + passInput)
    const nextHash = sha256Digest(passInput)
    if (nextHash === post?.password || legacy === post?.password) {
      setLock(false)
      // Store the password against the pathname only so query/hash changes do not miss.
      localStorage.setItem(
        'password_' + getPasswordStoragePath(router.asPath),
        passInput
      )
      showNotification(locale.COMMON.ARTICLE_UNLOCK_TIPS)
      return true
    }
    return false
  }

  // Load article-derived content after unlock.
  useEffect(() => {
    if (post?.password && post?.password !== '') {
      setLock(true)
    } else {
      setLock(false)
    }

    const passInputs = getPasswordQuery(router.asPath)
    if (passInputs.length > 0) {
      for (const passInput of passInputs) {
        if (validPassword(passInput)) {
          break
        }
      }
    }
    // validPassword depends on post and router, both of which are already tracked.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post, router.asPath])

  useEffect(() => {
    if (lock) {
      return
    }
    const currentPost = post
    const blockMap = currentPost?.blockMap
    if (currentPost && blockMap?.block) {
      currentPost.content = Object.keys(blockMap.block).filter(
        key => blockMap.block?.[key]?.value?.parent_id === currentPost.id
      )
      currentPost.toc = getPageTableOfContents(currentPost, blockMap)
    }
  }, [router, lock, post])

  props = { ...props, lock, validPassword }
  const theme = siteConfig('THEME', BLOG.THEME, props.NOTION_CONFIG)
  return (
    <>
      {/* Article layout. */}
      <DynamicLayout theme={theme} layoutName='LayoutSlug' {...props} />
      {/* Unlocked-password notification. */}
      {post?.password && post?.password !== '' && !lock && <Notification />}
      {/* Traffic-growth widget. */}
      <TechGrowWithLock lock={lock} />
    </>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  return getStaticPathsBase<SitePage, { params: { prefix: string } }>({
    from: 'slug-paths',
    filterFn: row => checkSlugHasNoSlash(row),
    mapPageToParams: row => ({ params: { prefix: row.slug } })
  })
}

export const getStaticProps: GetStaticProps<PageProps> = async ({
  params,
  locale
}) => {
  const prefix = String(params?.prefix || '')
  const props = await resolvePostProps({
    prefix,
    locale,
  })

  if (!props.post) {
    return { notFound: true }
  }
  return staticPropsResult(props, props.NOTION_CONFIG, isStaticExport)
}

export default Slug
