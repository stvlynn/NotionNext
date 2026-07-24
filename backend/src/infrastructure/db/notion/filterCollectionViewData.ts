type NotionRecord = Record<string, unknown>
type NotionRecordTable = Record<string, unknown>
type Schema = Record<string, PropertySchema | undefined>

interface BlockMap extends NotionRecord {
  collection_view?: NotionRecordTable
  collection_query?: NotionRecordTable
  collection?: NotionRecordTable
  block?: NotionRecordTable
}

interface CollectionFilter {
  operator?: string
  filters?: CollectionFilter[]
  property?: string
  filter?: PropertyFilter
}

interface PropertyFilter extends NotionRecord {
  operator?: string
  value?: unknown
}

interface CollectionSort {
  property: string
  direction: string
}

interface PropertySchema extends NotionRecord {
  name?: string
  type?: string
  groups?: StatusGroup[]
  options?: StatusOption[]
}

interface StatusGroup {
  name?: string
  optionIds?: string[]
}

interface StatusOption {
  id?: string
  value?: string
}

function asRecord(value: unknown): NotionRecord | null {
  return value !== null && typeof value === 'object'
    ? (value as NotionRecord)
    : null
}

function asRecordTable(value: unknown): NotionRecordTable | undefined {
  return asRecord(value) ?? undefined
}

function getRecordValue(entry: unknown): NotionRecord | null {
  const record = asRecord(entry)
  const value = asRecord(record?.value)
  return value ?? record
}

function getNestedRecord(entry: unknown): NotionRecord | null {
  const first = asRecord(entry)
  return asRecord(asRecord(first?.value)?.value) ?? asRecord(first?.value) ?? first
}

function isCollectionFilter(value: CollectionFilter | null): value is CollectionFilter {
  return Boolean(value)
}

function isCollectionSort(value: CollectionSort | null): value is CollectionSort {
  return Boolean(value)
}

function filterCollectionViewData(blockMap: BlockMap): void {
  if (!blockMap?.collection_view || !blockMap?.collection_query) return

  normalizeCollectionQueryResults(blockMap.collection_query)

  const inheritedFilters = getInheritedCollectionViewFilters(blockMap)

  Object.values(blockMap.collection_view).forEach(entry => {
    const view = getNestedRecord(entry)
    if (!view?.id) return

    const format = asRecord(view.format)
    const collectionPointer = asRecord(format?.collection_pointer)
    const collectionId = collectionPointer?.id
    const filter = getCollectionViewFilter(view) || inheritedFilters[String(view.id)]
    const collection = getRecordById(blockMap.collection, collectionId)
    const collectionValue = asRecord(asRecord(collection)?.value)
    const schema = (collectionValue?.schema || asRecord(collection)?.schema || {}) as Schema
    const collectionQuery = getRecordById(blockMap.collection_query, collectionId)
    const viewQuery = getRecordById(asRecordTable(collectionQuery), view.id)
    const sorts = getCollectionViewSorts(view)

    if (!collectionId || !viewQuery) return

    const viewQueryRecord = asRecord(viewQuery)
    if (!viewQueryRecord) return

    const matchesBlockFilter = (blockId: string): boolean => {
      const block = getRecordValue(asRecord(blockMap.block)?.[blockId])
      return matchesCollectionFilter(block, filter, schema)
    }
    const compareBlocks = (leftId: string, rightId: string): number =>
      compareCollectionBlocks(
        getRecordValue(asRecord(blockMap.block)?.[leftId]),
        getRecordValue(asRecord(blockMap.block)?.[rightId]),
        sorts,
        schema
      )

    if (filter) {
      filterBlockIdsInPlace(viewQueryRecord, matchesBlockFilter)
    }

    if (sorts.length > 0) {
      sortBlockIdsInPlace(viewQueryRecord, compareBlocks)
    }

    const pageSort = view.page_sort
    if (Array.isArray(pageSort)) {
      view.page_sort = filter
        ? pageSort.filter(matchesBlockFilter)
        : [...pageSort]

      if (sorts.length > 0) {
        view.page_sort = sortBlockIds(view.page_sort as string[], compareBlocks)
      }
    }
  })
}

