# domain

Business rules. No dependencies on frameworks, databases, or transport details.

## Public API

- `entities/` holds canonical pure TypeScript contracts for posts, pages, categories, tags, comments, and site configuration.
- `value-objects/` holds pure string value objects and helpers for slugs, Notion page IDs, language prefixes, and cache keys.
- `index.ts` re-exports the domain public API.

See [`docs/backend/domain.md`](../../../docs/backend/domain.md).
