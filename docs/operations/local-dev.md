# Local Development

## Prerequisites

- Node.js 22 (use `nvm use` or rely on `.nvmrc`).
- Yarn 1.22 (see `packageManager` in `package.json`).
- A Notion page to use as the content source.

## Setup

```sh
git clone <repo>
cd NotionNext
yarn install
cp .env.example .env.local
# edit .env.local: set NOTION_PAGE_ID and NOTION_TOKEN
yarn workspace notion-next-frontend dev
```

The dev server runs Next.js from the `frontend/` workspace. Open the printed URL.

## Workspaces

The repository is a yarn workspaces monorepo:

- `frontend/` — the Next.js application.
- `backend/` — the Notion data / API logic layer.

The frontend imports backend code through the `@/backend/*` path alias (configured in `frontend/tsconfig.json`).

## Useful scripts

- `yarn dev` — start Next.js dev.
- `yarn test` — run Jest.
- `yarn lint` / `yarn format` — ESLint + Prettier.
- `yarn health-check` — project health check.
- `yarn docs:site:dev` — run the VitePress documentation site.

See `package.json` and `frontend/package.json` for the full list.
