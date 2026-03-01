/**
 * 加载状态 - Anthropic 风格
 * 极简，accent 色脉冲动画
 */
export default function LoadingCover() {
  return (
    <div
      id='loading-cover'
      className='flex-grow flex flex-col items-center justify-center w-full min-h-screen'>
      {/* 简洁的加载指示器 */}
      <div className='flex items-center space-x-1.5'>
        <span
          className='w-1.5 h-1.5 rounded-full animate-pulse'
          style={{
            backgroundColor: 'var(--anthropic-accent)',
            animationDelay: '0ms'
          }}
        />
        <span
          className='w-1.5 h-1.5 rounded-full animate-pulse'
          style={{
            backgroundColor: 'var(--anthropic-accent)',
            animationDelay: '150ms',
            animationDuration: '1.5s'
          }}
        />
        <span
          className='w-1.5 h-1.5 rounded-full animate-pulse'
          style={{
            backgroundColor: 'var(--anthropic-accent)',
            animationDelay: '300ms',
            animationDuration: '1.5s'
          }}
        />
      </div>
    </div>
  )
}
