import SmartLink from '@/components/SmartLink'
import { siteConfig } from '@/lib/config'
import CONFIG from '../config'

/**
 * 上一篇/下一篇文章导航 - Anthropic 风格
 * 两栏布局，微妙卡片样式，hover 效果
 */
export default function ArticleAdjacent({ prev, next }) {
  if (!prev && !next) {
    return <></>
  }
  if (!siteConfig('ANTHROPIC_ARTICLE_ADJACENT', null, CONFIG)) {
    return <></>
  }

  return (
    <section className='pt-8'>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        {/* 上一篇 */}
        {prev ? (
          <SmartLink
            href={`/${prev.slug}`}
            passHref
            className='group block p-5 rounded-lg border transition-all duration-300 hover:border-[var(--anthropic-accent)]'
            style={{
              borderColor: 'var(--anthropic-border)',
              backgroundColor: 'var(--anthropic-card-bg)'
            }}>
            <div
              className='text-xs mono tracking-wide mb-2'
              style={{ color: 'var(--anthropic-text-tertiary)' }}>
              <span className='flex items-center gap-1'>
                <svg className='w-3 h-3' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
                  <path strokeLinecap='round' strokeLinejoin='round' d='M15.75 19.5L8.25 12l7.5-7.5' />
                </svg>
                Previous
              </span>
            </div>
            <div
              className='text-sm font-normal leading-snug transition-colors duration-200 line-clamp-2'
              style={{ color: 'var(--anthropic-text-primary)' }}>
              {prev.title}
            </div>
          </SmartLink>
        ) : (
          <div />
        )}

        {/* 下一篇 */}
        {next ? (
          <SmartLink
            href={`/${next.slug}`}
            passHref
            className='group block p-5 rounded-lg border transition-all duration-300 text-right hover:border-[var(--anthropic-accent)]'
            style={{
              borderColor: 'var(--anthropic-border)',
              backgroundColor: 'var(--anthropic-card-bg)'
            }}>
            <div
              className='text-xs mono tracking-wide mb-2'
              style={{ color: 'var(--anthropic-text-tertiary)' }}>
              <span className='flex items-center justify-end gap-1'>
                Next
                <svg className='w-3 h-3' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
                  <path strokeLinecap='round' strokeLinejoin='round' d='M8.25 4.5l7.5 7.5-7.5 7.5' />
                </svg>
              </span>
            </div>
            <div
              className='text-sm font-normal leading-snug transition-colors duration-200 line-clamp-2'
              style={{ color: 'var(--anthropic-text-primary)' }}>
              {next.title}
            </div>
          </SmartLink>
        ) : (
          <div />
        )}
      </div>
    </section>
  )
}
