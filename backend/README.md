# Archon Backend

This package contains the NestJS backend for Archon. It is the system of record for authentication, refresh-token session rotation, project ownership, memberships, invites, project statuses, tasks, task logs, comments, attachments, health checks, and local/demo seeding.

This README describes the current `main` branch implementation. On this branch, the backend defaults to:

- `EMAIL_VERIFICATION_MODE=bypass`
- `INVITE_DELIVERY_MODE=link`

Mail delivery and verify-email routes still exist, but they are dormant/hidden from the default product flow.

For the repo-wide overview, see [../README.md](../README.md).

## Overview

The backend exposes a versioned API under:

```text
/api/v1
```

Primary modules:

- `auth`
- `health`
- `mail`
- `project-invites`
- `projects`
- `seed`
- `task-logs`
- `tasks`

Global application behavior includes:

- request ID middleware
- `/api/v1` route prefix
- global validation pipe
- global response envelope
- global exception filter
- security-oriented response headers
- CORS configured from `FRONTEND_URL`

Swagger is mounted only when `SWAGGER_ENABLED=true`.

## Core Responsibilities

- create users and authenticate sessions
- issue JWT access tokens and rotate refresh tokens in cookies
- enforce project/task access rules
- create and accept project invites
- create projects and default statuses
- manage project statuses and activity history
- create, update, move, and delete tasks
- record task activity logs
- manage task comments and task attachments
- provide assignment notifications
- optionally seed repeatable local/demo data

## Current Runtime Behavior On `main`

### Auth

- signup works without requiring a visible email verification flow
- login returns an access token and sets a refresh cookie
- refresh token rotation is handled by `/auth/refresh`
- `/auth/me` returns the current user when the access token is valid
- verify-email endpoints still exist but are hidden from Swagger and behave as dormant compatibility routes under bypass mode

### Invites

- invite creation is owner/admin-only
- invite preview is public
- invite acceptance requires authentication
- the signed-in email must match the invite email
- invite delivery defaults to direct link mode

### Access control

- admins can access all projects and tasks
- owners can manage project settings and statuses
- members can access project boards and tasks but not owner-only project management routes
- comment edit/delete is limited to the comment author or an admin
- attachment delete is limited to the attachment creator or an admin

## Project Structure

```text
backend/
├── prisma/                   # schema and migrations
├── src/common/               # bootstrap, filters, middleware, swagger, utils
├── src/config/               # env validation and runtime config
├── src/database/             # Prisma service and DB module
├── src/modules/auth/         # auth routes, guards, services
├── src/modules/health/       # health endpoint
├── src/modules/mail/         # dormant/optional mail support
├── src/modules/project-invites/
├── src/modules/projects/
├── src/modules/seed/
├── src/modules/task-logs/
├── src/modules/tasks/
└── test/                     # e2e-focused backend test config
```

## Tech Stack

- NestJS 11
- TypeScript
- Prisma 7
- MySQL / MariaDB
- Joi environment validation
- JWT auth with refresh-token rotation
- Nodemailer and Resend support for optional mail delivery
- Jest for backend tests

## Environment Variables

The backend env contract is defined in:

- `src/config/environment.ts`

Important variables:

- `PORT`
- `APP_URL`
- `FRONTEND_URL`
- `SWAGGER_ENABLED`
- `DATABASE_URL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `JWT_ACCESS_TTL`
- `JWT_REFRESH_TTL`
- `REFRESH_COOKIE_NAME`
- `REFRESH_COOKIE_SECURE`
- `TRUST_PROXY_HOPS`
- `EMAIL_VERIFICATION_MODE`
- `INVITE_DELIVERY_MODE`
- `SEED_ENABLED`
- `NODE_ENV`

Optional mail variables:

- `MAIL_PROVIDER`
- `MAIL_FROM`
- `RESEND_API_KEY`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`
- `SMTP_CONNECTION_TIMEOUT_MS`

Current defaults on `main`:

- `EMAIL_VERIFICATION_MODE=bypass`
- `INVITE_DELIVERY_MODE=link`

That means many local and hosted deployments on this branch can omit all mail-specific env values.

## Run Locally

From the monorepo root:

```bash
pnpm install
```

From `backend/`:

```bash
cp .env.example .env
```

Start MySQL using the actual compose file:

```bash
docker compose --env-file ../infra/.env -f ../infra/docker/docker-compose.yml up -d
```

Apply migrations:

```bash
pnpm prisma:migrate:dev
```

Start the backend:

```bash
pnpm start:dev
```

Default local endpoints:

- API base: `http://localhost:4000/api/v1`
- health: `GET http://localhost:4000/api/v1/health`
- Swagger UI: `http://localhost:4000/api/v1/docs` when enabled

For fuller local setup details, see:

- [../docs/local-development.md](../docs/local-development.md)

## Scripts

From `backend/`:

```bash
pnpm build
pnpm start
pnpm start:dev
pnpm start:debug
pnpm start:prod
pnpm lint
pnpm test
pnpm test:watch
pnpm test:cov
pnpm test:e2e
pnpm prisma:generate
pnpm prisma:validate
pnpm prisma:migrate:dev
pnpm prisma:migrate:deploy
pnpm prisma:migrate:deploy:prod
pnpm prisma:diff:prod
pnpm prisma:status:prod
```

## Seed / Demo Bootstrap

The backend includes a hidden seed endpoint:

```text
POST /api/v1/seed/init
```

Rules:

- only works when `SEED_ENABLED=true`
- blocked in production
- intended for repeatable local/demo setup

Typical flow:

1. set `SEED_ENABLED=true`
2. start the backend
3. call:

```bash
curl -X POST http://localhost:4000/api/v1/seed/init
```

Current seeded demo accounts:

- `demo.member@example.com` / `DemoPass123!`
- `demo.admin@example.com` / `DemoPass123!`

## Verification

Recommended verification before shipping backend changes:

```bash
pnpm lint
pnpm test
pnpm test:e2e
pnpm build
```

Optional Prisma checks:

```bash
pnpm prisma:validate
pnpm prisma:generate
```

## Known Issues / Current Limitations

- The root workspace still advertises `db:*` helper scripts that reference a missing `scripts/docker-compose.sh`; use the compose command above instead.
- Swagger is opt-in and will return a normal 404 envelope when `SWAGGER_ENABLED` is false.
- The backend still contains dormant mail and verification infrastructure even though `main` defaults to no-email auth and link-based invites.
- On platforms that block SMTP, email delivery should be considered optional or re-enabled carefully with an HTTPS-based provider.
- There is no dedicated standalone `typecheck` script in this package; build, tests, and lint are the main package-level checks.

## Related Documentation

- [../README.md](../README.md)
- [../docs/architecture-overview.md](../docs/architecture-overview.md)
- [../docs/roles-and-permissions.md](../docs/roles-and-permissions.md)
- [../docs/project-workflows.md](../docs/project-workflows.md)
- [../docs/local-development.md](../docs/local-development.md)
- [prisma/README.md](./prisma/README.md)
- [src/README.md](./src/README.md)
- [test/README.md](./test/README.md)
