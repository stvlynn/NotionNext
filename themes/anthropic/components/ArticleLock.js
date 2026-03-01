import { useGlobal } from '@/lib/global'
import { useEffect, useRef } from 'react'

/**
 * 加密文章校验组件 - Anthropic 风格
 * 居中设计，accent 色提交按钮
 */
export const ArticleLock = props => {
  const { validPassword } = props
  const { locale } = useGlobal()

  const submitPassword = () => {
    const p = document.getElementById('password')
    if (!validPassword(p?.value)) {
      const tips = document.getElementById('tips')
      if (tips) {
        tips.innerHTML = ''
        tips.innerHTML = `<div class='text-red-500 animate__shakeX animate__animated text-sm'>${locale.COMMON.PASSWORD_ERROR}</div>`
      }
    }
  }

  const passwordInputRef = useRef(null)
  useEffect(() => {
    passwordInputRef.current?.focus()
  }, [])

  return (
    <div
      id='container'
      className='w-full flex justify-center items-center'
      style={{ minHeight: '60vh' }}>
      <div className='text-center space-y-6 max-w-sm w-full px-6'>
        {/* 锁图标 */}
        <div
          className='mx-auto w-12 h-12 rounded-full flex items-center justify-center'
          style={{
            backgroundColor: 'color-mix(in srgb, var(--anthropic-accent) 15%, transparent)'
          }}>
          <svg
            className='w-5 h-5'
            fill='none'
            viewBox='0 0 24 24'
            stroke='currentColor'
            strokeWidth={1.5}
            style={{ color: 'var(--anthropic-accent)' }}>
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              d='M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z'
            />
          </svg>
        </div>

        <div
          className='text-base ui-text font-medium'
          style={{ color: 'var(--anthropic-text-primary)' }}>
          {locale.COMMON.ARTICLE_LOCK_TIPS}
        </div>

        <div className='flex rounded-lg overflow-hidden border' style={{ borderColor: 'var(--anthropic-border)' }}>
          <input
            id='password'
            type='password'
            onKeyDown={e => {
              if (e.key === 'Enter') {
                submitPassword()
              }
            }}
            ref={passwordInputRef}
            className='outline-none w-full text-sm px-4 py-3 ui-text transition-all duration-200'
            style={{
              backgroundColor: 'var(--anthropic-bg-light)',
              color: 'var(--anthropic-text-primary)'
            }}
            placeholder='Enter password...'
          />
          <button
            onClick={submitPassword}
            className='btn-primary px-5 whitespace-nowrap text-sm font-medium rounded-none'>
            {locale.COMMON.SUBMIT}
          </button>
        </div>

        <div id='tips' className='min-h-[24px]' />
      </div>
    </div>
  )
}
