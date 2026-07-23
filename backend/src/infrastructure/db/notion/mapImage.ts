import BLOG from '@/blog.config'
import { siteConfig } from '@/lib/config'

interface NotionImageBlock {
  id: string
  type?: string
  format?: {
    block_width?: unknown
    [key: string]: unknown
  }
}

const mapImgUrl = (
  img: string | null | undefined,
  block: NotionImageBlock,
  type = 'block',
  needCompress = true
): string | null => {
  if (!img) {
    return null
  }

  let ret: string | null = null
  if (img.startsWith('/')) {
    ret = BLOG.NOTION_HOST + img
  } else {
    ret = img
  }

  const hasConverted =
    ret.indexOf('https://www.notion.so/image') === 0 ||
    ret.includes('notion.site/images/page-cover/')

  const needConvert =
    (!hasConverted &&
      (block.type === 'bookmark' ||
        ret.includes('secure.notion-static.com') ||
        ret.includes('prod-files-secure'))) ||
    ret.indexOf('attachment') === 0

  if (needConvert) {
    ret =
      BLOG.NOTION_HOST +
      '/image/' +
      encodeURIComponent(ret) +
      '?table=' +
      type +
      '&id=' +
      block.id
  }

  if (!isEmoji(ret) && ret.indexOf('notion.so/images/page-cover') < 0) {
    if (BLOG.RANDOM_IMAGE_URL) {
      const texts = BLOG.RANDOM_IMAGE_REPLACE_TEXT
      let isReplace = false
      if (texts) {
        const textArr = texts.split(',')
        textArr.forEach((text: string) => {
          if (ret!.indexOf(text) > -1) {
            isReplace = true
          }
        })
      } else {
        isReplace = true
      }
      if (isReplace) {
        ret = BLOG.RANDOM_IMAGE_URL
      }
    }

    if (
      ret &&
      ret.length > 4 &&
      !ret.includes('https://www.notion.so/images/')
    ) {
      const separator = ret.includes('?') ? '&' : '?'
      ret = `${ret.trim()}${separator}t=${block.id}`
    }
  }

  if (needCompress) {
    const width = block?.format?.block_width
    ret = compressImage(ret, width) ?? null
  }

  return ret
}

function isEmoji(str: string): boolean {
  const emojiRegex = new RegExp(
    '[\\u{1F300}-\\u{1F6FF}\\u{1F1E0}-\\u{1F1FF}\\u{2600}-\\u{26FF}\\u{2700}-\\u{27BF}\\u{1F900}-\\u{1F9FF}\\u{1F018}-\\u{1F270}\\u{238C}\\u{2B06}\\u{2B07}\\u{2B05}\\u{27A1}\\u{2194}-\\u{2199}\\u{2194}\\u{21A9}\\u{21AA}\\u{2934}\\u{2935}\\u{25AA}\\u{25AB}\\u{25FE}\\u{25FD}\\u{25FB}\\u{25FC}\\u{25B6}\\u{25C0}\\u{1F200}-\\u{1F251}]',
    'u'
  )
  return emojiRegex.test(str)
}

const compressImage = (
  image: string | null | undefined,
  width?: unknown,
  quality: number | string = 50,
  fmt = 'webp'
): string | null | undefined => {
  if (!image || image.indexOf('http') !== 0) {
    return image
  }

  if (image.includes('.svg')) return image

  if (!width || width === 0) {
    width = siteConfig('IMAGE_COMPRESS_WIDTH')
  }

  let urlObj: URL
  let params: URLSearchParams
  try {
    urlObj = new URL(image)
    params = new URLSearchParams(urlObj.search)
  } catch (err) {
    try {
      const decoded = decodeURIComponent(image)
      urlObj = new URL(decoded)
      params = new URLSearchParams(urlObj.search)
    } catch {
      console.error('compressImage: Invalid URL:', image, err)
      return image
    }
  }

  if (
    image.indexOf(BLOG.NOTION_HOST) === 0 &&
    image.indexOf('amazonaws.com') > 0
  ) {
    params.set('width', String(width))
    params.set('cache', 'v2')
    urlObj.search = params.toString()
    return urlObj.toString()
  } else if (image.indexOf('https://images.unsplash.com/') === 0) {
    params.set('q', String(quality))
    params.set('width', String(width))
    params.set('fmt', fmt)
    params.set('fm', fmt)
    urlObj.search = params.toString()
    return urlObj.toString()
  } else if (image.indexOf('https://your_picture_bed') === 0) {
    return 'do_somethin_here'
  }

  return image
}

export { compressImage, mapImgUrl }
