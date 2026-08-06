'use client'

import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui'
import { useLocale } from '../lib/global'
import { Search } from 'lucide-react'
import { useRouter } from 'next/router'
import * as React from 'react'

interface SearchInputProps {
  defaultValue?: string
}

/** Search field that routes to /search/[keyword] on submit. */
export function SearchInput({ defaultValue = '' }: SearchInputProps) {
  const router = useRouter()
  const locale = useLocale()
  const inputRef = React.useRef<HTMLInputElement>(null)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const key = inputRef.current?.value?.trim()
    void router.push(key ? `/search/${encodeURIComponent(key)}` : '/search')
  }

  return (
    <form onSubmit={submit} role='search' className='w-full'>
      <InputGroup className='h-11'>
        <InputGroupAddon align='inline-start'>
          <Search className='text-muted-foreground' aria-hidden />
        </InputGroupAddon>
        <InputGroupInput
          ref={inputRef}
          type='search'
          defaultValue={defaultValue}
          placeholder={locale.NAV.SEARCH}
          aria-label={locale.NAV.SEARCH}
          className='h-full'
        />
      </InputGroup>
    </form>
  )
}
