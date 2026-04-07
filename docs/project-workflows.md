# Project Workflows

This document explains the major user flows as they work on the current `main` branch.

## Authentication Flow

### Signup

Frontend:

- users open `/signup`
- the public auth panel validates full name, email, and password
- signup calls the backend signup endpoint
- on success, the UI routes the user to `/login` with the email prefilled

Backend:

- creates the user with app role `MEMBER`
- because `EMAIL_VERIFICATION_MODE` defaults to `bypass` on `main`, the account is treated as verified immediately
- still returns `emailVerificationRequired` in the response shape for compatibility

### Login

Frontend:

- users open `/login`
- login calls `/auth/login`
- the access token is stored in memory
- the workspace redirects to the requested `next` path or the dashboard

Backend:

- verifies credentials
- issues access token and refresh token
- refresh token is written to an HTTP-only cookie

### Session bootstrap

Protected routes mount `AuthSessionProvider`.

Bootstrap behavior:

1. try `/auth/me` if an access token already exists in memory
2. otherwise call `/auth/refresh`
3. if refresh succeeds, store the new access token and retry `/auth/me`
4. if refresh fails, treat the session as anonymous

### Verify email behavior on `main`

The public `/verify-email` route does not perform a visible verification workflow anymore.

- it redirects to `/login`
- if an email query param exists, it forwards that email into the login route

The backend still contains hidden verify-email endpoints, but the current product flow does not surface them.

## Invite Flow

### Creating an invite

Invite creation is owner/admin-only.

Current `main` behavior:

- the owner enters a teammate email in the invite dialog
- the frontend calls the invite creation endpoint
- the backend creates a hashed invite token
- because `INVITE_DELIVERY_MODE` defaults to `link`, the backend returns the invite URL
- the dialog shows the direct invite link and offers a copy action

The invite is also associated with the invited email, so existing authenticated accounts with that email can see it in-app.

### Reviewing an invite

Public route:

- `/invite/[token]`

The invite route:

- loads a public invite preview
- shows project name, invited email, inviter, and intended role
- branches based on session state

If not authenticated:

- the route asks the user to log in or create an account
- login and signup links preserve `next=/invite/[token]`

If authenticated with the matching email:

- the route shows an accept button

If authenticated with a different email:

- the route explains the mismatch
- the user can log out and switch accounts

### Accepting an invite

Backend acceptance rules:

- the invite must still be active
- the current user email must match the invite email
- the user must not already be a member

On success:

- a `ProjectMember` row is created
- the invite is marked accepted
- the frontend routes the user into the project board

### Pending invites inside the workspace

Authenticated users also see matching invites through:

- dashboard pending invites card
- notification bell

The pending invite list is built from active invites whose `email` matches the current user's email.

## Project Creation And Dashboard Flow

### Creating a project

Any authenticated user can create a project.

Creation does all of the following:

- creates the project
- sets `ownerId`
- creates an `OWNER` membership
- creates the default ordered statuses

Frontend behavior:

- the create-project dialog updates cached project lists optimistically
- then routes straight into the new project board

### Dashboard behavior

The dashboard shows:

- visible projects
- project-level metrics
- pending invites, if any

Each project card reflects:

- the current user's project role (`OWNER` or `MEMBER`)
- task counts and completion info
- edit affordances when the user is owner/admin

## Board And Task Lifecycle

### Board loading

The project board combines:

- project summary/detail data
- grouped project tasks
- project members
- local board filter and drawer state

The current board supports:

- board tab
- activity tab
- task drawer
- project-level controls in the header

### Creating tasks

Users with project access can create tasks from the board.

Task creation supports:

- title
- status
- description
- acceptance criteria
- notes
- parent task
- assignee
- due date
- links
- checklist items

### Updating tasks

Users with task access can:

- update core fields
- reassign tasks
- change due dates
- replace links and checklist items
- move the task to a different status

Task updates create task-log entries for audit/history.

### Moving tasks between statuses

Status changes are saved through a dedicated status update route.

Important behavior:

- reordering inside the same lane does not create noisy status-change logs
- moving to a different lane creates a status-change log

### Comments

Users with task access can create comments.

Only:

- the comment author
- an admin

can edit or delete a comment.

### Attachments

Attachments are currently URL-backed references, not uploaded files.

Users with task access can create them by providing:

- label
- file name
- URL

Only:

- the attachment creator
- an admin

can delete them.

### Activity feed

The activity tab is backed by task logs and supports:

- pagination
- event-type filtering
- text search over summaries and task titles

### Assignment notifications

The notification bell merges:

- pending invites
- recent assignment notifications

Assignment notifications are inferred from task-log updates where:

- the actor is not the current user
- the changed field is `assigneeId`
- the current user is the assignee

Only the latest relevant assignment event per task is shown.
