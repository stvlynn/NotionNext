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
- a `@utility container` that restores the v3 centred/padded container, and
- a base-layer `border-color` default (v4 changed it from `gray-200` to
  `currentColor`).

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
`data-slot` attributes, `cn()` from `@/lib/cn`): `Button`, `Card`, `Badge`,
`Separator`, `Skeleton`, `Avatar`. Prefer these primitives over hand-written
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
- Header wordmark mark: `NAVYINK_LOGO` (default
  `/themes/navyink/logo.jpg`).

## Motion

Animation uses [`motion`](https://motion.dev) via helpers in
`themes/navyink/components/Motion.tsx` (`FadeIn`, `StaggerContainer`,
`StaggerItem`, `Lift`). Motion is quick, eased-out, and short-travel; entrances
play once on scroll-in. A `prefers-reduced-motion` guard in `style.tsx`
collapses all transitions.

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
