'use client'

import * as React from 'react'

import { isScrolledToEnd, pickActiveHeadingIndex } from './reading'

/** Sticky header (4rem) plus the heading scroll margin, in pixels. */
const ACTIVE_THRESHOLD = 112

/**
 * Scroll-spy over a list of heading element ids. Returns the index of the
 * heading the reader is currently in (-1 before the first heading).
 *
 * Updates are coalesced to one per animation frame so scrolling stays cheap.
 */
export function useActiveHeading(ids: readonly string[]): number {
  const [activeIndex, setActiveIndex] = React.useState(-1)

  React.useEffect(() => {
    if (ids.length === 0) return undefined
    let frame = 0

    const update = () => {
      frame = 0
      const tops = ids.map(id => {
        const element = document.getElementById(id)
        return element
          ? element.getBoundingClientRect().top
          : Number.POSITIVE_INFINITY
      })
      const atEnd = isScrolledToEnd(
        window.scrollY,
        window.innerHeight,
        document.documentElement.scrollHeight
      )
      setActiveIndex(pickActiveHeadingIndex(tops, ACTIVE_THRESHOLD, atEnd))
    }

    const schedule = () => {
      if (frame === 0) frame = window.requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      if (frame !== 0) window.cancelAnimationFrame(frame)
    }
  }, [ids])

  return activeIndex
}
