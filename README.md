# Archon

Archon is a full-stack project delivery workspace built as a pnpm monorepo. It combines a Next.js frontend, a NestJS backend, and a Prisma/MySQL data layer to support account-based access, project ownership, invite-driven collaboration, Kanban task management, comments, attachments, task activity logs, and notification surfaces.

This documentation describes the actual `main` branch implementation. On this branch, account access defaults to direct login and link-based invites. Dormant email verification and mail delivery support still exist in the backend, but they are hidden from the normal product flow.

## Project Overview

Archon is organized around three core ideas:

- authenticated users work inside a protected workspace shell
- projects are the main collaboration boundary
- tasks move through project-defined workflow statuses on a Kanban-style board

The product has two major surfaces:

- public routes for landing, login, signup, and invite review
- protected workspace routes for the dashboard, boards, task work, and notifications

### How users enter the system

Unauthenticated users can visit the landing page, open login or signup, and open an invite review link. Signup creates an account and then routes the user back to login with the email prefilled. The `/verify-email` route no longer runs a visible verification workflow on `main`; it redirects to login.

Once a user logs in successfully:

- the frontend stores the access token in memory
- the backend rotates the refresh token through an HTTP-only cookie
- protected routes bootstrap session state by calling `/auth/me` and, if necessary, `/auth/refresh`
- anonymous users who hit protected routes are redirected to `/login?next=...`

### How projects work

Each project has:

- an owner (`projects.ownerId`)
- a membership list (`project_members`)
- an ordered set of workflow statuses
- a collection of tasks tied to those statuses

Creating a project automatically:

- creates the project record
- sets the current user as the project owner
- creates a `ProjectMember` record with role `OWNER`
- seeds the default workflow statuses for the board

The dashboard shows all projects visible to the current user:

- admins can see all projects
- non-admins see projects they own or projects they have joined as members

### How collaboration and invites work

Invites are project-scoped and email-bound.

- only project owners or admins can create invites
- invite preview is public
- invite acceptance requires authentication
- the signed-in user's email must match the invited email
- matching authenticated users also see pending invites inside the app and in the notification bell

On `main`, invite creation is link-first by default:

- the backend returns a direct invite URL
- existing users with the invited email can also see pending invites in-app after login
- the invite route lets users log in, sign up with the invited email, or accept immediately if the session already matches

### How boards and tasks work

Each project board is driven by project statuses. Tasks are grouped by status and rendered in ordered lanes. The board supports:

- task creation from the board
- task updates from the drawer
- drag-and-drop status changes
- project activity feed backed by task logs
- task comments
- URL-based attachments
- assignment notifications

Task access is inherited from project access. There is no separate task ACL layer. If a user can access a project, they can access tasks in that project.

### Role differences in practice

App-level roles:

- `ADMIN`
- `MEMBER`

Project-level roles:

- `OWNER`
- `MEMBER`

Practical behavior:

- project owners and admins can edit/delete projects
- project owners and admins can invite members
- project owners and admins can create, reorder, update, and delete project statuses
- project members can still open boards, create tasks, update tasks, move tasks, comment, and add attachments
- comment edit/delete is limited to the comment author or an admin
- attachment delete is limited to the attachment creator or an admin

## Key Features

- Account signup, login, logout, refresh-token session rotation, and `/auth/me`
- Protected workspace shell with sidebar navigation, project finder, and notification bell
- Project dashboard with visible-project metrics and pending invites
- Project creation, editing, and deletion
- Owner-managed project status creation, editing, reordering, and deletion
- Public invite preview plus authenticated invite acceptance
- Link-first invite delivery with in-app pending invites
- Kanban project board with drag-and-drop task movement
- Task drawer with task editing, checklist items, links, subtasks, comments, and attachments
- Project activity feed powered by task logs
- Task assignment notification feed
- Hidden Swagger/OpenAPI docs when enabled
- Optional seed endpoint for local/demo data

## User Roles And Permissions

### Unauthenticated visitor

Can:

- view the landing page
- open login and signup
- open an invite preview page

Cannot:

