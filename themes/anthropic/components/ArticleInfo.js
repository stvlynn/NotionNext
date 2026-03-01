import { siteConfig } from '@/lib/config'
import { useGlobal } from '@/lib/global'
import SmartLink from '@/components/SmartLink'
import TagItemMini from './TagItemMini'

/**
 * 文章头部信息 - Anthropic 风格
 * 大标题 (KingHwa_OldSong) + 元数据 (mono/muted) + 标签
 */
const ArticleInfo = ({ post }) => {
  const { locale } = useGlobal()

  if (!post) return null

  // 估算阅读时间: 约300字/分钟(中文), 200词/分钟(英文)
  const wordCount = post?.wordCount || 0
  const readingTime = Math.max(1, Math.ceil(wordCount / 300))

  return (
    <div className='animate-in pb-8'>
      {/* 分类 */}
      {post?.category && (
        <SmartLink
          href={`/category/${post.category}`}
          className='tag-pill inline-block mb-6'>
          {post.category}
        </SmartLink>
      )}

      {/* 标题 */}
      <h1
        className='post-title'
        style={{ color: 'var(--anthropic-text-primary)' }}>
        {post.title}
      </h1>

      {/* 元数据行 */}
      <div
        className='mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 mono text-xs tracking-wide'
        style={{ color: 'var(--anthropic-text-tertiary)' }}>
        {/* 作者 */}
        {post?.author && (
          <span className='flex items-center gap-1.5'>
            <svg className='w-3.5 h-3.5' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={1.5}>
              <path strokeLinecap='round' strokeLinejoin='round' d='M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z' />
            </svg>
            {post.author}
          </span>
        )}

        {/* 日期 */}
        {post.date?.start_date && (
          <span className='flex items-center gap-1.5'>
            <svg className='w-3.5 h-3.5' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={1.5}>
              <path strokeLinecap='round' strokeLinejoin='round' d='M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5' />
            </svg>
            {post.date.start_date}
          </span>
        )}

        {/* 字数 */}
        {wordCount > 0 && (
          <span className='flex items-center gap-1.5'>
            <svg className='w-3.5 h-3.5' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={1.5}>
              <path strokeLinecap='round' strokeLinejoin='round' d='M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z' />
            </svg>
            {wordCount.toLocaleString()} {locale.COMMON.WORDS || 'words'}
          </span>
        )}

        {/* 阅读时间 */}
        {wordCount > 0 && (
          <span className='flex items-center gap-1.5'>
            <svg className='w-3.5 h-3.5' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={1.5}>
              <path strokeLinecap='round' strokeLinejoin='round' d='M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z' />
            </svg>
            {readingTime} min read
          </span>
        )}
      </div>

      {/* 标签 */}
      {post?.tagItems && post.tagItems.length > 0 && (
        <div className='mt-5 flex flex-wrap gap-2'>
          {post.tagItems.map(tag => (
            <TagItemMini key={tag.name} tag={tag} />
          ))}
        </div>
      )}

      {/* 分割线 */}
      <div className='divider mt-8' />
    </div>
  )
}

export default ArticleInfo
