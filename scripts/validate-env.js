const path = require('node:path')
const { loadEnvConfig } = require('@next/env')

const frontendDir = path.resolve(__dirname, '..', 'frontend')
loadEnvConfig(frontendDir)

const requiredServerVariables = ['NOTION_PAGE_ID']
const forbiddenPublicSecrets = [
  'NEXT_PUBLIC_COMMENT_GITALK_CLIENT_SECRET',
  'NEXT_PUBLIC_WEBMENTION_TOKEN'
]

const missing = requiredServerVariables.filter(
  name => !process.env[name]?.trim()
)
const exposed = forbiddenPublicSecrets.filter(name => process.env[name]?.trim())

if (missing.length > 0 || exposed.length > 0) {
  if (missing.length > 0) {
    console.error(
      `Missing required server environment variables: ${missing.join(', ')}`
    )
  }

  if (exposed.length > 0) {
    console.error(
      `Secrets must not use the NEXT_PUBLIC_ prefix: ${exposed.join(', ')}`
    )
  }

  process.exit(1)
}

console.log('Environment configuration is valid.')
