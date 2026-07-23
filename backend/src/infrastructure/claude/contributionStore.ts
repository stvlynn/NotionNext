import { md5 } from 'js-md5'
import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

const EVENTS_TABLE = 'claude_contribution_events_v1'
const SNAPSHOTS_TABLE = 'claude_contribution_snapshots_v1'
const LOCAL_CACHE_KEY = '__claude_contribution_daily_cache_v1'

type ContributionEventType = 'create' | 'update'

interface LocalDailyCache {
  dayKey: string
  events: unknown[]
  updatedAtMs: number
  dirty: boolean
}

interface ContributionCacheOptions {
  forceRefresh?: boolean
  isBuild?: boolean
  nowMs?: number
}

interface ContributionEventsCacheOptions {
  limit?: number
  allowStale?: boolean
  nowMs?: number
}

interface ContributionPostSnapshot {
  repositoryId: string
  title: string
  slug: string
  createdAtMs: number
  updatedAtMs: number
}

interface StoredContributionEvent {
  event_id: string
  event_type: ContributionEventType
  repository_id: string
  timestamp_ms: number
  title: string
  slug: string
}

interface SnapshotRow {
  repository_id?: unknown
  title?: unknown
  slug?: unknown
  created_at_ms?: unknown
  updated_at_ms?: unknown
  synced_at_ms?: unknown
}

interface EventRow {
  event_id?: unknown
  event_type?: unknown
  repository_id?: unknown
  timestamp_ms?: unknown
  title?: unknown
  slug?: unknown
}

interface SnapshotUpsertRow {
  repository_id: string
  title: string
  slug: string
  created_at_ms: number
  updated_at_ms: number
  synced_at_ms: number
}

interface ContributionEventUpsertResult {
  enabled: boolean
  attempted: number
  inserted: number
}

interface ContributionSnapshotSyncResult {
  enabled: boolean
  scanned: number
  addedEvents: number
  attemptedEvents: number
}

interface ListContributionEventsOptions {
  limit?: number
}

interface ListedContributionEvent {
  eventId: string
  type: ContributionEventType
  repositoryId: string
  identifier: string
  timestampMs: number
  title: string
  slug: string
  href: string
}

interface SupabaseErrorLike {
  code?: unknown
  message?: unknown
}

let supabaseClient: SupabaseClient | null = null
let legacyCleanupPromise: Promise<boolean> | null = null

const getSupabaseUrl = (): string => {
  return process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
}

const getSupabaseKey = (): string => {
  return (
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    ''
  )
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return value !== null && typeof value === 'object'
}

const isNotNull = <T>(value: T | null): value is T => {
  return value !== null
}

const toTimestampMs = (value: unknown): number => {
  if (value === null || value === undefined || value === '') return 0
  if (typeof value === 'number') {
    if (!Number.isFinite(value) || value <= 0) return 0
    return Math.trunc(value)
  }
  const parsed = Date.parse(String(value))
  if (!Number.isFinite(parsed) || parsed <= 0) return 0
  return parsed
}

const normalizeRepositoryId = (value: unknown): string => {
  if (!value) return ''
  return String(value).replace(/-/g, '').trim().toLowerCase()
}

const normalizeText = (value: unknown): string => {
  return typeof value === 'string' ? value : ''
}

