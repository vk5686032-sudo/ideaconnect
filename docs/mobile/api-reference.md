# IdeaConnect Mobile — API Reference

Base URL: `EXPO_PUBLIC_API_URL` → `http://<host>:5000/api/v1`
Interactive docs: `http://<host>:5000/api/v1/docs` (Swagger UI) · raw spec: `/api/v1/docs.json`

**Response envelopes**

```ts
// Success
{ success: true, message: string, data: T }
// Paginated success
{ success: true, message: string, data: T[], pagination: { page, limit, total, pages } }
// Error
{ success: false, message: string, errors?: string[] }   // 400/401/403/404/500
```

---

## Token flow

```
login/register/reset ──► { user, token (~15m), refreshToken (~30d) }
        │                          │            │
        │                store in SecureStore    │
        ▼                                        │
API calls send Authorization: Bearer <token> ─────┤ 401?
        ▲                                        ▼
        │              POST /auth/refresh { refreshToken }
        │                        │ returns NEW token + NEW refreshToken
        └──── retry original ◄───┘   (old refresh token is now INVALID — rotation)

logout          POST /auth/logout      { refreshToken }   // revoke this device
logout everywhere POST /auth/logout-all                   // revoke all devices
ban (admin)     → all refresh tokens wiped server-side; next refresh returns 403
```

Client rules:
- Store both tokens in SecureStore; never log them.
- On 401 from a non-auth endpoint → single-flight refresh once → retry original. If refresh fails → clear storage → route to login.
- Auth endpoints (`/auth/login`, `/auth/register`, `/auth/forgot-password`, `/auth/resend-verification`) must NOT trigger global logout on 401.

---

## Auth

| Method | Path | Body / Notes |
|---|---|---|
| POST | `/auth/register` | `{ name, email, password(min6) }` → AuthPayload |
| POST | `/auth/login` | `{ email, password }` → AuthPayload (`user, token, refreshToken`) |
| POST | `/auth/refresh` | `{ refreshToken }` → new AuthPayload (rotates) |
| POST | `/auth/logout` 🔒 | `{ refreshToken }` |
| POST | `/auth/logout-all` 🔒 | — |
| GET | `/auth/me` 🔒 | full user doc (incl. ideasCreated/projectsJoined populated) |
| GET | `/auth/verify-email/:token` | public |
| POST | `/auth/forgot-password` | `{ email }` → always check your email flow |
| PUT | `/auth/reset-password/:token` | `{ password }` → **returns fresh AuthPayload** and revokes old sessions |

## Users

| Method | Path | Notes |
|---|---|---|
| GET | `/users?page&search&skill` | Directory — **no emails** (privacy allow-list) |
| GET | `/users/search/skills?skills=a,b` | comma list |
| GET | `/users/:id` | profile; `email` present only for self/admin |
| PUT | `/users/profile` 🔒 | `{ name?, bio?, skills?[], interests?[], education?[], experience?[], socialLinks{} }` |
| PUT | `/users/avatar` 🔒 | multipart field `avatar` (image ≤5MB) → `{ avatar }` |
| PUT | `/users/change-password` 🔒 | `{ currentPassword, newPassword }` |
| DELETE | `/users/account` 🔒 | `{ password }` |
| GET | `/users/me/stats` 🔒 | `{ ideasCount, projectsCount, reputation }` |
| PUT | `/users/me/push-tokens` 🔒 | `{ token: ExponentPushToken[...], platform: 'ios'|'android'|'web' }` |
| DELETE | `/users/me/push-tokens/:token` 🔒 | unregister device |

## Ideas

Browse: `GET /ideas?page&limit&search&category&status&sort` — status ∈ `open|in-progress|completed|archived` (drafts never listed); sort ∈ `newest|oldest|popular|trending`. Returns paginated array with author populated.

Detail: `GET /ideas/:id` → idea incl. author, team[], mentorReviews[] (mentor populated), aiAnalysis, likes[], bookmarks[]. Private/invite-only → 404 unless author/team/admin.

| Action | Call |
|---|---|
| Create / edit | `POST /ideas` · `PUT /ideas/:id` — body: title(≥5), description(≥20), category enum, tags[], requiredSkills[], visibility(`public|private|invite-only`), status(`open|draft`) |
| Delete | `DELETE /ideas/:id` |
| Like toggle | `POST /ideas/:id/like` → `{ likesCount, isLiked }` |
| Bookmark toggle | `POST /ideas/:id/bookmark` → `{ isBookmarked }` |
| My ideas / bookmarks | `GET /ideas/my/ideas` · `GET /ideas/my/bookmarks` |
| Mentor review | `POST /ideas/:id/review { review(≥10), rating(1-5) }` (upsert) · `DELETE /ideas/:id/review` |

Comments under an idea:

| Action | Call |
|---|---|
| List / add | `GET /ideas/:ideaId/comments` · `POST … { content, parentId? }` |
| Edit own / delete own | `PUT /ideas/comments/:id { content }` · `DELETE /ideas/comments/:id` |
| Like comment | `POST /ideas/comments/:id/like` |

