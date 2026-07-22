import { useGlobal } from '@/lib/global'
import SmartLink from '@/components/SmartLink'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { siteConfig } from '@/lib/config'
import CONFIG from '../config'

/**
 * 文章版权声明 - Anthropic 风格
 * 左侧 accent 色边框，简洁信息展示
 */
export default function ArticleCopyright() {
  const router = useRouter()
  const [path, setPath] = useState(siteConfig('LINK') + router.asPath)
  useEffect(() => {
    setPath(window.location.href)
  })

  const { locale } = useGlobal()

  if (!siteConfig('ANTHROPIC_ARTICLE_COPYRIGHT', null, CONFIG)) {
    return <></>
  }

  return (
    <section className='mt-8'>
      <div
        className='border-l-2 pl-5 py-4 space-y-2'
        style={{
          borderColor: 'var(--anthropic-accent)',
          backgroundColor: 'color-mix(in srgb, var(--anthropic-card-bg) 50%, var(--anthropic-bg-light))'
        }}>
        <div className='text-sm' style={{ color: 'var(--anthropic-text-secondary)' }}>
          <strong
            className='ui-text font-medium mr-2'
            style={{ color: 'var(--anthropic-text-primary)' }}>
            {locale.COMMON.AUTHOR}:
          </strong>
          <SmartLink href='/about' className='hover:underline' style={{ color: 'var(--anthropic-accent)' }}>
            {siteConfig('AUTHOR')}
          </SmartLink>
        </div>

        <div className='text-sm break-all' style={{ color: 'var(--anthropic-text-secondary)' }}>
          <strong
            className='ui-text font-medium mr-2'
            style={{ color: 'var(--anthropic-text-primary)' }}>
            {locale.COMMON.URL}:
          </strong>
          <a
            className='hover:underline mono text-xs'
            href={path}
            style={{ color: 'var(--anthropic-text-tertiary)' }}>
            {path}
          </a>
        </div>

        <div className='text-sm' style={{ color: 'var(--anthropic-text-secondary)' }}>
          <strong
            className='ui-text font-medium mr-2'
            style={{ color: 'var(--anthropic-text-primary)' }}>
            {locale.COMMON.COPYRIGHT}:
          </strong>
          <span className='text-xs'>
            {locale.COMMON.COPYRIGHT_NOTICE}
          </span>
        </div>
      </div>
    </section>
  )
}
