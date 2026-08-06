'use client'

import { useLocale, useThemeGlobal } from '../lib/global'
import { Moon, Sun } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import * as React from 'react'

import { Button, Tooltip, TooltipPopup, TooltipTrigger } from '@/components/ui'

/**
 * Dark-mode switch. The icon cross-fades and rotates so the toggle reads as a
 * single continuous control rather than two swapped glyphs. The popup is
 * portaled, so it carries the `theme-navyink` class to pick up scoped tokens.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { isDarkMode, changeDarkMode } = useThemeGlobal()
  const locale = useLocale()

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant='ghost'
            size='icon'
            aria-label={locale.NAV.DARK_MODE}
            className={className}
            onClick={() => changeDarkMode()}
          />
        }
      >
        <AnimatePresence mode='wait' initial={false}>
          <motion.span
            key={isDarkMode ? 'moon' : 'sun'}
            initial={{ opacity: 0, rotate: -90, scale: 0.6 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: 90, scale: 0.6 }}
            transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
            className='flex items-center justify-center'
          >
            {isDarkMode ? (
              <Moon className='size-4' />
            ) : (
              <Sun className='size-4' />
            )}
          </motion.span>
        </AnimatePresence>
      </TooltipTrigger>
      <TooltipPopup className='theme-navyink'>
        {locale.NAV.DARK_MODE}
      </TooltipPopup>
    </Tooltip>
  )
}