Mentions: comment text supports `@Full Name` → mention notifications (server-side).

Teams & start-project:

| Action | Call |
|---|---|
| Invite user (owner) | `POST /ideas/:id/invites { userId, role?, message? }` |
| My incoming idea invites | `GET /ideas/invites/my` |
| Accept/reject invite | `POST /ideas/invites/:invitationId/:action` (`accept|reject`) |
| Remove team member (owner) | `DELETE /ideas/:id/team/:userId` |
| Start-project request | `POST /ideas/:id/start-project-request { message }`; owner handles via `/ideas/start-project-requests/:requestId/approve|reject` |

## Projects

- `GET /projects?page&search` · `GET /projects/my/projects`
- `GET /projects/:id` → owner, members[] (populated), tasks, milestones[], progress, visibility (`public|private`)
- `POST /projects` `{ title, description, technologies[], deadline?, visibility? }` (+ optional `ideaId` conversion)
- Members: `POST /projects/:id/members { userId, role }` · role ∈ `lead|developer|designer|researcher|mentor`
- Join request: `POST /projects/:id/join-request { message }` → owner lists via `GET /projects/:id/invitations?status=pending` → `POST /projects/invitations/:invitationId/accept|reject`
- Progress: `PUT /projects/:id/progress { progress }` (auto-recalcs from tasks too)

## Tasks

- `GET /projects/:projectId/tasks` · `GET /tasks/my` 🔒
- `POST /projects/:projectId/tasks { title, description?, status?, priority?, assignedTo?, dueDate? }`
- Status ∈ `todo|in-progress|review|completed|cancelled` · priority ∈ `low|medium|high|urgent`
- `PUT /tasks/:id` (status transitions drive project progress + assignee reputation ±10)
- Milestones: `POST/PUT/DELETE /projects/:projectId/milestones(/:milestoneId)` `{ title, description?, dueDate?, completed? }`

## Chats

REST: `POST /chats/direct { recipientId }` · `POST /chats/group { name, description?, members[] }` · `GET /chats` · `GET /chats/project/:projectId` · `GET /chats/:id` · `GET /chats/:id/messages?page&limit` · `PATCH /chats/:id/messages/:messageId { content }` · `DELETE …/:messageId?scope=everyone|me` · `POST …/reactions { emoji }` · `POST /chats/:id/attachments` (multipart `file` ≤10MB + optional `content`) · participants add/remove/promote · `POST /chats/:id/leave`.

### Socket.io events

Connect once while authed: `io(SOCKET_URL, { auth: { token }, transports:['websocket','polling'] })`.

| Client emits | Payload | Server emits back |
|---|---|---|
| `join` | `userId` | `user:online(userId)` / `user:offline(userId)` (global) |
| `chat:join` / `chat:leave` | `chatId` | — |
| `message:send` | `{ chatId, content, senderId, replyTo? }` | `message:received(message)` to room; `notification {type:'new_message'}` to other members |
| `typing:start` / `typing:stop` | `{ chatId, userId, userName? }` | `typing:user` / `typing:stopped` (others in room) |
| `messages:read` | `{ chatId, userId }` | broadcast `messages:read { chatId, userId }` |

Server also emits mutation syncs: `message:edited(msg)`, `message:deleted {chatId,messageId}`, `message:deletedFor`, `message:reacted {chatId,messageId,reactions}`.

Read model: each message has `readBy: [{ user, readAt }]` — ✓ when only sender present, ✓✓ blue when any peer appears.

## Notifications

`GET /notifications?page&limit` · `GET /notifications/unread-count` → `{ count }` · `PUT /notifications/:id/read` · `PUT /notifications/read-all`

Types seen in `type`: `like, comment, reply, mention, invitation, join-request, project-update, task-assigned, mentor-review, mentor-request(+accepted/rejected), ai-analysis, system, start-project-*`. Each carries `title`, `message`, `actionUrl` (deep-link target), `relatedIdea/Project/Comment/User`.

Push: server auto-dispatches Expo push on every notification creation to registered device tokens. Mobile registers via `PUT /users/me/push-tokens` after login.

## Mentors

- `GET /mentors?search=` → approved mentors (name/avatar/bio/skills, reputation-sorted)
- `POST /mentors/:id/requests { message }` (dup-pending guarded)
- `GET /mentors/requests/my` (sent) · `GET /mentors/requests/incoming` 🔒 mentor-only
- `POST /mentors/requests/:requestId/:action` (`accept` → creates direct chat; `reject`)
- Invitations expire silently after 7 days (`status: 'expired'`)

## Reports (post-v1 UI)

`POST /reports { targetType: 'idea'|'project'|'comment'|'user', targetId, reason: 'spam'|'harassment'|'inappropriate'|'misinformation'|'other', details? }`

## Reputation (display-only on mobile)

Earned server-side: like received +2 · comment received +3 · reply +1 · mentor review given +5 · task completed +10 (reversed on undo). Surfaces: `/users/me/stats`, mentor directory ordering.
