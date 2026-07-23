import fs from 'fs'
import os from 'os'
import path from 'path'

let cachedNotionCacheRoot: string | null = null

function resolveNotionCacheRoot(): string {
  if (cachedNotionCacheRoot) {
    return cachedNotionCacheRoot
  }

  const fromEnv = process.env.NOTION_NEXT_NOTION_CACHE_DIR
  if (fromEnv) {
    const dir = path.resolve(fromEnv)
    fs.mkdirSync(dir, { recursive: true })
    cachedNotionCacheRoot = dir
    return cachedNotionCacheRoot
  }

  const primary = path.join(process.cwd(), '.next', 'cache', 'notion')
  try {
    fs.mkdirSync(primary, { recursive: true })
    cachedNotionCacheRoot = primary
    return cachedNotionCacheRoot
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code
    if (
      code === 'ENOENT' ||
      code === 'EROFS' ||
      code === 'EACCES' ||
      code === 'EPERM'
    ) {
      const fallback = path.join(os.tmpdir(), 'notionnext-notion-cache')
      fs.mkdirSync(fallback, { recursive: true })
      cachedNotionCacheRoot = fallback
      if (process.env.NODE_ENV !== 'test') {
        console.warn(
          '[NotionNext] Notion file cache root (read-only deploy, using tmpdir):',
          fallback
        )
      }
      return cachedNotionCacheRoot
    }
    throw err
  }
}

function sanitizeSessionId(sessionId: unknown): string {
  return String(sessionId || 'default').replace(/[^a-z0-9_-]/gi, '_')
}

function hasSessionId(value: unknown): value is { sessionId: unknown } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'sessionId' in value &&
    Boolean(value.sessionId)
  )
}

export function getNotionCacheRoot(): string {
  return resolveNotionCacheRoot()
}

export function getBuildSessionId(): string {
  const buildSessionFile = path.join(getNotionCacheRoot(), 'build-session.json')
  try {
    const raw = fs.readFileSync(buildSessionFile, 'utf8')
    const parsed = JSON.parse(raw) as unknown
    if (hasSessionId(parsed)) {
      return sanitizeSessionId(parsed.sessionId)
    }
  } catch {}

  return sanitizeSessionId(process.env.npm_lifecycle_event || 'runtime')
}

export function getBuildSessionPath(...parts: string[]): string {
  return path.join(
    getNotionCacheRoot(),
    'sessions',
    getBuildSessionId(),
    ...parts
  )
}
