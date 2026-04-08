# Archon Frontend

This package contains the Next.js frontend for Archon. It is the user-facing application for public landing/auth routes, protected workspace navigation, project dashboards, project boards, task interactions, invite review, and notification surfaces.

This README documents the current `main` branch behavior. On this branch, the frontend follows the no-email default product flow:

- signup routes back to login
- `/verify-email` redirects to login
- invites are link-first in the UI
- matching authenticated users also see pending invites inside the app

For the repo-wide overview, see [../README.md](../README.md).
For the visual architecture and flow diagrams, see [../README.md](../README.md) and [../docs/architecture-overview.md](../docs/architecture-overview.md).

## Overview

The frontend is split into two main route groups:

- public routes under `src/app/(public)`
- protected workspace routes under `src/app/(app)/app`

### Public surface

The public surface includes:

- landing page
- login
- signup
- invite review page
- `/verify-email` redirect route

The login and signup screens share the same auth panel component. Google OAuth is intentionally not implemented in this build; the UI explicitly marks it unavailable.

### Protected workspace

The protected workspace includes:

- dashboard at `/app`
- project boards at `/app/projects/[projectId]`
- workspace sidebar and account chrome
- notification bell for pending invites and assignment notifications

Protected routes are wrapped with:

- `AuthSessionProvider`
- `ProtectedAppShell`
- `AppShellChrome`

The frontend redirects anonymous users to `/login?next=...`.

## Core Responsibilities

- render public and authenticated app routes
- bootstrap session state from `/auth/me` and `/auth/refresh`
- manage the in-memory access token lifecycle
- load projects, project detail, grouped tasks, activity, invites, and notifications from the backend
- provide a workspace-level project finder in the shell header
- provide dashboard and board interactions
- handle project creation/edit/delete flows
- handle task create/update/move/comment/attachment flows
- present resilient loading, empty, and error states

## Current Product Behavior On `main`

### Auth

- login uses email/password
- signup creates an account, then routes back to login with the email prefilled
- `/verify-email` does not render a verification workflow; it redirects to login
- session recovery uses a refresh cookie and an in-memory access token

### Invites

- invite creation is link-first in the current app flow
- invite review is public
- invite acceptance requires authentication
- the signed-in account email must match the invite email
- pending invites appear on the dashboard and in the notification bell when the invite email matches the current user

### Projects and boards

- dashboard lists the visible projects for the current user
- project creators become owners automatically
- owners/admins can edit projects, invite members, and manage statuses
- members can still work inside boards and tasks

## Project Structure

```text
frontend/
├── src/app/                  # Next App Router routes and layouts
├── src/components/           # shared chrome and UI primitives
├── src/contracts/            # frontend API contracts
├── src/features/             # feature-oriented UI, hooks, and services
├── src/lib/                  # shared config and helpers
├── src/providers/            # top-level app providers
└── src/services/http/        # axios client, token store, API base URL
```

Feature areas:

- `features/auth` — login/signup UI, auth hooks, session provider, protected shell
- `features/projects` — dashboard, project editor, invites, project members
- `features/project-board` — board controller, board shell, activity feed
- `features/tasks` — task drawer, comments, attachments, logs, task notifications
- `features/notifications` — notification aggregation and rendering
- `features/public` — landing page sections

## Tech Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- Radix-based UI primitives
- TanStack Query
- axios
- `@dnd-kit/core`
- Sonner
- Vitest + Testing Library

## Environment Variables

The checked-in `frontend/.env.example` contains:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
```

Variable purposes:

- `NEXT_PUBLIC_APP_URL` — the frontend origin used for metadata and route-level app URLs
- `NEXT_PUBLIC_API_URL` — backend API base URL, including `/api/v1`

Important:

- `NEXT_PUBLIC_APP_URL` should be an origin only
- `NEXT_PUBLIC_API_URL` should include the API prefix

## Run Locally

From the monorepo root:

```bash
pnpm install
```

Then from `frontend/`:

```bash
cp .env.example .env
pnpm dev
```

You also need the backend running at the URL configured in `NEXT_PUBLIC_API_URL`.

Default local URLs:

- frontend: `http://localhost:3000`
- backend API: `http://localhost:4000/api/v1`

For the full local reviewer flow, also start the backend, apply migrations, and optionally seed demo data. See:

- [../docs/local-development.md](../docs/local-development.md)

## Scripts

From `frontend/`:

```bash
pnpm dev
pnpm build
pnpm start
pnpm lint
pnpm test
pnpm typecheck
```

## Verification

Recommended verification before committing frontend changes:

```bash
pnpm lint
pnpm test
pnpm typecheck
pnpm build
```

## Known Issues / Current Limitations

- This package depends on a running backend; there is no mocked standalone API mode.
- Google OAuth is intentionally unavailable.
- Workspace header search is limited to visible project names and descriptions; it does not search tasks or activity.
- `/verify-email` is a redirect path on `main`, not an active verification UI.
- Task attachments are URL-backed references, not uploaded files.
- Invite acceptance and pending invite visibility depend on the current authenticated email matching the invite email.

## Related Documentation

- [../README.md](../README.md)
- [../docs/architecture-overview.md](../docs/architecture-overview.md)
- [../docs/project-workflows.md](../docs/project-workflows.md)
- [../docs/roles-and-permissions.md](../docs/roles-and-permissions.md)
- [src/README.md](./src/README.md)
