import { useRouter } from 'next/router'
import { useImperativeHandle, useRef, useState } from 'react'
import { useGlobal } from '@/lib/global'

let lock = false

/**
 * 搜索输入框 - Anthropic 风格
 * 简洁输入框，搜索图标，accent 色 focus 状态
 */
const SearchInput = props => {
  const { currentSearch, cRef, className } = props
  const [onLoading, setLoadingState] = useState(false)
  const router = useRouter()
  const searchInputRef = useRef()
  const { locale } = useGlobal()

  useImperativeHandle(cRef, () => {
    return {
      focus: () => {
        searchInputRef?.current?.focus()
      }
    }
  })

  const handleSearch = () => {
    const key = searchInputRef.current.value
    if (key && key !== '') {
      setLoadingState(true)
      router.push({ pathname: '/search/' + key }).then(r => {
        setLoadingState(false)
      })
    } else {
      router.push({ pathname: '/' }).then(r => {})
    }
  }

  const handleKeyUp = e => {
    if (e.keyCode === 13) {
      handleSearch(searchInputRef.current.value)
    } else if (e.keyCode === 27) {
      cleanSearch()
    }
  }

  const cleanSearch = () => {
    searchInputRef.current.value = ''
    setShowClean(false)
  }

  const [showClean, setShowClean] = useState(false)
  const updateSearchKey = val => {
    if (lock) return
    searchInputRef.current.value = val
    setShowClean(!!val)
  }

  function lockSearchInput() {
    lock = true
  }

  function unLockSearchInput() {
    lock = false
  }

  return (
    <div className={`relative flex items-center ${className || ''}`}>
      {/* 搜索图标 */}
      <div
        className='absolute left-3 flex items-center pointer-events-none'
        style={{ color: 'var(--anthropic-text-tertiary)' }}>
        {onLoading ? (
          <svg className='w-4 h-4 animate-spin' fill='none' viewBox='0 0 24 24'>
            <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' />
            <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z' />
          </svg>
        ) : (
          <svg className='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={1.5}>
            <path strokeLinecap='round' strokeLinejoin='round' d='M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z' />
          </svg>
        )}
      </div>

      {/* 输入框 */}
      <input
        ref={searchInputRef}
        type='text'
        className='w-full pl-10 pr-8 py-2.5 text-sm ui-text rounded-lg border outline-none transition-all duration-200'
        style={{
          backgroundColor: 'var(--anthropic-card-bg)',
          borderColor: 'var(--anthropic-border)',
          color: 'var(--anthropic-text-primary)'
        }}
        onFocus={e => { e.target.style.borderColor = 'var(--anthropic-accent)' }}
        onBlur={e => { e.target.style.borderColor = 'var(--anthropic-border)' }}
        onKeyUp={handleKeyUp}
        onCompositionStart={lockSearchInput}
        onCompositionUpdate={lockSearchInput}
        onCompositionEnd={unLockSearchInput}
        placeholder={locale.SEARCH.ARTICLES}
        onChange={e => updateSearchKey(e.target.value)}
        defaultValue={currentSearch || ''}
      />

      {/* 清除按钮 */}
      {showClean && (
        <button
          className='absolute right-3 flex items-center transition-colors duration-200'
          style={{ color: 'var(--anthropic-text-tertiary)' }}
          onClick={cleanSearch}>
          <svg className='w-4 h-4 hover:text-[var(--anthropic-accent)]' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={1.5}>
            <path strokeLinecap='round' strokeLinejoin='round' d='M6 18L18 6M6 6l12 12' />
          </svg>
        </button>
      )}
    </div>
  )
}

export default SearchInput
