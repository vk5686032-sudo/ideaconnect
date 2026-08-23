# 💡 IdeaConnect — AI-Powered Collaborative Innovation Platform

A full-stack **MERN** application where students and innovators can **share ideas, form teams, build projects, and collaborate in real time** — with AI assistance and a complete admin panel.

---

## ✨ Features

### 🧠 Idea Management
- Create, browse, search & filter ideas (by category, status, tags, skills)
- Like, bookmark, and share ideas
- Rich detail view with comments & replies
- AI-powered idea analysis (feasibility, innovation, market, suggestions, challenges)
- Convert an idea into a project with one click

### 📁 Project Collaboration
- Create projects from scratch or convert from ideas
- Team invitations & member roles
- Milestones with completion tracking
- **Task board** — assign members, set priorities & due dates, track status; progress auto-calculates from completed tasks

### 💬 Real-Time Chat
- Direct (1:1) and group chats
- **Edit / delete** messages (for yourself or everyone)
- **Emoji reactions** on messages
- **File attachments** (images, documents — 10MB)
- **Reply / thread** to specific messages
- **Typing indicators** & **read receipts**
- Live presence (online/offline) via Socket.io

### 🔔 Notifications
- Bell icon with unread-count badge (sidebar + mobile top bar)
- Dropdown preview of recent notifications
- Full notifications page with mark-all-read
- Triggered by likes, comments, project invites, task assignments

### 👤 User Profiles
- Avatar, bio, skills, interests, education & experience
- Role badges (Admin / Mentor / Student)
- Social links
- Message users directly from their profile

### 🛡️ Admin Panel
- Dashboard stats (users, ideas, projects, active users)
- **User management** — change roles, ban/unban, approve mentors
- **Content moderation** — archive/delete ideas & projects
- Analytics (ideas by category, projects by status, top users)

### 🎓 Mentor System
- Approved mentors review ideas with ratings (1–5) + written feedback
- Mentor directory with search, mentorship requests (accept opens a direct chat)
- Incoming-request management on the dashboard

### ⭐ Reputation
- Points earned from community activity: likes received (+2), comments (+3), replies (+1), mentor reviews given (+5), completed tasks (+10)
- Self-actions never count; toggles are fully symmetric

### 🚩 Content Reporting
- Report ideas, projects, comments, or users with categorized reasons
- Reports land in the admin panel with one-click archive/delete resolution

### 🔐 Security & UX
- JWT authentication with short-lived access tokens + rotating refresh tokens (multi-device, revocable)
- Role-based access control, banned accounts blocked everywhere
- Email verification + password reset flows (verification currently bypassed in dev — see `middlewares/auth.js`)
- Rate limiting, Helmet security headers, CORS allow-listing
- Fully **responsive** — sidebar drawer on mobile, single-pane chat toggle
- Toast notifications, loading states, optimistic UI

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, Vite, Tailwind CSS, TanStack Query, Zustand, react-router-dom, react-hook-form + Zod, Socket.io-client, lucide-react |
| **Backend** | Node.js, Express 5, Mongoose 9, Socket.io, JWT, bcrypt, Multer, Nodemailer, Zod |
| **Database** | MongoDB (local or Atlas) |
| **Services** | OpenAI/Gemini API (AI), Cloudinary (image uploads), SMTP (email) |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** v18+
- **MongoDB** running locally (`mongodb://localhost:27017`), or a connection string

### 1. Clone & install

```bash
git clone <your-repo-url>
cd omniroute.test

# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configure environment

Copy the example and fill in your values:

```bash
cd backend
cp .env.example .env
```

| Variable | Description | Default |
|---|---|---|
| `PORT` | Backend port | `5000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/ideaconnect` |
| `JWT_SECRET` | JWT signing secret | change in production |
| `JWT_EXPIRE` | Token lifetime | `7d` |
| `SMTP_*` | Nodemailer email config | — |
| `CLOUDINARY_*` | Cloudinary image upload | — |
| `OPENAI_API_KEY` | AI analysis key | — |

Frontend config (`frontend/.env`):

```
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

> **Note:** without real SMTP / Cloudinary / OpenAI keys the app still runs — emails, cloud image uploads and AI analysis fall back to safe mock/demo behavior.

### 3. Seed demo data (optional but recommended)

