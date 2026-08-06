'use client'

import { conf } from '../lib/global'
import { useLocale } from '../lib/global'
import SmartLink from '@/components/SmartLink'
import { Menu, Search, X } from 'lucide-react'
import { motion } from 'motion/react'
import { useRouter } from 'next/router'
import * as React from 'react'

import {
  Button,
  Sheet,
  SheetPopup,
  SheetTitle,
  SheetTrigger
} from '@/components/ui'
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
 * solid, bordered bar once the reader scrolls. On mobile the nav lives in a
 * Sheet drawer; on desktop the active link carries a shared-layout underline.
 */
export function Header() {
  const locale = useLocale()
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
        'fixed inset-x-0 top-0 z-40 h-16 border-b transition-colors duration-200',
        scrolled
          ? 'border-border bg-background'
          : 'border-transparent bg-transparent'
      )}
    >
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
              )}
            >
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
              onClick={() => void router.push('/search')}
            >
              <Search className='size-4' />
            </Button>
          )}
          <ThemeToggle />
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              render={
                <Button
                  variant='ghost'
                  size='icon'
                  className='md:hidden'
                  aria-label={locale.NAV.MENU}
                />
              }
            >
              {open ? <X className='size-5' /> : <Menu className='size-5' />}
            </SheetTrigger>
            <SheetPopup className='theme-navyink md:hidden'>
              <SheetTitle className='sr-only'>{locale.NAV.MENU}</SheetTitle>
              <nav className='flex flex-col gap-1 p-4'>
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
                    )}
                  >
                    {link.label}
                  </SmartLink>
                ))}
              </nav>
            </SheetPopup>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
