import fs from 'node:fs'
import path from 'node:path'

const repositoryRoot = path.resolve(__dirname, '../..')

function readRepositoryFile(relativePath) {
  return fs.readFileSync(path.join(repositoryRoot, relativePath), 'utf8')
}

describe('Cloudflare page runtime boundaries', () => {
  test('keeps backend infrastructure out of the client-safe page runtime', () => {
    const runtime = readRepositoryFile(
      'frontend/src/shared/lib/page/runtime.ts'
    )
    const nextConfig = readRepositoryFile('frontend/next.config.js')

    expect(runtime).not.toMatch(/@\/lib\/(?:build|cache|server)\//)
    expect(runtime.match(/from ['"]@\/lib\/db\/[^'"]+['"]/g)).toEqual([
      "from '@/lib/db/notion/getPageTableOfContents'"
    ])
    expect(runtime).not.toMatch(/from ['"](?:node:)?(?:fs|path|crypto|os)['"]/)
    expect(nextConfig).not.toContain('src/shared/lib/empty-module.js')
    expect(nextConfig).not.toMatch(/(?:fs|path|crypto|os|net|tls|dns):\s*false/)
    expect(
      fs.existsSync(
        path.join(repositoryRoot, 'frontend/src/shared/lib/page/server.ts')
      )
    ).toBe(false)
  })

  test('configures the OpenNext revalidation queue', () => {
    const openNextConfig = readRepositoryFile('open-next.config.ts')
    const wranglerConfig = JSON.parse(readRepositoryFile('wrangler.jsonc'))

    expect(openNextConfig).toContain(
      '@opennextjs/cloudflare/overrides/queue/do-queue'
    )
    expect(openNextConfig).toMatch(/queue:\s*doQueue/)
    expect(wranglerConfig.durable_objects.bindings).toContainEqual({
      name: 'NEXT_CACHE_DO_QUEUE',
      class_name: 'DOQueueHandler'
    })
    expect(wranglerConfig.migrations).toContainEqual({
      tag: 'v1',
      new_sqlite_classes: ['DOQueueHandler']
    })
  })
})
