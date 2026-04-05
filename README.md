# DOWINN Project Workspace System

This repository contains the shipped full-stack assessment build for DOWINN.
It combines a Next.js frontend, a NestJS backend, a MySQL database, and a
documentation set that explains both the product and the delivery decisions.

## What The Product Is

DOWINN is a compact project workspace application built around four surfaces:

1. Public and auth: landing, login, signup, verification, and invite entry
   flows.
2. Projects dashboard: project discovery, creation, counts, and navigation.
3. Project board workspace: the main Kanban-style workspace for a single
   project.
4. Task collaboration detail: the task drawer for summary, details, comments,
   attachments, subtasks, and audit history.

The product is Kanban-first, but the workflow is no longer hardcoded to only
three statuses. New projects still start with `Todo`, `In Progress`, and
`Done`, but each project owns its own workflow statuses.

## Current Status

The main end-to-end build is implemented.

- frontend and backend apps are live under `frontend/` and `backend/`
- verification-first auth and refresh-token rotation are implemented
- project invites, acceptance, and project membership enforcement are
  implemented
- project dashboard, project board workspace, and task drawer are implemented
- dynamic project statuses, board-local search/filter/sort, and project
  activity are implemented
- task comments, attachments, subtasks, and audit history are implemented
- deterministic reviewer demo seeding is implemented
- canonical reviewer guidance lives in
  [docs/REVIEWER-PACK.md](./docs/REVIEWER-PACK.md)

## Standardized Stack

### Frontend

- Next.js App Router
- React 19
- TypeScript
- Tailwind CSS
- shadcn/ui
- TanStack Query
- Axios client layer in `frontend/src/services/http/`
- `dnd-kit` for board interactions

### Backend

- NestJS
- TypeScript
- Prisma ORM
- MySQL / MariaDB
- JWT access tokens plus refresh token rotation
- SMTP-backed mail abstraction for verification and invites

### Supporting Choices

- public pages are SEO-oriented
- authenticated routes are `noindex`
- optimistic UI is preferred over real-time infrastructure
- Redis is intentionally optional future infrastructure, not a requirement

## How To Explain This System In A Presentation

Use this sequence:

1. Start with the four user-facing surfaces.
2. Explain that `projects` owns project identity, members, invites, statuses,
   and project activity.
3. Explain that `tasks` owns task records, task detail, comments, attachments,
   subtasks, and audit logs.
4. Explain that the project board workspace composes both domains on the most
   important screen.
5. Close by showing the reviewer path: seed, login, dashboard, board, drawer,
   activity, and audit trail.

This is the clearest way to explain why `projects` and `tasks` intentionally
touch each other without implying that the boundaries are accidental.

## Repository Shape

```text
.
|-- frontend/          Next.js app workspace
|-- backend/           NestJS API workspace
|-- docs/              canonical architecture, API, reviewer, and codemap docs
|-- infra/             local database/runtime helpers
|-- scripts/           repo-level verification helpers
|-- shared/            intentionally small shared workspace
`-- .codex/            repo-local Codex configuration
```

Legacy `frontend-guide/` and `backend-guide/` folders still exist as reference
scaffolds, but the implemented application lives in `frontend/` and `backend/`.

## Frontend And Backend Ownership Model

### Frontend

The frontend is organized to reflect the shipped product:

- `features/public/`: landing page and public marketing presentation
- `features/auth/`: login, signup, verification, invite entry flows
- `features/projects/`: dashboard, project creation, invites, status
  management, project-domain services
- `features/project-board/`: project board workspace orchestration, tabs,
  filters, metrics, and activity composition
- `features/tasks/`: reusable task-domain UI, drawer, form, comments,
  attachments, logs, and task-domain services
- `contracts/`: API transport types, including shared workflow primitives

### Backend

The backend keeps stable Nest modules while splitting larger modules internally
by responsibility:

- `auth/`: signup, login, refresh, logout, me, verification
- `mail/`: SMTP-backed verification and invite delivery
- `project-invites/`: invite create, preview, and accept
- `projects/`: project queries, mutations, status management, and activity
- `tasks/`: task queries, commands, and workflow updates
- `task-logs/`: audit retrieval and transactional log-writing helpers
- `seed/`: reviewer demo bootstrap
- `health/`: health checks

## Documentation Map

- [docs/README.md](./docs/README.md): documentation index and precedence rules
- [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md): system shape, ownership
  model, request lifecycle, and composition strategy
- [docs/API.md](./docs/API.md): public REST contract
- [docs/FRONTEND-PLAN.md](./docs/FRONTEND-PLAN.md): frontend structure and
  route/feature responsibilities
- [docs/BACKEND-PLAN.md](./docs/BACKEND-PLAN.md): backend module and service
  responsibilities
- [docs/REVIEWER-PACK.md](./docs/REVIEWER-PACK.md): fastest reviewer path
- [docs/CODEMAPS/INDEX.md](./docs/CODEMAPS/INDEX.md): implementation-oriented
  navigation maps

## Setup Summary

1. Copy environment files from the committed examples.
2. Start MySQL with the infra helper.
3. Install dependencies with `pnpm install --frozen-lockfile`.
4. Run backend Prisma migrations and generate Prisma client.
5. Start the backend and frontend.
6. Run `bash scripts/quality-gate.sh`.

Detailed environment and deployment instructions live in
[docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md).

## Demo Bootstrap

Reviewer demo data is available through the backend once local env vars are in
place.

1. Set `SEED_ENABLED=true` in the backend environment.
2. Start the backend on `http://localhost:4000`.
3. Call `POST /api/v1/seed/init`.
4. Sign in with either seeded account:
   - `demo.member@example.com` / `DemoPass123!`
   - `demo.admin@example.com` / `DemoPass123!`

The seeded member account is the main reviewer path. It lands on a dashboard
with two projects and a primary project board workspace that already includes
the default `Todo`, `In Progress`, and `Done` statuses, board-local productivity
controls, project activity, and a task with ready-to-review collaboration and
audit history.

## Reviewer Entry Point

For the shortest evaluation path, start with
[docs/REVIEWER-PACK.md](./docs/REVIEWER-PACK.md). It includes:

- local run order
- seed and credentials
- the main walkthrough
- optional verification and invite flows
- smoke checks
- non-blocking warnings

## Known Issues / Incomplete Functionality

- Next.js build still warns about multiple lockfiles in the workspace.
- The backend does not yet define a dedicated standalone `typecheck` script.
- Legacy `frontend-guide/` and `backend-guide/` folders are still present as
  reference scaffolds alongside the shipped apps in `frontend/` and `backend/`.

## Submission Notes

For assessment delivery, this workspace should be submitted as **one repository
link** that contains the `frontend/`, `backend/`, `docs/`, `infra/`,
`scripts/`, `shared/`, and root PNPM workspace files together. Prefer a fresh
single-repo copy over separate frontend/backend repository links or git
submodules.

## Verification

Repo-wide verification entrypoint:

```bash
bash scripts/quality-gate.sh
```

Typical local service ports:

- frontend: `http://localhost:3000`
- backend: `http://localhost:4000`
- mysql: `127.0.0.1:3308`

## Delivery Principles

1. Keep the public API and route behavior stable.
2. Prefer explicit domain ownership over large generic feature folders.
3. Make the board workspace the main productivity surface.
4. Keep the audit trail and reviewer path easy to demonstrate.
5. Make every implementation decision explainable in an interview.
