import { siteConfig } from '@/lib/config'
import { useGlobal } from '@/lib/global'
import { getListByPage } from '@/lib/utils'
import { useEffect, useRef, useState } from 'react'
import CONFIG from '../config'
import BlogPostCard from './BlogPostCard'

/**
 * 博客列表滚动分页 - Anthropic 风格
 * 响应式网格 + 无限滚动加载
 */
const BlogPostListScroll = ({
  posts = [],
  currentSearch,
  showSummary = siteConfig('ANTHROPIC_POST_LIST_SUMMARY', null, CONFIG),
  siteInfo
}) => {
  const { NOTION_CONFIG, locale } = useGlobal()
  const [page, updatePage] = useState(1)
  const POSTS_PER_PAGE = siteConfig('POSTS_PER_PAGE', null, NOTION_CONFIG)
  const postsToShow = getListByPage(posts, page, POSTS_PER_PAGE)

  let hasMore = false
  if (posts) {
    const totalCount = posts.length
    hasMore = page * POSTS_PER_PAGE < totalCount
  }

  const handleGetMore = () => {
    if (!hasMore) return
    updatePage(page + 1)
  }

  const targetRef = useRef(null)

  // 监听滚动自动分页加载
  const scrollTrigger = () => {
    requestAnimationFrame(() => {
      const scrollS = window.scrollY + window.outerHeight
      const clientHeight = targetRef
        ? targetRef.current
          ? targetRef.current.clientHeight
          : 0
        : 0
      if (scrollS > clientHeight + 100) {
        handleGetMore()
      }
    })
  }

  useEffect(() => {
    window.addEventListener('scroll', scrollTrigger)
    return () => {
      window.removeEventListener('scroll', scrollTrigger)
    }
  })

  if (!postsToShow || postsToShow.length === 0) {
    return (
      <div className='flex items-center justify-center py-20'>
        <p
          className='text-base ui-text'
          style={{ color: 'var(--anthropic-text-tertiary)' }}>
          {currentSearch
            ? `No results for "${currentSearch}"`
            : 'No posts found.'}
        </p>
      </div>
    )
  }

  return (
    <div id='container' ref={targetRef} className='w-full'>
      {/* 文章网格 */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {postsToShow.map((post, index) => (
          <BlogPostCard
            key={post.id}
            index={index}
            post={post}
            showSummary={showSummary}
            siteInfo={siteInfo}
          />
        ))}
      </div>

      {/* 加载更多 */}
      <div className='py-8 flex justify-center'>
        <div
          onClick={handleGetMore}
          className={`text-sm ui-text cursor-pointer transition-colors duration-200 ${
            hasMore ? 'hover:opacity-70' : ''
          }`}
          style={{ color: hasMore ? 'var(--anthropic-accent)' : 'var(--anthropic-text-tertiary)' }}>
          {hasMore ? (
            <span className='flex items-center space-x-2'>
              <span>{locale.COMMON.MORE}</span>
              <svg className='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={1.5}>
                <path strokeLinecap='round' strokeLinejoin='round' d='M19.5 8.25l-7.5 7.5-7.5-7.5' />
              </svg>
            </span>
          ) : (
            <span>{locale.COMMON.NO_MORE}</span>
          )}
        </div>
      </div>
    </div>
  )
}

export default BlogPostListScroll