const buildHrefFromSlug = (slug: unknown): string => {
  const normalizedSlug = normalizeText(slug).trim()
  if (!normalizedSlug) return ''
  if (/^https?:\/\//i.test(normalizedSlug)) return normalizedSlug
  return normalizedSlug.startsWith('/') ? normalizedSlug : `/${normalizedSlug}`
}

const buildEventId = (
  type: ContributionEventType,
  repositoryId: string,
  timestampMs: number
): string => {
  return `e_${md5(`${type}|${repositoryId}|${timestampMs}`)}`
}

const chunkArray = <T>(arr: readonly T[] | undefined, size = 200): T[][] => {
  const list = Array.isArray(arr) ? arr : []
  const safeSize = Math.max(1, Math.min(1000, Number(size) || 200))
  const chunks: T[][] = []
  for (let i = 0; i < list.length; i += safeSize) {
    chunks.push(list.slice(i, i + safeSize))
  }
  return chunks
}

const formatDayKey = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const getTodayKey = (nowMs = Date.now()): string => {
  return formatDayKey(new Date(nowMs))
}

const getYesterdayEndMs = (nowMs = Date.now()): number => {
  const date = new Date(nowMs)
  date.setHours(0, 0, 0, 0)
  date.setMilliseconds(-1)
  return date.getTime()
}

const getLocalDailyCache = (): LocalDailyCache => {
  if (typeof globalThis === 'undefined') {
    return { dayKey: '', events: [], updatedAtMs: 0, dirty: true }
  }

  const globalCache = globalThis as typeof globalThis & {
    [LOCAL_CACHE_KEY]?: LocalDailyCache
  }

  if (!globalCache[LOCAL_CACHE_KEY]) {
    globalCache[LOCAL_CACHE_KEY] = {
      dayKey: '',
      events: [],
      updatedAtMs: 0,
      dirty: true
    }
  }
  return globalCache[LOCAL_CACHE_KEY]
}

export const markContributionCacheDirty = (): void => {
  const cache = getLocalDailyCache()
  cache.dirty = true
  cache.updatedAtMs = Date.now()
}

export const shouldRefreshContributionDailyCache = ({
  forceRefresh = false,
  isBuild = false,
  nowMs = Date.now()
}: ContributionCacheOptions = {}): boolean => {
  if (forceRefresh || isBuild) return true
  const cache = getLocalDailyCache()
  if (cache.dirty) return true
  if (!Array.isArray(cache.events)) return true
  return cache.dayKey !== getTodayKey(nowMs)
}

export const setContributionEventsToLocalCache = (
  events: unknown,
  nowMs = Date.now()
): LocalDailyCache => {
  const cache = getLocalDailyCache()
  cache.dayKey = getTodayKey(nowMs)
  cache.events = Array.isArray(events) ? events : []
  cache.updatedAtMs = nowMs
  cache.dirty = false
  return cache
}

export const getContributionEventsFromLocalCache = ({
  limit = 50000,
  allowStale = false,
  nowMs = Date.now()
}: ContributionEventsCacheOptions = {}): unknown[] | null => {
  const cache = getLocalDailyCache()
  if (!Array.isArray(cache.events)) return null
  if (!allowStale) {
    if (cache.dirty) return null
    if (cache.dayKey !== getTodayKey(nowMs)) return null
  }
  const safeLimit = Math.max(1, Math.min(100000, Number(limit) || 50000))
  const events = cache.events
  if (events.length <= safeLimit) return events
  return events.slice(events.length - safeLimit)
}

export const filterContributionEventsUntilYesterday = (
  events: unknown,
  nowMs = Date.now()
): unknown[] => {
  const cutoffMs = getYesterdayEndMs(nowMs)
  return (Array.isArray(events) ? events : []).filter(event => {
    const eventRecord = isRecord(event) ? event : {}
    const timestampMs = toTimestampMs(
      eventRecord.timestampMs || eventRecord.timestamp
    )
    return timestampMs > 0 && timestampMs <= cutoffMs
  })
}

const getSupabaseClient = (): SupabaseClient | null => {
  const url = getSupabaseUrl()
  const key = getSupabaseKey()
  if (!url || !key) return null

  if (supabaseClient) return supabaseClient
  supabaseClient = createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  })
  return supabaseClient
}

