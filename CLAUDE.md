# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

IdeaConnect is a full-stack MERN collaborative innovation platform where users share ideas, form
teams, build projects, and collaborate in real time with AI assistance. It ships three apps:

- `backend/` — Express 5 + Mongoose 9 REST + Socket.io API
- `frontend/` — React 19 + Vite web client
- `mobile/` — Expo / React Native client (Expo Router)

## Development Commands

### Backend (from `backend/`)
```bash
npm run dev       # nodemon hot-reload
npm start         # production start
npm run seed      # Load demo data (clears DB first)
npm run seed:dry  # Preview seed without changes
npm run backfill:reputation   # Recompute reputation from existing activity
npm test          # node:test + supertest (requires local MongoDB)
node scripts/verify-openapi.js  # Assert the OpenAPI spec covers every registered route
```

### Frontend (from `frontend/`)
```bash
npm run dev       # Vite dev server (localhost:5173, LAN-exposed)
npm run build     # Production build
npm run preview   # Preview production build
npm run lint      # Oxlint
npm test          # Vitest
```

### Mobile (from `mobile/`)
```bash
npm start         # Expo. Detects the LAN address first (prestart -> scripts/lan-ip.js)
npm run lan-ip    # just print/write the detected address
npm run android   # Android
npm run ios       # iOS
npm run typecheck # tsc --noEmit (must be zero errors)
npm run lint      # expo lint
npm test          # jest (jest-expo preset) — needs --forceExit, see Testing
npm run test:coverage
```

`npm start` regenerates `mobile/.env.local` every time, so nothing is hardcoded and nothing goes
stale when the wifi changes. Override with `LAN_IP=<addr> npm start` (`10.0.2.2` for an emulator).

### Docker (from repo root)
```bash
docker compose up --build          # mongo + backend + nginx frontend on :8080
docker compose exec backend node src/seed.js
```

### CI
`.github/workflows/ci.yml` — four jobs on push/PR to `main`: backend (tests + OpenAPI verify),
frontend (lint/test/build), mobile (typecheck/lint), docker (build + live smoke test).

## Environment Setup

### Backend (`backend/.env`)
Copy from `.env.example`. Key variables:
- `MONGODB_URI` — MongoDB connection (default: `mongodb://localhost:27017/ideaconnect`)
- `JWT_SECRET` — **required in production.** `docker compose` refuses to start without it
  (`${JWT_SECRET:?…}`). Generate with `openssl rand -hex 48`. Never ship the `.env.example`
  default — that value is in this repository's history. Rotating it signs every session out.
- `JWT_EXPIRE` — access-token lifetime, default `15m`
- `REFRESH_TOKEN_EXPIRE_DAYS` — refresh-token lifetime, default `30`
- `FRONTEND_URL` — allowed CORS origin (default: `http://localhost:5173`). Comma-separated for
  several; the list is split for both REST and Socket.io, so it works for both
- `RATE_LIMIT_MAX` — global API requests per 15 min per IP, default `600`
- `AUTH_RATE_LIMIT_MAX` — credential endpoints (`/auth/login`, `/register`, `/forgot-password`,
  `/reset-password/:token`, `/resend-verification`), default `10` per 15 min. `/auth/refresh` is
  deliberately **excluded** — the mobile client refreshes silently
- `AUTH_RATE_LIMIT_WINDOW_MS` — auth bucket window, default `900000`
- `SERVE_API_DOCS` — set `true` to expose the OpenAPI UI/spec in production (default: off)
- SMTP, Cloudinary, OpenAI keys are optional — the app degrades to mock/demo behavior. Note that
  without SMTP the mail endpoints still answer `200`, so a missing mail config is silent

### Frontend (`frontend/.env`)
```
VITE_API_URL=/api/v1
VITE_SOCKET_URL=
```

