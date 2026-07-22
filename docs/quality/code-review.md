# Code Review

## Checklist

- [ ] Follows FSD/DDD layer boundaries (see [`frontend/import-rules.md`](../frontend/import-rules.md) and [`backend/`](../backend/README.md)).
- [ ] No hardcoded user-facing strings — uses i18n keys.
- [ ] No redundant UI copy.
- [ ] No duplicated implementations — reuses `shared` utilities.
- [ ] No fallback/clever bypass logic that masks a root cause.
- [ ] Tests added or updated for changed behavior.
- [ ] Lint, type check, and formatting pass.
- [ ] Documentation updated if behavior, architecture, or conventions changed.
- [ ] Commit message follows Conventional Commits.
