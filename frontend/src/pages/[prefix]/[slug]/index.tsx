import Slug from '..'
import type { GetStaticPaths, GetStaticProps, NextPage } from 'next'
import { staticPropsResult } from '@/lib/page/runtime'
import { checkSlugHasOneSlash } from '@/lib/utils/post'
import { getStaticPathsBase } from '@/lib/build/staticPaths'
import { resolvePostProps } from '@/lib/page/server-data'
import type { PageProps, SitePage } from '@/lib/page/runtime'

const isStaticExport = process.env.EXPORT === 'true'

/**
 * Resolve a second-level Notion slug such as /article/about.
 */
const PrefixSlug: NextPage<PageProps> = props => {
  return <Slug {...props} />
}

export const getStaticPaths: GetStaticPaths = async () => {
  return getStaticPathsBase<SitePage, { params: { prefix: string; slug: string } }>({
    from: 'slug-paths',
    filterFn: row => checkSlugHasOneSlash(row),
    mapPageToParams: row => ({
      params: {
        prefix: row.slug.split('/')[0] || '',
        slug: row.slug.split('/')[1] || ''
      }
    })
  })
}

export const getStaticProps: GetStaticProps<PageProps> = async ({
  params,
  locale
}) => {
  const prefix = String(params?.prefix || '')
  const slug = String(params?.slug || '')
  const props = await resolvePostProps({
    prefix,
    slug,
    locale,
  })

  if (!props.post) {
    return { notFound: true }
  }
  return staticPropsResult(props, props.NOTION_CONFIG, isStaticExport)
}

export default PrefixSlug