Both are relative/same-origin, which is what CI and Docker already build, so dev and prod are the
same shape. `vite.config.js` proxies `/api` and `/socket.io` to `localhost:5000` (`ws: true` for
the upgrade), so **no address is ever configured for the web app** and the wifi is irrelevant. An
empty socket URL means "connect to the page origin" — see `config/endpoints.js`; it must not fall
back to a localhost default.

Only override `VITE_API_TARGET` if the backend is not on `localhost:5000`.

### Mobile (`mobile/.env`)

Only two things are set by hand:

```
EXPO_PUBLIC_EAS_PROJECT_ID=    # needed for real push tokens; empty in Expo Go
```

`EXPO_PUBLIC_API_URL` / `EXPO_PUBLIC_SOCKET_URL` are **not** set by hand. `npm start` runs
`mobile/scripts/lan-ip.js` first (a `prestart` hook), which detects this machine's LAN address,
verifies the backend answers on it, and writes `mobile/.env.local` — gitignored, so a stale address
is never committed and the URL follows you when the wifi changes. Override detection with
`LAN_IP=<address> npm start` (use `10.0.2.2` for an Android emulator; an override is trusted without
a health check because that alias only resolves from inside the emulator).

The web app needs none of this: `frontend/vite.config.js` proxies `/api` and `/socket.io`, so the
browser sees a single origin and no IP appears anywhere. The backend keeps binding every interface
via `server.listen(PORT)` — it has never been pinned to a specific address, only the clients were.

## Architecture

### Backend Structure
- **Entry**: `src/server.js` creates the HTTP server, initializes Socket.io, connects MongoDB
- **App**: `src/app.js` configures Express middleware (Helmet, CORS, rate limiting) and mounts routes
- **Routes**: One file per resource in `src/routes/`. Each carries `@openapi` JSDoc annotations
  that feed the Swagger spec; run `node scripts/verify-openapi.js` after changing a route.
- **Controllers**: Business logic in `src/controllers/`
- **Models**: Mongoose schemas in `src/models/` (User, Idea, Project, Task, Chat, Message,
  Comment, Notification, Invitation, AuditLog)
- **Auth**: JWT-based; middleware in `src/middlewares/auth.js` (`protect`, `optionalAuth`,
  `authorize(role)`, `checkVerification`, `isApprovedMentor`)
- **Socket.io**: `src/config/socket.js` (JWT handshake auth) and `src/sockets/chat.socket.js`
- **Services**: `src/services/` (ai, email, notification, push, invitation, reputation)

### Frontend Structure
- **Entry**: `src/main.jsx` → `src/App.jsx` → `src/routes/AppRoutes.jsx`
- **Routing**: React Router `createBrowserRouter`; guards in `routes/ProtectedRoute.jsx`
  (`ProtectedRoute`, `AdminRoute`, `GuestRoute`)
- **State**: Zustand in `src/store/authSlice.js`, persisted through the adapter in
  `src/store/authStorage.js`
- **API**: Axios instance `src/api/axios.js` with Bearer + single-flight refresh interceptors
- **Socket**: `src/services/socket.js`
- **Layouts**: `MainLayout` (persistent sidebar), `AuthLayout` (login/register)
- **Pages**: Feature directories under `src/pages/`

### Mobile Structure
- Expo Router file-based routes in `mobile/app/`; all non-route code in `mobile/src/`
- `src/api/client.ts` is the axios instance; `src/api/tokenStorage.ts` is the only place tokens
  live (expo-secure-store)
- `src/services/socket.ts` is a singleton Socket.io client
- Tests live beside the code in `__tests__/`, resolved through the `@/` alias
  (`jest.config.js`). Use `.tsx` for any file containing JSX.

## Key Patterns

- **Response envelopes**: backend uses `successResponse()` / `errorResponse()` from
  `src/utils/response.js` → `{ success, message, data }`, paginated adds `pagination`
