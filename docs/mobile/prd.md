# IdeaConnect Mobile — Product Requirements Document (PRD)

**Platform:** iOS + Android via React Native (Expo, managed workflow)
**Backend:** Existing IdeaConnect API at `/api/v1` — zero backend changes required for v1
**Status:** Planning → implementation tracked in [phases.md](./phases.md)

---

## 1. Vision

Bring IdeaConnect's collaborative innovation platform to students' pockets. The web app is where ideas get built at a desk; the mobile app is where engagement happens between classes — browsing ideas in the corridor, replying to chat pings instantly, and getting push-notified when a mentor reviews your idea.

**One sentence:** *All of IdeaConnect's community features, optimized for one-handed, on-the-go use with real-time notifications.*

## 2. Target users / personas

| Persona | Primary mobile needs |
|---|---|
| **Priya — Student innovator** | Browse/feed ideas between lectures, like & bookmark, comment, check task assignments, reply to team chats |
| **Marcus — Mentor** | Get pushed when someone requests mentorship or posts an idea in his field; review ideas quickly with a rating |
| **Team lead** | Project progress at a glance, invite/answer join requests, nudge tasks |

## 3. v1 Feature Matrix

Legend: ✅ Must-have (v1) · 🟡 Should-have (v1 if time allows) · ⏳ Deferred (post-v1)

| Feature | Priority | Backend surface |
|---|---|---|
| Email/password login, registration | ✅ | `POST /auth/login`, `POST /auth/register` |
| Session persistence + silent token refresh | ✅ | `token` + `refreshToken`, `POST /auth/refresh` |
| Logout (current device) | ✅ | `POST /auth/logout` |
| Forgot / reset password | ✅ | `POST /auth/forgot-password`, `PUT /auth/reset-password/:token` |
| Ideas feed: browse, search, filter, sort, infinite scroll | ✅ | `GET /ideas?page&search&category&status&sort` |
| Idea detail: full content, author, skills, mentor reviews | ✅ | `GET /ideas/:id` |
| Like / bookmark an idea | ✅ | `POST /ideas/:id/like`, `POST /ideas/:id/bookmark` |
| Comments: read, add, delete own, like | ✅ | `/ideas/:ideaId/comments*` |
| Notifications center + unread badge | ✅ | `GET /notifications`, `/notifications/unread-count` |
| Push notifications (Expo) | ✅ | `PUT/DELETE /users/me/push-tokens` + server dispatch |
| Direct & team chat (realtime) | ✅ | Socket.io + `GET /chats*`, attachments |
| Typing indicators, read receipts, presence dots | ✅ | socket events (`typing:*`, `messages:read`, `user:online/offline`) |
| Own profile view + edit (bio/skills/avatar) | ✅ | `GET/PUT /users/profile`, `PUT /users/avatar` |
| View other users' profiles; start chat with them | ✅ | `GET /users/:id`, `POST /chats/direct` |
| Projects list + detail (progress, members) | 🟡 | `GET /projects*` |
| Task board (view, change status) + milestones | 🟡 | `/projects/:id/tasks`, `PUT /tasks/:id` |
| Create/edit idea | 🟡 | `POST/PUT /ideas` |
| Mentor directory + request mentorship | 🟡 | `GET /mentors`, `POST /mentors/:id/requests` |
| Saved/bookmarked ideas screen | 🟡 | `GET /ideas/my/bookmarks` |
| Settings: change password, logout everywhere | 🟡 | `PUT /users/change-password`, `POST /auth/logout-all` |
| Dashboard/home summary (stats, my tasks) | 🟡 | `GET /users/me/stats`, `GET /tasks/my` |
| Create project from idea | ⏳ | `POST /projects?idea=` |
| Invite-only team management UI | ⏳ | `/ideas/:id/invites*` |
| AI analysis screens | ⏳ | `/ai/*` |
| Content reporting UI | ⏳ | `POST /reports` |
| Admin panel | ⏳ | Out of scope for mobile |

