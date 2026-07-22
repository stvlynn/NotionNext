import { siteConfig } from '@/lib/config'
import SmartLink from '@/components/SmartLink'

/**
 * Logo 组件 - 站点标题
 * 使用 KingHwa_OldSong 字体，简洁无装饰
 */
const Logo = props => {
  const { siteInfo } = props
  return (
    <SmartLink href='/' passHref legacyBehavior>
      <div className='flex items-center cursor-pointer'>
        <span
          className='site-title text-xl tracking-wide'
          style={{ color: 'var(--anthropic-text-primary)' }}>
          {siteInfo?.title || siteConfig('TITLE')}
        </span>
      </div>
    </SmartLink>
  )
}

export default Logo