- **`src/utils/ip.js` owns the rate-limit skip decision; `src/utils/origins.js` owns the CORS
  allowlist.** Both the global `/api` limiter and the auth limiter call
  `shouldSkipLimiting(config.nodeEnv)`, and both the REST and Socket.io CORS layers call
  `getAllowedOrigins()`. They were two hardcoded arrays that had already drifted — the socket list
  was missing two origins and read `process.env.FRONTEND_URL` as a single literal, so a
  comma-separated value worked for REST and silently broke websockets. Do not re-introduce a
  hardcoded origin list or a private-IP skip in either place: skipping private IPs in production is
  exactly how rate limiting ended up disabled behind the compose proxy. `app.set('trust proxy', 1)`
  in `app.js` is what makes the real client address visible; without it every request arrives as the
  proxy's own address.
- **CORS in production carries only `FRONTEND_URL`.** The `localhost:5173/5174/8081` entries are
  development conveniences and are dropped when `NODE_ENV=production`, because CORS runs with
  `credentials: true` and a local page would otherwise get credentialed cross-origin API access.
  `FRONTEND_URL='*'` still fails closed — the matcher is an exact allowlist and never reflects the
  request, so there is no wildcard path to credentialed access.
- **Chat attachments are allow-listed, and the stored extension is ours.** `uploadChatFile` in
  `src/middlewares/upload.js` takes the extension from its own map, never from the request, and the
  mimetype never decides acceptance on its own (it is attacker-controlled; it is only cross-checked
  for images). `/uploads` is served with `nosniff` + `Content-Disposition: attachment`. This route
  once had no `fileFilter` at all and kept the uploader's extension, which is a stored-XSS path via
  `express.static`'s extension-derived `Content-Type`. `documentFilter` uses `&&`, not `||`.
- **`checkVerification` is production-gated**, not a blanket no-op. `User.isVerified` defaults to
  `false` and no seed sets it, so the first production deploy **must** run the one-time migration or
  every existing account is locked out of all 16 write routes:
  `npm run backfill:verified` (dry run) then `npm run backfill:verified -- --apply`.
- **Refresh-token rotation sets `revokedAt`; it does not delete the entry.** Retired hashes are kept
  for 24 h so that replaying a rotated-out token is *detectable* — a replay revokes every session for
  the account, because a token that leaked and a client that double-sent are indistinguishable.
  Only *live* tokens count toward the 5-device cap: counting retired ones would age a client that
  refreshes every 15 minutes out of its own account, and pruning them immediately would leave a
  replay with nothing to match. A never-issued token changes nothing, so the endpoint is not a DoS
  against a user's other devices.
- **`forgot-password` and `resend-verification` return one indistinguishable `200`** and never
  report whether an address is registered. An SMTP failure is logged rather than returned, since a
  `500` would itself be an enumeration oracle. `register` is the deliberate exception — see
  `KNOWN GAPS`.
- **Auth flow**: token pair in storage, attached by an axios interceptor, user in Zustand.
  Access tokens last ~15 min; the interceptor performs a **single-flight** refresh and retries
  the original request once. `AUTH_ENDPOINTS` in `axios.js` must never trigger a global logout.
- **Role-based access**: `protect` verifies the JWT; `authorize('admin')` restricts admin routes
- **Real-time**: Socket.io for chat, typing, presence, read receipts and notification push
- **Mongoose 9**: no `useNewUrlParser`/`useUnifiedTopology`; async pre-save hooks take **no**
  `next` argument (see `models/User.js`)
- **Socket identity and authorization live in `services/chatAccess.service.js`.** `isChatParticipant`
  gates `chat:join` and `message:send`; `getChatPeers` scopes presence broadcasts. Sockets derive the
  user from `socket.userId` (verified handshake) and **ignore any client-supplied `senderId` or
  `userId`**. Do not re-introduce a membership check inline — the HTTP and socket paths must both go
  through the helper, or the socket path silently bypasses REST's authorization.
- **Two realtime channels, not one.** `notification` carries real Notification rows
  (`{ type, notification }`); `chat:unread` carries a transient chat badge (`{ chatId, message }`)
  and creates no row. Do not merge them — that overload is what once forced clients to sniff payloads
  and made every chat message refetch notifications.
