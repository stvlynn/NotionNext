import { getDataFromCache, setDataToCache } from '@/lib/cache/cache_manager'
import { siteConfig } from '@/lib/config'

interface SummaryPost {
  id: string
  title: string
  toc?: Array<{ text?: string }>
  aiSummary?: string | null
}

/**
 * get Ai summary
 * @returns {Promise<string>}
 * @param aiSummaryAPI
 * @param aiSummaryKey
 * @param truncatedText
 */
export async function getAiSummary(
  aiSummaryAPI: string,
  aiSummaryKey: string,
  truncatedText: string
): Promise<string | null> {
  try {
    console.log('请求文章摘要', truncatedText.slice(0, 100))
    const response = await fetch(aiSummaryAPI, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        token: aiSummaryKey,
        content: truncatedText
      })
    })

    if (response.ok) {
      const data = (await response.json()) as { summary?: string }
      return data.summary || null
    } else {
      throw new Error('Response not ok')
    }
  } catch (error) {
    console.error('ChucklePostAI：请求失败', error)
    return null
  }
}


/**
 * 获取文章摘要
 * @param props
 * @param pageContentText
 * @returns {Promise<void>}
 */
export async function getPageAISummary(
  post: SummaryPost,
  pageContentText: string
): Promise<void> {
  const aiSummaryAPI = siteConfig<string>('AI_SUMMARY_API')
  if (aiSummaryAPI) {
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
      const combinedText = post.title + ' ' + content
      const truncatedText = combinedText.slice(0, wordLimit)
      aiSummary = await getAiSummary(aiSummaryAPI, aiSummaryKey, truncatedText)
      await setDataToCache(cacheKey, aiSummary, aiSummaryCacheTime)
      post.aiSummary = aiSummary
    }
  }
}
