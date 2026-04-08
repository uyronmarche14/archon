# Final Interview Prep

This prep sheet is tuned to the current `main` branch of Archon and is meant to help you present the project clearly, confidently, and technically.

## 60-Second Project Summary

Archon is a full-stack project delivery workspace built as a pnpm monorepo with a Next.js frontend, a NestJS backend, Prisma, and MySQL. I used it to solve the assessment brief around authentication, project management, task workflows, drag-and-drop status updates, and audit history. Beyond the minimum scope, I also added invite-driven collaboration, comments, URL-based attachments, notification surfaces, seeded demo data, and updated documentation so the project is easier to review and present.

## Architecture Explanation

- The frontend is built with Next.js App Router and feature-oriented modules for auth, projects, boards, tasks, and notifications.
- The backend is built with NestJS and split into focused modules such as `auth`, `projects`, `project-invites`, `tasks`, `task-logs`, and `seed`.
- Prisma is the data-access layer and MySQL is the system of record.
- The backend is the real authorization boundary. The frontend improves UX, but project and task access are enforced server-side.
- I kept the project model centered on a project owning its members, statuses, and tasks, because that makes permission rules and board behavior easier to reason about.

## Auth And Session Flow

If asked, say:

"Login returns a short-lived access token and rotates the refresh token through an HTTP-only cookie. On the frontend, I keep the access token in memory instead of localStorage, then recover sessions through `/auth/me` and `/auth/refresh`. That gives a cleaner balance between UX and security for this assessment build."

Important points:

- access token is bearer-based and stored in memory
- refresh token is cookie-based and rotated by the backend
- protected routes recover session state client-side
- the backend still enforces auth and resource access even if the frontend route shell is bypassed

## Roles And Permission Model

Use this explanation:

"Archon has both app-level and project-level permissions. At the app level there are `ADMIN` and `MEMBER`. At the project level there are `OWNER` and `MEMBER`. Owners and admins can manage project configuration such as invites and workflow statuses. Members can still work inside the board by creating tasks, updating tasks, moving tasks, commenting, and adding attachments. Task access inherits project access, so I avoided creating a second task ACL system."

## Why Invites Are Link-First

Use this answer:

"On the current branch I optimized for reviewer usability and lower delivery risk, so invites default to link mode. The backend can still support mail-related flows, but link-first invites make testing and presentation much more reliable because the reviewer can move through the acceptance flow without depending on email infrastructure."

## Why Email Verification Is Bypassed On `main`

Use this answer:

"I left the verification-related backend support in place, but on `main` I switched the default experience to `EMAIL_VERIFICATION_MODE=bypass`. That was a deliberate product and assessment tradeoff: it reduces friction during review, keeps the main user flows easy to test, and avoids tying the demo to mail provider setup. I documented that clearly so the branch behavior is explicit."

## What I Intentionally Deferred

- Google OAuth
- file uploads for attachments
- full workspace search across tasks and activity
- a full frontend email verification UX on `main`
- deployment-specific ops hardening beyond the local/demo path

Good framing:

"I prioritized the core assessment flows, stability, and documentation first. Anything I deferred was deferred deliberately, not ignored."

## Strongest Technical Decisions

- Feature-oriented frontend structure instead of a flat component dump
- Server-side authorization with project access rules and owner-only actions
- Refresh-token rotation with in-memory access tokens
- Task activity log support so status changes and updates are observable
- Seed endpoint and demo data to make local review and presentation repeatable
- Swagger and README coverage so the reviewer can inspect behavior quickly

## What I Would Improve Next

Use this answer:

"With more time, I would expand the workspace search from project discovery into task and activity search, replace URL-only attachments with real file uploads and storage, and decide whether the email verification flow should stay dormant on `main` or move into a separate email-enabled deployment mode. I'd also add more deployment-oriented documentation and deeper end-to-end verification around the full invite flow."

## Likely Interview Questions And Strong Answers

### Why should we pass you?

"Because the submission is not just feature-complete at the surface level. I structured it so the codebase is reviewable, the workflows are testable, the permissions are clear, and the tradeoffs are documented. I focused on delivering something I can explain and defend technically."

### Why did you choose Next.js and NestJS?

"They gave me strong defaults for a full-stack assessment: clear module boundaries, strong TypeScript support, good developer velocity, and enough structure to keep auth, resource access, and UI flows organized under time constraints."

### What was the hardest part?

"The hardest part was balancing product scope with stability. It's easy to overbuild in a timed assessment, so I focused on the flows that best demonstrate engineering judgment: auth, permissions, project membership, board interactions, task history, and a clean local reviewer experience."

### What would you refactor if this became production software?

"I would strengthen search and file storage, decide on the long-term email/invite strategy, add more end-to-end coverage around the highest-value flows, and continue refining the docs and operational setup for deployment targets."

### Why is task access inherited from project access?

"Because the project is the collaboration boundary. That keeps the permission model simpler, avoids duplicated ACL logic, and matches the mental model of project workspaces where tasks belong to the project rather than to a separate security domain."

## Short Demo Flow

Keep the demo calm and structured:

1. Start at the landing page and show login/signup quickly.
2. Log in with a seeded account.
3. Open the dashboard and explain visible projects plus role differences.
4. Use the workspace search to jump into a project.
5. Show the board, drag a task, and explain status-driven workflow.
6. Open a task and show comments, attachments, and activity history.
7. Show the notification bell and pending invite flow.
8. Mention Swagger and the seed endpoint as reviewer support tools.

## Presentation Mindset

- Speak in tradeoffs, not apologies.
- Call incomplete areas "intentional deferrals" when they truly were.
- Lead with architecture, permissions, and workflow clarity.
- Keep answers tied to concrete implementation details in this repo.
