import Comment from '@/components/Comment'
import replaceSearchResult from '@/components/Mark'
import NotionPage from '@/components/NotionPage'
import ShareBar from '@/components/ShareBar'
import SmartLink from '@/components/SmartLink'
import { conf } from './lib/global'
import { useThemeGlobal } from './lib/global'
import { isBrowser } from '@/lib/utils'
import { motion } from 'motion/react'
import { useRouter } from 'next/router'
import * as React from 'react'

import { Button } from '@/components/ui'
import { cn } from '@/lib/cn'
import CONFIG from './config'
import { Style } from './style'
import { ArchiveGroup } from './components/Archive'
import { ArticleInfo } from './components/ArticleInfo'
import { ArticleLock } from './components/ArticleLock'
import { Footer } from './components/Footer'
import { Header } from './components/Header'
import { FadeIn } from './components/Motion'
import { PostListPage, PostListScroll } from './components/PostList'
import { SearchNav } from './components/SearchNav'
import { SideRight } from './components/SideRight'
import { SlotBar } from './components/SlotBar'
import { TagPill } from './components/TagPill'
import type { ThemeLayoutProps } from './types'

/**
 * Navy Ink — a coss UI theme recoloured to the navy-ink design system.
 * See shared/styles/navy-ink.css for the token layer.
 */
const LayoutBase = (props: ThemeLayoutProps) => {
  const { children, slotTop, post, className } = props
  const { fullWidth } = useThemeGlobal()
  const router = useRouter()

  return (
    <div
      id='theme-navyink'
      className='theme-navyink min-h-screen scroll-smooth bg-background text-foreground antialiased'>
      <Style />
      <Header />

      <main className='min-h-[70vh] pt-16'>
        <div className='mx-auto flex max-w-5xl justify-center gap-10 px-5 py-10'>
          <motion.div
            key={router.asPath}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.2, 0, 0, 1] }}
            className={cn('w-full min-w-0', fullWidth ? '' : 'max-w-3xl', className)}>
            {slotTop}
            {children}
          </motion.div>
          {!fullWidth && <SideRight post={post} />}
        </div>
      </main>

      <Footer />
    </div>
  )
}

const LayoutPostList = (props: ThemeLayoutProps) => {
  const listStyle = conf('POST_LIST_STYLE')
  return (
    <div>
      <SlotBar {...props} />
      {listStyle === 'page' ? (
        <PostListPage
          page={props.page ?? 1}
          posts={props.posts ?? []}
          postCount={props.postCount ?? 0}
        />
      ) : (
        <PostListScroll
          posts={props.posts ?? []}
          currentSearch={props.currentSearch}
        />
      )}
    </div>
  )
}

const LayoutIndex = (props: ThemeLayoutProps) => <LayoutPostList {...props} />

const LayoutSearch = (props: ThemeLayoutProps) => {
  const { keyword } = props
  const router = useRouter()
  const currentSearch = keyword || (router?.query?.s as string | undefined)

  React.useEffect(() => {
    if (currentSearch) {
      void replaceSearchResult({
        doms: document.getElementsByClassName('replace'),
        search: currentSearch,
        target: {
          element: 'span',
          className: 'text-brand border-b border-dashed border-brand'
        }
      })
    }
  }, [currentSearch])

  if (!currentSearch) {
    return (
      <SearchNav
        tagOptions={props.tagOptions ?? []}
        categoryOptions={props.categoryOptions ?? []}
      />
    )
  }
  return (
    <div id='posts-wrapper'>
      <LayoutPostList {...props} currentSearch={currentSearch} />
    </div>
  )
}

const LayoutArchive = (props: ThemeLayoutProps) => {
  const { archivePosts = {} } = props
  return (
    <div className='pb-10'>
      {Object.keys(archivePosts).map(title => (
        <ArchiveGroup
          key={title}
          archiveTitle={title}
          posts={archivePosts[title] ?? []}
        />
      ))}
    </div>
  )
}

const LayoutSlug = (props: ThemeLayoutProps) => {
  const { post, lock, validPassword } = props
  const router = useRouter()
  const waiting404 = conf<number>('POST_WAITING_TIME_FOR_404', 8) * 1000

  React.useEffect(() => {
    if (!post) {
      const timer = setTimeout(() => {
        if (isBrowser) {
          const article = document.querySelector(
            '#article-wrapper #notion-article'
          )
          if (!article) void router.push('/404')
        }
      }, waiting404)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [post, router, waiting404])

  if (lock && validPassword) {
    return <ArticleLock validPassword={validPassword} />
  }

  if (!post) return null

  return (
    <article id='article-wrapper'>
      <ArticleInfo post={post} />
      <section className='navyink-article mx-auto max-w-3xl'>
        <NotionPage post={post} />
      </section>

      <div className='mx-auto max-w-3xl'>
        <ShareBar post={post} />
        <div className='mt-10 duration-200'>
          <Comment frontMatter={post} />
        </div>
      </div>
    </article>
  )
}

const Layout404 = () => {
  const { locale } = useThemeGlobal()
  return (
    <div className='flex min-h-[60vh] flex-col items-center justify-center text-center'>
      <p className='font-mono text-7xl font-bold text-brand'>404</p>
      <p className='mt-4 text-lg text-muted-foreground'>
        {locale.COMMON.NOT_FOUND}
      </p>
      <SmartLink href='/' className='mt-8'>
        <Button variant='brand'>{locale.NAV.INDEX}</Button>
      </SmartLink>
    </div>
  )
}

const LayoutCategoryIndex = (props: ThemeLayoutProps) => {
  const { categoryOptions = [] } = props
  const { locale } = useThemeGlobal()
  return (
    <FadeIn>
      <h1 className='mb-8 text-2xl font-bold tracking-tight text-foreground'>
        {locale.COMMON.CATEGORY}
      </h1>
      <div className='flex flex-wrap gap-2'>
        {categoryOptions.map(category => (
          <SmartLink
            key={category.name}
            href={`/category/${category.name}`}
            className='inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3.5 py-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:border-brand hover:text-brand'>
            {category.name}
            <span className='text-muted-foreground'>{category.count}</span>
          </SmartLink>
        ))}
      </div>
    </FadeIn>
  )
}

const LayoutTagIndex = (props: ThemeLayoutProps) => {
  const { tagOptions = [] } = props
  const { locale } = useThemeGlobal()
  return (
    <FadeIn>
      <h1 className='mb-8 text-2xl font-bold tracking-tight text-foreground'>
        {locale.COMMON.TAGS}
      </h1>
      <div className='flex flex-wrap gap-2'>
        {tagOptions.map(tag => (
          <TagPill key={tag.name} tag={tag} showCount />
        ))}
      </div>
    </FadeIn>
  )
}

export {
  Layout404,
  LayoutArchive,
  LayoutBase,
  LayoutCategoryIndex,
  LayoutIndex,
  LayoutPostList,
  LayoutSearch,
  LayoutSlug,
  LayoutTagIndex,
  CONFIG as THEME_CONFIG
}
