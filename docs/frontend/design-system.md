# Design system: Navy Ink + coss UI

The frontend uses [coss UI](https://coss.com/ui) (Base UI + Tailwind) recoloured
to the [navy-ink design system](https://github.com/stvlynn/navy-ink-design-system):
a cool silver-white light mode, a navy-ink dark mode, and a single
cornflower-blue accent. It ships as a dedicated theme (`navyink`) so the 26
legacy themes are unaffected.

## Tailwind v4

The project runs Tailwind CSS **v4** via `@tailwindcss/postcss`
(`frontend/postcss.config.js`). The entry stylesheet
`frontend/src/shared/styles/globals.css` uses the v4 directives:

```css
@import 'tailwindcss';
@import 'tw-animate-css';
@import './navy-ink.css';
@config '../../../tailwind.config.js';
```

The legacy `tailwind.config.js` is still loaded via `@config` so existing
themes keep their custom colours, breakpoints, fonts, and shadows. Three v4
compatibility shims live in `globals.css`:

- `dark-variant.css` — `@custom-variant dark (&:where(.dark, .dark *))` so
  `dark:` follows `html.dark` instead of `prefers-color-scheme`. Also import
  it from `notion.css` (compiled separately; uses `@apply dark:*`).
- a `@utility container` that restores the v3 centred/padded container,
- a base-layer `border-color` default (v4 changed it from `gray-200` to
  `currentColor`), and
- `--font-sans` / `--font-serif` on `:root` via `theme(fontFamily.*)`, because
  font stacks loaded through `@config` are inlined into the utilities and get
  no `--font-*` variables of their own.

### Notion body colour

Prose colour is `--fg-color` in `notion.css` (`.notion { color: var(--fg-color) }`),
switched under `html.dark`. Do not also `@apply dark:text-*` on `.notion`, and
do not re-list Notion blocks with a forced `color` in themes.

Standalone stylesheets that use `@apply` (`notion.css`, `utility-patterns.css`)
start with `@reference "tailwindcss"` so `@apply` resolves outside the entry
file.

## Token architecture

All colour lives in `frontend/src/shared/styles/navy-ink.css` as CSS variables
(OKLCH ink + cornflower ramps, plus semantic tokens), mapped to Tailwind
utilities through `@theme inline` (`bg-background`, `text-muted-foreground`,
`border-border`, `bg-brand`, `bg-ink-500`, `from-corn-400`, …).

Three token names collide with the legacy config (`primary`, `secondary`,
`warning`). They are rewired to CSS variables in `tailwind.config.js`; the
variables default to the original legacy values on `:root` and are overridden
only inside `.theme-navyink`. This lets a single `bg-primary` utility resolve
per scope without touching the other themes.

## coss component registry

Reusable coss primitives live in `frontend/src/shared/components/ui/` (TypeScript,
`data-slot` attributes, `cn()` from `@/lib/cn`). They are verbatim ports of the
upstream coss UI sources (`cosscom/coss`, `apps/ui/registry/default/ui/`), adapted
only in imports: `@/registry/default/lib/utils` → `@/lib/cn`, sibling imports are
relative, and `useRender`/`mergeProps` come from the `@base-ui-components/react`
package root (the installed 1.0.0-rc.0 exposes no `./use-render` subpath export).
`Button` carries one project addition: a `brand` variant mapped to the
`--brand`/`--brand-foreground` tokens.

Ported set: `Button`, `Spinner`, `Card` (+ `CardFrame` family), `Badge`,
`Avatar`, `Separator`, `Skeleton`, `Empty`, `Field`, `Input`, `InputGroup`,
`Textarea`, `Kbd`, `Label`, `Menu` (+ `DropdownMenu` aliases), `Pagination`,
`ScrollArea`, `Sheet`, `Tooltip`. Prefer these primitives over hand-written
markup. Add more with `npx shadcn@latest add @coss/<component>`.

## The `navyink` theme

`frontend/src/shared/themes/navyink/` implements the standard NotionNext theme
contract (`LayoutBase`, `LayoutIndex`, `LayoutPostList`, `LayoutSearch`,
`LayoutArchive`, `LayoutSlug`, `Layout404`, `LayoutCategoryIndex`,
`LayoutTagIndex`, `THEME_CONFIG`) in `.tsx`. Enable it with
`NEXT_PUBLIC_THEME=navyink`.

- The root element carries `id="theme-navyink"` (for scoped styles in
  `style.tsx`) and `class="theme-navyink"` (for scoped tokens).
- Untyped `useGlobal`/`siteConfig` are wrapped once in
  `themes/navyink/lib/global.ts` (`useThemeGlobal`, `conf`) so the rest of the
  theme is fully typed.
- All user-facing copy resolves through `useLocale()` (same file): the active
  lang file is deep-merged over `NAVYINK_LOCALE_DEFAULTS`, so components read
  plain `locale.X` keys and never use `|| 'literal'` fallbacks.
- Base UI portals (Sheet, Tooltip, Menu popups) render at `document.body`,
  outside the `.theme-navyink` token scope — portaled popup content must carry
  the `theme-navyink` class so the scoped `primary`/`secondary`/`warning`
  overrides still apply.
- Header wordmark mark: `NAVYINK_LOGO` (default
  `/themes/navyink/logo.jpg`).

## Article reading

`LayoutSlug` renders the post as one `.navyink-article-column` (masthead,
body, share bar, comments) so every part shares the same side gutters
(`clamp(0.25rem, 4vw, 2.5rem)`), which keeps the measure near 70 Latin or
40 CJK characters inside the `max-w-3xl` column.

Reading typography lives in `style.tsx` under `#theme-navyink .navyink-article`
and overrides the Notion block rules from `notion.css` (matching `!important`
only where `notion.css` uses it):

- Body is 17px / 1.8 with one `--article-block-gap` (0.75rem) between blocks
  and no padding inside them.
- Headings carry `--article-section-gap` (2.75rem) above and a quarter of that
  below, so they attach to the section they introduce; consecutive headings
  collapse to 1rem. Headings have `scroll-margin-top: 6rem` for the sticky
  header.
- Quotes use `--font-serif`, one size up, a 2px `--brand` rail and no
  background. Callouts are the reverse: `--muted` fill, `--border`,
  `--radius-md`, slightly smaller type. Inline code is ink on `--muted`,
  never red.
- Body links underline with a 35% brand line; on hover a full-strength line
  fills in from the left (`background-size` transition, 300 ms).

Two reading aids are theme `lib/` hooks with the pure logic in
`lib/reading.ts` (unit-tested in `__tests__/themes/navyink/`):

- `SectionRail` (`components/SectionRail.tsx`) replaces the sidebar table of
  contents. It pins one bar per heading to the right edge on `xl` and up:
  bars above the current section are `muted-foreground`, the current one is
  `brand` and longer, the rest are `border-strong`. Hovering or focusing the
  rail slides the heading titles out beside the bars. `useActiveHeading`
  picks the last heading above a 112px threshold (or the last heading at the
  end of the document) and coalesces updates per animation frame. Gated by
  `NAVYINK_WIDGET_TOC`; hidden with fewer than two headings.
- `ArticleBody` (`components/ArticleBody.tsx`) wraps `NotionPage` and runs
  `useRevealOnScroll`: top-level blocks below the fold at mount get
  `data-navyink-reveal="out"` and flip to `"in"` on intersection (10px rise,
  450 ms). Blocks already on screen are never marked, and nothing is marked
  under `prefers-reduced-motion` or without JavaScript, so the resting state
  is always the plain page.

## Motion

Animation uses [`motion`](https://motion.dev) via helpers in
`themes/navyink/components/Motion.tsx` (`FadeIn`, `StaggerContainer`,
`StaggerItem`, `Lift`). Motion is quick, eased-out, and short-travel; entrances
play once on scroll-in. UI motion stays at or under 300 ms (page enter 250 ms,
stagger children 300 ms at 60 ms intervals, interaction feedback 150–200 ms),
transitions name exact properties (never `transition-all`), and pressables get
press feedback from the coss primitives or `Lift`'s `whileTap`. A
`prefers-reduced-motion` guard in `style.tsx` collapses all transitions.

## TypeScript

Frontend core (`pages/`, `shared/lib/`, `shared/hooks/`, `shared/components/`)
and the typed `navyink` theme are authored in TypeScript.
`tsconfig.json` is strict (`noImplicitAny`, `exactOptionalPropertyTypes`,
`noUncheckedIndexedAccess`).

`allowJs` remains enabled for:

- Legacy theme directories under `shared/themes/` (except `navyink`)
- CJS bootstrap configs under `shared/config/*.config.js` that
  `blog.config.js` loads via Node `require`

Keep the `any` boundary to typed facades (see `themes/navyink/lib/global.ts`)
rather than scattering unsafe access. See
[`docs/decisions/002-typescript-first.md`](../decisions/002-typescript-first.md).
