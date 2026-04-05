# DOWINN Submission

This repository contains the DOWINN full-stack assessment build. It includes:

- a Next.js frontend in `frontend/`
- a NestJS backend in `backend/`
- a Docker-based MySQL setup in `infra/`
- lightweight workspace notes in `frontend/WORKSPACE.md`,
  `backend/WORKSPACE.md`, and `infra/WORKSPACE.md`

## Product Summary

DOWINN is a compact project workspace app built around four main surfaces:

1. Public and auth flows: landing, signup, login, email verification, and
   invite entry
2. Projects dashboard: project discovery, creation, counts, and navigation
3. Project board workspace: a Kanban-style board for one project
4. Task collaboration detail: a task drawer with comments, attachments,
   subtasks, and audit history

New projects start with `Todo`, `In Progress`, and `Done`, but statuses are
project-specific and can be managed per project.

## Tech Stack

### Frontend

- Next.js App Router
- React 19
- TypeScript
- Tailwind CSS
- shadcn/ui
- TanStack Query
- Axios
- `dnd-kit`

### Backend

- NestJS
- TypeScript
- Prisma ORM
- MySQL / MariaDB
- JWT access tokens and refresh-token rotation
- SMTP-ready mail abstraction for verification and invites

## Repository Layout

```text
.
|-- frontend/              Next.js application
|-- backend/               NestJS API
|-- infra/                 local MySQL Docker files and env defaults
|-- scripts/               repo utilities
|-- package.json           workspace scripts
|-- pnpm-workspace.yaml    PNPM workspace definition
`-- pnpm-lock.yaml         lockfile
```

## Local Service URLs

These are the local defaults used by the checked-in `.env.example` files:

- Frontend app: `http://localhost:3000`
- Backend API base: `http://localhost:4000/api/v1`
- Swagger UI: `http://localhost:4000/api/v1/docs`
- Health check: `http://localhost:4000/api/v1/health`
- Seed endpoint: `POST http://localhost:4000/api/v1/seed/init`
- MySQL: `127.0.0.1:3308`

The frontend defaults come from `frontend/.env.example`:

- `NEXT_PUBLIC_APP_URL=http://localhost:3000`
- `NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1`

The backend defaults come from `backend/.env.example`:

- `PORT=4000`
- `APP_URL=http://localhost:4000`
- `FRONTEND_URL=http://localhost:3000`
- `DATABASE_URL=mysql://dowinn:dowinn@127.0.0.1:3308/dowinn`

## Local Setup

1. Copy the env files:

```bash
cp infra/.env.example infra/.env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

2. Start MySQL:

```bash
docker compose --env-file infra/.env -f infra/docker/docker-compose.yml up -d
```

3. Install dependencies:

```bash
pnpm install --frozen-lockfile
```

4. Apply Prisma migrations and generate the client:

```bash
pnpm -C backend prisma:migrate:deploy
pnpm -C backend prisma:generate
```

5. Start the apps:

```bash
pnpm dev
```

If you prefer separate terminals:

```bash
pnpm -C backend start:dev
pnpm -C frontend dev
```

## Demo Bootstrap

To load reviewer demo data:

1. Set `SEED_ENABLED=true` in `backend/.env`
2. Start the backend
3. Call the seed endpoint:

```bash
curl -X POST http://localhost:4000/api/v1/seed/init
```

4. Open `http://localhost:3000/login`
5. Sign in with either account:
   - `demo.member@example.com` / `DemoPass123!`
   - `demo.admin@example.com` / `DemoPass123!`

The seeded member account is the main review path.

## What To Check

- Dashboard and project list at `http://localhost:3000/app`
- Project board workspace at `http://localhost:3000/app/projects/[projectId]`
- Task drawer comments, attachments, subtasks, and audit history
- Backend health at `http://localhost:4000/api/v1/health`
- Backend Swagger docs at `http://localhost:4000/api/v1/docs`

## Useful Commands

From the repo root:

```bash
pnpm lint
pnpm test
pnpm build
pnpm -C frontend typecheck
```

## Workspace Notes

- [frontend/WORKSPACE.md](./frontend/WORKSPACE.md)
- [backend/WORKSPACE.md](./backend/WORKSPACE.md)
- [infra/WORKSPACE.md](./infra/WORKSPACE.md)

## Submission Scope

This submission is intended to be reviewed as one repository containing the
frontend, backend, infra, and root PNPM workspace files together.