function normalizeCollectionQueryResults(collectionQuery: NotionRecordTable): void {
  Object.values(collectionQuery || {}).forEach(collectionViews => {
    Object.values(asRecord(collectionViews) || {}).forEach(viewData => {
      const viewDataRecord = asRecord(viewData)
      if (!viewDataRecord) return

      const reducerResults = asRecord(viewDataRecord.reducerResults)
      const reducerGroupResults = reducerResults?.collection_group_results
      if (!viewDataRecord.collection_group_results && reducerGroupResults) {
        viewDataRecord.collection_group_results = reducerGroupResults
      }
    })
  })
}

function getInheritedCollectionViewFilters(
  blockMap: BlockMap
): Record<string, CollectionFilter> {
  const inheritedFilters: Record<string, CollectionFilter> = {}

  Object.values(blockMap.block || {}).forEach(entry => {
    const block = getRecordValue(entry)
    if (block?.type !== 'collection_view' || !Array.isArray(block.view_ids)) {
      return
    }

    const viewIds = block.view_ids.filter(
      (viewId): viewId is string => typeof viewId === 'string'
    )
    const firstSiblingFilter = viewIds
      .map(viewId => {
        const view = getRecordById(blockMap.collection_view, viewId)
        const viewValue = getNestedRecord(view)
        return getCollectionViewFilter(viewValue)
      })
      .find(isCollectionFilter)

    if (!firstSiblingFilter) return

    viewIds.forEach(viewId => {
      const view = getRecordById(blockMap.collection_view, viewId)
      const viewValue = getNestedRecord(view)
      if (!getCollectionViewFilter(viewValue)) {
        inheritedFilters[String(viewValue?.id || viewId)] = firstSiblingFilter
      }
    })
  })

  return inheritedFilters
}

function getCollectionViewFilter(
  view: NotionRecord | null
): CollectionFilter | null {
  const filters: CollectionFilter[] = []
  const format = asRecord(view?.format)
  const propertyFilters = format?.property_filters

  if (Array.isArray(propertyFilters)) {
    filters.push(
      ...propertyFilters
        .map(filterItem => normalizePropertyFilter(filterItem))
        .filter(isCollectionFilter)
    )
  }

  const query2 = asRecord(view?.query2)
  const queryFilterValue = query2?.filter
  if (queryFilterValue) {
    const queryFilter = normalizeFilter(queryFilterValue)
    if (queryFilter) filters.push(queryFilter)
  }

  if (filters.length === 0) return null
  if (filters.length === 1) return filters[0] ?? null

  return {
    operator: typeof view?.filter_operator === 'string' ? view.filter_operator : 'and',
    filters
  }
}

function normalizeFilter(filter: unknown): CollectionFilter | null {
  const filterRecord = asRecord(filter)
  if (!filterRecord) return null

  if (Array.isArray(filterRecord.filters)) {
    return {
      operator:
        typeof filterRecord.operator === 'string' ? filterRecord.operator : 'and',
      filters: filterRecord.filters
        .map(child => normalizeFilter(child))
        .filter(isCollectionFilter)
    }
  }

  return normalizePropertyFilter(filterRecord)
}

function normalizePropertyFilter(filterItem: unknown): CollectionFilter | null {
  const filterItemRecord = asRecord(filterItem)
  const nestedFilter = asRecord(filterItemRecord?.filter)
  const property = filterItemRecord?.property || nestedFilter?.property
  const filter = asRecord(nestedFilter?.filter) || nestedFilter

  if (!property || !filter) return null

  return {
    property: property as string,
    filter: filter as PropertyFilter
  }
}

function filterBlockIdsInPlace(
  value: unknown,
  predicate: (blockId: string) => boolean
): void {
  const record = asRecord(value)
  if (!record) return

  if (Array.isArray(record.blockIds)) {
    record.blockIds = record.blockIds
      .filter((blockId): blockId is string => typeof blockId === 'string')
      .filter(predicate)
  }

  Object.values(record).forEach(child => filterBlockIdsInPlace(child, predicate))
}

function sortBlockIdsInPlace(
  value: unknown,
  compare: (leftId: string, rightId: string) => number
): void {
  const record = asRecord(value)
  if (!record) return

  if (Array.isArray(record.blockIds)) {
    record.blockIds = sortBlockIds(
      record.blockIds.filter(
        (blockId): blockId is string => typeof blockId === 'string'
      ),
      compare
    )
  }

  Object.values(record).forEach(child => sortBlockIdsInPlace(child, compare))
}

