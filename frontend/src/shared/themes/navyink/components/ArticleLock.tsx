'use client'

import {
  Button,
  Field,
  FieldError,
  InputGroup,
  InputGroupAddon,
  InputGroupInput
} from '@/components/ui'
import { useLocale } from '../lib/global'
import { Lock } from 'lucide-react'
import * as React from 'react'

interface ArticleLockProps {
  validPassword: (password: string) => boolean
}

/**
 * Password gate for locked posts. Autofocuses the password field on mount. A
 * wrong password marks the field invalid and shows an inline error, which
 * clears as soon as the visitor edits the input again.
 */
export function ArticleLock({ validPassword }: ArticleLockProps) {
  const locale = useLocale()
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
        className='w-full max-w-sm space-y-6 px-6 text-center'
      >
        <div className='mx-auto flex size-12 items-center justify-center rounded-full bg-muted'>
          <Lock className='size-5 text-brand' />
        </div>
        <p className='font-medium text-foreground'>
          {locale.COMMON.ARTICLE_LOCK_TIPS}
        </p>
        <Field invalid={error} className='items-stretch'>
          <InputGroup className='h-11'>
            <InputGroupInput
              ref={inputRef}
              type='password'
              onChange={() => error && setError(false)}
              className='h-full'
              aria-label={locale.COMMON.ARTICLE_LOCK_TIPS}
              aria-invalid={error || undefined}
            />
            <InputGroupAddon align='inline-end'>
              <Button type='submit'>{locale.COMMON.SUBMIT}</Button>
            </InputGroupAddon>
          </InputGroup>
          {error && (
            <FieldError match className='text-center text-sm'>
              {locale.COMMON.PASSWORD_ERROR}
            </FieldError>
          )}
        </Field>
      </form>
    </div>
  )
}
