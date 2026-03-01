import { useCallback, useEffect, useState } from 'react'
import { useGlobal } from '@/lib/global'

/**
 * 右下角悬浮按钮 - Anthropic 风格
 * 回到顶部 + 暗色模式切换 (移动端) + TOC 切换 (移动端)
 */
export default function RightFloatArea({ floatSlot }) {
  const [showFloatButton, switchShow] = useState(false)
  const { isDarkMode, changeDarkMode } = useGlobal()

  const scrollListener = useCallback(() => {
    const targetRef =
      document.getElementById('wrapper') || document.documentElement
    const clientHeight = targetRef?.clientHeight || 0
    const scrollY =
      window.pageYOffset || document.documentElement.scrollTop || 0
    const viewportHeight =
      window.innerHeight || document.documentElement.clientHeight || 0

    const fullHeight = Math.max(1, clientHeight - viewportHeight)
    let per = parseFloat(((scrollY / fullHeight) * 100).toFixed(0))
    if (isNaN(per) || per < 0) per = 0
    if (per > 100) per = 100

    const shouldShow = scrollY > 100 && per > 0
    if (shouldShow !== showFloatButton) {
      switchShow(shouldShow)
    }
  }, [showFloatButton])

  useEffect(() => {
    const throttledScroll = () => {
      window.requestAnimationFrame(() => {
        scrollListener()
      })
    }
    window.addEventListener('scroll', throttledScroll)
    scrollListener()
    return () => window.removeEventListener('scroll', throttledScroll)
  }, [scrollListener])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div
      className={`fixed bottom-6 right-6 z-30 flex flex-col items-center gap-2 transition-all duration-300 ${
        showFloatButton ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
      }`}>
      {/* 自定义插槽 */}
      {floatSlot}

      {/* 暗色模式切换 - 移动端 */}
      <button
        onClick={changeDarkMode}
        aria-label='Toggle dark mode'
        className='lg:hidden w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 shadow-md border'
        style={{
          backgroundColor: 'var(--anthropic-card-bg)',
          borderColor: 'var(--anthropic-border)',
          color: 'var(--anthropic-text-secondary)'
        }}>
        {isDarkMode
          ? <svg className='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={1.5}>
              <path strokeLinecap='round' strokeLinejoin='round' d='M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z' />
            </svg>
          : <svg className='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={1.5}>
              <path strokeLinecap='round' strokeLinejoin='round' d='M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z' />
            </svg>
        }
      </button>

      {/* 回到顶部按钮 */}
      <button
        onClick={scrollToTop}
        aria-label='Scroll to top'
        className='w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 shadow-md hover:shadow-lg'
        style={{
          backgroundColor: 'var(--anthropic-accent)',
          color: 'white'
        }}>
        <svg className='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
          <path strokeLinecap='round' strokeLinejoin='round' d='M4.5 15.75l7.5-7.5 7.5 7.5' />
        </svg>
      </button>
    </div>
  )
}
