import { siteConfig } from '@/lib/config'
import { useGlobal } from '@/lib/global'
import CONFIG from '../config'
import Catalog from './Catalog'
import TagItemMini from './TagItemMini'
import SmartLink from '@/components/SmartLink'

/**
 * 右侧栏 - Anthropic 风格
 * 桌面端显示 (lg+)
 * 包含: TOC (Catalog), 最新文章, 标签
 * Sticky 定位
 */
export default function SideRight(props) {
  const {
    post,
    latestPosts,
    tags,
    currentTag,
    rightAreaSlot,
    className
  } = props

  const { locale } = useGlobal()

  // 文章全屏处理
  if (post && post?.fullWidth) {
    return null
  }

  return (
    <div
      id='sideRight'
      className={`hidden lg:block lg:w-72 shrink-0 ${className || ''}`}>
      <div className='sticky top-24 space-y-8'>
        {/* 目录 */}
        {post && post.toc && post.toc.length > 1 && (
          <div
            className='rounded-lg border overflow-hidden'
            style={{
              borderColor: 'var(--anthropic-border)',
              backgroundColor: 'var(--anthropic-card-bg)'
            }}>
            <Catalog toc={post.toc} />
          </div>
        )}

        {/* 最新文章 */}
        {siteConfig('ANTHROPIC_WIDGET_LATEST_POSTS', null, CONFIG) &&
          latestPosts &&
          latestPosts.length > 0 && (
            <div>
              <h4
                className='ui-text text-xs font-medium uppercase tracking-wider mb-3'
                style={{ color: 'var(--anthropic-text-tertiary)' }}>
                {locale.COMMON.LATEST_POSTS}
              </h4>
              <ul className='space-y-2.5'>
                {latestPosts.map(post => (
                  <li key={post.id}>
                    <SmartLink
                      href={post?.href}
                      passHref
                      className='group block'>
                      <span
                        className='text-sm leading-snug transition-colors duration-200 line-clamp-2 group-hover:text-[var(--anthropic-accent)]'
                        style={{ color: 'var(--anthropic-text-secondary)' }}>
                        {post.title}
                      </span>
                      {post.date?.start_date && (
                        <span
                          className='mono text-xs mt-0.5 block'
                          style={{ color: 'var(--anthropic-text-tertiary)' }}>
                          {post.date.start_date}
                        </span>
                      )}
                    </SmartLink>
                  </li>
                ))}
              </ul>
            </div>
          )}

        {/* 标签云 */}
        {tags && tags.length > 0 && (
          <div>
            <h4
              className='ui-text text-xs font-medium uppercase tracking-wider mb-3'
              style={{ color: 'var(--anthropic-text-tertiary)' }}>
              {locale.COMMON.TAGS}
            </h4>
            <div className='flex flex-wrap gap-1.5'>
              {tags.slice(0, 20).map(tag => (
                <TagItemMini
                  key={tag.name}
                  tag={tag}
                  selected={tag.name === currentTag}
                />
              ))}
            </div>
          </div>
        )}

        {/* 自定义插槽 */}
        {rightAreaSlot}
      </div>
    </div>
  )
}
