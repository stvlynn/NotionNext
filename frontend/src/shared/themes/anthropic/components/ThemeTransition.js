import { useCallback, useRef, useState } from 'react'
import { useGlobal } from '@/lib/global'

/**
 * 全屏涟漪过渡动画 - 切换暗色/亮色模式时
 * 从点击位置展开圆形遮罩，覆盖全屏后切换主题
 */
export function useThemeTransition() {
  const { isDarkMode, changeDarkMode } = useGlobal()
  const [ripple, setRipple] = useState(null)
  const timeoutRef = useRef(null)

  const triggerTransition = useCallback((e) => {
    // Respect prefers-reduced-motion
    if (typeof window !== 'undefined') {
      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      if (prefersReduced) {
        changeDarkMode()
        return
      }
    }

    // Prevent double-trigger while animation is in progress
    if (ripple) return

    // Get click position from the button
    const rect = e.currentTarget.getBoundingClientRect()
    const x = rect.left + rect.width / 2
    const y = rect.top + rect.height / 2

    // Calculate the maximum distance from click point to any corner of the viewport
    const w = window.innerWidth
    const h = window.innerHeight
    const maxX = Math.max(x, w - x)
    const maxY = Math.max(y, h - y)
    const maxRadius = Math.ceil(Math.sqrt(maxX * maxX + maxY * maxY))

    // Read the raw (never-overridden) background values from CSS custom properties
    // --anthropic-raw-bg-light and --anthropic-raw-bg-dark are defined in :root
    // and never overridden by the .dark class, so they always hold the true values
    const computedStyles = getComputedStyle(document.documentElement)
    const rawLightBg = computedStyles.getPropertyValue('--anthropic-raw-bg-light').trim() || '#FAF9F0'
    const rawDarkBg = computedStyles.getPropertyValue('--anthropic-raw-bg-dark').trim() || '#141413'

    // When switching: the ripple color is the DESTINATION theme's background
    const targetColor = isDarkMode ? rawLightBg : rawDarkBg

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // The ripple circle is 2px x 2px, so scale = maxRadius to cover the diagonal
    const rippleScale = maxRadius

    setRipple({ x, y, rippleScale, targetColor })

    // After the expand animation completes (~650ms), toggle theme and remove overlay
    timeoutRef.current = setTimeout(() => {
      changeDarkMode()
      // Brief delay to let new theme paint, then remove the overlay
      timeoutRef.current = setTimeout(() => {
        setRipple(null)
      }, 100)
    }, 650)
  }, [isDarkMode, changeDarkMode, ripple])

  return { ripple, triggerTransition }
}

/**
 * 涟漪遮罩层组件 - 放置在布局根级
 * Uses a 2px circle that scales up from the click origin to cover the viewport
 */
export function ThemeTransitionOverlay({ ripple }) {
  if (!ripple) return null

  const { x, y, rippleScale, targetColor } = ripple

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        pointerEvents: 'none',
        overflow: 'hidden'
      }}>
      <div
        style={{
          position: 'absolute',
          left: `${x - 1}px`,
          top: `${y - 1}px`,
          width: '2px',
          height: '2px',
          borderRadius: '50%',
          backgroundColor: targetColor,
          '--ripple-scale': rippleScale,
          animation: 'themeRippleExpand 650ms cubic-bezier(0.16, 1, 0.3, 1) forwards'
        }}
      />
    </div>
  )
}
