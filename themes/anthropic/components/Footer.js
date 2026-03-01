import { BeiAnGongAn } from '@/components/BeiAnGongAn'
import BeiAnSite from '@/components/BeiAnSite'
import PoweredBy from '@/components/PoweredBy'
import { siteConfig } from '@/lib/config'
import SmartLink from '@/components/SmartLink'

/**
 * 页脚 - Anthropic 风格
 * 多栏链接布局，简洁版权信息
 */
const Footer = ({ title }) => {
  const d = new Date()
  const currentYear = d.getFullYear()
  const since = siteConfig('SINCE')
  const copyrightDate =
    parseInt(since) < currentYear ? since + '-' + currentYear : currentYear

  return (
    <footer
      className='relative z-10 mt-20 border-t'
      style={{
        borderColor: 'var(--anthropic-border)',
        backgroundColor: 'var(--anthropic-card-bg)'
      }}>
      <div className='site-margin max-w-7xl mx-auto'>
        {/* 上部分: 多栏链接 */}
        <div className='py-12 grid grid-cols-2 md:grid-cols-4 gap-8'>
          {/* 站点 */}
          <div>
            <h4
              className='post-title text-base mb-4'
              style={{ color: 'var(--anthropic-text-primary)' }}>
              {siteConfig('TITLE')}
            </h4>
            <p
              className='text-sm leading-relaxed'
              style={{ color: 'var(--anthropic-text-secondary)' }}>
              {siteConfig('BIO')}
            </p>
          </div>

          {/* 导航 */}
          <div>
            <h4
              className='ui-text text-xs font-medium uppercase tracking-wider mb-4'
              style={{ color: 'var(--anthropic-text-tertiary)' }}>
              Navigation
            </h4>
            <ul className='space-y-2'>
              {[
                { href: '/', label: 'Home' },
                { href: '/archive', label: 'Archive' },
                { href: '/category', label: 'Categories' },
                { href: '/tag', label: 'Tags' }
              ].map(link => (
                <li key={link.href}>
                  <SmartLink
                    href={link.href}
                    className='text-sm transition-colors duration-200 hover:opacity-80'
                    style={{ color: 'var(--anthropic-text-secondary)' }}>
                    {link.label}
                  </SmartLink>
                </li>
              ))}
            </ul>
          </div>

          {/* 社交链接 */}
          <div>
            <h4
              className='ui-text text-xs font-medium uppercase tracking-wider mb-4'
              style={{ color: 'var(--anthropic-text-tertiary)' }}>
              Connect
            </h4>
            <ul className='space-y-2'>
              {siteConfig('CONTACT_GITHUB') && (
                <li>
                  <a
                    href={siteConfig('CONTACT_GITHUB')}
                    target='_blank'
                    rel='noreferrer'
                    className='text-sm transition-colors duration-200 hover:opacity-80'
                    style={{ color: 'var(--anthropic-text-secondary)' }}>
                    GitHub
                  </a>
                </li>
              )}
              {siteConfig('CONTACT_TWITTER') && (
                <li>
                  <a
                    href={siteConfig('CONTACT_TWITTER')}
                    target='_blank'
                    rel='noreferrer'
                    className='text-sm transition-colors duration-200 hover:opacity-80'
                    style={{ color: 'var(--anthropic-text-secondary)' }}>
                    Twitter
                  </a>
                </li>
              )}
              {siteConfig('CONTACT_EMAIL') && (
                <li>
                  <a
                    href={`mailto:${siteConfig('CONTACT_EMAIL')}`}
                    className='text-sm transition-colors duration-200 hover:opacity-80'
                    style={{ color: 'var(--anthropic-text-secondary)' }}>
                    Email
                  </a>
                </li>
              )}
              {siteConfig('LINK') && (
                <li>
                  <a
                    href={siteConfig('LINK')}
                    target='_blank'
                    rel='noreferrer'
                    className='text-sm transition-colors duration-200 hover:opacity-80'
                    style={{ color: 'var(--anthropic-text-secondary)' }}>
                    Website
                  </a>
                </li>
              )}
            </ul>
          </div>

          {/* 更多 */}
          <div>
            <h4
              className='ui-text text-xs font-medium uppercase tracking-wider mb-4'
              style={{ color: 'var(--anthropic-text-tertiary)' }}>
              More
            </h4>
            <ul className='space-y-2'>
              <li>
                <SmartLink
                  href='/search'
                  className='text-sm transition-colors duration-200 hover:opacity-80'
                  style={{ color: 'var(--anthropic-text-secondary)' }}>
                  Search
                </SmartLink>
              </li>
              {siteConfig('CONTACT_TELEGRAM') && (
                <li>
                  <a
                    href={siteConfig('CONTACT_TELEGRAM')}
                    target='_blank'
                    rel='noreferrer'
                    className='text-sm transition-colors duration-200 hover:opacity-80'
                    style={{ color: 'var(--anthropic-text-secondary)' }}>
                    Telegram
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* 下部分: 版权 */}
        <div
          className='py-6 border-t flex flex-col md:flex-row items-center justify-between gap-2'
          style={{ borderColor: 'var(--anthropic-border)' }}>
          <div
            className='text-xs ui-text'
            style={{ color: 'var(--anthropic-text-tertiary)' }}>
            <span>&copy; {copyrightDate} </span>
            <a
              href={siteConfig('LINK')}
              className='hover:underline'
              style={{ color: 'var(--anthropic-text-secondary)' }}>
              {siteConfig('AUTHOR')}
            </a>
            {title && <span className='mx-1'>|</span>}
            {title && <span>{title}</span>}
          </div>
          <div
            className='text-xs ui-text flex items-center gap-3'
            style={{ color: 'var(--anthropic-text-tertiary)' }}>
            <BeiAnSite />
            <BeiAnGongAn />
            <span className='hidden busuanzi_container_site_pv'>
              <i className='fas fa-eye' />
              <span className='px-1 busuanzi_value_site_pv'> </span>
            </span>
            <PoweredBy className='flex items-center' />
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
