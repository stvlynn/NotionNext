interface ParsePositiveIntOptions {
  min?: number
  max?: number
}

let buildEnvLogged = false

function parsePositiveInt(
  value: unknown,
  fallback: number,
  { min = 1, max = Infinity }: ParsePositiveIntOptions = {}
): number {
  const n = Number.parseInt(String(value ?? '').trim(), 10)
  if (!Number.isFinite(n)) return fallback
  return Math.min(max, Math.max(min, n))
}

function isTruthyEnv(value: string | undefined): boolean {
  if (value === undefined || value === '') return true
  const v = String(value).trim().toLowerCase()
  if (['0', 'false', 'no', 'off', 'skip', 'disabled'].includes(v)) return false
  return true
}

export function isBuildOrExport(): boolean {
  return process.env.BUILD_MODE === 'true' || process.env.EXPORT === 'true'
}

export function isBuildPrefetchEnabled(): boolean {
  if (process.env.BUILD_PREFETCH_ENABLED === undefined) return false
  return isTruthyEnv(process.env.BUILD_PREFETCH_ENABLED)
}

export function getBuildPrefetchConcurrency(): number {
  return parsePositiveInt(process.env.BUILD_PREFETCH_CONCURRENCY, 8, {
    min: 1,
    max: 32
  })
}

export function getNotionBuildRateMaxPerMinute(): number {
  return parsePositiveInt(process.env.NOTION_BUILD_RATE_MAX_PER_MINUTE, 50, {
    min: 1,
    max: 600
  })
}

export function getNotionBuildRateMinIntervalMs(): number {
  return parsePositiveInt(process.env.NOTION_BUILD_RATE_MIN_INTERVAL_MS, 300, {
    min: 0,
    max: 60_000
  })
}

export function getStaticPageGenerationTimeoutSec(): number {
  return parsePositiveInt(process.env.STATIC_PAGE_GENERATION_TIMEOUT, 300, {
    min: 60,
    max: 3600
  })
}

export function logBuildEnvSummary(): void {
  if (buildEnvLogged || !isBuildOrExport()) return
  buildEnvLogged = true
  console.log(
    '[BuildEnv]',
    JSON.stringify(
      {
        prefetchEnabled: isBuildPrefetchEnabled(),
        prefetchConcurrency: getBuildPrefetchConcurrency(),
        notionRateMaxPerMinute: getNotionBuildRateMaxPerMinute(),
        notionRateMinIntervalMs: getNotionBuildRateMinIntervalMs(),
        staticPageGenerationTimeoutSec: getStaticPageGenerationTimeoutSec()
      },
      null,
      0
    )
  )
}
