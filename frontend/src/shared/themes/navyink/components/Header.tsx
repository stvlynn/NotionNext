'use client'

import { conf } from '../lib/global'
import { useThemeGlobal } from '../lib/global'
import SmartLink from '@/components/SmartLink'
import { Menu, Search, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useRouter } from 'next/router'
import * as React from 'react'

import { Button } from '@/components/ui'
import { cn } from '@/lib/cn'
import CONFIG from '../config'
import { Logo } from './Logo'
import { ThemeToggle } from './ThemeToggle'

interface NavLink {
  href: string
  label: string
}

/**
 * Sticky top navigation. Transparent at the top of the page, it settles into a
 * translucent, blurred, bordered bar once the reader scrolls — a single
 * material change rather than an abrupt swap.
 */
export function Header() {
  const { locale } = useThemeGlobal()
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [scrolled, setScrolled] = React.useState(false)

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const links: NavLink[] = [
    conf('NAVYINK_MENU_INDEX', true, CONFIG) && {
      href: '/',
      label: locale.NAV.INDEX
    },
    conf('NAVYINK_MENU_CATEGORY', true, CONFIG) && {
      href: '/category',
      label: locale.COMMON.CATEGORY
    },
    conf('NAVYINK_MENU_TAG', true, CONFIG) && {
      href: '/tag',
      label: locale.COMMON.TAGS
    },
    conf('NAVYINK_MENU_ARCHIVE', true, CONFIG) && {
      href: '/archive',
      label: locale.NAV.ARCHIVE
    }
  ].filter(Boolean) as NavLink[]

  const showSearch = conf('NAVYINK_MENU_SEARCH', true, CONFIG)

  const isActive = (href: string) =>
    href === '/' ? router.asPath === '/' : router.asPath.startsWith(href)

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-40 h-16 transition-all duration-300',
        scrolled
          ? 'border-b border-border bg-background/80 backdrop-blur-md'
          : 'border-b border-transparent bg-transparent'
      )}>
      <div className='mx-auto flex h-full max-w-5xl items-center justify-between px-5'>
        <Logo />

        <nav className='hidden items-center gap-1 md:flex'>
          {links.map(link => (
            <SmartLink
              key={link.href}
              href={link.href}
              className={cn(
                'relative rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                isActive(link.href)
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}>
              {link.label}
              {isActive(link.href) && (
                <motion.span
                  layoutId='navyink-nav-active'
                  className='absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-brand'
                  transition={{ duration: 0.3, ease: [0.2, 0, 0, 1] }}
                />
              )}
            </SmartLink>
          ))}
        </nav>

        <div className='flex items-center gap-1'>
          {showSearch && (
            <Button
              variant='ghost'
              size='icon'
              aria-label={locale.NAV.SEARCH}
              onClick={() => void router.push('/search')}>
              <Search className='size-4' />
            </Button>
          )}
          <ThemeToggle />
          <Button
            variant='ghost'
            size='icon'
            className='md:hidden'
            aria-label='Menu'
            aria-expanded={open}
            onClick={() => setOpen(v => !v)}>
            {open ? <X className='size-5' /> : <Menu className='size-5' />}
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.2, 0, 0, 1] }}
            className='overflow-hidden border-b border-border bg-background/95 backdrop-blur-md md:hidden'>
            <div className='mx-auto flex max-w-5xl flex-col gap-1 px-5 py-3'>
              {links.map(link => (
                <SmartLink
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    isActive(link.href)
                      ? 'bg-accent text-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                  )}>
                  {link.label}
                </SmartLink>
              ))}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  )
}
