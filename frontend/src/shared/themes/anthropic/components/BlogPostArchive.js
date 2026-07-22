import SmartLink from '@/components/SmartLink'

/**
 * 博客归档列表 - Anthropic 风格
 * 年份分组标题使用 KingHwa_OldSong，左侧强调线 hover 效果
 */
const BlogPostArchive = ({ posts = [], archiveTitle }) => {
  if (!posts || posts.length === 0) {
    return <></>
  }

  return (
    <div className='animate-in'>
      {/* 年份标题 */}
      <div
        className='pt-12 pb-4'
        id={archiveTitle}>
        <h2
          className='post-title text-3xl'
          style={{ color: 'var(--anthropic-text-primary)' }}>
          {archiveTitle}
        </h2>
      </div>

      {/* 文章列表 */}
      <ul className='space-y-0'>
        {posts?.map(post => (
          <li
            key={post.id}
            className='group border-l-2 transition-all duration-300 hover:border-l-2'
            style={{
              borderColor: 'var(--anthropic-border)'
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--anthropic-accent)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--anthropic-border)' }}>
            <div
              id={post?.publishDay}
              className='flex items-baseline py-3 px-4 gap-4'>
              <span
                className='mono text-xs tracking-wide shrink-0'
                style={{ color: 'var(--anthropic-text-tertiary)' }}>
                {post.date?.start_date}
              </span>
              <SmartLink
                href={post?.href}
                passHref
                className='text-sm md:text-base transition-colors duration-200 truncate'
                style={{ color: 'var(--anthropic-text-secondary)' }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--anthropic-accent)' }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--anthropic-text-secondary)' }}>
                {post.title}
              </SmartLink>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default BlogPostArchive
