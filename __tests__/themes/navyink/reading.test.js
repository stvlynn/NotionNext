import {
  headingState,
  isScrolledToEnd,
  pickActiveHeadingIndex
} from '@/themes/navyink/lib/reading'

describe('navyink pickActiveHeadingIndex', () => {
  it('returns -1 before the first heading is reached', () => {
    expect(pickActiveHeadingIndex([400, 900, 1400], 112)).toBe(-1)
  })

  it('picks the last heading that has scrolled past the threshold', () => {
    expect(pickActiveHeadingIndex([-600, -100, 500], 112)).toBe(1)
    expect(pickActiveHeadingIndex([-600, 100, 500], 112)).toBe(1)
  })

  it('treats a heading exactly at the threshold as reached', () => {
    expect(pickActiveHeadingIndex([-600, 112, 500], 112)).toBe(1)
  })

  it('activates the last heading once the page is scrolled to its end', () => {
    expect(pickActiveHeadingIndex([-600, -100, 300], 112, true)).toBe(2)
  })

  it('ignores headings that are not in the document', () => {
    expect(
      pickActiveHeadingIndex([-600, Number.POSITIVE_INFINITY, -50], 112)
    ).toBe(2)
  })

  it('returns -1 for an empty outline', () => {
    expect(pickActiveHeadingIndex([], 112)).toBe(-1)
    expect(pickActiveHeadingIndex([], 112, true)).toBe(-1)
  })
})

describe('navyink headingState', () => {
  it('marks headings before the active one as read', () => {
    expect(headingState(0, 2)).toBe('read')
    expect(headingState(1, 2)).toBe('read')
  })

  it('marks the active heading', () => {
    expect(headingState(2, 2)).toBe('active')
  })

  it('marks headings after the active one as unread', () => {
    expect(headingState(3, 2)).toBe('unread')
  })

  it('marks every heading unread before the first is reached', () => {
    expect(headingState(0, -1)).toBe('unread')
  })
})

describe('navyink isScrolledToEnd', () => {
  it('is true when the viewport bottom reaches the document end', () => {
    expect(isScrolledToEnd(1200, 800, 2000)).toBe(true)
  })

  it('tolerates fractional scroll positions', () => {
    expect(isScrolledToEnd(1198.5, 800, 2000)).toBe(true)
  })

  it('is false while there is more to scroll', () => {
    expect(isScrolledToEnd(1000, 800, 2000)).toBe(false)
  })
})