function sortBlockIds(
  blockIds: string[],
  compare: (leftId: string, rightId: string) => number
): string[] {
  return blockIds
    .map((id, index) => ({ id, index }))
    .sort(
      (left, right) => compare(left.id, right.id) || left.index - right.index
    )
    .map(item => item.id)
}

function matchesCollectionFilter(
  block: NotionRecord | null | undefined,
  filter: CollectionFilter | null | undefined,
  schema: Schema = {}
): boolean {
  const properties = asRecord(block?.properties)
  if (!properties) return false

  if (Array.isArray(filter?.filters)) {
    const matcher = (child: CollectionFilter): boolean =>
      matchesCollectionFilter(block, child, schema)
    return filter.operator === 'or'
      ? filter.filters.some(matcher)
      : filter.filters.every(matcher)
  }

  const propertyId = filter?.property
  const propertyFilter = filter?.filter
  if (!propertyId || !propertyFilter) return true

  const values = getPropertyValues(properties[propertyId])
  return matchesFilter(values, propertyFilter, schema[propertyId])
}

function matchesPropertyFilters(
  block: NotionRecord | null | undefined,
  filters: unknown[],
  schema: Schema = {}
): boolean {
  return matchesCollectionFilter(
    block,
    {
      operator: 'and',
      filters: filters.map(normalizePropertyFilter).filter(isCollectionFilter)
    },
    schema
  )
}

function getCollectionViewSorts(view: NotionRecord | null): CollectionSort[] {
  const query2 = asRecord(view?.query2)
  const format = asRecord(view?.format)
  const sorts = query2?.sort || query2?.sorts || format?.collection_sort

  if (!Array.isArray(sorts)) return []

  return sorts
    .map(sort => {
      const sortRecord = asRecord(sort)
      const property = sortRecord?.property || sortRecord?.property_id
      if (!property) return null

      return {
        property: property as string,
        direction:
          typeof sortRecord?.direction === 'string'
            ? sortRecord.direction
            : typeof sortRecord?.sort === 'string'
              ? sortRecord.sort
              : 'ascending'
      }
    })
    .filter(isCollectionSort)
}

function compareCollectionBlocks(
  left: NotionRecord | null | undefined,
  right: NotionRecord | null | undefined,
  sorts: CollectionSort[],
  schema: Schema = {}
): number {
  for (const sort of sorts) {
    const propertyId = getSchemaPropertyId(schema, sort.property)
    const propertySchema = schema[propertyId] || {}
    const direction = String(sort.direction).toLowerCase()
    const multiplier =
      direction === 'descending' || direction === 'desc' ? -1 : 1
    const result =
      comparePropertyValues(
        getSortValue(left, propertyId, propertySchema),
        getSortValue(right, propertyId, propertySchema),
        propertySchema
      ) * multiplier

    if (result !== 0) return result
  }

  return 0
}

function getSchemaPropertyId(schema: Schema, property: string): string {
  if (schema[property]) return property

  return (
    Object.entries(schema).find(([, propertySchema]) => {
      return propertySchema?.name === property
    })?.[0] || property
  )
}

function getSortValue(
  block: NotionRecord | null | undefined,
  propertyId: string,
  propertySchema: PropertySchema
): unknown {
  const properties = asRecord(block?.properties)
  const values = getPropertyValues(properties?.[propertyId])
  if (propertySchema?.type === 'date') {
    return values.map(normalizeDateTime).find(Boolean)
  }

  return expandPropertyValues(values, propertySchema)[0]
}

function comparePropertyValues(
  left: unknown,
  right: unknown,
  propertySchema: PropertySchema
): number {
  const leftEmpty = left === undefined || left === null || left === ''
  const rightEmpty = right === undefined || right === null || right === ''
  if (leftEmpty || rightEmpty) {
    if (leftEmpty && rightEmpty) return 0
    return leftEmpty ? 1 : -1
  }

  if (propertySchema?.type === 'number') {
    const leftNumber = toNumber(left)
    const rightNumber = toNumber(right)
    if (leftNumber !== null && rightNumber !== null) {
      return leftNumber - rightNumber
    }
  }

  if (propertySchema?.type === 'date') {
    return normalizeDateTime(left).localeCompare(normalizeDateTime(right))
  }

  return String(left).localeCompare(String(right), undefined, {
    numeric: true,
    sensitivity: 'base'
  })
}

