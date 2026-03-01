import { siteConfig } from '@/lib/config'
import { useGlobal } from '@/lib/global'
import SmartLink from '@/components/SmartLink'
import { useCallback, useEffect, useState } from 'react'
import throttle from 'lodash.throttle'
import CONFIG from '../config'
import Logo from './Logo'

/**
 * 顶部导航栏 - Anthropic 风格
 * 固定在顶部，毛玻璃背景，极简设计
 */
const Header = props => {
  const { tags, currentTag, categories, currentCategory } = props
  const { locale, isDarkMode, changeDarkMode } = useGlobal()
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  const showIndex = siteConfig('ANTHROPIC_MENU_INDEX', true, CONFIG)
  const showCategory = siteConfig('ANTHROPIC_MENU_CATEGORY', true, CONFIG)
  const showTag = siteConfig('ANTHROPIC_MENU_TAG', true, CONFIG)
  const showArchive = siteConfig('ANTHROPIC_MENU_ARCHIVE', true, CONFIG)
  const showSearch = siteConfig('ANTHROPIC_MENU_SEARCH', true, CONFIG)

  const toggleMenu = () => {
    setIsOpen(!isOpen)
  }

  const closeMenu = () => {
    setIsOpen(false)
  }

  // 监听滚动来切换导航栏样式
  useEffect(() => {
    const handler = throttle(() => {
      setScrolled(window.scrollY > 10)
    }, 100)
    window.addEventListener('scroll', handler)
    handler()
    return () => window.removeEventListener('scroll', handler)
  }, [])

  const navLinks = [
    showIndex && { href: '/', label: locale.NAV.INDEX },
    showCategory && { href: '/category', label: locale.COMMON.CATEGORY },
    showTag && { href: '/tag', label: locale.COMMON.TAGS },
    showArchive && { href: '/archive', label: locale.NAV.ARCHIVE },
    showSearch && { href: '/search', label: locale.NAV.SEARCH }
  ].filter(Boolean)

  return (
    <div id='top-nav' className='z-40'>
      {/* 导航栏 */}
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300
          ${scrolled
            ? 'backdrop-blur-md bg-[var(--anthropic-bg-light)]/90 border-b border-[var(--anthropic-border)] shadow-sm'
            : 'bg-transparent'
          }`}
        style={{ height: '68px' }}>
        <div className='h-full site-margin max-w-7xl mx-auto flex items-center justify-between'>
          {/* 左侧: Logo */}
          <Logo {...props} />

          {/* 右侧: 导航链接 (桌面端) */}
          <nav className='hidden lg:flex items-center space-x-8 ui-text'>
            {navLinks.map(link => (
              <SmartLink
                key={link.href}
                href={link.href}
                className='nav-link text-sm tracking-wide'
                style={{ color: 'var(--anthropic-text-secondary)' }}>
                {link.label}
              </SmartLink>
            ))}

            {/* 暗色模式切换 */}
            <button
              onClick={changeDarkMode}
              aria-label='Toggle dark mode'
              className='p-2 rounded-lg transition-colors duration-200 hover:bg-[var(--anthropic-border)]'
              style={{ color: 'var(--anthropic-text-secondary)' }}>
              {isDarkMode
                ? <svg className='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={1.5}>
                    <path strokeLinecap='round' strokeLinejoin='round' d='M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z' />
                  </svg>
                : <svg className='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={1.5}>
                    <path strokeLinecap='round' strokeLinejoin='round' d='M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z' />
                  </svg>
              }
            </button>
          </nav>

          {/* 移动端菜单按钮 */}
          <button
            onClick={toggleMenu}
            className='lg:hidden p-2 rounded-lg transition-colors duration-200 hover:bg-[var(--anthropic-border)]'
            style={{ color: 'var(--anthropic-text-primary)' }}
            aria-label='Toggle menu'>
            {isOpen
              ? <svg className='w-5 h-5' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={1.5}>
                  <path strokeLinecap='round' strokeLinejoin='round' d='M6 18L18 6M6 6l12 12' />
                </svg>
              : <svg className='w-5 h-5' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={1.5}>
                  <path strokeLinecap='round' strokeLinejoin='round' d='M3.75 9h16.5m-16.5 6.75h16.5' />
                </svg>
            }
          </button>
        </div>
      </header>

      {/* 移动端菜单面板 */}
      {isOpen && (
        <div
          className='fixed inset-0 z-30 lg:hidden'
          onClick={closeMenu}>
          <div className='absolute inset-0 bg-black/20 backdrop-blur-sm' />
          <div
            className='absolute top-[68px] left-0 right-0 bg-[var(--anthropic-bg-light)] border-b border-[var(--anthropic-border)] shadow-lg animate-in'
            onClick={e => e.stopPropagation()}>
            <nav className='flex flex-col py-4 site-margin'>
              {navLinks.map(link => (
                <SmartLink
                  key={link.href}
                  href={link.href}
                  onClick={closeMenu}
                  className='py-3 text-base ui-text border-b border-[var(--anthropic-border)]/50 transition-colors duration-200'
                  style={{ color: 'var(--anthropic-text-primary)' }}>
                  {link.label}
                </SmartLink>
              ))}
              {/* 移动端暗色模式切换 */}
              <button
                onClick={() => { changeDarkMode(); closeMenu() }}
                className='py-3 text-left text-base ui-text transition-colors duration-200 flex items-center space-x-2'
                style={{ color: 'var(--anthropic-text-secondary)' }}>
                {isDarkMode
                  ? <><svg className='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={1.5}><path strokeLinecap='round' strokeLinejoin='round' d='M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z' /></svg><span>{locale.COMMON.LIGHT_MODE || 'Light Mode'}</span></>
                  : <><svg className='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={1.5}><path strokeLinecap='round' strokeLinejoin='round' d='M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z' /></svg><span>{locale.COMMON.DARK_MODE || 'Dark Mode'}</span></>
                }
              </button>
            </nav>
          </div>
        </div>
      )}
    </div>
  )
}

export default Header
