# Kubernetes

Kubernetes manifests for NotionNext. These are templates — adjust to the target cluster, registry, and namespace.

## Suggested resources

- `Deployment` running the NotionNext Docker image (built from the root `Dockerfile`).
- `Service` exposing the Next.js port (default `3000`).
- `Ingress` routing traffic to the Service.
- `Secret` holding `NOTION_PAGE_ID`, `NOTION_TOKEN`, Clerk / Supabase / Redis credentials.
- `ConfigMap` for non-secret configuration (`LOG_LEVEL`, etc.).

## How to use

1. Build and push the image to your registry.
2. Replace `__IMAGE__`, `__NAMESPACE__`, and secret references in the manifests.
3. `kubectl apply -f deploy/k8s/`.
4. Document any cluster-specific steps here.
