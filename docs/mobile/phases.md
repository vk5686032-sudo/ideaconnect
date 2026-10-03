# IdeaConnect Mobile — Delivery Phases

Each phase ends with working, testable functionality. Acceptance criteria (AC) are the exit bar — do not start the next phase until all AC pass on a real device.

**Effort scale:** 🟢 small (≤1 session) · 🟡 medium · 🔴 large (multi-session)

**Status legend:** ✅ code done · ⏳ code done, device ACs pending · ⬜ not started.
Per-phase build detail and the outstanding device ACs live in [handoff.md](./handoff.md),
which is the authoritative progress log. This file is the plan of record.

> **2026-09-28:** the "device ACs pending" markers below are coarser than reality. A device
> regression sweep ran against Android 15 / Expo Go 57 and passed several individual checks, and
> two auth ACs are now covered by backend tests. [handoff.md](./handoff.md) splits each phase into
> **verified** vs **still pending** — read that table rather than the per-phase AC lines here. No
> phase is fully signed off below.

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

## Phase 1 — Auth & Session 🟡 — code done · auth-core swept on device · deep links pending
**Goal:** Full auth lifecycle with secure token storage and silent refresh.

- [x] `services/secureStore.ts` wrappers (get/set/delete for `accessToken`, `refreshToken`)
- [x] `api/client.ts`: axios instance, request interceptor (Bearer), response interceptor with **single-flight refresh + retry**
- [x] `store/authSlice.ts`: user/token state, hydrate-on-launch from SecureStore
- [x] Screens: Login, Register, Forgot Password, Reset Password (`?token=` deep link), Verify Email
- [x] Expo Router guards: redirect unauthed → `(auth)/login`; authed users skip `(auth)`
- [x] Logout button → `POST /auth/logout { refreshToken }` → clear storage

**AC:** see handoff.md — 9 checks. **6 verified** (#1 wrong password, #2 kill+reopen, #3 transparent refresh — all on device; #5 footer nav, #6 register, #7 forgot-password — in a browser). **1 test-verified only** (#4 refresh reuse). **2 untested**, and no longer blocked by tooling: the `ideaconnect://` reset-password link and the verify-email link both need the built APK installed, which now exists but has not been done.

## Phase 2 — Ideas Feed & Detail — ✅ code done · ✅ ACs swept (browser)
**Goal:** The core consumption loop: discover → read → interact.

- [x] Query hooks (`hooks/queries/useIdeas.ts`) with TanStack Query: infinite list keyed by filters
- [x] Ideas screen: debounced search, category/status/sort chips, FlatList w/ pull-to-refresh + `onEndReached`
- [x] Idea Detail: content, badges, author, like/bookmark/share, mentor reviews, comments
- [x] Create/Edit Idea screen (RHF+zod) with draft support
- [x] Bookmarks screen (`GET /ideas/my/bookmarks`)

**AC:** 12 checks pending — see handoff.md.

## Phase 3 — Projects & Tasks — ✅ code done · ✅ all 12 ACs swept (browser)
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
- [ ] Closed-app push delivery — **needs the APK installed on a device** (the EAS
      build exists; it has never been installed — see Phase 7)

**AC:** 8 of 9 verified on the device (real backend, live socket, dark mode). The device
pass found and fixed a real bug: the in-app notification banner was built on
`onAction`, which react-native-toast-message v2 renamed to `onPress`, so the
banner rendered fine and did nothing when tapped. Closed-app delivery now only
needs the built APK installed on a device — the build exists but was never
installed. See handoff.md for the per-AC breakdown.

## Phase 6 — Profile, Mentors & Settings — ✅ code done · ✅ ACs swept (browser)
- [x] Own profile tab: stats, skills/interests, edit mode, avatar upload
- [x] User Profile screen (others): Message + Request Mentorship
- [x] Mentor directory: search, request flow, "My Requests" status chips
- [x] Settings: change password, logout everywhere, push explainer, app info

**AC:** 12 checks pending — see handoff.md.

## Phase 7 — Polish & Release Prep 🟡 — EAS build done; skeletons done; rest open
- [x] Loading skeletons for all 9 list loaders; `EmptyState` icons on all 13 call sites
- [x] Error states with retry — all 7 list screens (ideas, projects, chat,
      notifications, bookmarks, home tasks, both mentor lists) **and** the
      cold-start boot failure, which used to hang on the splash forever: the
      api client had no request timeout, so an unreachable server never settled
- [x] App icon, adaptive icon, splash (indigo brand), name "IdeaConnect"
- [x] Deep-link scheme `ideaconnect://` declared in `app.json`
- [x] `ios.bundleIdentifier` / `android.package` set and `eas.json` added with
      development / preview / production profiles
- [x] **First EAS build — DONE.** `@vasanth1104/ideaconnect`, build
      `3ff40e0b-c569-4a77-899d-58e0ad420629`, universal APK 111.8 MB. Two
      blockers had to go first: `eas.json` was schema-invalid (a string inside
      `build`, which the schema reads as a profile), so *every* EAS command
      refused to run; and `expo-dev-client` is absent, so the `preview` profile
      was used instead of `development` — a standalone app, which is what
      closed-app push actually needs. **The APK has now been installed, and it
      exposed a release-only failure that Expo Go had hidden for the entire
      project: Android blocks cleartext HTTP in released builds, so the installed
      app could not reach the API at all** — sign-in and reset did nothing, with
      no error shown. Fixed via the `expo-build-properties` plugin (setting
      `android.usesCleartextTraffic` in `app.json` is silently ignored by
      prebuild). The corrected build is downloaded and staged but the phone
      dropped offline during install, so the fix is **not yet proven on a
      device**. Phase 1b #8 (reset-password deep link) **is** verified working.
      Verify-email deep link and closed-app push remain unverified.
- [x] Image caching audit — done for chat attachments (`expo-image` +
      `cachePolicy="memory-disk"`); `Avatar` already used `expo-image`
- [ ] ~~FlashList~~ — **deliberately skipped.** Not installed, and `FlatList`
      already virtualises the paginated feeds. Revisit only if jank is actually
      observed; the dependency is not worth marginal gain.
- [x] ~~README/known-issues list~~ — **done**: `known-issues.md` (broken/unverified/deferred, plus
      the environment traps that keep looking like bugs)
- [x] README/docs updated; known-issues list — **done**, and re-verified this pass:
      `handoff.md` and `phases.md` corrected to backend 75 / frontend 67 / mobile 43, the web
      sweep recorded as **complete**, and the release-build cleartext failure documented

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

