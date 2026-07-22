# Public API

Each slice exposes a public API through an `index.ts` barrel file. Consumers of a slice must only import from its public API.

## Example

```
features/search/index.ts
  export { SearchDialog } from './ui/SearchDialog'
  export { useSearch } from './model/useSearch'
```

Consumers:

```ts
// Good
import { SearchDialog, useSearch } from '@/features/search'

// Bad — reaching into internals
import { SearchDialog } from '@/features/search/ui/SearchDialog'
```

## Legacy aliases

During the migration, legacy aliases (`@/components`, `@/lib`, `@/themes`, `@/hooks`, `@/styles`) are remapped to the new FSD locations in `frontend/tsconfig.json` / `frontend/jsconfig.json`. These act as a public API shim for existing imports and should be replaced with explicit FSD imports as code is touched.
