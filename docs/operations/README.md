# Operations

This section covers how NotionNext is run, built, deployed, and monitored.

## Documents

- [`local-dev.md`](local-dev.md) — local development setup.
- [`deployment.md`](deployment.md) — deployment guide (migrated from root `DEPLOYMENT.md`).

## Environment

- Runtime: Node.js 22 (see `.nvmrc`).
- Required environment variables: see `.env.example`.
- Local services: optional Redis (for distributed cache), Supabase (for membership).

## Commands

From the repository root (yarn workspaces):

```sh
# Install dependencies
yarn install

# Run the frontend (Next.js dev) from the frontend workspace
yarn workspace notion-next-frontend dev

# Run tests
yarn test

# Run type checks
yarn workspace notion-next-frontend type-check

# Lint
yarn workspace notion-next-frontend lint

# Build
yarn workspace notion-next-frontend build
```

See the root `Makefile` for the standard task shortcuts.
