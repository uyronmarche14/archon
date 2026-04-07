# Local Development

This document captures the real local development workflow for the current repo.

## Prerequisites

- Node.js 20 or newer
- pnpm `10.18.3`
- Docker with `docker compose`

## Workspace Installation

Install everything from the monorepo root:

```bash
pnpm install
```

## Environment Setup

Create local env files from the examples:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
cp infra/.env.example infra/.env
```

## Backend Environment Variables

These are the main backend envs described by the Joi schema in `backend/src/config/environment.ts`.

### Required or effectively required

- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`

### Common runtime config

- `PORT`
- `APP_URL`
- `FRONTEND_URL`
- `SWAGGER_ENABLED`
- `DATABASE_URL`
- `JWT_ACCESS_TTL`
- `JWT_REFRESH_TTL`
- `REFRESH_COOKIE_NAME`
- `REFRESH_COOKIE_SECURE`
- `TRUST_PROXY_HOPS`
- `SEED_ENABLED`
- `NODE_ENV`

### Current auth/invite defaults on `main`

If omitted, these default to:

```env
EMAIL_VERIFICATION_MODE=bypass
INVITE_DELIVERY_MODE=link
```

### Optional mail config

These can be omitted entirely on the current `main` branch unless you explicitly re-enable email flows:

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

## Frontend Environment Variables

Frontend envs come from `frontend/.env.example`:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
```

Important:

- `NEXT_PUBLIC_APP_URL` should be the frontend origin only
- `NEXT_PUBLIC_API_URL` should point to the backend API base, including `/api/v1`

## Database Setup

### Actual compose file

The local MySQL stack is defined at:

- `infra/docker/docker-compose.yml`

The compose file reads variables from:

- `infra/.env`

Start MySQL with:

```bash
docker compose --env-file infra/.env -f infra/docker/docker-compose.yml up -d
```

Stop it with:

```bash
docker compose --env-file infra/.env -f infra/docker/docker-compose.yml down
```

View logs with:

```bash
docker compose --env-file infra/.env -f infra/docker/docker-compose.yml logs -f mysql
```

### Default local connection

The default local DB URL expected by the backend is:

```env
DATABASE_URL=mysql://dowinn:dowinn@127.0.0.1:3308/dowinn
```

If you change `MYSQL_PORT` in `infra/.env`, update `backend/.env` to match.

## Prisma Workflow

Generate the client manually if needed:

```bash
pnpm --filter backend prisma:generate
```

Validate the schema:

```bash
pnpm --filter backend prisma:validate
```

Apply local development migrations:

```bash
pnpm --filter backend prisma:migrate:dev
```

Production deployment migration helper:

```bash
pnpm --filter backend prisma:migrate:deploy
```

## Running The Apps

### Run both apps from the root

```bash
pnpm dev
```

### Run the backend only

```bash
pnpm --filter backend start:dev
```

### Run the frontend only

```bash
pnpm --filter @dowinn/frontend dev
```

## Build, Test, And Lint

### Root

```bash
pnpm build
pnpm lint
pnpm test
pnpm typecheck
```

### Backend

```bash
pnpm --filter backend build
pnpm --filter backend test
pnpm --filter backend lint
```

### Frontend

```bash
pnpm --filter @dowinn/frontend build
pnpm --filter @dowinn/frontend test
pnpm --filter @dowinn/frontend lint
pnpm --filter @dowinn/frontend typecheck
```

## Local URLs

- frontend app: `http://localhost:3000`
- backend API: `http://localhost:4000/api/v1`
- Swagger UI: `http://localhost:4000/api/v1/docs` when enabled
- health endpoint: `http://localhost:4000/api/v1/health`

## Seed Data

The backend includes a seed endpoint:

- route: `POST /api/v1/seed/init`
- hidden from Swagger

It only works when:

- `SEED_ENABLED=true`
- `NODE_ENV` is not `production`

Example local call:

```bash
curl -X POST http://localhost:4000/api/v1/seed/init
```

The seed creates:

- two demo users
- two demo projects
- owner/member memberships
- default statuses
- several demo tasks
- seeded task logs

Current seeded accounts:

- `demo.admin@example.com`
- `demo.member@example.com`

Demo password:

- `DemoPass123!`

## Troubleshooting

### Swagger returns `NOT_FOUND`

Set:

```env
SWAGGER_ENABLED=true
```

Then restart the backend and open `/api/v1/docs`.

### CORS errors in the frontend

Make sure backend and frontend URLs use origins only where appropriate:

- `FRONTEND_URL` must be the frontend origin only, such as `https://app.example.com`
- do not include `/login` or other path segments
- `APP_URL` should be the backend origin only
- `NEXT_PUBLIC_API_URL` should include `/api/v1`

### Prisma client or missing enum/type errors

If build errors mention missing Prisma types or model properties, generate the Prisma client:

```bash
pnpm --filter backend prisma:generate
```

The backend also runs `prisma generate` during `build` and `postinstall`.

### Root DB helper scripts do not work

The root `package.json` still references a missing `scripts/docker-compose.sh`. Use the explicit `docker compose --env-file infra/.env -f infra/docker/docker-compose.yml ...` commands above instead.
