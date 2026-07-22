# shared

Reusable primitives and utilities used by any layer.

## Contents

- `components/` — UI components (migrated from the legacy root `components/`).
- `lib/` — utilities, i18n (`lang/`), plugins, global config helpers (migrated from the legacy root `lib/` client-side modules).
- `themes/` — the 27 themes (migrated from the legacy root `themes/`).
- `hooks/` — React hooks (migrated from the legacy root `hooks/`).
- `config/` — feature configuration files (migrated from the legacy root `conf/`).

## Rules

- No business logic, no references to specific entities/features.
- Imports only within `shared`.
