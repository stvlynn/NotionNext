jest.mock('@/lib/db/notion/getNotionAPI', () => ({
  __esModule: true,
  default: {
    getSignedFileUrls: jest.fn()
  }
}))
jest.mock('p-limit', () => () => fn => fn())
jest.mock('notion-utils', () => ({
  getBlockValue: jest.fn(entry => entry?.value?.value || entry?.value || entry)
}))

import { isNotionHtmlArtifactBlock } from '@/backend/domain'
import notionAPI from '@/lib/db/notion/getNotionAPI'
import {
  formatNotionBlock,
  hydrateNotionHtmlArtifacts
} from '@/lib/db/notion/getPostBlocks'

describe('Notion HTML artifact fallback', () => {
  const mockGetSignedFileUrls = notionAPI.getSignedFileUrls

  beforeEach(() => {
    mockGetSignedFileUrls.mockReset()
  })

  it('detects HTML attachment embeds when Notion omits embed_variant', () => {
    expect(
      isNotionHtmlArtifactBlock({
        type: 'embed',
        properties: {
          source: [['attachment:file-id:interactive-demo.html']]
        },
        format: {}
      })
    ).toBe(true)
  })

  it('does not promote ordinary or misleading attachments to HTML artifacts', () => {
    const candidates = [
      {
        type: 'embed',
        properties: { source: [['attachment:file-id:report.pdf']] }
      },
      {
        type: 'embed',
        properties: { source: [['attachment:file-id:demo.html.exe']] }
      },
      {
        type: 'file',
        properties: { source: [['attachment:file-id:demo.html']] }
      }
    ]

    candidates.forEach(candidate => {
      expect(isNotionHtmlArtifactBlock(candidate)).toBe(false)
    })
  })

  it('normalizes inferred HTML artifacts before URL sanitization', () => {
    const source = 'attachment:file-id:interactive-demo.htm'
    const formatted = formatNotionBlock({
      artifact: {
        value: {
          id: 'artifact',
          type: 'embed',
          properties: { source: [[source]] },
          format: {}
        }
      }
    })

    expect(formatted.artifact.value.format.embed_variant).toBe('html_artifact')
    expect(formatted.artifact.value.properties.source[0][0]).toBe(source)
  })

  it('hydrates inferred HTML artifacts from their signed attachment URL', async () => {
    const recordMap = {
      block: {
        artifact: {
          value: {
            id: 'artifact',
            type: 'embed',
            properties: {
              source: [['attachment:file-id:interactive-demo.html']]
            },
            format: {}
          }
        }
      },
      signed_urls: {}
    }
    mockGetSignedFileUrls.mockResolvedValue({
      signedUrls: ['https://files.example/interactive-demo.html']
    })
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      headers: { get: () => null },
      text: async () => '<!doctype html><p>Interactive demo</p>'
    })

    await expect(hydrateNotionHtmlArtifacts(recordMap)).resolves.toBe(true)

    expect(mockGetSignedFileUrls).toHaveBeenCalledWith([
      {
        permissionRecord: { table: 'block', id: 'artifact' },
        url: 'attachment:file-id:interactive-demo.html'
      }
    ])
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://files.example/interactive-demo.html'
    )
    expect(recordMap.block.artifact.value.format).toMatchObject({
      embed_variant: 'html_artifact',
      html_artifact_content: '<!doctype html><p>Interactive demo</p>'
    })
  })

  it('repairs cached artifacts using an existing signed URL', async () => {
    const recordMap = {
      block: {
        artifact: {
          value: {
            id: 'artifact',
            type: 'embed',
            properties: {
              source: [['attachment:file-id:cached-demo.html']]
            },
            format: {}
          }
        }
      },
      signed_urls: {
        artifact: 'https://files.example/cached-demo.html'
      }
    }
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      headers: { get: () => null },
      text: async () => '<p>Cached demo</p>'
    })

    await expect(hydrateNotionHtmlArtifacts(recordMap)).resolves.toBe(true)

    expect(mockGetSignedFileUrls).not.toHaveBeenCalled()
    expect(recordMap.block.artifact.value.format).toMatchObject({
      embed_variant: 'html_artifact',
      html_artifact_content: '<p>Cached demo</p>'
    })
  })

  it('does not request signed URLs for non-HTML attachments', async () => {
    const recordMap = {
      block: {
        attachment: {
          value: {
            id: 'attachment',
            type: 'embed',
            properties: { source: [['attachment:file-id:report.pdf']] },
            format: {}
          }
        }
      }
    }

    await expect(hydrateNotionHtmlArtifacts(recordMap)).resolves.toBe(false)
    expect(mockGetSignedFileUrls).not.toHaveBeenCalled()
  })
})
