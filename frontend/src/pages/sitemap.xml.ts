// pages/sitemap.xml.js
import BLOG from '@/blog.config'
import { siteConfig } from '@/lib/page/runtime'
import {
  buildSitemapLoc,
  normalizeSitemapBaseUrl,
  normalizeSitemapLocale,
  toSitemapDateString
} from '@/lib/sitemap-utils'
import { extractLangId, extractLangPrefix } from '@/lib/utils/pageId'
import { fetchGlobalAllData } from '@/lib/page/server-data'
import type { GetServerSideProps } from 'next'
import type { SitePage } from '@/lib/page/runtime'
import { getServerSideSitemap } from 'next-sitemap'

type SitemapField = Parameters<typeof getServerSideSitemap>[1][number]

export const getServerSideProps: GetServerSideProps = async ctx => {
  let fields: SitemapField[] = []
  const siteIds = BLOG.NOTION_PAGE_ID.split(',')

  for (let index = 0; index < siteIds.length; index++) {
    const siteId = siteIds[index]
    if (!siteId) {
      continue
    }
    const id = extractLangId(siteId)
    const locale = extractLangPrefix(siteId)
    // The first site id represents the default language.
    const siteData = await fetchGlobalAllData({
      pageId: id,
      from: 'sitemap.xml'
    })
    const link = siteConfig(
      'LINK',
      siteData?.siteInfo?.link,
      siteData.NOTION_CONFIG
    )
    const localeFields = generateLocalesSitemap(link, siteData.allPages || [], locale)
    fields = fields.concat(localeFields)
  }

  fields = getUniqueFields(fields)

  // Cache the generated sitemap response.
  ctx.res.setHeader(
    'Cache-Control',
    'public, max-age=3600, stale-while-revalidate=59'
  )
  return getServerSideSitemap(ctx, fields)
}

function generateLocalesSitemap(
  link: string | undefined,
  allPages: SitePage[],
  locale: string
) {
  const normalizedLink = normalizeSitemapBaseUrl(link)
  const normalizedLocale = normalizeSitemapLocale(locale)
  const dateNow = toSitemapDateString(new Date())
  const daily = 'daily' as const

  const defaultFields = [
    {
      loc: buildSitemapLoc({ baseUrl: normalizedLink, locale: normalizedLocale }),
      lastmod: dateNow,
      changefreq: daily,
      priority: 0.7
    },
    {
      loc: buildSitemapLoc({
        baseUrl: normalizedLink,
        locale: normalizedLocale,
        slug: 'archive'
      }),
      lastmod: dateNow,
      changefreq: daily,
      priority: 0.7
    },
    {
      loc: buildSitemapLoc({
        baseUrl: normalizedLink,
        locale: normalizedLocale,
        slug: 'category'
      }),
      lastmod: dateNow,
      changefreq: daily,
      priority: 0.7
    },
    {
      loc: buildSitemapLoc({
        baseUrl: normalizedLink,
        locale: normalizedLocale,
        slug: 'rss/feed.xml'
      }),
      lastmod: dateNow,
      changefreq: daily,
      priority: 0.7
    },
    {
      loc: buildSitemapLoc({
        baseUrl: normalizedLink,
        locale: normalizedLocale,
        slug: 'search'
      }),
      lastmod: dateNow,
      changefreq: daily,
      priority: 0.7
    },
    {
      loc: buildSitemapLoc({
        baseUrl: normalizedLink,
        locale: normalizedLocale,
        slug: 'tag'
      }),
      lastmod: dateNow,
      changefreq: daily,
      priority: 0.7
    }
  ].filter(field => Boolean(field?.loc)) as SitemapField[]

  const postFields =
    allPages
      ?.filter((p: SitePage) => p.status === BLOG.NOTION_PROPERTY_NAME.status_publish)
      // Exclude external links and hash-only anchors.
      ?.filter((p: SitePage) => p.slug && !p.slug.startsWith('http') && !p.slug.startsWith('#'))
      ?.map((post: SitePage): SitemapField | null => {
        const loc = buildSitemapLoc({
          baseUrl: normalizedLink,
          locale: normalizedLocale,
          slug: post?.slug
        })
        if (!loc) return null

        return {
          loc,
          lastmod: toSitemapDateString(post?.publishDay, dateNow),
          changefreq: daily,
          priority: 0.7
        }
      })
      ?.filter((field: SitemapField | null): field is SitemapField =>
        Boolean(field)
      ) ?? []

  return defaultFields.concat(postFields)
}

function getUniqueFields(fields: SitemapField[]) {
  const uniqueFieldsMap = new Map<string, SitemapField>()

  fields.forEach((field: SitemapField) => {
    const existingField = uniqueFieldsMap.get(field.loc)

    if (
      !existingField ||
      (Date.parse(field.lastmod || '') || 0) >
        (Date.parse(existingField.lastmod || '') || 0)
    ) {
      uniqueFieldsMap.set(field.loc, field)
    }
  })

  return Array.from(uniqueFieldsMap.values())
}

export default function Sitemap() {
  return null
}
