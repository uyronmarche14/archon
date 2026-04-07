# Roles And Permissions

This document captures the actual permission model implemented on the `main` branch.

## Role Layers

Archon has two overlapping role systems.

### App-level user role

Stored on `User.role`:

- `ADMIN`
- `MEMBER`

### Project-level membership role

Stored on `ProjectMember.role`:

- `OWNER`
- `MEMBER`

The project owner is also stored on `Project.ownerId`. In practice, owner-only checks rely on ownership first, then use membership only for non-owner-only access.

## Unauthenticated Visitor

Can:

- view the landing page
- open login and signup
- open invite preview links

Cannot:

- access the dashboard or project board
- accept an invite
- load pending invites or assignment notifications
- access task details, comments, attachments, or project activity

## Authenticated User

Can:

- enter protected workspace routes
- load visible projects
- bootstrap session via `/auth/me` and `/auth/refresh`
- accept a matching invite if the invite email equals the current account email

Cannot automatically:

- access all projects
- manage every project
- accept invites meant for another email

## Admin

Admins have the broadest access.

Can:

- list all projects
- access any project and task
- perform owner-scoped project actions
- edit or delete any comment
- delete any task attachment

Notes:

- the frontend also exposes broader editing affordances for admins, such as project editing controls across visible projects
- there is no separate admin console in the current implementation

## Project Owner

Owners can do everything a project member can do, plus owner-scoped project management.

Owner-only capabilities:

- create invites
- create project statuses
- update project statuses
- reorder project statuses
- delete project statuses
- edit project metadata
- delete the project

Owners can also:

- access the board
- create tasks
- update tasks
- move tasks between statuses
- comment on tasks
- add task attachments

## Project Member

Members have project/task access but not project configuration authority.

Members can:

- open the project board
- list project tasks
- create tasks
- update tasks
- move tasks between statuses
- open task drawers
- create task comments
- create task attachments
- view project activity

Members cannot:

- invite additional members
- edit project metadata
- delete the project
- manage project statuses

## Invited User

An invited user is not a special stored role until they accept the invite.

Invite behavior:

- invite preview is public
- accepting the invite requires login
- the signed-in account email must exactly match the invite email
- after acceptance, the backend creates a `ProjectMember` record for that user

If the user is not logged in:

- the invite route prompts them to log in or sign up
- the route preserves a `next` return path back to the invite

If the user is logged in with the wrong email:

- the invite route shows the mismatch
- the user can log out and switch accounts

## Project And Task Access Rules

### Project list visibility

Implemented in `ProjectQueriesService.listProjects`:

- admins see all projects
- non-admins see projects where they are owner or member

### Project route access

Implemented through `RequireProjectAccess` + `ResourceAccessGuard`:

- owner or admin always allowed
- members allowed when `ownerOnly` is false
- members blocked when `ownerOnly` is true

### Task route access

Implemented through `RequireTaskAccess` + `ResourceAccessGuard`:

- admin allowed
- project owner allowed
- project members allowed
- no task-level ACL exists beyond project membership

## Comment And Attachment Restrictions

These rules are narrower than project access.

### Comments

Anyone with task access can:

- list comments
- create comments

Only the comment author or an admin can:

- edit a comment
- delete a comment

### Attachments

Anyone with task access can:

- list attachments
- create attachments

Only the attachment creator or an admin can:

- delete an attachment

## Practical Permission Matrix

### Can create a project?

- any authenticated user

### Who becomes the owner?

- the authenticated user who created the project

### Who can invite members?

- project owner
- admin

### Who can accept an invite?

- an authenticated user whose email matches the invite email

### Who can access boards?

- project owner
- project member
- admin

### Who can move tasks?

- any authenticated user with project/task access

### Who can assign tasks?

- any authenticated user with project/task access through normal task create/update routes

### Who can edit or delete projects?

- project owner
- admin

### Who can manage statuses?

- project owner
- admin

### Who can edit/delete comments?

- comment author
- admin

### Who can delete attachments?

- attachment creator
- admin