function matchesFilter(
  values: string[],
  filter: PropertyFilter,
  propertySchema?: PropertySchema
): boolean {
  const expectedValues = getExpectedValues(filter.value, propertySchema)
  const actualValues = expandPropertyValues(values, propertySchema)
  const actualText = actualValues.join(' ')
  const expectedText = expectedValues.join(' ')

  switch (filter.operator) {
    case 'enum_is':
    case 'status_is':
      return expectedValues.some(value => actualValues.includes(value))
    case 'enum_is_not':
    case 'status_is_not':
      return expectedValues.every(value => !actualValues.includes(value))
    case 'enum_contains':
    case 'multi_select_contains':
      return expectedValues.some(value => actualValues.includes(value))
    case 'enum_does_not_contain':
    case 'multi_select_does_not_contain':
      return expectedValues.every(value => !actualValues.includes(value))
    case 'string_contains':
      return expectedValues.some(value =>
        actualValues.some(current => current.includes(value))
      )
    case 'string_does_not_contain':
      return expectedValues.every(value =>
        actualValues.every(current => !current.includes(value))
      )
    case 'string_is':
      return expectedValues.some(value => actualValues.includes(value))
    case 'string_is_not':
      return expectedValues.every(value => !actualValues.includes(value))
    case 'string_starts_with':
      return expectedValues.some(value => actualText.startsWith(value))
    case 'string_ends_with':
      return expectedValues.some(value => actualText.endsWith(value))
    case 'checkbox_is':
      return toBoolean(actualValues[0]) === toBoolean(expectedValues[0])
    case 'checkbox_is_not':
      return toBoolean(actualValues[0]) !== toBoolean(expectedValues[0])
    case 'number_equals':
      return toNumber(actualValues[0]) === toNumber(expectedValues[0])
    case 'number_does_not_equal':
      return toNumber(actualValues[0]) !== toNumber(expectedValues[0])
    case 'number_greater_than':
      return Number(toNumber(actualValues[0])) > Number(toNumber(expectedValues[0]))
    case 'number_less_than':
      return Number(toNumber(actualValues[0])) < Number(toNumber(expectedValues[0]))
    case 'number_greater_than_or_equal_to':
      return Number(toNumber(actualValues[0])) >= Number(toNumber(expectedValues[0]))
    case 'number_less_than_or_equal_to':
      return Number(toNumber(actualValues[0])) <= Number(toNumber(expectedValues[0]))
    case 'date_is':
      return normalizeDate(actualValues[0]) === normalizeDate(expectedValues[0])
    case 'date_is_before':
      return normalizeDate(actualValues[0]) < normalizeDate(expectedValues[0])
    case 'date_is_after':
      return normalizeDate(actualValues[0]) > normalizeDate(expectedValues[0])
    case 'date_is_on_or_before':
      return normalizeDate(actualValues[0]) <= normalizeDate(expectedValues[0])
    case 'date_is_on_or_after':
      return normalizeDate(actualValues[0]) >= normalizeDate(expectedValues[0])
    case 'relation_contains':
    case 'person_contains':
      return expectedValues.some(value => actualValues.includes(value))
    case 'relation_does_not_contain':
    case 'person_does_not_contain':
      return expectedValues.every(value => !actualValues.includes(value))
    case 'is_empty':
      return actualValues.length === 0
    case 'is_not_empty':
      return actualValues.length > 0
    default:
      return true
  }
}

function getPropertyValues(property: unknown): string[] {
  if (!Array.isArray(property)) return []

  const values: string[] = []

  property.forEach(item => {
    if (!Array.isArray(item)) return

    const plainValue = item[0]
    if (plainValue !== undefined && plainValue !== null && plainValue !== '') {
      values.push(String(plainValue))
    }

    const decorations = item[1]
    if (!Array.isArray(decorations)) return

    decorations.forEach(decoration => {
      if (!Array.isArray(decoration)) return

      const metadata = asRecord(decoration[1])
      if (metadata?.start_date && metadata?.start_time) {
        values.push(`${metadata.start_date} ${metadata.start_time}`)
      }

      ;[
        metadata?.id,
        metadata?.page_id,
        metadata?.user_id,
        metadata?.value,
        metadata?.start_date
      ].forEach(value => {
        if (value !== undefined && value !== null && value !== '') {
          values.push(String(value))
        }
      })
    })
  })

  return Array.from(new Set(values))
}

