import { Footer } from '@/themes/navyink/components/Footer'
import { Header } from '@/themes/navyink/components/Header'
import { useGlobal } from '@/lib/global'
import { render, screen } from '@testing-library/react'

jest.mock('@/lib/global', () => ({
  useGlobal: jest.fn()
}))

jest.mock('@/lib/config', () => ({
  siteConfig: (key, defaultValue) =>
    ({
      TITLE: 'Steven Lynn',
      AUTHOR: 'Steven Lynn',
      LINK: 'https://blog.stv.pm'
    })[key] ?? defaultValue
}))

jest.mock('next/router', () => ({
  useRouter: () => ({ asPath: '/', push: jest.fn() })
}))

const LOCALE = {
  NAV: {
    INDEX: 'Home',
    ABOUT: 'About',
    ARCHIVE: 'Archive',
    SEARCH: 'Search',
    MENU: 'Menu'
  },
  COMMON: { CATEGORY: 'Category', TAGS: 'Tags' }
}

beforeEach(() => {
  useGlobal.mockReturnValue({
    isDarkMode: false,
    toggleDarkMode: jest.fn(),
    locale: LOCALE
  })
})

describe('navyink links to the homepage at stv.pm', () => {
  it('shows an About link in the header that leaves the blog', () => {
    render(<Header />)
    const about = screen.getByRole('link', { name: 'About' })
    expect(about.getAttribute('href')).toBe('https://stv.pm')
  })

  it('never marks the external About link as the active page', () => {
    render(<Header />)
    expect(screen.getByRole('link', { name: 'About' }).className).toContain(
      'text-muted-foreground'
    )
  })

  it("links the author's name in the footer", () => {
    render(<Footer />)
    const hrefs = screen
      .getAllByRole('link', { name: 'Steven Lynn' })
      .map(link => link.getAttribute('href'))
    // One link is the blog wordmark (home of the blog), the other the author.
    expect(hrefs).toEqual(expect.arrayContaining(['https://stv.pm', '/']))
  })
})
