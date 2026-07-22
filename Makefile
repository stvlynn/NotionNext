.PHONY: check test lint format docs deploy help install dev build type-check

install: ## Install dependencies (yarn workspaces)
	@yarn install

dev: ## Start the Next.js dev server (frontend workspace)
	@yarn workspace notion-next-frontend dev

build: ## Build the frontend
	@yarn workspace notion-next-frontend build

type-check: ## Run TypeScript type checks
	@yarn workspace notion-next-frontend type-check

check: ## Run all quality checks (lint + type-check + test)
	@yarn workspace notion-next-frontend lint
	@yarn workspace notion-next-frontend type-check
	@yarn test

test: ## Run tests
	@yarn test

lint: ## Run linter
	@yarn workspace notion-next-frontend lint

format: ## Run formatter
	@yarn format

docs: ## Run the VitePress docs site
	@yarn docs:site:dev

deploy: ## Deploy the project
	@echo "See docs/operations/deployment.md and deploy/README.md for deployment options"

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-14s %s\n", $$1, $$2}'
