type OfficialPropertyValue = string | number | boolean | null

interface NotionRichText {
  plain_text?: string
}

interface NotionProperty {
  type?: string
  title?: NotionRichText[]
  rich_text?: NotionRichText[]
  url?: string | null
  select?: { name?: string } | null
  status?: { name?: string } | null
  checkbox?: boolean | null
  number?: number | null
  date?: { start?: string } | null
  email?: string | null
  phone_number?: string | null
}

interface OfficialMemberPage {
  id: string
  created_time?: string
  last_edited_time?: string
  properties?: Record<string, NotionProperty>
  icon?: {
    type?: string
    external?: {
      url?: string
    }
  } | null
  cover?: {
    type?: string
    external?: {
      url?: string
    }
  } | null
}

interface MapOfficialMemberOptions {
  statusProperty?: string
}

interface OfficialMember {
  id: string
  title: string
  slug: string
  type: 'Member'
  status: OfficialPropertyValue
  summary: OfficialPropertyValue
  avatar: OfficialPropertyValue
  role: OfficialPropertyValue
  bio: OfficialPropertyValue
  quote: OfficialPropertyValue
  featured: OfficialPropertyValue
  verified: OfficialPropertyValue
  website: OfficialPropertyValue
  joinedAtText: OfficialPropertyValue
  sortOrder: OfficialPropertyValue
  author_slug: OfficialPropertyValue
  social_github: OfficialPropertyValue
  social_x: OfficialPropertyValue
  social_linkedin: OfficialPropertyValue
  publishDate: number
  lastEditedDate: number
  pageIcon: string | null
  pageCover: string | null
  pageCoverThumbnail: string | null
  ext: Record<string, unknown>
  href: string
}

interface FetchMembersOptions {
  typeProperty?: string
  statusProperty?: string
  typeValue?: string
  statusValue?: string
}

interface NotionQueryResponse {
  has_more?: boolean
  next_cursor?: string | null
  results?: OfficialMemberPage[]
}

function isNotionQueryResponse(value: unknown): value is NotionQueryResponse {
  return value !== null && typeof value === 'object'
}

function readPropertyValue(property: NotionProperty | undefined): OfficialPropertyValue {
  if (!property) return null
  const type = property.type
  switch (type) {
    case 'title':
      return property.title?.map(t => t.plain_text).join('') || null
    case 'rich_text':
      return property.rich_text?.map(t => t.plain_text).join('') || null
    case 'url':
      return property.url || null
    case 'select':
      return property.select?.name || null
    case 'status':
      return property.status?.name || null
    case 'checkbox':
      return property.checkbox ?? null
    case 'number':
      return property.number ?? null
    case 'date':
      return property.date?.start || null
    case 'email':
      return property.email || null
    case 'phone_number':
      return property.phone_number || null
    default:
      return null
  }
}

function findPropertyKey(
  properties: Record<string, NotionProperty> | undefined,
  candidates: string[]
): string | null {
  if (!properties) return null
  for (const candidate of candidates) {
    if (properties[candidate]) return candidate
    const lower = candidate.toLowerCase()
    for (const key of Object.keys(properties)) {
      if (key.toLowerCase() === lower) return key
    }
  }
  return null
}

export function mapOfficialMemberPage(
  page: OfficialMemberPage,
  { statusProperty = 'status' }: MapOfficialMemberOptions = {}
): OfficialMember | null {
  const props = page.properties || {}
  const get = (candidates: string | string[]): OfficialPropertyValue => {
    const key = findPropertyKey(
      props,
      Array.isArray(candidates) ? candidates : [candidates]
    )
    return key ? readPropertyValue(props[key]) : null
  }

  const title = get(['title', 'Title']) as string | null
  const slug = get(['slug', 'Slug']) as string | null
  if (!title || !slug) return null

  return {
    id: page.id,
    title,
    slug: slug.startsWith('members/') ? slug : `members/${slug}`,
    type: 'Member',
    status: get([statusProperty, 'status', 'Status']) || 'Published',
    summary: get(['summary', 'Summary']) || '',
    avatar: get(['avatar', 'Avatar']) || null,
    role: get(['role', 'Role']) || '',
    bio: get(['bio', 'Bio']) || '',
    quote: get(['quote', 'Quote']) || '',
    featured: get(['featured', 'Featured']) || false,
    verified: get(['verified', 'Verified']) || false,
    website: get(['website', 'Website']) || null,
    joinedAtText: get(['joinedAtText', 'joined_at_text', 'Joined At']) || '',
    sortOrder: get(['sortOrder', 'sort_order', 'Sort Order']) ?? null,
    author_slug: get(['author_slug', 'authorSlug', 'Author Slug']) || '',
    social_github: get(['social_github', 'github', 'GitHub']) || null,
    social_x: get(['social_x', 'twitter', 'x', 'Twitter', 'X']) || null,
    social_linkedin: get(['social_linkedin', 'linkedin', 'LinkedIn']) || null,
    publishDate: page.created_time ? new Date(page.created_time).getTime() : Date.now(),
    lastEditedDate: page.last_edited_time
      ? new Date(page.last_edited_time).getTime()
      : Date.now(),
    pageIcon: page.icon?.type === 'external' ? page.icon.external?.url || null : null,
    pageCover:
      page.cover?.type === 'external' ? page.cover.external?.url || null : null,
    pageCoverThumbnail:
      page.cover?.type === 'external' ? page.cover.external?.url || null : null,
    ext: {},
    href: `/members/${slug.replace(/^members\//, '')}`
  }
}

export async function fetchMembersFromOfficialAPI({
  typeProperty = 'type',
  statusProperty = 'status',
  typeValue = 'Member',
  statusValue = 'Published'
}: FetchMembersOptions = {}): Promise<OfficialMember[]> {
  const token = process.env.NOTION_API_TOKEN
  const dataSourceId = process.env.NOTION_MEMBERS_DATA_SOURCE_ID

  if (!token || !dataSourceId) return []

  try {
    const members: OfficialMember[] = []
    let startCursor: string | undefined = undefined

    do {
      const response: Response = await fetch(
        `https://api.notion.com/v1/data_sources/${dataSourceId}/query`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Notion-Version': '2022-06-28',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            filter: { property: typeProperty, select: { equals: typeValue } },
            page_size: 100,
            ...(startCursor ? { start_cursor: startCursor } : {})
          })
        }
      )

      if (!response.ok) {
        console.error('[memberDataSource] API request failed:', response.status)
        return members
      }

      const data: unknown = await response.json()
      if (!isNotionQueryResponse(data)) {
        return members
      }

      members.push(
        ...(data.results || [])
          .map(page => mapOfficialMemberPage(page, { statusProperty }))
          .filter(
            (member): member is OfficialMember => member?.status === statusValue
          )
      )
      startCursor = data.has_more ? data.next_cursor ?? undefined : undefined
    } while (startCursor)

    console.log(`[memberDataSource] Fetched ${members.length} members from official API`)
    return members
  } catch (error) {
    console.error('[memberDataSource] Error fetching members:', error)
    return []
  }
}
