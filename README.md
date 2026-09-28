# 💡 IdeaConnect — AI-Powered Collaborative Innovation Platform

A full-stack **MERN** platform where students and innovators share ideas, form teams, build
projects, and collaborate in real time — with AI assistance, a mentor system, reputation, content
moderation, and a companion **React Native (Expo)** mobile app.

---

## ✨ Features

### 🧠 Idea Management
- Create, browse, search & filter ideas (category, status, tags, skills) with infinite scroll
- Like, bookmark, and share ideas
- Comments with threaded replies, edits, deletes and likes; `@Full Name` mentions
- **AI-powered analysis** (feasibility, innovation, market, suggestions, challenges) with
  similar-idea detection and teammate suggestions
- Drafts and visibility control (public / private / invite-only)
- Convert an idea into a project, or invite teammates onto an idea

### 📁 Project Collaboration
- Create projects from scratch or convert from an idea
- Team invitations, join requests, member roles (lead, developer, designer, researcher, mentor)
- Milestones with completion tracking
- **Task board** — 5 columns, drag-and-drop reordering, priorities, due dates, assignee;
  project progress auto-recalculates from completed tasks

### 💬 Real-Time Chat
- Direct (1:1) and group/project chats over Socket.io
- **Edit / delete** messages (for yourself or everyone), **emoji reactions**, **reply/thread**
- **File attachments** (images, documents, 10MB)
- **Typing indicators**, **read receipts** (✓ / ✓✓), live **presence** dots
- Online/offline transitions with a presence snapshot on reconnect

### 🔔 Notifications
- Bell icon with unread-count badge, dropdown preview, and a full notifications page
- Realtime push over Socket.io, plus **Expo push** to mobile devices
- **Actionable notifications** — accept/decline join requests and invitations inline
- Deep-link (`actionUrl`) navigation from each notification

### 👤 Profiles & Reputation
- Avatar, bio, skills, interests, education, experience, social links
- Role badges (Admin / Mentor / Student); message any user directly from their profile
- **Reputation** from community activity: likes received (+2), comments (+3), replies (+1),
  mentor reviews given (+5), completed tasks (+10). Self-actions never count; toggles are symmetric.

### 🎓 Mentor System
- Approved mentors review ideas with a 1–5 rating and written feedback
- Mentor directory with live search; mentorship requests; accept opens a direct chat

### 🛡️ Admin Panel
- 7 tabs: Overview (stats + analytics), Users, Ideas, Projects, Reports, Approvals, Audit Logs
- User management: role changes, ban/unban (revokes refresh tokens), mentor approval, bulk actions
- Content moderation: archive / restore / delete ideas and projects
- Content reports from users, with one-click resolution

### 📱 Mobile App (Expo / React Native)
Full parity for the core loop — auth, ideas feed & detail, projects & tasks, realtime chat,
notifications, profile, mentors, settings. Light/dark theming via NativeWind.
See [`docs/mobile/`](./docs/mobile/).

### 🔐 Security
- Short-lived JWT access tokens (~15 min) with **rotating refresh tokens** (~30 days, hashed
  server-side, max 5 devices, revocable individually or all at once)
- Role-based access control; banned accounts blocked everywhere
- Rate limiting, Helmet security headers, CORS allow-listing, Zod validation on writes

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, Vite, Tailwind CSS, TanStack Query, Zustand, react-router-dom 7, react-hook-form + Zod, Socket.io-client, lucide-react |
| **Backend** | Node.js, Express 5, Mongoose 9, Socket.io, JWT, bcrypt, Multer, Nodemailer, Zod, swagger-jsdoc |
| **Database** | MongoDB (local or Atlas) |
| **Mobile** | Expo SDK 57, React Native 0.86, Expo Router, NativeWind + Tailwind, Zustand, TanStack Query, expo-secure-store |
| **Services** | OpenAI/Gemini (AI), Cloudinary (uploads), SMTP (email), Expo push |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js 18+**
- **MongoDB** running locally (`mongodb://localhost:27017`), or a connection string

### 1. Install

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install

# Mobile (optional)
cd ../mobile
npm install
```

### 2. Configure environment

```bash
cd backend
cp .env.example .env      # fill in your own values
cd ../frontend
cp .env.example .env
```

| Variable | Description | Default |
|---|---|---|
| `PORT` | Backend port | `5000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/ideaconnect` |
| `JWT_SECRET` | JWT signing secret | **must be changed** |
| `JWT_EXPIRE` | Access-token lifetime | `15m` |
| `REFRESH_TOKEN_EXPIRE_DAYS` | Refresh-token lifetime | `30` |
| `FRONTEND_URL` | Allowed CORS origin | `http://localhost:5173` |
| `SMTP_*` | Nodemailer email config | — |
| `CLOUDINARY_*` | Cloudinary image upload | — |
| `OPENAI_API_KEY` | AI analysis key | — |

