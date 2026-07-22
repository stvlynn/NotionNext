# FSD Overview

Feature-Sliced Design (FSD) is an architectural methodology for frontend projects that organizes code by **scope of change** rather than by technical role.

## Why FSD is used here

NotionNext has grown to ~95 components, 29 themes, and many utilities. Organizing purely by technical type (`components/`, `lib/`, `hooks/`) makes it hard to see which files belong to a single user scenario and increases coupling. FSD groups each scenario into a self-contained slice so changes stay local.

## The six layers

```
app -> pages -> widgets -> features -> entities -> shared
```

Each layer may only import from layers to its right (downward). See [`layers.md`](layers.md) for the responsibility of each layer.

## Migration status

The existing codebase was migrated from a flat structure into FSD layers. Legacy aliases (`@/components`, `@/lib`, `@/themes`, `@/hooks`, `@/styles`) are remapped in `frontend/tsconfig.json` and `frontend/jsconfig.json` to the new FSD locations so that existing imports keep resolving during the transition. New code should follow the FSD import rules in [`import-rules.md`](import-rules.md).
