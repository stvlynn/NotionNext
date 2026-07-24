import { defineCloudflareConfig } from '@opennextjs/cloudflare/config'
import r2IncrementalCache from '@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache'
import doQueue from '@opennextjs/cloudflare/overrides/queue/do-queue'

const cloudflareConfig = defineCloudflareConfig({
  incrementalCache: r2IncrementalCache,
  queue: doQueue
})

export default {
  ...cloudflareConfig,
  cloudflare: {
    ...cloudflareConfig.cloudflare,
    // Next.js traces ofetch's Node export into the standalone bundle. Using
    // the workerd condition would select an untraced file at bundle time.
    useWorkerdCondition: false
  },
  appPath: 'frontend',
  buildOutputPath: 'frontend',
  packageJsonPath: 'package.json',
  buildCommand: 'yarn build'
}