- access workspace routes
- accept invites
- access projects, boards, comments, attachments, or notifications

### Authenticated user

Can:

- enter the protected workspace
- see projects visible to their account
- open boards and tasks they are authorized to access
- receive pending invites and assignment notifications

Cannot automatically:

- manage every project
- accept invites for another email address

### Project owner

Can:

- edit project metadata
- delete the project
- invite members
- manage workflow statuses
- create, edit, move, and delete tasks
- use all member capabilities

### Project member

Can:

- access the project board and tasks
- create tasks
- update tasks
- move tasks between statuses
- comment on tasks
- add URL-based attachments
- accept invites for matching email accounts

Cannot:

- edit/delete the project itself
- invite other members
- manage project statuses

### Admin

Can:

- see all projects
- bypass normal owner/member visibility limits for project and task access
- perform owner-scoped actions
- edit/delete any user's comments
- delete any user's attachments

## Project Structure

```text
dowinn/
├── backend/                  # NestJS API, Prisma schema, auth, projects, invites, tasks
├── frontend/                 # Next.js App Router client
├── infra/                    # Local infrastructure files, mainly MySQL docker config
├── scripts/                  # Workspace helper scripts
├── docs/                     # Implementation-aware project documentation
├── package.json              # Root workspace scripts
├── pnpm-workspace.yaml       # pnpm workspace definition
└── pnpm-lock.yaml            # Root dependency lockfile
```

### Backend highlights

- `src/modules/auth` — signup/login/refresh/logout/session access and dormant verification endpoints
- `src/modules/projects` — project CRUD, project status management, project activity
- `src/modules/project-invites` — invite creation, preview, pending invite list, acceptance
- `src/modules/tasks` — grouped task queries, task CRUD, comments, attachments, notifications
- `src/modules/task-logs` — audit-style task activity entries
- `src/modules/seed` — optional local/demo bootstrap endpoint
- `src/config` — runtime config and env validation
- `prisma/` — schema and migrations

### Frontend highlights

- `src/app/(public)` — public routes such as landing, login, signup, invite review, verify-email redirect
- `src/app/(app)/app` — protected dashboard and project pages
- `src/features/auth` — auth UI, login/signup mutations, session provider, protected shell
- `src/features/projects` — dashboard, project editor, invites, member flows
- `src/features/project-board` — board controller, board header, activity feed, board-level orchestration
- `src/features/tasks` — task drawer, comments, attachments, logs, assignment notifications
- `src/components/shared` — workspace shell, account menu, navigation chrome
- `src/services/http` — axios client, auth refresh wiring, API base URL logic

## Tech Stack

- Frontend: Next.js 16 App Router, React 19, TypeScript, React Query, axios
- UI: Tailwind CSS 4, custom UI components, Radix primitives, Lucide icons
- Drag-and-drop: `@dnd-kit/core`
- Backend: NestJS 11, TypeScript, Joi config validation, Swagger/OpenAPI
- Database: MySQL/MariaDB via Prisma 7 and the MariaDB adapter
- Authentication: JWT access tokens + HTTP-only refresh cookie rotation
- Mail support: Nodemailer and Resend support remain in the backend, but are dormant by default on `main`
- Tooling: pnpm workspaces, ESLint, Vitest, Jest, Prisma migrations, Knip

## How To Run Locally

Detailed setup notes live in [docs/local-development.md](docs/local-development.md). The short version is below.

### Prerequisites

- Node.js 20+
- pnpm 10.18.3
- Docker Desktop or compatible Docker runtime

### 1. Install dependencies

```bash
pnpm install
```

### 2. Create local env files

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
cp infra/.env.example infra/.env
```

### 3. Start MySQL

The actual compose file lives at `infra/docker/docker-compose.yml`.

```bash
docker compose --env-file infra/.env -f infra/docker/docker-compose.yml up -d
```

### 4. Apply Prisma migrations

```bash
pnpm --filter backend prisma:migrate:dev
```

### 5. Start the apps

Run both in parallel from the workspace:

```bash
pnpm dev
```

Or run them separately:

```bash
pnpm --filter backend start:dev
pnpm --filter @dowinn/frontend dev
```

### Local URLs

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:4000/api/v1`
- Swagger UI: `http://localhost:4000/api/v1/docs` when `SWAGGER_ENABLED=true`

