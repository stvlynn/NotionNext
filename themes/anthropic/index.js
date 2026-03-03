import Comment from '@/components/Comment'
import replaceSearchResult from '@/components/Mark'
import NotionPage from '@/components/NotionPage'
import ShareBar from '@/components/ShareBar'
import { siteConfig } from '@/lib/config'
import { useGlobal } from '@/lib/global'
import { isBrowser } from '@/lib/utils'
import { Transition } from '@headlessui/react'
import SmartLink from '@/components/SmartLink'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/router'
import { createContext, useContext, useEffect, useRef, useState } from 'react'
import ArticleAdjacent from './components/ArticleAdjacent'
import ArticleCopyright from './components/ArticleCopyright'
import { ArticleLock } from './components/ArticleLock'
import ArticleInfo from './components/ArticleInfo'
import ArticleRecommend from './components/ArticleRecommend'
import BlogPostArchive from './components/BlogPostArchive'
import BlogPostListPage from './components/BlogPostListPage'
import BlogPostListScroll from './components/BlogPostListScroll'
import Catalog from './components/Catalog'
import Footer from './components/Footer'
import Header from './components/Header'
import RightFloatArea from './components/RightFloatArea'
import SearchInput from './components/SearchInput'
import SearchNav from './components/SearchNav'
import SideRight from './components/SideRight'
import SlotBar from './components/SlotBar'
import TagItemMini from './components/TagItemMini'
import CONFIG from './config'
import { Style } from './style'
import { useThemeTransition, ThemeTransitionOverlay } from './components/ThemeTransition'

const AlgoliaSearchModal = dynamic(
  () => import('@/components/AlgoliaSearchModal'),
  { ssr: false }
)

// 主题全局状态
const ThemeGlobalAnthropic = createContext()
export const useAnthropicGlobal = () => useContext(ThemeGlobalAnthropic)

/**
 * 基础布局 - Anthropic 风格
 * 简洁单栏为主，桌面端可选右侧 TOC
 */
const LayoutBase = props => {
  const { post, children, slotTop, className } = props
  const { onLoading, fullWidth } = useGlobal()
  const router = useRouter()

  // Algolia搜索框
  const searchModal = useRef(null)

  // 全屏涟漪暗色模式过渡
  const { ripple, triggerTransition } = useThemeTransition()

  return (
    <ThemeGlobalAnthropic.Provider value={{ searchModal }}>
      <div
        id='theme-anthropic'
        className={`${siteConfig('FONT_STYLE')} scroll-smooth min-h-screen`}>
        <Style />

        {/* 全屏涟漪过渡遮罩 */}
        <ThemeTransitionOverlay ripple={ripple} />

        {/* 顶部导航 */}
        <Header {...props} triggerThemeTransition={triggerTransition} />

        {/* 主区块 */}
        <main
          id='wrapper'
          className='pt-20 min-h-screen'>
          <div
            id='container-inner'
            className={
              (JSON.parse(siteConfig('LAYOUT_SIDEBAR_REVERSE'))
                ? 'flex-row-reverse'
                : '') +
              ' w-full mx-auto lg:flex lg:space-x-8 justify-center relative z-10 site-margin max-w-7xl'
            }>
            <div
              className={`${className || ''} w-full ${fullWidth ? '' : 'max-w-4xl'} h-full overflow-hidden`}>
              <Transition
                show={!onLoading}
                appear={true}
                enter='anthropic-page-enter'
                enterFrom='anthropic-page-enter-from'
                enterTo='anthropic-page-enter-to'
                leave='anthropic-page-leave'
                leaveFrom='anthropic-page-leave-from'
                leaveTo='anthropic-page-leave-to'
                unmount={false}>
                {slotTop}
                {children}
              </Transition>
            </div>

            {/* 右侧栏 - 仅桌面端显示 */}
            {!fullWidth && <SideRight {...props} />}
          </div>
        </main>

        {/* 悬浮按钮 */}
        <RightFloatArea {...props} triggerThemeTransition={triggerTransition} />

        {/* 全文搜索 */}
        <AlgoliaSearchModal cRef={searchModal} {...props} />

        {/* 页脚 */}
        <Footer title={siteConfig('TITLE')} />
      </div>
    </ThemeGlobalAnthropic.Provider>
  )
}

/**
 * 首页 - 博客列表
 */
const LayoutIndex = props => {
  return <LayoutPostList {...props} />
}

/**
 * 博客列表
 */
const LayoutPostList = props => {
  return (
    <div className='pt-4'>
      <SlotBar {...props} />
      {siteConfig('POST_LIST_STYLE') === 'page' ? (
        <BlogPostListPage {...props} />
      ) : (
        <BlogPostListScroll {...props} />
      )}
    </div>
  )
}

/**
 * 搜索页
 */
