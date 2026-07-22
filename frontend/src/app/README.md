# app

Application initialization layer. Holds Next.js global setup (`_app`, `_document`, `_error` wiring lives in `../pages` per the Next.js Pages Router requirement) and global styles.

## Contents

- `styles/` — global CSS (migrated from the legacy root `styles/`).

## Rules

- No business logic, no reusable UI, no page-specific code.
- Global providers and theme setup belong here.
