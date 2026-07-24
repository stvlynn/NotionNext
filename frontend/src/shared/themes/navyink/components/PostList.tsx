'use client'

import { conf } from '../lib/global'
import { useThemeGlobal } from '../lib/global'
import { getListByPage } from '@/lib/utils'
import * as React from 'react'

import { Button } from '@/components/ui'
import type { Post } from '../types'
import { StaggerContainer } from './Motion'
import { Pagination } from './Pagination'
import { PostCard } from './PostCard'

const GRID = 'grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3'

function EmptyState({ message }: { message: string }) {
  return (
    <div className='flex items-center justify-center py-24'>
      <p className='text-sm text-muted-foreground'>{message}</p>
    </div>
  )
}

interface PostListPageProps {
  page?: number
  posts?: Post[]
  postCount?: number
}

/** Paginated grid (POST_LIST_STYLE = 'page'). */
export function PostListPage({
  page = 1,
  posts = [],
  postCount = 0
}: PostListPageProps) {
  const { NOTION_CONFIG, locale } = useThemeGlobal()
  const perPage = conf('POSTS_PER_PAGE', 12, NOTION_CONFIG)
  const totalPage = Math.ceil(postCount / perPage)

  if (!posts || posts.length === 0 || page > totalPage) {
    return <EmptyState message={locale.COMMON.NO_RESULTS || 'No posts found.'} />
  }

  return (
    <div className='w-full'>
      <StaggerContainer className={GRID}>
        {posts.map((post, i) => (
          <PostCard key={post.id} post={post} index={i} />
        ))}
      </StaggerContainer>
      {postCount > perPage && <Pagination page={page} totalPage={totalPage} />}
    </div>
  )
}

interface PostListScrollProps {
  posts?: Post[]
  currentSearch?: string | undefined
}

/** Infinite-scroll grid (POST_LIST_STYLE = 'scroll'). */
export function PostListScroll({
  posts = [],
  currentSearch
}: PostListScrollProps) {
  const { NOTION_CONFIG, locale } = useThemeGlobal()
  const perPage = conf('POSTS_PER_PAGE', 12, NOTION_CONFIG)
  const [page, setPage] = React.useState(1)
  const visible = getListByPage(posts, page, perPage)
  const hasMore = page * perPage < (posts?.length || 0)

  const loadMore = React.useCallback(() => {
    setPage(p => (p * perPage < (posts?.length || 0) ? p + 1 : p))
  }, [perPage, posts])

  React.useEffect(() => {
    const onScroll = () => {
      if (!hasMore) return
      const nearBottom =
        window.scrollY + window.innerHeight >
        document.body.scrollHeight - 320
      if (nearBottom) loadMore()
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [hasMore, loadMore])

  if (!visible || visible.length === 0) {
    return (
      <EmptyState
        message={
          currentSearch
            ? `${locale.COMMON.NO_RESULTS || 'No results for'} "${currentSearch}"`
            : locale.COMMON.NO_RESULTS || 'No posts found.'
        }
      />
    )
  }

  return (
    <div className='w-full'>
      <StaggerContainer className={GRID}>
        {visible.map((post, i) => (
          <PostCard key={post.id} post={post} index={i} />
        ))}
      </StaggerContainer>
      <div className='flex justify-center py-10'>
        {hasMore ? (
          <Button variant='outline' size='sm' onClick={loadMore}>
            {locale.COMMON.MORE || 'Load more'}
          </Button>
        ) : (
          <span className='text-sm text-muted-foreground'>
            {locale.COMMON.NO_MORE || 'No more posts'}
          </span>
        )}
      </div>
    </div>
  )
}
