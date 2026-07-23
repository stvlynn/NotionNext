'use client'

import { useThemeGlobal } from '../lib/global'
import { Search } from 'lucide-react'
import { useRouter } from 'next/router'
import * as React from 'react'

interface SearchInputProps {
  defaultValue?: string
}

/** Search field that routes to /search/[keyword] on submit. */
export function SearchInput({ defaultValue = '' }: SearchInputProps) {
  const router = useRouter()
  const { locale } = useThemeGlobal()
  const inputRef = React.useRef<HTMLInputElement>(null)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const key = inputRef.current?.value?.trim()
    void router.push(key ? `/search/${encodeURIComponent(key)}` : '/search')
  }

  return (
    <form onSubmit={submit} role='search' className='w-full'>
      <div className='flex h-11 items-center gap-2 rounded-lg border border-input bg-card px-3.5 shadow-sm transition-colors focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/30'>
        <Search className='size-4 shrink-0 text-muted-foreground' />
        <input
          ref={inputRef}
          type='search'
          defaultValue={defaultValue}
          placeholder={locale.SEARCH?.ARTICLES || locale.NAV.SEARCH || 'Search'}
          aria-label={locale.NAV.SEARCH || 'Search'}
          className='h-full w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground'
        />
      </div>
    </form>
  )
}
