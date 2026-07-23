# Operations

This section covers how NotionNext is run, built, deployed, and monitored.

## Documents

- [`local-dev.md`](local-dev.md) — local development setup.
- [`deployment.md`](deployment.md) — deployment guide (migrated from root `DEPLOYMENT.md`).

## Environment

- Runtime: Node.js 22 (see `.nvmrc`).
- Required environment variables: see `.env.example`.
- Local services: optional Redis (for distributed cache), Supabase (for membership).

Copy `.env.example` to `frontend/.env.local` for local development. Real
`.env*`, `.dev.vars*`, and Wrangler state files are ignored by Git. Variables
prefixed with `NEXT_PUBLIC_` are public browser configuration and must never
contain secrets.

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

# Build and deploy the production Cloudflare Worker
yarn build:cloudflare
yarn deploy:cloudflare
```

The production blog Worker is configured in `wrangler.jsonc`. OpenNext adapts
the Next.js Pages Router application under `frontend/` and stores ISR output in
the `notionnext-blog-cache` R2 bucket. Set secrets with `wrangler secret put`;
do not add secret values to the Wrangler configuration.

`yarn validate:env` runs before development and production builds. GitHub
Actions build-time values belong in repository Variables or Secrets; Worker
runtime secrets belong in Wrangler Secrets.

See the root `Makefile` for the standard task shortcuts.