```bash
cd backend
npm run seed        # clears DB + loads demo data
npm run seed:dry    # preview without making changes
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

---

## 🔑 Demo Accounts

| Role | Email | Password |
|---|---|---|
| **Admin** | `admin@ideaconnect.dev` | `password123` |
| **Mentor** | `mentor@ideaconnect.dev` | `password123` |
| **Student** | `priya@ideaconnect.dev` | `password123` |
| **Developer** | `james@ideaconnect.dev` | `password123` |

---

## 📚 API Overview

All endpoints live under **`/api/v1`** (an unversioned `/api/*` alias is kept for the current web build). Interactive docs: **`/api/v1/docs`** (Swagger UI) · raw spec: `/api/v1/docs.json`.

Authenticated requests expect a Bearer access token (~15 min). Clients silently renew it via `POST /auth/refresh` using the rotating refresh token returned at login (~30 days, hashed server-side, max 5 devices).

| Route Group | Endpoints | Auth |
|---|---|---|
| `/api/auth` | register, login, logout, me, verify-email, forgot-password, reset-password | partial |
| `/api/users` | profile CRUD, upload avatar, all users, user by id | ✓ |
| `/api/ideas` | CRUD, search, pagination, like, bookmark, comments, AI analysis | ✓ |
| `/api/projects` | CRUD, invite members, accept/reject invite, progress | ✓ |
| `/api/chats` | direct/group chats, messages, edit/delete, reactions, attachments, read | ✓ |
| `/api/notifications` | list, unread-count, mark read / all read | ✓ |
| `/api/tasks` | project tasks CRUD, my-tasks, milestones | ✓ |
| `/api/admin` | stats, users, ideas, projects, role/ban/mentor actions | Admin |
| `/api/ai` | analyze idea | ✓ |
| `/api/health` | server health | public |

### Socket.io events (`chat.socket.js`)

| Event (client → server) | Event (server → client) |
|---|---|
| `join` / `chat:join` / `chat:leave` | `user:online` / `user:offline` |
| `message:send` | `message:received` |
| `typing:start` / `typing:stop` | `typing:user` / `typing:stopped` |
| `messages:read` | `messages:read` |
| — | `notification` (realtime push) |

---

## 🗂️ Project Structure

```
omniroute.test/
├── backend/
│   ├── src/
│   │   ├── config/        # env, db, socket, cloudinary
│   │   ├── controllers/   # auth, idea, project, chat, task, admin…
│   │   ├── middlewares/   # auth, errorHandler, upload
│   │   ├── models/        # User, Idea, Project, Task, Chat, Message…
│   │   ├── routes/        # one per controller
│   │   ├── services/      # ai, email, notification
│   │   ├── sockets/       # chat.socket.js
│   │   ├── utils/         # response helpers
│   │   ├── seed.js        # demo data
│   │   ├── app.js
│   │   └── server.js
│   └── package.json
└── frontend/
    └── src/
        ├── api/           # axios + per-feature API clients
        ├── components/    # common & feature components
        ├── layouts/       # MainLayout (sidebar), AuthLayout
        ├── pages/         # Ideas, Projects, Chat, Notifications, Admin…
        ├── routes/        # AppRoutes, ProtectedRoute
        ├── services/      # socket.js
        ├── store/         # Zustand auth store
        ├── utils/         # constants, helpers
        └── App.jsx / main.jsx
```

---

## 🧪 Scripts

```bash
# Backend
npm start         # production start
npm run dev       # nodemon
npm run seed      # load demo data
npm run seed:dry  # preview seed

# Frontend
npm run dev       # dev server
npm run build     # production build
npm run preview   # preview production build
```

---

## 🗺️ Roadmap / Future Work

- [x] Auth, profiles, dashboard
- [x] Ideas, comments, likes, bookmarks, search
- [x] Projects, team invites, tasks, milestones
- [x] Real-time chat (edit/delete/reactions/attachments/read receipts/presence)
- [x] AI idea analysis
- [x] Notifications (realtime + Expo push for mobile)
- [x] Admin panel & moderation (incl. content reports)
- [x] Mentor system (reviews, requests, directory)
- [x] Reputation system
- [x] Refresh-token sessions, API versioning (`/api/v1`), Swagger docs
- [~] Automated test suite (basic smoke tests — needs expansion)
- [ ] Docker / deployment config
- [ ] React Native (Expo) mobile app
- [ ] Google OAuth login
- [ ] Production SMTP / Cloudinary / OpenAI wiring
- [ ] Re-enable email verification enforcement (bypassed for dev — see `backend/src/middlewares/auth.js`)

### 📱 Mobile app notes
The backend is React-Native-ready: REST under `/api/v1`, Socket.io realtime,
Expo push notifications (`PUT /users/me/push-tokens` registers a device),
and a Swagger spec at `/api/v1/docs` to build the client against.

---

## 📝 License

For educational / academic demonstration purposes.
