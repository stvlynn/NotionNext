import LazyImage from '@/components/LazyImage'
import { siteConfig } from '@/lib/config'
import { useGlobal } from '@/lib/global'
import SmartLink from '@/components/SmartLink'
import CONFIG from '../config'

/**
 * 相关文章推荐 - Anthropic 风格
 * 2-3 列小卡片网格
 */
export default function ArticleRecommend({ recommendPosts, siteInfo }) {
  const { locale } = useGlobal()
  const palette = siteConfig('ANTHROPIC_PALETTE', null, CONFIG) || CONFIG.ANTHROPIC_PALETTE

  if (
    !siteConfig('ANTHROPIC_ARTICLE_RECOMMEND', null, CONFIG) ||
    !recommendPosts ||
    recommendPosts.length === 0
  ) {
    return <></>
  }

  return (
    <div className='pt-8'>
      <h3
        className='post-title text-xl mb-5'
        style={{ color: 'var(--anthropic-text-primary)' }}>
        {locale.COMMON.RELATE_POSTS}
      </h3>

      <div className='grid grid-cols-2 md:grid-cols-3 gap-4'>
        {recommendPosts.map((post, index) => {
          const hasCover = post?.pageCoverThumbnail
          const placeholderColor = palette[index % palette.length]

          return (
            <SmartLink
              key={post.id}
              title={post.title}
              href={post?.href}
              passHref
              className='group block rounded-lg overflow-hidden transition-all duration-300 hover:shadow-md'
              style={{ backgroundColor: 'var(--anthropic-card-bg)' }}>
              {/* 封面 */}
              <div
                className='relative overflow-hidden'
                style={{ aspectRatio: '16 / 10' }}>
                {hasCover ? (
                  <LazyImage
                    src={post.pageCoverThumbnail}
                    alt={post.title}
                    className='w-full h-full object-cover transition-transform duration-300 group-hover:scale-105'
                  />
                ) : (
                  <div
                    className='w-full h-full flex items-center justify-center'
                    style={{ backgroundColor: placeholderColor }}>
                    <span className='text-white text-xs post-title text-center px-3 select-none opacity-90'>
                      {post.title}
                    </span>
                  </div>
                )}
              </div>

              {/* 标题 */}
              <div className='p-3'>
                <h4
                  className='text-sm leading-snug line-clamp-2 transition-colors duration-200'
                  style={{ color: 'var(--anthropic-text-primary)' }}>
                  {post.title}
                </h4>
                {post.date?.start_date && (
                  <p
                    className='mt-1.5 mono text-xs'
                    style={{ color: 'var(--anthropic-text-tertiary)' }}>
                    {post.date.start_date}
                  </p>
                )}
              </div>
            </SmartLink>
          )
        })}
      </div>
    </div>
  )
}
