# Theme TypeScript migration

Legacy themes under `frontend/src/shared/themes/` (except `navyink`) remain JavaScript under `allowJs`. Migrate one theme per change set using `navyink` as the reference.

## Checklist

1. Rename theme entry and components from `.js` to `.tsx` / `.ts`.
2. Add a typed facade over `useGlobal` / `siteConfig` (see `navyink/lib/global.ts`).
3. Define theme props/types in `types.ts` (or colocate interfaces).
4. Keep user-facing copy in locale / config keys — no new hardcoded strings.
5. Run `yarn type-check` and a smoke render of the theme layouts you touch.
6. Do not enable `checkJs` for the whole themes tree in the same PR.

## Out of scope here

Bulk renaming every legacy theme file in one PR. That weakens reviewability and tends toward pervasive `any`.
