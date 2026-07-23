'use client'

import { useThemeGlobal } from '../lib/global'
import { Lock } from 'lucide-react'
import * as React from 'react'

import { Button } from '@/components/ui'

interface ArticleLockProps {
  validPassword: (password: string) => boolean
}

/** Password gate for locked posts. Shakes the field on an incorrect password. */
export function ArticleLock({ validPassword }: ArticleLockProps) {
  const { locale } = useThemeGlobal()
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [error, setError] = React.useState(false)

  React.useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const value = inputRef.current?.value || ''
    if (!validPassword(value)) setError(true)
  }

  return (
    <div className='flex min-h-[60vh] w-full items-center justify-center'>
      <form
        onSubmit={submit}
        className='w-full max-w-sm space-y-6 px-6 text-center'>
        <div className='mx-auto flex size-12 items-center justify-center rounded-full bg-brand-muted'>
          <Lock className='size-5 text-brand' />
        </div>
        <p className='font-medium text-foreground'>
          {locale.COMMON.ARTICLE_LOCK_TIPS}
        </p>
        <div className='flex overflow-hidden rounded-lg border border-input focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/30'>
          <input
            ref={inputRef}
            type='password'
            onChange={() => error && setError(false)}
            className='h-11 w-full bg-card px-3.5 text-sm text-foreground outline-none'
            aria-invalid={error}
          />
          <Button type='submit' className='rounded-none'>
            {locale.COMMON.SUBMIT || 'OK'}
          </Button>
        </div>
        {error && (
          <p className='text-sm text-destructive'>
            {locale.COMMON.PASSWORD_ERROR}
          </p>
        )}
      </form>
    </div>
  )
}
