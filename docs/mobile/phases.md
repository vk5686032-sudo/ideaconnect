# IdeaConnect Mobile — Delivery Phases

Each phase ends with working, testable functionality. Acceptance criteria (AC) are the exit bar — do not start the next phase until all AC pass on a real device.

**Effort scale:** 🟢 small (≤1 session) · 🟡 medium · 🔴 large (multi-session)

**Status legend:** ✅ code done · ⏳ code done, device ACs pending · ⬜ not started.
Per-phase build detail and the outstanding device ACs live in [handoff.md](./handoff.md),
which is the authoritative progress log. This file is the plan of record.

---

## Phase 0 — Scaffold & Theme 🟡 — ✅ verified on device
**Goal:** Running Expo app with navigation skeleton and both themes wired.

- [x] `npx create-expo-app@latest mobile --template tabs` (TypeScript)
- [x] Install stack: expo-router, nativewind + tailwindcss, zustand, @tanstack/react-query, axios, socket.io-client, react-hook-form, @hookform/resolvers, zod, date-fns
- [x] NativeWind configured with **light + dark** (`darkMode: 'class'`), theme tokens from [design-spec.md](./design-spec.md) (indigo palette, Inter via `expo-font`)
- [x] `.env` with `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_SOCKET_URL` (see [setup-guide.md](./setup-guide.md))
- [x] Folder skeleton per [folder-structure.md](./folder-structure.md); template boilerplate removed
- [x] Shared UI primitives stubbed: `Button`, `Card`, `Badge`, `Input`, `Avatar`, `EmptyState`
- [x] ESLint (typescript + react-hooks)

**AC:** App runs in Expo Go on device + emulator; 5 placeholder tabs render; toggling OS dark mode re-themes instantly. **Passed** (Expo Go 57, dark mode OK).

## Phase 1 — Auth & Session 🔴 — ✅ code done · ⏳ device ACs pending
**Goal:** Full auth lifecycle with secure token storage and silent refresh.

- [x] `services/secureStore.ts` wrappers (get/set/delete for `accessToken`, `refreshToken`)
- [x] `api/client.ts`: axios instance, request interceptor (Bearer), response interceptor with **single-flight refresh + retry**
- [x] `store/authSlice.ts`: user/token state, hydrate-on-launch from SecureStore
- [x] Screens: Login, Register, Forgot Password, Reset Password (`?token=` deep link), Verify Email
- [x] Expo Router guards: redirect unauthed → `(auth)/login`; authed users skip `(auth)`
- [x] Logout button → `POST /auth/logout { refreshToken }` → clear storage

**AC:** see [handoff.md](./handoff.md#-phase-1a1b--pending-device-acs-user-test-together) — 9 checks, all untested.

## Phase 2 — Ideas Feed & Detail 🔴 — ✅ code done · ⏳ device ACs pending
**Goal:** The core consumption loop: discover → read → interact.

- [x] Query hooks (`hooks/queries/useIdeas.ts`) with TanStack Query: infinite list keyed by filters
- [x] Ideas screen: debounced search, category/status/sort chips, FlatList w/ pull-to-refresh + `onEndReached`
- [x] Idea Detail: content, badges, author, like/bookmark/share, mentor reviews, comments
- [x] Create/Edit Idea screen (RHF+zod) with draft support
- [x] Bookmarks screen (`GET /ideas/my/bookmarks`)

**AC:** 12 checks pending — see handoff.md.

## Phase 3 — Projects & Tasks 🟡 — ✅ code done · ⏳ device ACs pending
- [x] Projects list (progress bars) + Project Detail (progress, milestones, members, tasks, open-chat)
- [x] Task status change → `PUT /tasks/:id`
- [x] My Tasks widget on Home (`GET /tasks/my`)
- [x] Create Project form
- [x] Join-project request flow for non-members

**AC:** 12 checks pending — see handoff.md.

## Phase 4 — Chat 🔴 — ✅ verified on two devices
- [x] Chat list tab: DMs + teams, last message preview, online dot
- [x] `services/socket.ts`: JWT-auth connection, connect on login / disconnect on logout, presence
- [x] Chat Room: bubbles, composer, emoji, image attachments, typing, read receipts, reactions, edit/delete
- [x] Start chat from user profile (`POST /chats/direct`)

**AC:** **Passed** — two-device realtime verified (sends, typing, receipts, presence dots, attachments, emoji, join flow).

## Phase 5 — Notifications & Push 🟡 — ✅ code done · ✅ in-app verified · ⏳ closed-app push deferred
- [x] Notifications screen: paginated, unread highlight, mark-read/all, `actionUrl` deep links
- [x] Unread badge on the Home bell, invalidated by the socket `notification` event
- [x] Push setup: `expo-notifications`, permission prompt, `getDevicePushTokenAsync` → `PUT /users/me/push-tokens`
- [x] Foreground handler → in-app banner; tap → deep link
- [ ] Closed-app push delivery — **blocked on an EAS build** (Phase 7)

**AC:** 8 of 9 passed in-app; closed-app delivery deferred.

## Phase 6 — Profile, Mentors & Settings 🟡 — ✅ code done · ⏳ device ACs pending
- [x] Own profile tab: stats, skills/interests, edit mode, avatar upload
- [x] User Profile screen (others): Message + Request Mentorship
- [x] Mentor directory: search, request flow, "My Requests" status chips
- [x] Settings: change password, logout everywhere, push explainer, app info

**AC:** 12 checks pending — see handoff.md.

## Phase 7 — Polish & Release Prep 🔴 — ⬜ not started
- [ ] Loading skeletons for all lists; empty states with illustrations/icons
- [ ] Error states with retry — **currently only on 4 detail screens**; the tab
      list screens (ideas, projects, chat, notifications, bookmarks) have loading
      and empty states but no error/retry branch
- [x] App icon, adaptive icon, splash (indigo brand), name "IdeaConnect"
- [x] Deep-link scheme `ideaconnect://` declared in `app.json`
- [x] `ios.bundleIdentifier` / `android.package` set and `eas.json` added with
      development / preview / production profiles — **never built yet**
- [ ] First EAS build (validates closed-app push; needs `EXPO_PUBLIC_EAS_PROJECT_ID`)
- [ ] Performance pass: FlashList where lists are long, image caching audit
- [ ] README/docs updated; known-issues list

**AC:** Clean install on a fresh device via EAS build; zero console errors in a 15-minute happy-path walkthrough.

---

## Dependency graph

```
Phase 0 ──► 1 (Auth) ──► 2 (Ideas) ──► 3 (Projects/Tasks)
                 │              │
                 │              └──► 6 (Profile/Mentors)
                 ├──► 4 (Chat) ──► 5 (Notifications/Push)
                 └────────────────────┘
                          └──► 7 (Polish) after all above
```

## Suggested rhythm

One phase per sitting. Keep this file's checkboxes honest — tick only what passes AC on a real device.

