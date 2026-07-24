# Testing

## Strategy

NotionNext uses Jest (see `jest.config.js`). Tests live in `__tests__/` and colocated `*.test.*` / `*.spec.*` files.

## Test types

- **Unit tests** — pure functions in `lib/utils`, `lib/cache`, domain logic, and config validation.
- **Component tests** — React components using `@testing-library/react`.
- **Integration tests** — Notion data fetching, cache layers, and API route handlers.
- **Architecture tests** — client/server import boundaries and deployment
  bindings that must remain synchronized.

## Running

```sh
yarn test              # run once
yarn test:watch        # watch mode
yarn test:coverage     # with coverage
yarn test:ci           # CI mode
```

## Conventions

- Mock external services (Notion, Supabase, Redis, network) — never hit real APIs in tests.
- Keep tests fast and isolated.
- Use the existing Jest setup in `jest.setup.js` and `jest.env.js`.
