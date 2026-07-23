import BLOG from '@/blog.config'
import {
  THEMES,
  getThemeConfig,
  initDarkMode,
  saveDarkModeToLocalStorage
} from '@/themes/theme'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/router'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction
} from 'react'
import { generateLocaleDict, initLocale, redirectUserLang } from './utils/lang'

type RuntimeConfigValue = any
type RuntimeConfig = Record<string, RuntimeConfigValue>
type LocaleDictionary = Record<string, any>

interface GlobalProviderProps {
  post?: unknown
  children: ReactNode
  siteInfo?: unknown
  categoryOptions?: unknown
  tagOptions?: unknown
  NOTION_CONFIG?: RuntimeConfig | undefined
}

export interface GlobalContextValue {
  isLiteMode: boolean
  isLoaded: boolean
  isSignedIn: boolean
  user: any
  fullWidth: boolean
  NOTION_CONFIG?: RuntimeConfig | undefined
  THEME_CONFIG: RuntimeConfig | null
  runtimeConfigOverrides: RuntimeConfig
  updateRuntimeConfigOverride: (key: string, value: RuntimeConfigValue) => void
  toggleDarkMode: () => void
  onLoading: boolean
  setOnLoading: Dispatch<SetStateAction<boolean>>
  lang: string
  changeLang: (lang: string) => void
  locale: LocaleDictionary
  updateLocale: Dispatch<SetStateAction<LocaleDictionary>>
  isDarkMode: boolean
  updateDarkMode: Dispatch<SetStateAction<boolean>>
  theme: string
  setTheme: Dispatch<SetStateAction<string>>
  switchTheme: () => string | string[] | undefined
  siteInfo?: any | undefined
  categoryOptions?: any | undefined
  tagOptions?: any | undefined
}

/**
 * 全局上下文
 */
const GlobalContext = createContext<GlobalContextValue>({} as GlobalContextValue)
let globalSnapshot: GlobalContextValue | null = null

export const getGlobalSnapshot = () => globalSnapshot

