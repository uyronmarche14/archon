# Known Issues And Current Limitations

This file documents implementation-backed gaps and rough edges in the current `main` branch.

## 1. Google OAuth is unavailable

The auth panel renders a Google sign-in affordance, but it is intentionally non-functional. The UI explicitly states that this assessment build does not include Google OAuth yet.

Implication:

- email/password auth is the only working login path on `main`

## 2. Workspace search is project-only

The workspace shell now includes a working project finder, but it is intentionally scoped to visible projects only.

Implementation indicators:

- the search dialog matches visible project names and descriptions
- it does not search tasks, activity entries, comments, or backend-only data
- it does not add a dedicated backend search endpoint

Implication:

- users can jump to projects quickly, but they should not expect full-text task or activity search from the global header

## 3. Attachments are URL records, not uploaded files

Task attachments currently require:

- label
- file name
- URL

There is no backend file upload pipeline, storage integration, or binary asset handling in the current implementation.

Implication:

- attachments are reference links only

## 4. Frontend verification UX has been removed on `main`

The current branch uses:

- `EMAIL_VERIFICATION_MODE=bypass`
- `/verify-email` redirect-to-login behavior

The frontend no longer exposes a working verification inbox/resend flow on `main`.

Implication:

- account setup is no-email by default on this branch

## 5. Backend email support still exists but is dormant by default

The backend still contains:

- mail service infrastructure
- email verification logic
- invite email support
- hidden verify-email endpoints

These paths are not the mainline experience on `main`, but they have not been fully removed from the backend.

Implication:

- documentation and hosting setup must distinguish between `main` and any email-enabled branch or env override

## 6. Swagger is opt-in

Swagger is only mounted when:

```env
SWAGGER_ENABLED=true
```

If disabled, `/api/v1/docs` returns a normal API 404 envelope.

Implication:

- a working backend does not guarantee a working docs route unless the env toggle is enabled

## 7. Invite acceptance is strict about email identity

Invite acceptance requires the current session email to match the invite email exactly.

This is by design in the current implementation, but it can surprise testers when:

- they sign in with the wrong account
- they expect any authenticated user to accept the invite

The frontend handles this by prompting a logout/switch-account action.

## 8. Protected routes rely on client-side session bootstrap

The protected shell decides whether to redirect using the client-side auth session provider. That keeps the flow simple, but it also means route protection is not enforced as a server-rendered middleware step in the frontend.

Implication:

- the real authorization boundary remains the backend API

## 9. Some older documentation references no longer match the repo layout

The prior README referenced files such as:

- workspace notes under `frontend/WORKSPACE.md`, `backend/WORKSPACE.md`, `infra/WORKSPACE.md`
- docs paths that were not actually present in the repo

This documentation pass replaces those stale references, but older screenshots, branches, or notes may still mention them.
