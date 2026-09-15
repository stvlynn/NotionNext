'use client'

import * as React from 'react'

/** Container react-notion-x renders the page's top-level blocks into. */
const BLOCK_CONTAINER = '.notion-page-content-inner'

/** Attribute the reveal styles in style.tsx key off. */
export const REVEAL_ATTRIBUTE = 'data-navyink-reveal'

/**
 * Reveals top-level Notion blocks as they scroll into view.
 *
 * Blocks already inside the viewport when the article mounts are left alone,
 * so the first screen never waits on an animation. Blocks below the fold are
 * marked `out` and flip to `in` once they intersect; the CSS transition does
 * the rest. The marks are only ever set from here, so without JavaScript (or
 * with reduced motion) every block renders in its resting state.
 */
export function useRevealOnScroll(
  ref: React.RefObject<HTMLElement | null>,
  key: string | undefined
): void {
  React.useEffect(() => {
    const root = ref.current
    if (!root) return undefined
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return undefined
    }
    const container = root.querySelector(BLOCK_CONTAINER)
    if (!container) return undefined

    const viewportBottom = window.innerHeight
    const pending = Array.from(container.children).filter(
      (block): block is HTMLElement =>
        block instanceof HTMLElement &&
        block.getBoundingClientRect().top >= viewportBottom
    )
    if (pending.length === 0) return undefined

    pending.forEach(block => block.setAttribute(REVEAL_ATTRIBUTE, 'out'))
    const observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          entry.target.setAttribute(REVEAL_ATTRIBUTE, 'in')
          observer.unobserve(entry.target)
        }
      },
      { rootMargin: '0px 0px -6% 0px' }
    )
    pending.forEach(block => observer.observe(block))

    return () => {
      observer.disconnect()
      pending.forEach(block => block.removeAttribute(REVEAL_ATTRIBUTE))
    }
  }, [ref, key])
}