Frontend (`frontend/.env`):

```
VITE_API_URL=http://localhost:5000/api/v1
VITE_SOCKET_URL=http://localhost:5000
```

> Without real SMTP / Cloudinary / OpenAI keys the app still runs: emails are **skipped cleanly**
> (logged as `[email:skipped]`), uploads fall back to local disk, and AI analysis returns mock scores.

### 3. Seed demo data (recommended)

```bash
cd backend
npm run seed        # clears the DB, then loads demo data
npm run seed:dry    # preview without changes
```

### 4. Run

```bash
# Terminal 1 — backend
cd backend
npm run dev         # nodemon hot-reload

# Terminal 2 — frontend
cd frontend
npm run dev         # Vite dev server
```

Open **http://localhost:5173** 🎉

For a device on the same Wi-Fi, use your LAN IP in `frontend/.env` (`VITE_API_URL` and
`FRONTEND_URL` in `backend/.env`).

---

## 🐳 Docker

Run the whole stack (MongoDB + backend + nginx-served frontend) with one command:

```bash
docker compose up --build
# → http://localhost:8080
```

The frontend is served by nginx on `:8080` and reverse-proxies `/api` and `/socket.io` to the
backend, so the browser uses a single origin. Load demo data with:

```bash
docker compose exec backend node src/seed.js
```

---

## 🔑 Demo Accounts

| Role | Email | Password |
|---|---|---|
| **Admin** | `admin@ideaconnect.dev` | `password123` |
| **Mentor** | `mentor@ideaconnect.dev` | `password123` |
| **Student** | `priya@ideaconnect.dev` | `password123` |
| **Developer** | `james@ideaconnect.dev` | `password123` |

---

## 📚 API

All endpoints live under **`/api/v1`** (an unversioned `/api/*` alias is kept for the current web
build). Interactive docs: **`/api/v1/docs`** (Swagger UI) · raw spec: `/api/v1/docs.json`.

Authenticated requests send `Authorization: Bearer <accessToken>` (~15 min). Clients renew
silently via `POST /auth/refresh` using the rotating refresh token from login (~30 days).

| Route group | Endpoints | Auth |
|---|---|---|
| `/api/v1/auth` | register, login, refresh, logout, logout-all, me, verify-email, forgot/reset password, resend verification | partial |
| `/api/v1/users` | directory, profile, avatar, change-password, account, me/stats, push-tokens, skill search | ✓ |
| `/api/v1/ideas` | CRUD, search/filter/sort, like, bookmark, comments, mentor reviews, team invites, start-project requests | ✓ |
| `/api/v1/projects` | CRUD, members & roles, invites, join requests, invitations, progress, milestones | ✓ |
| `/api/v1/tasks` | project tasks CRUD, reorder, my-tasks, milestones | ✓ |
| `/api/v1/chats` | direct/group/project chats, messages, edit/delete, reactions, attachments, participants, leave | ✓ |
| `/api/v1/notifications` | list, unread-count, mark read / read-all | ✓ |
| `/api/v1/mentors` | directory, send request, my requests, incoming requests, accept/reject | ✓ |
| `/api/v1/reports` | file a content report | ✓ |
| `/api/v1/ai` | analyze idea, similar ideas, teammates, improve title/description, duplicates, recommendations | ✓ |
| `/api/v1/admin` | stats, analytics, users, ideas, projects, moderation, bulk actions, reports, approvals, audit logs | Admin |
| `/api/v1/health` | server health check | public |

### Socket.io events (`sockets/chat.socket.js`)

Sockets authenticate with the JWT in `handshake.auth.token`; the server derives the user from
`socket.userId` and ignores any client-supplied `senderId`. Chat access is checked against the
`participants` list before joining a room or writing a message.

| Client → server | Server → client |
|---|---|
| `join` / `chat:join` / `chat:leave` | `user:online` / `user:offline` / `presence:snapshot` (scoped to chat peers) |
| `message:send` | `message:received` |
| `typing:start` / `typing:stop` | `typing:user` / `typing:stopped` |
| `messages:read` | `messages:read` |
| — | `message:edited` / `message:deleted` / `message:deletedFor` / `message:reacted` |
| — | `notification` — a real Notification row was created |
| — | `chat:unread` — transient chat badge, no row created |

Sockets authenticate via the JWT in `handshake.auth.token`; the server trusts `socket.userId`
only, never a client-supplied `senderId`.

---

## 🗂️ Project Structure

