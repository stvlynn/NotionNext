# UI Patterns

## Semantic styling

Use semantic class names and theme tokens. NotionNext uses Tailwind CSS plus theme color tokens defined in `frontend/src/shared/config/themeColorPalette.ts`. Do not hardcode colors; reference tokens.

## No hardcoded copy

All user-facing text must be defined through the i18n system in `frontend/src/shared/lib/lang/` and referenced by key. Do not inline Chinese or English strings in components.

## No redundant copy

Do not repeat information already conveyed by a title, icon, selected state, or surrounding context.

## No duplicated implementations

If a piece of UI logic already exists (e.g. a date formatter, a collapse component), reuse it from `frontend/src/shared`. Do not copy-paste with minor variations.

## Theme awareness

Components must work across the 29 themes under `frontend/src/shared/themes/`. Theme-specific overrides belong in the theme package, not in shared components.

## Notion post embeds

`NotionPage` routes X and Twitter post URLs in generic Notion Embed blocks
through the same `react-tweet-embed` adapter used for Tweet blocks. Match the
hostname and status path, keep the numeric post ID as a string, and omit share
query parameters. The adapter loads X's official widget with `dnt` enabled and
remounts when the post ID changes. Direct X page iframes are blocked by X's
`frame-ancestors` policy.

HTML artifacts retain their sandboxed `srcDoc` renderer. Other embeds retain
their resolved source and configured dimensions.
