// import '@/styles/animate.css' // @see https://animate.style/
import '@/styles/globals.css'
import '@/styles/utility-patterns.css'

// core styles shared by all of react-notion-x (required)
import 'react-notion-x/src/styles.css' // Base react-notion-x styles.
import '@/styles/notion.css' // Local Notion style overrides.

import useAdjustStyle from '@/hooks/useAdjustStyle'
import { getBaseLayoutByTheme } from '@/themes/theme'
import type { AppProps } from 'next/app'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useMemo } from 'react'
import type { PageProps } from '@/lib/page/runtime'
import { GlobalContextProvider } from '@/lib/global'
import ErrorHandler from '@/lib/utils/errorHandler'

// Extension plugins are intentionally loaded in the app shell.
import BLOG from '@/blog.config'
import ExternalPlugins from '@/components/ExternalPlugins'
import SEO from '@/components/SEO'
import { zhCN } from '@clerk/localizations'
import dynamic from 'next/dynamic'
// import { ClerkProvider } from '@clerk/nextjs'
const ClerkProvider = dynamic(() =>
  import('@clerk/nextjs').then(m => m.ClerkProvider)
)
const AppErrorBoundary = ErrorHandler.createErrorBoundary(
  <div style={{ padding: '2rem', textAlign: 'center', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
    <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Something went wrong</h1>
    <p style={{ color: '#666', marginBottom: '1.5rem' }}>An unexpected error occurred. Please refresh the page.</p>
    <button onClick={() => window.location.reload()} style={{ padding: '0.5rem 1.5rem', cursor: 'pointer', border: '1px solid #ccc', borderRadius: '4px', background: 'transparent' }}>Refresh</button>
  </div>
)

/**
 * App DOM entry point.
 */
const MyApp = ({ Component, pageProps }: AppProps<PageProps>) => {
  // Centralized style adjustments for browser-specific issues.
  useAdjustStyle()

  const route = useRouter()
  const queryTheme = new URLSearchParams(route.asPath.split('?')[1] || '').get(
    'theme'
  )
  const notionTheme = pageProps?.NOTION_CONFIG?.THEME
  const configTheme = BLOG.THEME
  const theme = useMemo(() => {
    return queryTheme || notionTheme || configTheme
  }, [queryTheme, notionTheme, configTheme])

  useEffect(() => {
    const source = queryTheme
      ? 'url:theme'
      : notionTheme
        ? 'notion:config'
        : 'blog/env:config'
    console.log(
      '[ThemeResolver][runtime-final]',
      JSON.stringify(
        {
          note: 'This is the final theme used for rendering.',
          configTheme,
          notionTheme: notionTheme || null,
          queryTheme: queryTheme || null,
          finalTheme: theme,
          source
        },
        null,
        2
      )
    )
  }, [configTheme, notionTheme, queryTheme, theme])

  const GLayout = useCallback(
    (props: PageProps) => {
      const Layout = getBaseLayoutByTheme(theme)
      return <Layout {...props} />
    },
    [theme]
  )

  const enableClerk = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  const content = (
    <AppErrorBoundary>
      <GlobalContextProvider {...pageProps}>
        <GLayout {...pageProps}>
          <SEO {...pageProps} />
          <Component {...pageProps} />
        </GLayout>
        <ExternalPlugins {...pageProps} />
      </GlobalContextProvider>
    </AppErrorBoundary>
  )
  return (
    <>
      {enableClerk ? (
        <ClerkProvider localization={zhCN as never}>{content}</ClerkProvider>
      ) : (
        content
      )}
    </>
  )
}

export default MyApp
