import LazyImage from '@/components/LazyImage'
import { siteConfig } from '@/lib/config'
import SmartLink from '@/components/SmartLink'
import CONFIG from '../config'
import TagItemMini from './TagItemMini'

/**
 * 文章卡片 - Anthropic 风格
 * 封面图 + 标题 + 日期 + 摘要 + 标签
 * 整体可点击，hover 上浮效果
 */
const BlogPostCard = ({ index, post, showSummary, siteInfo }) => {
  const showCover = siteConfig('ANTHROPIC_POST_LIST_COVER', true, CONFIG)
  const showSummaryConfig = siteConfig('ANTHROPIC_POST_LIST_SUMMARY', true, CONFIG)
  const palette = siteConfig('ANTHROPIC_PALETTE', null, CONFIG) || CONFIG.ANTHROPIC_PALETTE

  if (!post) return null

  const hasCover = showCover && post?.pageCoverThumbnail
  // 当没有封面图时，使用调色板颜色作为背景
  const placeholderColor = palette[index % palette.length]

  return (
    <div className='post-card group'>
      <SmartLink
        href={post?.href}
        className='block rounded-xl overflow-hidden transition-all duration-300'
        style={{ backgroundColor: 'var(--anthropic-card-bg)' }}>
        {/* 封面图区域 */}
        {showCover && (
          <div
            className='card-cover relative overflow-hidden'
            style={{ aspectRatio: '16 / 10' }}>
            {hasCover ? (
              <LazyImage
                priority={index < 3}
                alt={post?.title}
                src={post?.pageCoverThumbnail}
                className='w-full h-full object-cover'
              />
            ) : (
              <div
                className='w-full h-full flex items-center justify-center'
                style={{ backgroundColor: placeholderColor }}>
                <span
                  className='post-title text-white text-xl md:text-2xl text-center px-6 leading-snug select-none'
                  style={{ textShadow: '0 1px 3px rgba(0,0,0,0.2)' }}>
                  {post.title}
                </span>
              </div>
            )}
          </div>
        )}

        {/* 文字内容区域 */}
        <div className='p-5 space-y-3'>
          {/* 日期 */}
          <div
            className='mono text-xs tracking-wide'
            style={{ color: 'var(--anthropic-text-tertiary)' }}>
            {post.date?.start_date}
            {post?.category && (
              <>
                <span className='mx-2'>/</span>
                <span>{post.category}</span>
              </>
            )}
          </div>

          {/* 标题 */}
          <h2
            className='post-title text-lg md:text-xl leading-snug transition-colors duration-200'
            style={{ color: 'var(--anthropic-text-primary)' }}>
            {post.title}
          </h2>

          {/* 摘要 */}
          {showSummaryConfig && post.summary && (
            <p
              className='text-sm leading-relaxed line-clamp-3'
              style={{ color: 'var(--anthropic-text-secondary)' }}>
              {post.summary}
            </p>
          )}

          {/* 标签 */}
          {post?.tagItems && post.tagItems.length > 0 && (
            <div className='flex flex-wrap gap-1.5 pt-1'>
              {post.tagItems.slice(0, 3).map(tag => (
                <TagItemMini key={tag.name} tag={tag} />
              ))}
            </div>
          )}
        </div>
      </SmartLink>
    </div>
  )
}

export default BlogPostCard
