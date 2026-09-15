/**
 * Pure helpers behind the article reading aids (section rail, scroll-spy).
 * Kept free of DOM access so they can be unit-tested directly.
 */

export type HeadingState = 'read' | 'active' | 'unread'

/**
 * Index of the heading the reader is currently in.
 *
 * `tops` are heading offsets relative to the viewport top, in document order.
 * The active heading is the last one that has scrolled past `threshold`
 * (the sticky header height plus a little breathing room). Before the first
 * heading is reached the result is -1. When the page is scrolled to its end
 * the last heading wins, so a short final section can still be reached.
 */
export function pickActiveHeadingIndex(
  tops: readonly number[],
  threshold: number,
  atEnd = false
): number {
  if (tops.length === 0) return -1
  if (atEnd) return tops.length - 1
  let active = -1
  for (let i = 0; i < tops.length; i++) {
    const top = tops[i]
    if (top !== undefined && top <= threshold) active = i
  }
  return active
}

/** Read / active / unread state of a heading relative to the active one. */
export function headingState(index: number, activeIndex: number): HeadingState {
  if (index === activeIndex) return 'active'
  return index < activeIndex ? 'read' : 'unread'
}

/**
 * Whether the window has reached the end of the document. A 2px tolerance
 * absorbs fractional scroll positions on high-DPI displays.
 */
export function isScrolledToEnd(
  scrollY: number,
  viewportHeight: number,
  documentHeight: number
): boolean {
  return scrollY + viewportHeight >= documentHeight - 2
}