- **Project members are de-duplicated** by `pre('save')` and `pre('findOneAndUpdate')` hooks in
  `models/Project.js` — no code path may persist a duplicate member
- **Reputation** is awarded server-side by `services/reputation.service.js` and reversed on undo;
  it never throws
- **`notificationService.create` must not throw.** All 21 call sites are bare `await`s inside
  controller try-blocks whose catch turns a throw into a 5xx, so a failed notification would fail
  the comment, like or project update that triggered it. It returns `null` and logs instead.
  (`markAsRead` is the opposite: the controller depends on it resolving `null` to return 404.)

## Things to be careful about

- **Zustand v5 persist contract**: the storage adapter receives a `{ state, version }` **object**,
  not a JSON string. `src/store/authStorage.js` handles both. Calling `JSON.parse` on the value
  throws and silently breaks session persistence (symptom: login appears to succeed but a reload
  logs the user out).
- **`rememberMe` must be declared in the zod login schema**, otherwise zod strips it and every
  session is forced into `localStorage`.
- **lucide-react v1** dropped brand icons — use `components/common/BrandIcons.jsx`.
- **Google Fonts `@import` must be line 1** of the stylesheet.
- **expo-notifications throws at import time in Expo Go** (SDK 53+ Android) — never import it
  statically in mobile code; use a dynamic import guarded by `Constants.appOwnership`.
- **Infinite-query caches** must be written through the wrapper (`{ pages, pageParams }`); bare
  envelopes crash `InfiniteQueryObserver`. Type the writer's cache as
  `InfiniteData<Page, number>` and assert the shape in a test — a wrong alias type-checks fine
  against itself, which is how a crash shipped once.
- **Dedupe by `_id`** when flattening paginated feeds — create/delete shifts rows between fetches,
  so the same row can land on two cached pages.
- **`actionUrl` targets the web router.** `mobile/src/utils/links.ts` must map every shape the
  backend emits; an unmapped value falls back to `/notifications` rather than doing nothing.
- **Never put a raw store import in `mobile/src/api/*`** — it creates a require cycle. Use
  `setAuthClientListener()`; `authSlice` registers itself.
- **Socket transport must keep `polling` in the fallback list.** Websocket-only hard-fails behind
  proxies that block the upgrade, and with infinite retries that fails silently forever.
- **The signup minimum password length is enforced in three places that share no constant:**
  `PASSWORD_MIN` in `src/validations/auth.validation.js` (the exported authority), the Mongoose
  `minlength` on `User.password`, and a copy in each client — `frontend` Login/Register/
  ResetPassword/Settings and `mobile` login/register/reset-password/settings. Change them
  together; changing only the backend means the client accepts a password the server rejects.
  `passwordPolicy.test.js` asserts the model matches `PASSWORD_MIN`.
- **Login is deliberately `min(1)`, not the signup minimum.** This is not an oversight. Accounts
  created before the minimum was raised still hold shorter passwords; a signup minimum on the
  login form refuses to submit, the backend is never reached, and the user is locked out of both
  clients with no way to sign in. It happened when a blanket replace over `min(6, …)` rewrote the
  login forms along with the signup ones — a security change turned into a self-inflicted outage.
  `passwordPolicy.test.js` also reads both client login files and fails if either is not `min(1)`.
  Keep that test's fail-on-missing-path behaviour: a silently-skipped assertion looks like
  coverage and is worse than none.
- **An empty `VITE_SOCKET_URL`/`EXPO_PUBLIC_*` means same-origin, not localhost.** Resolution
  lives in `frontend/src/config/endpoints.js`. The previous `|| 'http://localhost:5000'` broke
  websockets in the Docker build, because `""` is falsy so the `||` replaced it and every visitor's
  browser dialled port 5000 on their own machine. `socket.io-client` treats `undefined` as
  "connect to the page origin", which is what CI and the nginx proxy both need.

