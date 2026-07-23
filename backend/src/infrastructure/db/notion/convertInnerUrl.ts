import { idToUuid } from 'notion-utils'
import { checkStrIsNotionId, getLastPartOfUrl, isBrowser } from '@/lib/utils'

interface InnerLinkPage {
  short_id: string
  href?: string
  slug: string
}

interface ConvertInnerUrlParams {
  allPages?: InnerLinkPage[]
  lang?: string
}

export const convertInnerUrl = ({
  allPages,
  lang
}: ConvertInnerUrlParams): void => {
  if (!isBrowser) {
    return
  }
  const allAnchorTags = document
    ?.getElementById('notion-article')
    ?.querySelectorAll<HTMLAnchorElement>(
      'a.notion-link, a.notion-collection-card, a.notion-page-link'
    )

  if (!allAnchorTags) {
    return
  }
  const { origin, pathname } = window.location
  const currentURL = origin + pathname
  const currentPathLang = pathname.split('/').filter(Boolean)[0]
  const langPrefix = lang === currentPathLang ? '/' + lang : ''
  for (const anchorTag of Array.from(allAnchorTags)) {
    if (anchorTag?.href) {
      const slug = getLastPartOfUrl(anchorTag.href)
      if (checkStrIsNotionId(slug)) {
        const slugPage = allPages?.find(page => {
          return idToUuid(slug).indexOf(page.short_id) === 14
        })
        if (slugPage) {
          anchorTag.href = langPrefix + slugPage?.href
        }
      }
    }
    if (anchorTag?.target === '_blank') {
      const hrefWithoutQueryHash = anchorTag.href.split('?')[0]!.split('#')[0]
      const hrefWithRelativeHash =
        currentURL.split('#')[0] || '' + anchorTag.href.split('#')[1] || ''
      if (
        currentURL === hrefWithoutQueryHash ||
        currentURL === hrefWithRelativeHash
      ) {
        anchorTag.target = '_self'
      }
    }

    if (anchorTag.href.endsWith('#')) {
      anchorTag.target = '_blank'
    }
  }

  for (const anchorTag of Array.from(allAnchorTags)) {
    const slug = getLastPartOfUrl(anchorTag.href)
    const slugPage = allPages?.find(page => {
      return page.slug.indexOf(slug) >= 0
    })
    if (slugPage) {
    }
  }
}