const ensureLegacyHrefCleanup = async (
  client: SupabaseClient | null
): Promise<boolean> => {
  if (!client) return false
  if (legacyCleanupPromise) return legacyCleanupPromise

  legacyCleanupPromise = (async () => {
    const ignoreMissingColumn = (error: SupabaseErrorLike | null): boolean => {
      if (!error) return false
      const code = String(error.code || '')
      const message = String(error.message || '').toLowerCase()
      return (
        code === '42703' ||
        code === 'PGRST204' ||
        (message.includes('column') && message.includes('href'))
      )
    }

    const { error: eventCleanupError } = await client
      .from(EVENTS_TABLE)
      .update({ href: '' })
      .neq('href', '')
    if (eventCleanupError && !ignoreMissingColumn(eventCleanupError)) {
      console.warn(
        `[Contrib] Supabase 清理旧 href 失败(${EVENTS_TABLE}): ${
          eventCleanupError.message || eventCleanupError.code || eventCleanupError
        }`
      )
    }

    const { error: snapshotCleanupError } = await client
      .from(SNAPSHOTS_TABLE)
      .update({ href: '' })
      .neq('href', '')
    if (snapshotCleanupError && !ignoreMissingColumn(snapshotCleanupError)) {
      console.warn(
        `[Contrib] Supabase 清理旧 href 失败(${SNAPSHOTS_TABLE}): ${
          snapshotCleanupError.message ||
          snapshotCleanupError.code ||
          snapshotCleanupError
        }`
      )
    }

    return true
  })()

  return legacyCleanupPromise
}

const getReadyClient = async (): Promise<SupabaseClient | null> => {
  const client = getSupabaseClient()
  if (!client) return null
  await ensureLegacyHrefCleanup(client)
  return client
}

export const isContributionStoreEnabled = (): boolean => {
  return Boolean(getSupabaseUrl() && getSupabaseKey())
}

export const buildContributionPostSnapshot = (
  post: unknown
): ContributionPostSnapshot | null => {
  const postRecord = isRecord(post) ? post : {}
  const dateRecord = isRecord(postRecord.date) ? postRecord.date : {}
  const repositoryId = normalizeRepositoryId(postRecord.id)
  if (!repositoryId) return null

  const createdAtMs = toTimestampMs(
    postRecord.createdTime || postRecord.publishDate || dateRecord.start_date
  )
  const updatedAtMs = Math.max(
    toTimestampMs(postRecord.lastEditedDate),
    createdAtMs
  )

  return {
    repositoryId,
    title: normalizeText(postRecord.title),
    slug: normalizeText(postRecord.slug),
    createdAtMs,
    updatedAtMs
  }
}

const normalizeEventType = (value: unknown): ContributionEventType =>
  value === 'create' ? 'create' : 'update'

const normalizeRawEvent = (raw: unknown): StoredContributionEvent | null => {
  if (!raw || typeof raw !== 'object') return null
  const rawRecord = raw as Record<string, unknown>
  const type = normalizeEventType(rawRecord.type)
  const repositoryId = normalizeRepositoryId(
    rawRecord.repositoryId || rawRecord.identifier || rawRecord.postId
  )
  const timestampMs = toTimestampMs(
    rawRecord.timestampMs ||
      rawRecord.timestamp ||
      rawRecord.date ||
      rawRecord.time
  )
  if (!repositoryId || !timestampMs) return null

  const candidateEventId = normalizeText(rawRecord.eventId)
  const eventId = candidateEventId || buildEventId(type, repositoryId, timestampMs)

  return {
    event_id: eventId,
    event_type: type,
    repository_id: repositoryId,
    timestamp_ms: timestampMs,
    title: normalizeText(rawRecord.title),
    slug: normalizeText(rawRecord.slug)
  }
}

const loadSnapshotMap = async (
  client: SupabaseClient,
  repositoryIds: readonly string[] | undefined
): Promise<Map<string, ContributionPostSnapshot & { syncedAtMs: number }>> => {
  const map = new Map<string, ContributionPostSnapshot & { syncedAtMs: number }>()
  const uniqueIds = Array.from(new Set((repositoryIds || []).filter(Boolean)))
  if (!uniqueIds.length) return map

  for (const chunk of chunkArray(uniqueIds, 200)) {
    const { data, error } = await client
      .from(SNAPSHOTS_TABLE)
      .select(
        'repository_id, title, slug, created_at_ms, updated_at_ms, synced_at_ms'
      )
      .in('repository_id', chunk)

    if (error) throw error
    const rows = (data || []) as SnapshotRow[]
    rows.forEach(row => {
      const repositoryId = normalizeRepositoryId(row.repository_id)
      if (!repositoryId) return
      map.set(repositoryId, {
        repositoryId,
        title: normalizeText(row.title),
        slug: normalizeText(row.slug),
        createdAtMs: toTimestampMs(row.created_at_ms),
        updatedAtMs: toTimestampMs(row.updated_at_ms),
        syncedAtMs: toTimestampMs(row.synced_at_ms)
      })
    })
  }

  return map
}

