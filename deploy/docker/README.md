# Docker

NotionNext ships with a root `Dockerfile` that builds the Next.js application. Use it as the base image for any Docker-based deployment.

## Build

```sh
docker build -t notion-next .
```

## Run

```sh
docker run -p 3000:3000 --env-file .env.example notion-next
```

## Compose

A `docker-compose` example can be added here when a multi-service setup (e.g. with Redis) is needed. Adjust image names, ports, and environment variables to the target environment.

## Notes

- The build runs `yarn install` and `yarn workspace notion-next-frontend build`.
- Set `NOTION_PAGE_ID`, `NOTION_TOKEN`, and other secrets via environment variables or a secret manager.
