/**
 * 文章相关工具
 * 此处只能放客户端支持的代码
 */
import BLOG from '@/blog.config'
import { isHttpLink } from '.'
import { siteConfig } from '@/lib/config'
import { uploadDataToAlgolia } from '../plugins/algolia'
import { getPageContentText } from '@/lib/db/notion/getPageContentText'
import { getPageTableOfContents } from '@/lib/db/notion/getPageTableOfContents'
import { countWords } from '../plugins/wordCount'
import { getAiSummary } from '../plugins/aiSummary'
import { getDataFromCache, setDataToCache } from '@/lib/cache/cache_manager'

interface PostLike {
  id: string
  type: string
  slug: string
  status?: string
  tags?: string[]
  title?: string
  toc?: Array<{ text?: string }>
  blockMap?: { block?: Record<string, { value?: { parent_id?: string } }> }
  content?: string[]
  wordCount?: number
  readTime?: number
  aiSummary?: string | null
}

interface ProcessPostProps {
  [key: string]: unknown
  post?: PostLike
  allPages?: PostLike[]
  prev?: PostLike | null
  next?: PostLike | null
  recommendPosts?: PostLike[]
}

/**
 * 获取文章的关联推荐文章列表，目前根据标签关联性筛选
 * @param post
 * @param {*} allPosts
 * @param {*} count
 * @returns
 */
export function getRecommendPost(
  post: PostLike,
  allPosts: PostLike[],
  count = 6
): PostLike[] {
  let recommendPosts: PostLike[] = []
  const postIds: string[] = []
  const currentTags = post?.tags || []
  for (let i = 0; i < allPosts.length; i++) {
    const p = allPosts[i]
    if (!p) continue
    if (p.id === post.id || p.type.indexOf('Post') < 0) {
      continue
    }

    for (let j = 0; j < currentTags.length; j++) {
      const t = currentTags[j]
      if (!t) continue
      if (postIds.indexOf(p.id) > -1) {
        continue
      }
      if (p.tags && p.tags.indexOf(t) > -1) {
        recommendPosts.push(p)
        postIds.push(p.id)
      }
    }
  }

  if (recommendPosts.length > count) {
    recommendPosts = recommendPosts.slice(0, count)
  }
  return recommendPosts
}

/**
 * 确认slug中不包含 / 符号
 * @param {*} row
 * @returns
 */
export function checkSlugHasNoSlash(row: { slug: string; type: string }): boolean {
  let slug = row.slug
  if (slug.startsWith('/')) {
    slug = slug.substring(1)
  }
  return (
    (slug.match(/\//g) || []).length === 0 &&
    !isHttpLink(slug) &&
    row.type.indexOf('Menu') < 0
  )
}

/**
 * 检查url中包含一个  /
 * @param {*} row
 * @returns
 */
export function checkSlugHasOneSlash(row: { slug: string; type: string }): boolean {
  let slug = row.slug
  if (slug.startsWith('/')) {
    slug = slug.substring(1)
  }
  return (
    (slug.match(/\//g) || []).length === 1 &&
    !isHttpLink(slug) &&
    row.type.indexOf('Menu') < 0
  )
}

/**
 * 检查url中包含两个及以上的  /
 * @param {*} row
 * @returns
 */
export function checkSlugHasMorThanTwoSlash(row: { slug: string; type: string }): boolean {
  let slug = row.slug
  if (slug.startsWith('/')) {
    slug = slug.substring(1)
  }
  return (
    (slug.match(/\//g) || []).length >= 2 &&
    row.type.indexOf('Menu') < 0 &&
    !isHttpLink(slug)
  )
}


/**
 * 获取文章摘要
 * @param props
 * @param pageContentText
 * @returns {Promise<void>}
 */
async function getPageAISummary(
  props: ProcessPostProps,
  pageContentText: string
): Promise<void> {
  const aiSummaryAPI = siteConfig('AI_SUMMARY_API')
  const post = props.post
  if (aiSummaryAPI && post) {
    const cacheKey = `ai_summary_${post.id}`
    let aiSummary = await getDataFromCache<string | null>(cacheKey)
    if (aiSummary) {
      post.aiSummary = aiSummary
    } else {
      const aiSummaryKey = siteConfig<string>('AI_SUMMARY_KEY')
      const aiSummaryCacheTime = Number(siteConfig('AI_SUMMARY_CACHE_TIME'))
      const wordLimit = Number(siteConfig('AI_SUMMARY_WORD_LIMIT', '1000'))
      let content = ''
      for (const heading of post.toc || []) {
        content += (heading.text || '') + ' '
      }
      content += pageContentText
      const combinedText = (post.title || '') + ' ' + content
      const truncatedText = combinedText.slice(0, wordLimit)
      aiSummary = await getAiSummary(aiSummaryAPI, aiSummaryKey, truncatedText)
      await setDataToCache(cacheKey, aiSummary, aiSummaryCacheTime)
      post.aiSummary = aiSummary
    }
  }
}

/**
 * 处理文章数据
 * @param props
 * @param from
 * @returns {Promise<void>}
 */
export async function processPostData(
  props: ProcessPostProps,
  from?: string
): Promise<void> {
  void from
  const post = props.post

  if (!post) {
    props.prev = null
    props.next = null
    props.recommendPosts = []
    delete props.allPages
    return
  }

  const blockMap = post.blockMap
  if (blockMap?.block) {
    // 目录默认加载
    post.content = Object.keys(blockMap.block).filter(
      key => blockMap.block?.[key]?.value?.parent_id === post.id
    )
    post.toc = getPageTableOfContents(post as never, blockMap as never)
    const pageContentText = getPageContentText(post as never, blockMap as never)
    const { wordCount, readTime } = countWords(pageContentText)
    post.wordCount = wordCount
    post.readTime = readTime
    await getPageAISummary(props, pageContentText)
  }

  // 生成全文索引 && JSON.parse(BLOG.ALGOLIA_RECREATE_DATA)
  if (BLOG.ALGOLIA_APP_ID) {
    uploadDataToAlgolia(post)
  }

  // 推荐关联文章处理
  const allPosts = props.allPages?.filter(
    page => page.type === 'Post' && page.status === 'Published'
  )
  if (allPosts && allPosts.length > 0) {
    const index = allPosts.indexOf(post)
    props.prev = allPosts.slice(index - 1, index)[0] ?? allPosts.slice(-1)[0] ?? null
    props.next = allPosts.slice(index + 1, index + 2)[0] ?? allPosts[0] ?? null
    props.recommendPosts = getRecommendPost(
      post,
      allPosts,
      Number(siteConfig('POST_RECOMMEND_COUNT'))
    )
  } else {
    props.prev = null
    props.next = null
    props.recommendPosts = []
  }

  delete props.allPages
}