const loadExistingEventIds = async (
  client: SupabaseClient,
  eventIds: readonly string[] | undefined
): Promise<Set<string>> => {
  const set = new Set<string>()
  const uniqueIds = Array.from(new Set((eventIds || []).filter(Boolean)))
  if (!uniqueIds.length) return set

  for (const chunk of chunkArray(uniqueIds, 300)) {
    const { data, error } = await client
      .from(EVENTS_TABLE)
      .select('event_id')
      .in('event_id', chunk)

    if (error) throw error
    const rows = (data || []) as EventRow[]
    rows.forEach(row => {
      if (row?.event_id) set.add(normalizeText(row.event_id))
    })
  }
  return set
}

const upsertSnapshots = async (
  client: SupabaseClient,
  snapshots: readonly SnapshotUpsertRow[]
): Promise<void> => {
  if (!snapshots.length) return

  for (const chunk of chunkArray(snapshots, 200)) {
    const { error } = await client
      .from(SNAPSHOTS_TABLE)
      .upsert(chunk, { onConflict: 'repository_id' })
    if (error) throw error
  }
}

const upsertEvents = async (
  client: SupabaseClient,
  events: readonly StoredContributionEvent[]
): Promise<void> => {
  if (!events.length) return

  for (const chunk of chunkArray(events, 200)) {
    const { error } = await client
      .from(EVENTS_TABLE)
      .upsert(chunk, { onConflict: 'event_id', ignoreDuplicates: true })
    if (error) throw error
  }
}

export const upsertContributionEvents = async (
  rawEvents: unknown
): Promise<ContributionEventUpsertResult> => {
  const client = await getReadyClient()
  if (!client) {
    return { enabled: false, attempted: 0, inserted: 0 }
  }

  const events = Array.isArray(rawEvents)
    ? rawEvents.map(normalizeRawEvent).filter(isNotNull)
    : []
  if (!events.length) {
    return { enabled: true, attempted: 0, inserted: 0 }
  }

  const existingIds = await loadExistingEventIds(
    client,
    events.map(event => event.event_id)
  )
  const pendingEvents = events.filter(event => !existingIds.has(event.event_id))
  await upsertEvents(client, pendingEvents)

  return {
    enabled: true,
    attempted: events.length,
    inserted: pendingEvents.length
  }
}

