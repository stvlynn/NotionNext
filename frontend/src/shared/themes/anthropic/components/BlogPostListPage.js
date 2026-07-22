import { siteConfig } from '@/lib/config'
import { useGlobal } from '@/lib/global'
import BlogPostCard from './BlogPostCard'
import PaginationNumber from './PaginationNumber'

/**
 * 文章列表分页 - Anthropic 风格
 * 响应式网格: 移动端1列, 平板2列, 桌面3列
 */
const BlogPostListPage = ({ page = 1, posts = [], postCount, siteInfo }) => {
  const { NOTION_CONFIG } = useGlobal()
  const POSTS_PER_PAGE = siteConfig('POSTS_PER_PAGE', null, NOTION_CONFIG)
  const totalPage = Math.ceil(postCount / POSTS_PER_PAGE)
  const showPagination = postCount >= POSTS_PER_PAGE

  if (!posts || posts.length === 0 || page > totalPage) {
    return (
      <div className='flex items-center justify-center py-20'>
        <p
          className='text-base ui-text'
          style={{ color: 'var(--anthropic-text-tertiary)' }}>
          No posts found.
        </p>
      </div>
    )
  }

  return (
    <div id='container' className='w-full'>
      {/* 文章网格 */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {posts?.map((post, index) => (
          <BlogPostCard
            index={index}
            key={post.id}
            post={post}
            siteInfo={siteInfo}
          />
        ))}
      </div>

      {/* 分页 */}
      {showPagination && (
        <PaginationNumber page={page} totalPage={totalPage} />
      )}
    </div>
  )
}

export default BlogPostListPage