const LayoutSearch = props => {
  const { keyword } = props
  const router = useRouter()
  const currentSearch = keyword || router?.query?.s

  useEffect(() => {
    if (currentSearch) {
      replaceSearchResult({
        doms: document.getElementsByClassName('replace'),
        search: keyword,
        target: {
          element: 'span',
          className: 'text-red-500 border-b border-dashed'
        }
      })
    }
  })

  return (
    <div className='pt-8'>
      {!currentSearch ? (
        <SearchNav {...props} />
      ) : (
        <div id='posts-wrapper'>
          {siteConfig('POST_LIST_STYLE') === 'page' ? (
            <BlogPostListPage {...props} />
          ) : (
            <BlogPostListScroll {...props} />
          )}
        </div>
      )}
    </div>
  )
}

/**
 * 归档页
 */
const LayoutArchive = props => {
  const { archivePosts } = props
  return (
    <div className='pt-8 pb-20 min-h-full'>
      {Object.keys(archivePosts).map(archiveTitle => (
        <BlogPostArchive
          key={archiveTitle}
          posts={archivePosts[archiveTitle]}
          archiveTitle={archiveTitle}
        />
      ))}
    </div>
  )
}

/**
 * 文章详情
 */
const LayoutSlug = props => {
  const { post, lock, validPassword } = props
  const router = useRouter()
  const waiting404 = siteConfig('POST_WAITING_TIME_FOR_404') * 1000

  useEffect(() => {
    if (!post) {
      setTimeout(
        () => {
          if (isBrowser) {
            const article = document.querySelector('#article-wrapper #notion-article')
            if (!article) {
              router.push('/404').then(() => {
                console.warn('找不到页面', router.asPath)
              })
            }
          }
        },
        waiting404
      )
    }
  }, [post])

  return (
    <>
      {lock && <ArticleLock validPassword={validPassword} />}

      {!lock && post && (
        <div className='animate-in'>
          {/* 文章头部信息 */}
          <ArticleInfo post={post} />

          {/* 文章正文 */}
          <article
            id='article-wrapper'
            itemScope
            itemType='https://schema.org/Movie'
            className='subpixel-antialiased overflow-y-hidden'>
            <section className='justify-center mx-auto max-w-3xl'>
              {post && <NotionPage post={post} />}
            </section>

            <ShareBar post={post} />

            {post?.type === 'Post' && (
              <>
                <ArticleCopyright {...props} />
                <ArticleRecommend {...props} />
                <ArticleAdjacent {...props} />
              </>
            )}
          </article>

          <div className='pt-6'>
            <div className='divider' />
          </div>

          {/* 评论区 */}
          <div className='duration-200 overflow-x-auto py-8'>
            <Comment frontMatter={post} />
          </div>
        </div>
      )}
    </>
  )
}

/**
 * 404 页面
 */
const Layout404 = props => {
  const router = useRouter()
  const { locale } = useGlobal()

  useEffect(() => {
    setTimeout(() => {
      if (isBrowser) {
        const article = document.querySelector('#article-wrapper #notion-article')
        if (!article) {
          router.push('/').then(() => {})
        }
      }
    }, 3000)
  })

  return (
    <div className='w-full h-screen flex flex-col items-center justify-center'>
      <h1 className='text-6xl post-title' style={{ color: 'var(--anthropic-accent)' }}>
        404
      </h1>
      <p className='mt-4 text-lg' style={{ color: 'var(--anthropic-text-secondary)' }}>
        {locale.COMMON.NOT_FOUND}
      </p>
      <SmartLink href='/' className='mt-8 btn-primary'>
        返回首页
      </SmartLink>
    </div>
  )
}

/**
 * 分类列表页
 */
const LayoutCategoryIndex = props => {
  const { categoryOptions } = props
  const { locale } = useGlobal()

  return (
    <div className='pt-8'>
      <h2 className='post-title text-2xl mb-8'>{locale.COMMON.CATEGORY}</h2>
      <div className='flex flex-wrap gap-3'>
        {categoryOptions?.map(category => (
          <SmartLink
            key={category.name}
            href={`/category/${category.name}`}
            passHref
            legacyBehavior>
            <div className='tag-pill cursor-pointer hover:scale-105 transition-transform'>
              {category.name} ({category.count})
            </div>
          </SmartLink>
        ))}
      </div>
    </div>
  )
}

/**
 * 标签列表页
 */
const LayoutTagIndex = props => {
  const { tagOptions } = props
  const { locale } = useGlobal()

  return (
    <div className='pt-8'>
      <h2 className='post-title text-2xl mb-8'>{locale.COMMON.TAGS}</h2>
      <div className='flex flex-wrap gap-2'>
        {tagOptions.map(tag => (
          <div key={tag.name} className='p-1'>
            <TagItemMini key={tag.name} tag={tag} />
          </div>
        ))}
      </div>
    </div>
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
