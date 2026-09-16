import { ThemeToggle } from '@/themes/navyink/components/ThemeToggle'
import { useGlobal } from '@/lib/global'
import { fireEvent, render, screen } from '@testing-library/react'

jest.mock('@/lib/global', () => ({
  useGlobal: jest.fn()
}))

jest.mock('@/lib/config', () => ({
  siteConfig: (key, defaultValue) => defaultValue
}))

const LOCALE = { NAV: { DARK_MODE: 'Toggle theme' } }

describe('navyink ThemeToggle', () => {
  it('calls the toggle exposed by the global context when clicked', () => {
    const toggleDarkMode = jest.fn()
    useGlobal.mockReturnValue({ isDarkMode: false, toggleDarkMode, locale: LOCALE })

    render(<ThemeToggle />)
    fireEvent.click(screen.getByRole('button', { name: LOCALE.NAV.DARK_MODE }))

    expect(toggleDarkMode).toHaveBeenCalledTimes(1)
  })

  it('only reads dark-mode members that the global context actually provides', () => {
    const context = { isDarkMode: true, toggleDarkMode: jest.fn(), locale: LOCALE }
    const read = new Set()
    useGlobal.mockReturnValue(
      new Proxy(context, {
        get(target, key) {
          read.add(key)
          return target[key]
        }
      })
    )

    render(<ThemeToggle />)

    for (const key of read) {
      if (typeof key !== 'string') continue
      expect(Object.keys(context)).toContain(key)
    }
  })
})