## 4. Screen inventory (~16 screens)

Grouped by navigator. Acceptance criteria are per-screen smoke checks.

### Auth group (`app/(auth)/`)
1. **Login** — email/password form; inline validation errors (wrong password must show toast, never log out); links to register/forgot.
2. **Register** — name/email/password/confirm; success shows "check your email" state with continue button.
3. **Forgot password** — email submit → confirmation state.
4. **Reset password** (`reset-password?token=`) — new password fields; deep-link target of reset emails.
5. **Verify email** (`verify-email?token=`) — auto-verifies on open; resend-by-email fallback. *(Enforcement currently bypassed server-side.)*

### Tab group (`app/(tabs)/`) — bottom tabs
6. **Home** — greeting + stats cards (ideas/projects/tasks/reputation), my open tasks preview, recent ideas.
7. **Ideas** — search bar, category/status/sort chips, flat list w/ pull-to-refresh + infinite scroll; card = category badge, title, excerpt, likes/comments/views, author row.
8. **Projects** — my projects grid/list with progress bars.
9. **Chat** — conversation list w/ last message, unread feel, online dot for DMs.
10. **Profile** — own profile summary + quick links (My Ideas, Bookmarks, Settings, Mentor directory).

### Stacked screens
11. **Idea Detail** — full content, badges, author, actions row (like/bookmark/share), mentor-reviews section, comments thread w/ composer.
12. **Create/Edit Idea** — form w/ category picker, visibility, tags, skills chips; draft option.
13. **Project Detail** — status/visibility header, progress bar, milestones checklist, members list, tasks section, "open chat" button.
14. **Create Project** — minimal form (title/description/tech/deadline).
15. **Chat Room** — message list (bubbles, own right-aligned), composer with attachment + emoji, typing indicator, read ✓ marks, presence in header, reply-to bar, long-press reactions/edit/delete.
16. **Notifications** — grouped list, unread highlight, tap navigates via `actionUrl`; mark-all-read.
17. **User Profile** (view others) — avatar/badges/skills; Message + Request Mentorship buttons.
18. **Mentors** — searchable directory; request-mentorship action; "My Requests" tab with status chips.
19. **Settings** — avatar upload, change password, sessions (logout all), push-token unregister, about.

## 5. User stories (representative)

- As a student, I pull-to-refresh the Ideas feed and see new ideas without leaving the screen.
- As a student, I tap 🔔 and see that a mentor reviewed my idea; tapping it opens that idea.
- As a mentor, I receive a push notification when someone requests mentorship, even with the app closed; tapping it opens the dashboard-equivalent requests view.
- As a teammate, I see typing dots and ✓✓ when my message was read.
- As any user, I close and reopen the app after a week and I'm still logged in (refresh token), never seeing a manual re-login unless refresh fails.

## 6. Non-functional requirements

- **Security:** access + refresh tokens in `expo-secure-store` (device keystore/Keychain), never AsyncStorage. Refresh rotation handled transparently in the axios interceptor.
- **Offline tolerance:** TanStack Query cache renders stale data instantly; mutations queue user feedback via toasts. Full offline mode deferred.
- **Performance:** lists virtualized (FlatList/FlashList); images via cached Expo Image; cold start to first content < 3s on mid-range Android.
- **Realtime:** single shared Socket.io connection while authed; reconnect with backoff; presence events update a global online-users set.
- **Accessibility:** min touch targets 44pt, labels on icon buttons, dynamic font scaling respected.
- **Theming:** light + dark via NativeWind `colorScheme`, follows OS setting.

## 7. Out of scope (v1)

Admin panel, content reporting UI, Google OAuth, offline-first sync, tablet-specific layouts, localization (English only).

## 8. Success metrics (informal)

- Login → first idea viewed in < 30s for a new user
- Push notification delivered < 5s after triggering event
- Chat message round-trip visually instant (<300ms local echo)
