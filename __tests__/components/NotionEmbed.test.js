import { render, screen } from '@testing-library/react'
import { NotionEmbed } from '@/components/NotionPage'
import { useNotionContext } from 'react-notion-x'

jest.mock('@/lib/config', () => ({ siteConfig: jest.fn() }))
jest.mock('@/lib/db/notion/mapImage', () => ({
  compressImage: jest.fn(),
  mapImgUrl: jest.fn()
}))
jest.mock('@/components/NotionLink', () => () => null)
jest.mock('@/lib/utils', () => ({ isBrowser: true }))
jest.mock('@fisch0920/medium-zoom', () => jest.fn())
jest.mock('@/backend/domain', () => ({
  isNotionHtmlArtifactBlock: block =>
    block.format?.embed_variant === 'html_artifact'
}))
jest.mock('react-notion-x', () => ({
  NotionRenderer: () => null,
  useNotionContext: jest.fn()
}))
jest.mock('next/dynamic', () => () => {
  const Widget = ({ tweetId, options }) => (
    <div data-testid='tweet' data-id={tweetId} data-dnt={options.dnt} />
  )
  return Widget
})

const postId = '2119698589849161814'
const createBlock = source => ({
  id: 'embed-block',
  type: 'embed',
  properties: { source: [[source]] },
  format: { display_source: source, block_height: 320 }
})

beforeEach(() => {
  useNotionContext.mockReturnValue({ recordMap: {} })
})

describe('NotionEmbed', () => {
  it.each([
    `https://x.com/Stv_Lynn/status/${postId}?a=share&s=20`,
    `https://www.x.com/Stv_Lynn/status/${postId}`,
    `https://twitter.com/Stv_Lynn/status/${postId}`,
    `https://www.twitter.com/Stv_Lynn/status/${postId}/`,
    `https://mobile.twitter.com/Stv_Lynn/status/${postId}`,
    `https://x.com/i/web/status/${postId}`,
    `https://x.com/i/status/${postId}`,
    `https://x.com/Stv_Lynn/status/${postId}/photo/1`,
    `https://x.com/Stv_Lynn/status/${postId}/video/1`
  ])('renders %s through the widget with an exact string ID', source => {
    const { container } = render(<NotionEmbed block={createBlock(source)} />)

    expect(screen.getByTestId('tweet')).toHaveAttribute('data-id', postId)
    expect(screen.getByTestId('tweet')).toHaveAttribute('data-dnt', 'true')
    expect(container.querySelector('iframe')).toBeNull()
  })

  it('uses the original source when display_source is absent', () => {
    const block = createBlock(`https://x.com/author/status/${postId}`)
    delete block.format.display_source
    render(<NotionEmbed block={block} />)

    expect(screen.getByTestId('tweet')).toHaveAttribute('data-id', postId)
  })

  it('remounts the widget when navigation changes the post ID', () => {
    const { rerender } = render(
      <NotionEmbed
        block={createBlock(`https://x.com/author/status/${postId}`)}
      />
    )
    const initialWidget = screen.getByTestId('tweet')
    const nextId = '2119698589849161815'
    rerender(
      <NotionEmbed
        block={createBlock(`https://x.com/author/status/${nextId}`)}
      />
    )

    expect(screen.getByTestId('tweet')).toHaveAttribute('data-id', nextId)
    expect(screen.getByTestId('tweet')).not.toBe(initialWidget)
  })

  it.each([
    'https://example.com/demo',
    `https://x.com.example.com/author/status/${postId}`,
    `https://example.com/x.com/author/status/${postId}`,
    'https://x.com/author/status/invalid',
    'https://x.com/author',
    '/relative-embed'
  ])('preserves the generic renderer for %s', source => {
    const { container } = render(<NotionEmbed block={createBlock(source)} />)
    const iframe = container.querySelector('iframe')

    expect(iframe).toHaveAttribute('src', source)
    expect(iframe.parentElement).toHaveStyle({ height: '320px' })
    expect(screen.queryByTestId('tweet')).toBeNull()
  })

  it('preserves signed URL precedence', () => {
    useNotionContext.mockReturnValue({
      recordMap: {
        signed_urls: { 'embed-block': 'https://example.com/signed' }
      }
    })
    const block = createBlock(`https://x.com/author/status/${postId}`)
    const { container } = render(<NotionEmbed block={block} />)

    expect(container.querySelector('iframe')).toHaveAttribute(
      'src',
      'https://example.com/signed'
    )
  })

  it('preserves sandboxed HTML artifacts even with an X display source', () => {
    const block = createBlock(`https://x.com/author/status/${postId}`)
    block.format.embed_variant = 'html_artifact'
    block.format.html_artifact_content = '<p>Interactive demo</p>'
    const { container } = render(<NotionEmbed block={block} />)
    const iframe = container.querySelector('iframe')

    expect(iframe).toHaveAttribute('srcdoc', '<p>Interactive demo</p>')
    expect(iframe).toHaveAttribute(
      'sandbox',
      'allow-scripts allow-forms allow-popups'
    )
    expect(iframe).not.toHaveAttribute('src')
  })

  it.each([undefined, 'attachment:demo.html'])(
    'omits unresolved source %s',
    source => {
      const { container } = render(<NotionEmbed block={createBlock(source)} />)
      expect(container).toBeEmptyDOMElement()
    }
  )
})
