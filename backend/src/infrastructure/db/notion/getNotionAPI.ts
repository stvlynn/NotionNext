import path from 'path'
import { NotionAPI as NotionLibrary } from 'notion-client'
import BLOG from '@/blog.config'
import { RateLimiter } from './RateLimiter'
import {
  getNotionBuildRateMaxPerMinute,
  getNotionBuildRateMinIntervalMs,
  logBuildEnvSummary
} from '@/lib/build/buildEnv'

type NotionClientOptions = NonNullable<ConstructorParameters<typeof NotionLibrary>[0]>
type LegacyNotionClientOptions = Omit<
  NotionClientOptions,
  'activeUser' | 'authToken'
> & {
  activeUser?: string | null
  authToken?: string | null
  kyOptions?: {
    mode: RequestMode
    hooks: {
      beforeRequest: Array<(request: Request) => Request>
    }
  }
}

type NotionMethodName = {
  [Key in keyof NotionLibrary]: NotionLibrary[Key] extends (
    ...args: never[]
  ) => unknown
    ? Key
    : never
}[keyof NotionLibrary]

type NotionMethod<Name extends NotionMethodName> = Extract<
  NotionLibrary[Name],
  (...args: never[]) => unknown
>

type CallableNotionMethod<Name extends NotionMethodName> = (
  ...args: Parameters<NotionMethod<Name>>
) => ReturnType<NotionMethod<Name>>

const useRateLimiter = process.env.BUILD_MODE || process.env.EXPORT
const lockFilePath = path.resolve(process.cwd(), '.notion-api-lock')
const rateLimiter = new RateLimiter(
  getNotionBuildRateMaxPerMinute(),
  lockFilePath,
  getNotionBuildRateMinIntervalMs()
)
if (useRateLimiter) {
  logBuildEnvSummary()
}

const globalStore: {
  notion: NotionLibrary | null
  inflight: Map<string, Promise<unknown>>
} = { notion: null, inflight: new Map() }

function getRawNotion(): NotionLibrary {
  if (!globalStore.notion) {
    const options: LegacyNotionClientOptions = {
      apiBaseUrl: BLOG.API_BASE_URL || 'https://www.notion.so/api/v3',
      activeUser: BLOG.NOTION_ACTIVE_USER || null,
      authToken: BLOG.NOTION_TOKEN_V2 || null,
      userTimeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      kyOptions: {
        mode: 'cors',
        hooks: {
          beforeRequest: [
            (request: Request): Request => {
              const url = request.url.toString()
              if (url.includes('/api/v3/syncRecordValues')) {
                return new Request(
                  url.replace(
                    '/api/v3/syncRecordValues',
                    '/api/v3/syncRecordValuesMain'
                  ),
                  request
                )
              }
              return request
            }
          ]
        }
      }
    }

    globalStore.notion = new NotionLibrary(options as NotionClientOptions)
  }
  return globalStore.notion
}

async function callNotion<Name extends NotionMethodName>(
  methodName: Name,
  ...args: Parameters<NotionMethod<Name>>
): Promise<Awaited<ReturnType<NotionMethod<Name>>>> {
  const notion = getRawNotion()
  const original = notion[methodName] as NotionMethod<Name>
  if (typeof original !== 'function') {
    throw new Error(`${String(methodName)} is not a function`)
  }

  const key = `${String(methodName)}-${JSON.stringify(args)}`

  if (globalStore.inflight.has(key)) {
    return globalStore.inflight.get(key) as Promise<
      Awaited<ReturnType<NotionMethod<Name>>>
    >
  }

  const method = original.bind(notion) as CallableNotionMethod<Name>
  const execute = (): ReturnType<NotionMethod<Name>> => method(...args)
  const promise = (useRateLimiter
    ? rateLimiter.enqueue(key, execute)
    : Promise.resolve().then(execute)) as Promise<
    Awaited<ReturnType<NotionMethod<Name>>>
  >

  globalStore.inflight.set(key, promise)
  promise
    .catch(() => {})
    .finally(() => globalStore.inflight.delete(key))
  return promise
}

export const notionAPI = {
  getPage: (...args: Parameters<NotionLibrary['getPage']>) =>
    callNotion('getPage', ...args),
  getBlocks: (...args: Parameters<NotionLibrary['getBlocks']>) =>
    callNotion('getBlocks', ...args),
  getSignedFileUrls: (
    ...args: Parameters<NotionLibrary['getSignedFileUrls']>
  ) => callNotion('getSignedFileUrls', ...args),
  getUsers: (...args: Parameters<NotionLibrary['getUsers']>) =>
    callNotion('getUsers', ...args),
  __call: callNotion
}

export default notionAPI
