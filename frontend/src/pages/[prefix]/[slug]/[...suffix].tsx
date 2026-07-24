import Slug from '..'
import type { GetStaticPaths, GetStaticProps, NextPage } from 'next'
import { staticPropsResult } from '@/lib/page/runtime'
import { checkSlugHasMorThanTwoSlash } from '@/lib/utils/post'
import { getStaticPathsBase } from '@/lib/build/staticPaths'
import { resolvePostProps } from '@/lib/page/server-data'
import type { PageProps, SitePage } from '@/lib/page/runtime'

const isStaticExport = process.env.EXPORT === 'true'

/**
 * Resolve Notion slugs with three or more path segments.
 */
const PrefixSlug: NextPage<PageProps> = props => {
  return <Slug {...props} />
}


export const getStaticPaths: GetStaticPaths = async () => {
  return getStaticPathsBase<
    SitePage,
    { params: { prefix: string; slug: string; suffix: string[] } }
  >({
    from: 'slug-paths',
    filterFn: row => checkSlugHasMorThanTwoSlash(row),
    mapPageToParams: row => ({
      params: {
        prefix: row.slug.split('/')[0] || '',
        slug: row.slug.split('/')[1] || '',
        suffix: row.slug.split('/').slice(2)
      }
    })
  })
}

/**
 * Fetch data for a deep slug route.
 */
export const getStaticProps: GetStaticProps<PageProps> = async ({
  params,
  locale
}) => {
  const prefix = String(params?.prefix || '')
  const slug = String(params?.slug || '')
  const suffixParam = params?.suffix
  const suffix = Array.isArray(suffixParam)
    ? suffixParam.map(String)
    : suffixParam
      ? [String(suffixParam)]
      : []

  const props = await resolvePostProps({
    prefix,
    slug,
    suffix,
    locale,
  })

  if (!props.post) {
    return { notFound: true }
  }
  return staticPropsResult(props, props.NOTION_CONFIG, isStaticExport)
}

export default PrefixSlug