function getExpectedValues(
  value: unknown,
  propertySchema?: PropertySchema
): string[] {
  if (Array.isArray(value)) {
    return value.flatMap(item => getExpectedValues(item, propertySchema))
  }

  const valueRecord = asRecord(value)
  if (valueRecord?.value !== undefined && valueRecord.value !== null) {
    return expandStatusGroupValue(String(valueRecord.value), propertySchema)
  }
  if (valueRecord?.start_date) return [String(valueRecord.start_date)]
  if (valueRecord?.id) return [String(valueRecord.id)]
  if (value !== undefined && value !== null) return [String(value)]

  return []
}

function expandPropertyValues(
  values: string[],
  propertySchema?: PropertySchema
): string[] {
  if (propertySchema?.type === 'date') {
    const dates = values.map(normalizeDate).filter(Boolean)
    return dates.length > 0 ? Array.from(new Set(dates)) : values
  }

  if (propertySchema?.type === 'multi_select') {
    return Array.from(
      new Set(
        values.flatMap(value => {
          const text = String(value)
          const parts = text
            .split(',')
            .map(item => item.trim())
            .filter(Boolean)

          return parts.length > 1 ? [text, ...parts] : [text]
        })
      )
    )
  }

  if (propertySchema?.type !== 'status') return values

  const groups = Array.isArray(propertySchema.groups)
    ? propertySchema.groups
    : undefined
  const options = Array.isArray(propertySchema.options)
    ? propertySchema.options
    : undefined
  const groupValues = groups
    ?.filter(group =>
      options?.some(
        option =>
          typeof option.value === 'string' &&
          values.includes(option.value) &&
          typeof option.id === 'string' &&
          group.optionIds?.includes(option.id)
      )
    )
    .map(group => group.name)
    .filter((name): name is string => typeof name === 'string')

  return Array.from(new Set([...values, ...(groupValues || [])]))
}

function expandStatusGroupValue(
  value: string,
  propertySchema?: PropertySchema
): string[] {
  if (propertySchema?.type !== 'status') return [value]

  const groups = Array.isArray(propertySchema.groups)
    ? propertySchema.groups
    : undefined
  const options = Array.isArray(propertySchema.options)
    ? propertySchema.options
    : undefined
  const group = groups?.find(group => group.name === value)
  if (!group) return [value]

  const optionValues = options
    ?.filter(
      option =>
        typeof option.id === 'string' && group.optionIds?.includes(option.id)
    )
    .map(option => option.value)
    .filter((optionValue): optionValue is string => typeof optionValue === 'string')

  return [value, ...(optionValues || [])]
}

function toBoolean(value: unknown): boolean {
  return value === true || value === 'true' || value === 'Yes' || value === '1'
}

function toNumber(value: unknown): number | null {
  const number = Number(value)
  return Number.isNaN(number) ? null : number
}

function normalizeDate(value: unknown): string {
  if (!value) return ''
  return String(value).match(/\d{4}-\d{2}-\d{2}/)?.[0] || ''
}

function normalizeDateTime(value: unknown): string {
  if (!value) return ''
  const text = String(value)
  const date = normalizeDate(text)
  const time = text.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/)
  return date && time
    ? `${date}T${time[1]?.padStart(2, '0')}:${time[2]}:${time[3] || '00'}`
    : date
}

function getRecordById(
  record: NotionRecordTable | undefined,
  id: unknown
): unknown | null {
  if (!record || !id) return null

  for (const candidate of getIdCandidates(id)) {
    const value = record[candidate]
    if (value) return value
  }

  return null
}

function getIdCandidates(id: unknown): string[] {
  const candidates = new Set<string>([String(id)])

  if (typeof id === 'string') {
    const compactId = id.replace(/-/g, '')
    candidates.add(compactId)

    if (/^[0-9a-fA-F]{32}$/.test(compactId)) {
      candidates.add(
        [
          compactId.slice(0, 8),
          compactId.slice(8, 12),
          compactId.slice(12, 16),
          compactId.slice(16, 20),
          compactId.slice(20)
        ].join('-')
      )
    }
  }

  return Array.from(candidates)
}

export {
  filterCollectionViewData,
  matchesCollectionFilter,
  matchesPropertyFilters
}
