interface ArticleCopyrightPost {
  copyright?: unknown
}

interface ArticleCopyrightLocale {
  COMMON?: {
    COPYRIGHT_NOTICE?: string
  }
}

export function resolveArticleCopyrightText({
  post,
  locale,
  mode
}: {
  post?: ArticleCopyrightPost
  locale?: ArticleCopyrightLocale
  mode?: unknown
}): string {
  const rawCopyright = post?.copyright
  const customCopyright =
    typeof rawCopyright === 'string' ? rawCopyright.trim() : rawCopyright
  const hasCustomCopyright =
    customCopyright !== undefined &&
    customCopyright !== null &&
    String(customCopyright).trim() !== ''

  if (mode === false || mode === 'false') {
    return ''
  }

  if (mode === 'custom' && !hasCustomCopyright) {
    return ''
  }

  return hasCustomCopyright
    ? String(customCopyright)
    : locale?.COMMON?.COPYRIGHT_NOTICE || ''
}
