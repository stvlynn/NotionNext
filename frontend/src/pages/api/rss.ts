import BLOG from '@/blog.config'
import type { NextApiRequest, NextApiResponse } from 'next'
import { fetchGlobalAllData } from '@/lib/page/server-data'
import type { RssContent, SitePage } from '@/lib/page/runtime'
import { Feed } from 'feed'

interface RssCache {
  xml: string | null
  atomXml: string | null
  json: string | null
  updatedAt: number
}

/**
 * In-memory RSS cache to avoid regenerating on every request.
 * Survives across ISR revalidations within the same serverless instance.
 */
let rssCache: RssCache = {
  xml: null,
  atomXml: null,
  json: null,
  updatedAt: 0
}

const CACHE_TTL_MS = 10 * 60 * 1000 // 10 minutes

function isCacheFresh() {
  return rssCache.xml && Date.now() - rssCache.updatedAt < CACHE_TTL_MS
}

/**
 * Generate RSS feed content from site data.
 * Reuses the same data pipeline as the homepage getStaticProps.
 */
async function generateRssContent(): Promise<RssContent | null> {
  const locale = BLOG.LANG
  const pageId = BLOG.NOTION_PAGE_ID

  // Parse the first (default) page ID for data fetching
  const pageIds = pageId.split(',')
  const defaultPageId = pageIds[0]
  if (!defaultPageId) {
    return null
  }
  const targetId = defaultPageId.includes(':')
    ? defaultPageId.split(':')[1]
    : defaultPageId
  if (!targetId) {
    return null
  }

  const props = await fetchGlobalAllData({ from: 'rss-api', pageId: targetId, locale })
  if (!props || !props.allPages) {
    return null
  }

  const { siteInfo, allPages, NOTION_CONFIG } = props

  // Filter published posts only
  const latestPosts = allPages
    .filter((p: SitePage) => p.type === 'Post' && p.status === 'Published')
    .sort((a: SitePage, b: SitePage) => {
      const dateA = new Date(a.publishDay || a.publishDate || 0)
      const dateB = new Date(b.publishDay || b.publishDate || 0)
      return dateB.getTime() - dateA.getTime()
    })
    .slice(0, 20)

  if (latestPosts.length === 0) {
    return null
  }

  const TITLE = siteInfo?.title || BLOG.AUTHOR
  const DESCRIPTION = siteInfo?.description || BLOG.BIO
  const LINK = siteInfo?.link || BLOG.LINK
  const AUTHOR = NOTION_CONFIG?.AUTHOR || BLOG.AUTHOR
  const LANG = NOTION_CONFIG?.LANG || BLOG.LANG
  const year = new Date().getFullYear()

  const feed = new Feed({
    id: LINK,
    title: TITLE,
    description: DESCRIPTION,
    link: LINK,
    language: LANG,
    favicon: `${LINK}/favicon.png`,
    copyright: `All rights reserved ${year}, ${AUTHOR}`,
    author: {
      name: AUTHOR,
      link: LINK
    }
  })

  for (const post of latestPosts) {
    feed.addItem({
      title: post.title,
      link: `${LINK}/${post.slug}`,
      description: post.summary || '',
      date: new Date(post?.publishDay || post?.publishDate || Date.now())
    })
  }

  return {
    xml: feed.rss2(),
    atomXml: feed.atom1(),
    json: feed.json1()
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' })
  }

  try {
    if (!isCacheFresh()) {
      const content = await generateRssContent()
      if (content) {
        rssCache = {
          ...content,
          updatedAt: Date.now()
        }
      }
    }

    if (!rssCache.xml) {
      return res.status(503).json({ message: 'RSS feed not available' })
    }

    const format = Array.isArray(req.query.format)
      ? req.query.format[0]
      : req.query.format || 'rss'

    res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=3600')

    if (format === 'atom') {
      if (!rssCache.atomXml) {
        return res.status(503).json({ message: 'RSS feed not available' })
      }
      res.setHeader('Content-Type', 'application/atom+xml; charset=utf-8')
      return res.status(200).send(rssCache.atomXml)
    }

    if (format === 'json') {
      if (!rssCache.json) {
        return res.status(503).json({ message: 'RSS feed not available' })
      }
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      return res.status(200).send(rssCache.json)
    }

    // Default: RSS 2.0
    res.setHeader('Content-Type', 'application/rss+xml; charset=utf-8')
    return res.status(200).send(rssCache.xml)
  } catch (error) {
    console.error('[RSS API] Error generating feed:', error)
    return res.status(500).json({ message: 'Failed to generate RSS feed' })
  }
}