export function GlobalContextProvider(props: GlobalProviderProps) {
  const {
    post,
    children,
    siteInfo,
    categoryOptions,
    tagOptions,
    NOTION_CONFIG
  } = props

  const defaultLang = String(NOTION_CONFIG?.LANG || BLOG.LANG)
  const defaultTheme = String(NOTION_CONFIG?.THEME || BLOG.THEME)
  const defaultAppearance = String(NOTION_CONFIG?.APPEARANCE || BLOG.APPEARANCE)
  const [lang, updateLang] = useState(defaultLang) // 默认语言
  const [locale, updateLocale] = useState<LocaleDictionary>(
    generateLocaleDict(defaultLang) as LocaleDictionary
  ) // 默认语言
  const [theme, setTheme] = useState(defaultTheme) // 默认博客主题
  const [THEME_CONFIG, SET_THEME_CONFIG] = useState<object | null>(null) // 主题配置
  const [runtimeConfigOverrides, setRuntimeConfigOverrides] =
    useState<RuntimeConfig>({})
  const [isLiteMode, setLiteMode] = useState(false)

  const defaultDarkMode = defaultAppearance
  const [isDarkMode, updateDarkMode] = useState(defaultDarkMode === 'dark') // 默认深色模式
  const [onLoading, setOnLoading] = useState(false) // 抓取文章数据
  const router = useRouter()

  // 登录验证相关
  const enableClerk = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  const { isLoaded, isSignedIn, user } = enableClerk
    ? /* eslint-disable-next-line react-hooks/rules-of-hooks */
      useUser()
    : { isLoaded: true, isSignedIn: false, user: false }

  // 是否全屏
  const fullWidth =
    typeof post === 'object' && post !== null && 'fullWidth' in post
      ? Boolean((post as { fullWidth?: unknown }).fullWidth)
      : false

  // 切换主题
  const switchTheme = useCallback(() => {
    const query = router.query
    const currentTheme = Array.isArray(query.theme) ? query.theme[0] : query.theme || theme
    const currentIndex = THEMES.indexOf(currentTheme)
    const newIndex = currentIndex < THEMES.length - 1 ? currentIndex + 1 : 0
    const newTheme = THEMES[newIndex] || theme
    query.theme = newTheme
    router.push({ pathname: router.pathname, query })
    return newTheme
  }, [router, theme, THEMES])

  // 抓取主题配置
  const updateThemeConfig = useCallback(async (theme: string | string[] | undefined) => {
    const themeId = Array.isArray(theme) ? theme[0] : theme
    if (!themeId) return
    const config = await getThemeConfig(themeId)
    SET_THEME_CONFIG(config)
  }, [])

  // 切换深色模式
  const toggleDarkMode = useCallback(() => {
    const newStatus = !isDarkMode
    saveDarkModeToLocalStorage(newStatus)
    updateDarkMode(newStatus)
    const htmlElement = document.getElementsByTagName('html')[0]
    htmlElement?.classList?.remove(newStatus ? 'light' : 'dark')
    htmlElement?.classList?.add(newStatus ? 'dark' : 'light')
  }, [isDarkMode])

  const changeLang = useCallback((lang: string) => {
    if (lang) {
      updateLang(lang)
      updateLocale(generateLocaleDict(lang) as LocaleDictionary)
    }
  }, [])

  const updateRuntimeConfigOverride = useCallback((key: string, value: RuntimeConfigValue) => {
    if (!key) return
    setRuntimeConfigOverrides(prev => ({ ...prev, [key]: value }))
  }, [])

  // 添加路由变化时的语言处理
  useEffect(() => {
    initLocale(router.locale, changeLang, updateLocale)
    // 处理极简模式
    setLiteMode(router.query.lite === 'true')
  }, [router.locale, router.query.lite])


  // 首次加载成功
  useEffect(() => {
    initDarkMode(updateDarkMode, defaultDarkMode)
    // 处理多语言自动重定向
    if (
      NOTION_CONFIG?.REDIRECT_LANG &&
      JSON.parse(String(NOTION_CONFIG?.REDIRECT_LANG))
    ) {
      redirectUserLang(undefined, BLOG.NOTION_PAGE_ID)
    }
    setOnLoading(false)
  }, [NOTION_CONFIG?.REDIRECT_LANG, defaultDarkMode])

  const currentTheme = useMemo(() => {
    return router?.query?.theme || theme
  }, [router?.query?.theme, theme])

  useEffect(() => {
    updateThemeConfig(currentTheme)
  }, [currentTheme])

  useEffect(() => {
    const handleStart = () => {
      setOnLoading(true)
    }
    const handleStop = () => {
      setOnLoading(false)
    }

    router.events.on('routeChangeStart', handleStart)
    router.events.on('routeChangeError', handleStop)
    router.events.on('routeChangeComplete', handleStop)
    return () => {
      router.events.off('routeChangeStart', handleStart)
      router.events.off('routeChangeComplete', handleStop)
      router.events.off('routeChangeError', handleStop)
    }
  }, [router.events])

  const contextValue = useMemo<GlobalContextValue>(() => ({
    isLiteMode,
    isLoaded,
    isSignedIn: Boolean(isSignedIn),
    user,
    fullWidth,
    NOTION_CONFIG,
    THEME_CONFIG,
    runtimeConfigOverrides,
    updateRuntimeConfigOverride,
    toggleDarkMode,
    onLoading,
    setOnLoading,
    lang,
    changeLang,
    locale,
    updateLocale,
    isDarkMode,
    updateDarkMode,
    theme,
    setTheme,
    switchTheme,
    siteInfo,
    categoryOptions,
    tagOptions
  }), [isLiteMode, isLoaded, isSignedIn, user, fullWidth, NOTION_CONFIG, THEME_CONFIG, runtimeConfigOverrides, updateRuntimeConfigOverride, toggleDarkMode, onLoading, setOnLoading, lang, changeLang, locale, updateLocale, isDarkMode, updateDarkMode, theme, setTheme, switchTheme, siteInfo, categoryOptions, tagOptions])
  globalSnapshot = contextValue

  return (
    <GlobalContext.Provider
      value={contextValue}>
      {children}
    </GlobalContext.Provider>
  )
}

export const useGlobal = (): GlobalContextValue => useContext(GlobalContext)
