# Architecture Overview

This document describes the current `main` branch architecture of Archon as implemented in the repo.

## Monorepo Layout

Archon is a pnpm workspace monorepo:

```text
dowinn/
├── backend/   # NestJS API + Prisma schema/migrations
├── frontend/  # Next.js App Router client
├── infra/     # Local infrastructure assets, mainly Docker/MySQL
├── scripts/   # Workspace helper scripts
└── docs/      # Project documentation
```

The root workspace manages dependency installation and common commands:

- `pnpm dev`
- `pnpm build`
- `pnpm lint`
- `pnpm test`
- `pnpm typecheck`

## Visual Maps

### System architecture

```mermaid
flowchart LR
  user["Visitor / Member / Admin"]
  public["Public pages<br/>landing, login, signup, invite review"]
  shell["Protected workspace shell<br/>dashboard, board, notifications"]
  frontend["Next.js 16 App Router"]
  api["NestJS 11 API<br/>/api/v1"]
  prisma["Prisma 7 + MariaDB adapter"]
  db["MySQL / MariaDB"]
  mail["Mail providers<br/>Resend / SMTP"]
  infra["Local infra<br/>Docker compose MySQL"]

  user --> public
  user --> shell
  public --> frontend
  shell --> frontend
  frontend --> api
  api --> prisma
  prisma --> db
  infra -. local only .-> db
  api -. dormant on main .-> mail
```

### Auth and session flow

```mermaid
flowchart LR
  login["Login or signup page"]
  signup["Signup creates account"]
  loginReturn["Redirect to login with prefilled email"]
  auth["POST /auth/login"]
  access["Access token stored in memory"]
  refresh["Refresh token stored in HTTP-only cookie"]
  me["GET /auth/me"]
  retry["POST /auth/refresh on 401"]
  protected["Protected workspace routes"]
  verify["/verify-email redirects to login on main"]

  signup --> loginReturn
  login --> auth
  auth --> access
  auth --> refresh
  access --> me
  me --> protected
  protected -. expired access .-> retry
  retry --> access
  verify -. dormant verification UX .-> login
```

### Project collaboration flow

```mermaid
flowchart LR
  owner["Owner or admin"]
  project["Create project"]
  memberRecord["Owner becomes Project.ownerId and ProjectMember OWNER"]
  statuses["Default statuses seeded"]
  invite["Create invite"]
  preview["Public invite preview"]
  auth["Matching user logs in or signs up"]
  accept["Accept invite"]
  membership["Project membership granted"]
  board["Board and task workspace"]
  logs["Task logs and notifications"]

  owner --> project
  project --> memberRecord
  project --> statuses
  owner --> invite
  invite --> preview
  preview --> auth
  auth --> accept
  accept --> membership
  membership --> board
  board --> logs
```

### Board and task workflow

```mermaid
flowchart LR
  statuses["Project statuses define lanes"]
  grouped["Grouped task query returns tasks by status"]
  board["Board renders ordered lanes"]
  member["Owner, member, or admin works on tasks"]
  create["Create or edit task"]
  move["Move task between statuses"]
  discuss["Comments and URL attachments"]
  notify["Assignment notifications"]
  tasklog["TaskLog activity stream"]
  ownerOnly["Owner/admin status management"]

  statuses --> grouped
  grouped --> board
  member --> create
  member --> move
  member --> discuss
  create --> tasklog
  move --> tasklog
  discuss --> tasklog
  move --> notify
  ownerOnly --> statuses
```

## Detailed Interaction Maps

### Frontend-to-backend request lifecycle

```mermaid
flowchart LR
  ui["Route or feature component"]
  hook["Feature hook"]
  service["Feature service"]
  axios["Shared axios client"]
  retry["401 refresh handler"]
  api["Nest controller"]
  guard["JWT + resource guards"]
  usecase["Service / query layer"]
  prisma["Prisma service"]
  db["MySQL / MariaDB"]
  envelope["Response envelope"]

  ui --> hook
  hook --> service
  service --> axios
  axios -. unauthorized .-> retry
  retry --> axios
  axios --> api
  api --> guard
  guard --> usecase
  usecase --> prisma
  prisma --> db
  db --> prisma
  prisma --> usecase
  usecase --> api
  api --> envelope
  envelope --> axios
  axios --> service
  service --> hook
  hook --> ui
```

### Auth bootstrap and session recovery