### Optional seed data

Enable seeding in `backend/.env`:

```env
SEED_ENABLED=true
```

Then call:

```bash
curl -X POST http://localhost:4000/api/v1/seed/init
```

The seed endpoint is hidden from Swagger and blocked in production.

## Environment Variables

See [docs/local-development.md](docs/local-development.md) for the full breakdown. The important variables are:

### Backend

- `PORT` — backend port
- `APP_URL` — public backend origin
- `FRONTEND_URL` — allowed frontend origin for CORS
- `SWAGGER_ENABLED` — enables `/api/v1/docs`
- `DATABASE_URL` — MySQL connection string
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `JWT_ACCESS_TTL`
- `JWT_REFRESH_TTL`
- `REFRESH_COOKIE_NAME`
- `REFRESH_COOKIE_SECURE`
- `TRUST_PROXY_HOPS`
- `EMAIL_VERIFICATION_MODE` — defaults to `bypass` on `main`
- `INVITE_DELIVERY_MODE` — defaults to `link` on `main`
- `MAIL_PROVIDER`, `MAIL_FROM`, `RESEND_*`, `SMTP_*` — optional unless email delivery is explicitly re-enabled
- `SEED_ENABLED`
- `NODE_ENV`

### Frontend

- `NEXT_PUBLIC_APP_URL` — frontend origin
- `NEXT_PUBLIC_API_URL` — backend API base URL, typically `http://localhost:4000/api/v1`

## API / Frontend-Backend Connection Overview

The frontend talks to the backend through a shared axios client configured with:

- `withCredentials: true` for refresh-cookie flows
- in-memory access token storage for bearer-authenticated requests
- a refresh handler that retries `401` responses via `/auth/refresh`

The backend exposes an API under `/api/v1` and wraps responses in a standard envelope:

- `success`
- `data`
- `meta`
- `error`

Major API groups:

- `/auth/*`
- `/projects/*`
- `/projects/:projectId/invites`
- `/invites/*`
- `/tasks/*`
- `/projects/:projectId/tasks`
- `/health`

Swagger is mounted at `/api/v1/docs` only when `SWAGGER_ENABLED=true`.

## Current Limitations And Known Issues

Implementation-backed limitations are documented in [docs/known-issues.md](docs/known-issues.md). Important examples:

- Google OAuth is not implemented; the UI explicitly marks it unavailable
- workspace header search finds visible projects by name or description, but it does not search tasks or activity
- attachments are URL-backed references, not uploaded files
- `/verify-email` no longer runs a frontend verification workflow on `main`
- backend email verification and mail delivery support still exist but are dormant by default on `main`
- the root `db:*` scripts manage the documented local compose stack for MySQL

## Developer Notes

- The backend enforces access at the project/task level through the resource access guard and authorization service.
- Task access inherits project membership; there is no task-level ACL model.
- Project ownership matters more than membership for configuration actions. Owner-only routes intentionally skip membership fallback.
- The frontend auth session provider uses access token memory state plus refresh-cookie recovery rather than persistent browser storage.
- On `main`, documentation should assume a no-email default even though dormant mail infrastructure remains in the backend.
- Seed data is deterministic and resets only records owned by the fixed demo IDs, so it is designed for repeatable local/demo use rather than one-time bootstrap.

## Supporting Documentation

- [Architecture Overview](docs/architecture-overview.md)
- [Roles And Permissions](docs/roles-and-permissions.md)
- [Project Workflows](docs/project-workflows.md)
- [Local Development](docs/local-development.md)
- [Known Issues](docs/known-issues.md)

## Future Improvements

- Expand workspace search beyond the current project finder to include tasks and activity
- Add first-class file uploads instead of URL-only task attachments
- Decide whether dormant email verification should remain supported on `main`
- Add richer operational documentation for deployment targets and environment-specific hosting