```
omniroute.test/
├── backend/                  # Express + MongoDB + Socket.io
│   ├── src/
│   │   ├── config/           # env, db, socket, cloudinary
│   │   ├── controllers/      # auth, idea, project, chat, task, admin, mentor, report, user, ai, notification, comment
│   │   ├── middlewares/      # auth, errorHandler, upload
│   │   ├── models/           # User, Idea, Project, Task, Chat, Message, Comment, Notification, Invitation, AuditLog
│   │   ├── routes/           # one per controller (+ @openapi annotations)
│   │   ├── services/         # ai, email, notification, push, invitation, reputation
│   │   ├── sockets/          # chat.socket.js
│   │   ├── utils/            # response helpers, jwt, mentions
│   │   ├── validations/      # zod schemas
│   │   ├── docs/swagger.js   # OpenAPI spec
│   │   ├── __tests__/        # node:test + supertest
│   │   ├── seed.js
│   │   ├── app.js            # express app
│   │   └── server.js         # http server + socket.io
│   ├── scripts/verify-openapi.js
│   └── Dockerfile
├── frontend/                 # React + Vite + Tailwind
│   ├── src/
│   │   ├── api/              # axios instance + per-feature clients
│   │   ├── components/       # common, projects, notifications, reports
│   │   ├── layouts/          # MainLayout (sidebar), AuthLayout
│   │   ├── pages/            # Ideas, Projects, Chat, Admin, Mentors, …
│   │   ├── routes/           # AppRoutes, ProtectedRoute
│   │   ├── services/         # socket.js
│   │   ├── store/            # Zustand auth store + persist adapter
│   │   └── utils/
│   ├── Dockerfile
│   └── nginx.conf
├── mobile/                   # Expo / React Native
│   ├── app/                  # Expo Router routes
│   ├── src/                  # api, components, hooks, services, store, types, utils
│   ├── app.json  eas.json
│   └── docs/mobile/          # PRD, phases, tech stack, API reference, design spec
├── docs/mobile/              # mobile planning docs
├── .github/workflows/ci.yml
└── docker-compose.yml
```

---

## 🧪 Scripts & Tests

```bash
# Backend
npm start                    # production start
npm run dev                  # nodemon
npm run seed                 # load demo data (clears DB first)
npm run seed:dry             # preview seed
npm run backfill:reputation  # recompute reputation from existing activity
npm test                     # node:test + supertest (33 tests)
node scripts/verify-openapi.js   # asserts the OpenAPI spec covers every route

# Frontend
npm run dev
npm run build
npm run preview
npm run lint                 # oxlint
npm test                     # vitest (24 tests)

# Mobile
npm start                    # Expo
npm run typecheck            # tsc --noEmit
npm run lint
npm test                     # jest / jest-expo (29 tests)
```

Backend tests use dedicated databases (`ideaconnect_test`, `…_chataccess`, `…_socketauth`,
`…_email` — one per file, because the runner executes files concurrently and each wipes its own
collections) and boot the app on an ephemeral port, so they never touch your dev data or clash
with a running server. They require a local MongoDB on `localhost:27017`; override with
`MONGODB_URI_TEST` / `MONGODB_URI_CHATACCESS` / `MONGODB_URI_SOCKETAUTH` / `MONGODB_URI_EMAIL`.

**CI** (`.github/workflows/ci.yml`) runs on every push/PR to `main`: backend tests + OpenAPI
verification, frontend lint/test/build, mobile typecheck/lint, and a Docker build with a live
smoke test of the composed stack.

---

## 🗺️ Roadmap / Status

- [x] Auth, profiles, dashboard
- [x] Ideas, comments, likes, bookmarks, search, drafts
- [x] Projects, team invites, join requests, tasks (drag-and-drop), milestones
- [x] Real-time chat (edit/delete/reactions/attachments/read receipts/presence)
- [x] AI idea analysis + teammate suggestions
- [x] Notifications (realtime + Expo push + inline actions)
- [x] Admin panel & moderation (incl. content reports, audit logs)
- [x] Mentor system (reviews, requests, directory)
- [x] Reputation system
- [x] Refresh-token sessions, API versioning (`/api/v1`), full OpenAPI docs
- [x] React Native (Expo) mobile app — Phases 0–6
- [x] Docker + docker-compose + GitHub Actions CI
- [x] EAS build profiles (`mobile/eas.json`)
- [x] Socket authorization (chat membership) + socket regression tests
- [x] Mobile test suite (jest-expo) and web auth-store regression tests
- [~] Test coverage — 33 backend / 24 frontend / 29 mobile; no E2E or integration suite
- [ ] Mobile Phase 7 polish (skeletons, error states, first EAS release build)
- [ ] Closed-app push verification (needs an EAS build + `EXPO_PUBLIC_EAS_PROJECT_ID`)
- [ ] Google OAuth login
- [ ] Production SMTP / Cloudinary / OpenAI wiring
- [ ] Re-enable email verification enforcement (bypassed for dev — see `backend/src/middlewares/auth.js`)

---

## 📝 License

For educational / academic demonstration purposes.