```mermaid
sequenceDiagram
  participant User as User
  participant Route as Protected route
  participant Session as AuthSessionProvider
  participant Client as Axios client
  participant API as Nest auth endpoints
  participant Tokens as Access token store + refresh cookie

  User->>Route: Open /app or /app/projects/:id
  Route->>Session: Mount protected shell
  alt Access token already in memory
    Session->>Client: GET /auth/me
    Client->>API: Authorization: Bearer accessToken
    API-->>Client: Current user envelope
    Client-->>Session: Hydrated session
  else No access token in memory
    Session->>Client: POST /auth/refresh
    Client->>API: Send refresh cookie
    API->>Tokens: Validate + rotate refresh token
    API-->>Client: New access token
    Client-->>Session: Store access token in memory
    Session->>Client: GET /auth/me
    Client->>API: Authorization: Bearer new access token
    API-->>Client: Current user envelope
    Client-->>Session: Hydrated session
  end
  opt Refresh fails
    Session-->>Route: Treat user as anonymous
    Route-->>User: Redirect to /login?next=...
  end
```

### Invite preview and acceptance journey

```mermaid
sequenceDiagram
  participant Owner as Owner/Admin
  participant Frontend as Frontend invite dialog
  participant Backend as ProjectInvitesModule
  participant Invite as ProjectInvite token store
  participant Visitor as Invite recipient
  participant Public as Public invite route
  participant Auth as Login / signup flow
  participant Accept as Accept invite endpoint

  Owner->>Frontend: Submit teammate email
  Frontend->>Backend: POST /project-invites
  Backend->>Invite: Create hashed invite token
  Invite-->>Backend: Stored active invite
  Backend-->>Frontend: Invite URL (link mode on main)

  Visitor->>Public: Open /invite/[token]
  Public->>Backend: GET invite preview
  Backend-->>Public: Project + inviter + invited email

  alt Not authenticated
    Public-->>Visitor: Prompt login or signup with next=/invite/[token]
    Visitor->>Auth: Sign in or create matching account
  end

  Visitor->>Accept: POST accept invite
  Accept->>Backend: Validate token + current user
  Backend->>Invite: Ensure invite is active and email matches
  Backend->>Invite: Mark invite accepted
  Backend-->>Accept: Create ProjectMember row
  Accept-->>Visitor: Route into project board
```

### Board load and task update lifecycle

```mermaid
sequenceDiagram
  participant User as Owner / Member / Admin
  participant Board as Project board shell
  participant Tasks as Task services + hooks
  participant API as TasksModule / ProjectsModule
  participant Guard as ResourceAccessGuard
  participant Data as Project, statuses, tasks
  participant Logs as TaskLog + notifications

  User->>Board: Open /app/projects/:projectId
  Board->>API: Load project detail, members, grouped tasks
  API->>Guard: Assert project or task access
  Guard-->>API: Access granted
  API->>Data: Read project, statuses, grouped tasks
  Data-->>API: Ordered lanes + task payload
  API-->>Board: Initial board state

  User->>Tasks: Create, edit, or move task
  Tasks->>API: POST/PATCH task request
  API->>Guard: Re-check membership / owner-only rules
  Guard-->>API: Access granted
  API->>Data: Persist task changes
  API->>Logs: Write TaskLog event
  opt Assignee changed
    Logs->>Logs: Surface assignment notification
  end
  API-->>Tasks: Updated task envelope
  Tasks-->>Board: Revalidate grouped board data
```

### Role and permission boundary map

```mermaid
flowchart LR
  admin["ADMIN"]
  owner["Project OWNER"]
  member["Project MEMBER"]
  visitor["Unauthenticated visitor"]

  browse["Landing, login, signup, invite preview"]
  workspace["Workspace shell and dashboard"]
  board["Project board and tasks"]
  manageProject["Edit/delete project"]
  manageStatuses["Create/reorder/update/delete statuses"]
  invite["Create invites"]
  comments["Comment and attachment actions"]
  elevated["Admin-only overrides<br/>cross-project access and author override"]

  visitor --> browse
  member --> workspace
  owner --> workspace
  admin --> workspace

  member --> board
  owner --> board
  admin --> board

  owner --> manageProject
  admin --> manageProject

  owner --> manageStatuses
  admin --> manageStatuses

  owner --> invite
  admin --> invite

  member --> comments
  owner --> comments
  admin --> comments

  admin --> elevated
```

