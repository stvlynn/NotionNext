import fs from 'fs'

interface RedirectPage {
  id: string
  slug: string
  type?: string
  status?: string
}

export function generateRedirectJson({
  allPages = []
}: {
  allPages?: RedirectPage[]
}): void {
  const uuidSlugMap: Record<string, string> = {}
  allPages.forEach(page => {
    if (page.type === 'Post' && page.status === 'Published') {
      uuidSlugMap[page.id] = page.slug
    }
  })
  try {
    fs.writeFileSync('./public/redirect.json', JSON.stringify(uuidSlugMap))
  } catch (error) {
    console.warn('无法写入文件', error)
  }
}
