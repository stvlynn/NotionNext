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

# Build the production Cloudflare Worker locally
yarn build:cloudflare
```

The production blog Worker is configured in `wrangler.jsonc`. OpenNext adapts
the Next.js Pages Router application under `frontend/` and stores ISR output in
the `notionnext-blog-cache` R2 bucket.

Production deployment is owned by Cloudflare Workers Builds. The
`notionnext-blog` Worker is connected to `stvlynn/NotionNext`; every push to
`main` runs `yarn build:cloudflare` and `yarn deploy:cloudflare` in
Cloudflare's build environment. Non-production branch builds and manual
deployment triggers are disabled.

GitHub Actions only runs repository quality gates. It does not receive a
Cloudflare API token and does not deploy production.

Configure build-time values under the Worker's **Settings > Builds**:

- Encrypted build secret: `NOTION_PAGE_ID`.
- Build variables: the public `NEXT_PUBLIC_*` site configuration listed in
  `.env.example`.

Keep `NOTION_PAGE_ID` configured separately as a Worker runtime secret.
Cloudflare manages build authentication internally through its Git
integration. Never add secret values to source files, Wrangler configuration,
logs, or variables prefixed with `NEXT_PUBLIC_`.

`yarn validate:env` runs before development and standard production builds.

See the root `Makefile` for the standard task shortcuts.
