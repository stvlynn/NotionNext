declare const slugBrand: unique symbol

export type Slug = string & {
  readonly [slugBrand]: 'Slug'
}

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export function isSlug(value: unknown): value is Slug {
  return typeof value === 'string' && SLUG_PATTERN.test(value.trim())
}

export function createSlug(value: string): Slug {
  const normalized = value.trim()

  if (!isSlug(normalized)) {
    throw new Error('Invalid slug')
  }

  return normalized
}