## Frontend Architecture

The frontend is a Next.js App Router application in `frontend/`.

### Route model

Public routes live under `src/app/(public)`:

- `/`
- `/login`
- `/signup`
- `/invite/[token]`
- `/verify-email`

Protected workspace routes live under `src/app/(app)/app`:

- `/app`
- `/app/projects/[projectId]`

The protected route group wraps its content with:

- `AuthSessionProvider`
- `ProtectedAppShell`
- `AppShellChrome`

### State and data flow

The frontend uses:

- React Query for request caching and mutations
- an axios client for API calls
- an in-memory access token store
- refresh-cookie recovery through `/auth/refresh`

Request flow:

1. UI components call feature hooks.
2. Hooks call service functions.
3. Service functions call the shared axios client.
4. The axios client attaches the in-memory access token when available.
5. On a `401`, the client can trigger the registered refresh handler.
6. The refresh handler calls `/auth/refresh`, stores the new access token, and retries the request.

The frontend never persists the access token to local storage. Session recovery depends on the refresh cookie plus the auth bootstrap query.

### UI architecture

Most frontend behavior is organized by feature:

- `features/auth`
- `features/projects`
- `features/project-board`
- `features/tasks`
- `features/notifications`

This keeps the route files thin and pushes business behavior into feature hooks and controllers.

## Backend Architecture

The backend is a NestJS application in `backend/`.

### Core module graph

The application module wires:

- `AuthModule`
- `HealthModule`
- `MailModule`
- `ProjectsModule`
- `ProjectInvitesModule`
- `SeedModule`
- `TaskLogsModule`
- `TasksModule`

It also loads environment validation and the Prisma database module.

### Global backend behaviors

`configureApplication` sets:

- global route prefix: `/api/v1`
- global validation pipe
- global response envelope interceptor
- global exception filter
- security-oriented response headers
- proxy trust configuration

The backend also installs request ID middleware globally.

### Response model

The API uses a consistent JSON envelope:

```json
{
  "success": true,
  "data": {},
  "meta": {},
  "error": null
}
```

Errors are normalized through the global exception filter.

### Swagger

Swagger is configured in `configure-swagger.ts`.

- UI path: `/api/v1/docs`
- JSON path: `/api/v1/docs-json`
- only mounted when `SWAGGER_ENABLED=true`

The current `main` branch intentionally hides the verify-email endpoints from Swagger, even though the backend routes still exist.

## Database Architecture

The backend uses Prisma 7 with:

- `@prisma/client`
- `@prisma/adapter-mariadb`
- a MySQL/MariaDB datasource

Main entities:

- `User`
- `RefreshToken`
- `EmailVerificationToken`
- `Project`
- `ProjectMember`
- `ProjectStatus`
- `Task`
- `TaskLog`
- `TaskLink`
- `TaskChecklistItem`
- `TaskComment`
- `TaskAttachment`
- `ProjectInvite`

### Key modeling decisions

- app-level role lives on `User.role`
- project role lives on `ProjectMember.role`
- project owner is stored separately on `Project.ownerId`
- task access is inferred from project access, not stored independently
- invite acceptance is email-bound
- invite tokens and email verification tokens are stored as hashes, not raw tokens

## Authorization Model

Authorization is centralized through the auth resource access system.

### Project access

`ResourceAuthorizationService.assertProjectAccess` allows:

- admins
- project owners
- project members for non-owner-only routes

Owner-only routes deliberately do not fall back to membership checks.

### Task access

`ResourceAuthorizationService.assertTaskAccess` allows:

- admins
- project owners
- project members with membership in the task's project

This means task permissions are inherited from project membership.

### Ownership-specific restrictions outside the main guard

Some actions add narrower service-level restrictions:

- task comments can only be updated/deleted by the comment author or an admin
- task attachments can only be deleted by the attachment creator or an admin

## Current Auth and Invite Defaults On `main`

The `main` branch runtime defaults are:

- `EMAIL_VERIFICATION_MODE=bypass`
- `INVITE_DELIVERY_MODE=link`

Implications:

- signup completes without requiring frontend verification UX
- `/verify-email` redirects to login
- invite creation returns a direct link by default
- the backend mail and verification infrastructure remains available but dormant unless explicitly re-enabled by env

The diagrams above reflect the `main` branch defaults, not the alternate `main-email` branch.
