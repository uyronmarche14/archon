# Known Issues And Current Limitations

This file documents implementation-backed gaps and rough edges in the current `main` branch.

## 1. Root DB helper scripts are stale

The root `package.json` defines:

- `db:up`
- `db:down`
- `db:logs`

Those scripts reference `scripts/docker-compose.sh`, but that file is not present in the repo. The actual compose file lives at:

- `infra/docker/docker-compose.yml`

Use direct `docker compose` commands for local DB management until the root scripts are corrected.

## 2. Google OAuth is unavailable

The auth panel renders a Google sign-in affordance, but it is intentionally non-functional. The UI explicitly states that this assessment build does not include Google OAuth yet.

Implication:

- email/password auth is the only working login path on `main`

## 3. Search is visual-only

The workspace shell renders search UI, but it is currently only presentational.

Implementation indicators:

- the shell tooltip explicitly says search is visual-only
- there is no actual search execution path wired to API or local query state

Implication:

- users should not expect workspace-wide search to function yet

## 4. Attachments are URL records, not uploaded files

Task attachments currently require:

- label
- file name
- URL

There is no backend file upload pipeline, storage integration, or binary asset handling in the current implementation.

Implication:

- attachments are reference links only

## 5. Frontend verification UX has been removed on `main`

The current branch uses:

- `EMAIL_VERIFICATION_MODE=bypass`
- `/verify-email` redirect-to-login behavior

The frontend no longer exposes a working verification inbox/resend flow on `main`.

Implication:

- account setup is no-email by default on this branch

## 6. Backend email support still exists but is dormant by default

The backend still contains:

- mail service infrastructure
- email verification logic
- invite email support
- hidden verify-email endpoints

These paths are not the mainline experience on `main`, but they have not been fully removed from the backend.

Implication:

- documentation and hosting setup must distinguish between `main` and any email-enabled branch or env override

## 7. Swagger is opt-in

Swagger is only mounted when:

```env
SWAGGER_ENABLED=true
```

If disabled, `/api/v1/docs` returns a normal API 404 envelope.

Implication:

- a working backend does not guarantee a working docs route unless the env toggle is enabled

## 8. Invite acceptance is strict about email identity

Invite acceptance requires the current session email to match the invite email exactly.

This is by design in the current implementation, but it can surprise testers when:

- they sign in with the wrong account
- they expect any authenticated user to accept the invite

The frontend handles this by prompting a logout/switch-account action.

## 9. Protected routes rely on client-side session bootstrap

The protected shell decides whether to redirect using the client-side auth session provider. That keeps the flow simple, but it also means route protection is not enforced as a server-rendered middleware step in the frontend.

Implication:

- the real authorization boundary remains the backend API

## 10. Some older documentation references no longer match the repo layout

The prior README referenced files such as:

- workspace notes under `frontend/WORKSPACE.md`, `backend/WORKSPACE.md`, `infra/WORKSPACE.md`
- docs paths that were not actually present in the repo

This documentation pass replaces those stale references, but older screenshots, branches, or notes may still mention them.