export const syncContributionSnapshots = async (
  postSnapshots: unknown
): Promise<ContributionSnapshotSyncResult> => {
  const client = await getReadyClient()
  if (!client) {
    return { enabled: false, scanned: 0, addedEvents: 0, attemptedEvents: 0 }
  }

  const snapshots = Array.isArray(postSnapshots) ? postSnapshots : []
  if (!snapshots.length) {
    return { enabled: true, scanned: 0, addedEvents: 0, attemptedEvents: 0 }
  }

  const normalizedSnapshots = snapshots
    .map(snapshot => {
      const snapshotRecord = isRecord(snapshot) ? snapshot : {}
      const repositoryId = normalizeRepositoryId(snapshotRecord.repositoryId)
      if (!repositoryId) return null

      const createdAtMs = toTimestampMs(snapshotRecord.createdAtMs)
      const updatedAtMs = Math.max(
        toTimestampMs(snapshotRecord.updatedAtMs),
        createdAtMs
      )

      return {
        repositoryId,
        title: normalizeText(snapshotRecord.title),
        slug: normalizeText(snapshotRecord.slug),
        createdAtMs: createdAtMs || updatedAtMs,
        updatedAtMs
      }
    })
    .filter(isNotNull)

  if (!normalizedSnapshots.length) {
    return { enabled: true, scanned: 0, addedEvents: 0, attemptedEvents: 0 }
  }

  const prevMap = await loadSnapshotMap(
    client,
    normalizedSnapshots.map(snapshot => snapshot.repositoryId)
  )

  const nowMs = Date.now()
  const eventsToInsert: StoredContributionEvent[] = []
  const snapshotsToUpsert = normalizedSnapshots.map(snapshot => ({
    repository_id: snapshot.repositoryId,
    title: snapshot.title,
    slug: snapshot.slug,
    created_at_ms: snapshot.createdAtMs,
    updated_at_ms: snapshot.updatedAtMs,
    synced_at_ms: nowMs
  }))

  normalizedSnapshots.forEach(snapshot => {
    const prev = prevMap.get(snapshot.repositoryId)
    if (!prev) {
      const createTimestamp = snapshot.createdAtMs || snapshot.updatedAtMs
      if (createTimestamp) {
        eventsToInsert.push({
          event_id: buildEventId('create', snapshot.repositoryId, createTimestamp),
          event_type: 'create',
          repository_id: snapshot.repositoryId,
          timestamp_ms: createTimestamp,
          title: snapshot.title,
          slug: snapshot.slug
        })
      }

      const hasHistoricalUpdate =
        snapshot.updatedAtMs &&
        createTimestamp &&
        snapshot.updatedAtMs > createTimestamp
      if (hasHistoricalUpdate) {
        eventsToInsert.push({
          event_id: buildEventId('update', snapshot.repositoryId, snapshot.updatedAtMs),
          event_type: 'update',
          repository_id: snapshot.repositoryId,
          timestamp_ms: snapshot.updatedAtMs,
          title: snapshot.title,
          slug: snapshot.slug
        })
      }
      return
    }

    const previousUpdatedAtMs = toTimestampMs(prev.updatedAtMs)
    const shouldAppendUpdate =
      snapshot.updatedAtMs && snapshot.updatedAtMs > previousUpdatedAtMs
    if (shouldAppendUpdate) {
      const updateTimestamp = snapshot.updatedAtMs
      eventsToInsert.push({
        event_id: buildEventId('update', snapshot.repositoryId, updateTimestamp),
        event_type: 'update',
        repository_id: snapshot.repositoryId,
        timestamp_ms: updateTimestamp,
        title: snapshot.title,
        slug: snapshot.slug
      })
    }
  })

  const existingIds = await loadExistingEventIds(
    client,
    eventsToInsert.map(event => event.event_id)
  )
  const pendingEvents = eventsToInsert.filter(
    event => !existingIds.has(event.event_id)
  )

  await upsertSnapshots(client, snapshotsToUpsert)
  await upsertEvents(client, pendingEvents)

  return {
    enabled: true,
    scanned: normalizedSnapshots.length,
    attemptedEvents: eventsToInsert.length,
    addedEvents: pendingEvents.length
  }
}

export const listContributionEvents = async ({
  limit = 50000
}: ListContributionEventsOptions = {}): Promise<ListedContributionEvent[]> => {
  const client = await getReadyClient()
  if (!client) return []

  const safeLimit = Math.max(1, Math.min(100000, Number(limit) || 50000))
  const { data, error } = await client
    .from(EVENTS_TABLE)
    .select('event_id, event_type, repository_id, timestamp_ms, title, slug')
    .order('timestamp_ms', { ascending: false })
    .limit(safeLimit)

  if (error) throw error

  const rows = (data || []) as EventRow[]
  return rows
    .slice()
    .sort((a, b) => toTimestampMs(a?.timestamp_ms) - toTimestampMs(b?.timestamp_ms))
    .map(row => {
      const repositoryId = normalizeRepositoryId(row.repository_id)
      const timestampMs = toTimestampMs(row.timestamp_ms)
      const type: ContributionEventType =
        row.event_type === 'create' ? 'create' : 'update'
      if (!repositoryId || !timestampMs) return null
      return {
        eventId: normalizeText(row.event_id),
        type,
        repositoryId,
        identifier: repositoryId,
        timestampMs,
        title: normalizeText(row.title),
        slug: normalizeText(row.slug),
        href: buildHrefFromSlug(row.slug)
      }
    })
    .filter(isNotNull)
}