## Testing

- **Verify anything that is not platform-specific in a browser against `localhost:5173`.** The
  backend, the zod schemas and the query layer are shared with mobile, so a bug found there is a
  real bug. A change that only looks at unit tests misses this whole class.
- **Reserve the device for** SecureStore, the image picker, the native share sheet, OS dark mode,
  and `ideaconnect://` deep links. Expo Go cannot register a custom URL scheme, so those need an
  EAS build.
- **Driving forms over `adb` is impractical**, for reasons worth not re-deriving: masked password
  fields make a character count unreadable, `input text` truncates at spaces, Chrome autofill
  injects a real name into the register form, and clearing a field with repeated backspaces
  escapes into system settings. Detail in `docs/mobile/handoff.md`.
- `mobile` Jest passes 31/31 but the process does not exit — a pre-existing handle leak, so
  `--forceExit` is needed locally. CI runs `typecheck`/`lint` only; see `Known Gaps`.

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@ideaconnect.dev | password123 |
| Mentor | mentor@ideaconnect.dev | password123 |
| Student | priya@ideaconnect.dev | password123 |
| Developer | james@ideaconnect.dev | password123 |

## Known Gaps

Deliberately not fixed, with the reason. **These are decisions, not oversights** — before "fixing"
one, check the reason, because several have a real cost to closing.

| Gap | Why it is open | Revisit when |
|---|---|---|
| `POST /auth/register` returns `400 "Email already registered"`, so it is still an account-enumeration oracle | `forgot-password` and `resend-verification` were fixed; register was left because the non-enumerating version is a UX decision (silent success, or a "check your email" flow) and the OpenAPI entry documents the current behaviour | You are willing to change the register UX |
| Refresh token lives in `localStorage` (web) / `sessionStorage`, so any XSS exfiltrates a 30-day credential | The correct fix is an httpOnly + Secure + SameSite cookie, but it touches the whole auth flow, the axios interceptor and the mobile client. That is a project, not a patch. The 2026-09-28 XSS hole that made this urgent is closed | Scheduling an auth-flow refactor |
| `mobile` Jest suite passes 31/31 but the process never exits — a pre-existing handle leak (pre-existing as of 2026-09-28, unrelated to that day's work) | `forceExit` masks it rather than fixing it | Next time you touch the mobile test setup |
| `swagger-jsdoc` is effectively unmaintained and pulls a deprecated `glob` chain | The generated spec is verified 117/117 against real routes, so it is load-bearing for CI. Replacing it means hand-writing or serving a static `openapi.json` | If it blocks a dependency audit |
| `zod` is v4 in the backend and v3 in the frontend, duplicated with no shared source of truth | A workspace/shared package is more structure than the project currently has | A third consumer appears |
| `frontend/package.json` pins `lucide-react ^1.28.0`, but the real package is 0.x | Pin looks unresolvable or stale; unverified against the registry | Next dependency review |
| `notificationService.create` returns `null` on failure instead of throwing, across 21 call sites | Deliberate: it stops a failed notification from turning a successful write into a `5xx`. Real production cost is that a silently failed notification is invisible | Notifications need retry/queueing |

## API Surface

All endpoints are prefixed `/api/v1` (a legacy `/api/*` alias also exists). Route groups: `auth`,
`users`, `ideas`, `projects`, `tasks`, `chats`, `notifications`, `mentors`, `reports`, `ai`,
`admin`, `health`.

Swagger UI is at `/api/v1/docs`; the raw spec is `/api/v1/docs.json`. **Both are development-only**
and return `404` in production unless `SERVE_API_DOCS=true` — the spec is a complete map of every
route, its schemas and its error shapes, and it used to be served unauthenticated there.

To confirm coverage after changing a route (reads the spec module directly, not the HTTP route, so
it is unaffected by the production gate): `node scripts/verify-openapi.js`.
