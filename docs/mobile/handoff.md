# IdeaConnect Mobile — Handoff Memory

Session-to-session progress log. Update after every work session.
Authoritative plan docs live beside this file ([prd.md](./prd.md), [phases.md](./phases.md), etc.).

> **2026-09-27 note (web platform).** The web/backend were audited and fixed in the same session
> that reconciled this folder. Highlights relevant to mobile: the backend now serves a **complete
> OpenAPI spec** (117/117 routes, verified by `backend/scripts/verify-openapi.js`), and
> `mobile/app.json` gained `ios.bundleIdentifier` / `android.package` plus a new `mobile/eas.json`
> so EAS builds can actually run. A **critical web session bug was also fixed** (zustand v5 persist
> contract) — it was web-only, so no mobile change is required, but the same mistake would break a
> mobile store if the persist adapter were copied. See the root `README.md` and `CLAUDE.md`.

---

## Status snapshot

| Phase | Status | Notes |
|---|---|---|
| 0 — Scaffold & Theme | ✅ Code done · ✅ Device-verified (Expo Go 57, dark mode OK) | |
| 1a — Auth core (client/store/login/logout) | ✅ Code done · ⏳ device ACs not yet tested | See combined checklist below |
| 1b — Auth screens (register/forgot/reset/verify) | ✅ Code done · ⏳ shares 1a's pending device tests | All 5 (auth) routes exist; login footer links live |
| 2 — Ideas feed & detail | ✅ Code done · ⏳ device ACs pending | Feed + detail + create/edit + bookmarks + AI Insights; see checklist |
| 3 — Projects & tasks | ✅ Code done · ⏳ device ACs pending | Feed + detail + create + join flow + tasks (status picker, add) + milestones + Home widget; see checklist |
| 4 — Chat | ✅ Code done · ✅ realtime verified on two devices | Socket service, chat list, realtime room, mini profiles, team chats |
| 5 — Notifications & push | ✅ Code done · ✅ in-app verified (banner actions, badge, deep-links) | Closed-app push deferred to Phase 7 EAS build |
| 6 — Profile, mentors & settings | ✅ Code done · ⏳ device ACs pending | Profile rebuild + edit (edu/exp field-array editors, avatar upload), mentors directory + my-requests, settings; see checklist |
| 7 — Polish & release prep | ⬜ Next up after Phase 6 AC pass — includes EAS builds (validates closed-app push) | |

## Stack as built

Expo SDK 57 (`expo@57.0.15`, RN 0.86.2, React 19.2.3, TS ~6.0 strict) · Expo Router · NativeWind 4.2.6 + **Tailwind v3.4** (`nativewind/preset`, `darkMode: 'class'`) · Zustand 5 (no persist — SecureStore hydration) · TanStack Query 5 · axios · socket.io-client (chat realtime since Phase 4) · RHF + zod · expo-secure-store / notifications / image / image-picker / haptics · lucide-react-native · react-native-toast-message 2.4 · Inter via `@expo-google-fonts/inter` · ESLint via `eslint-config-expo/flat.js`.

`.env`: `EXPO_PUBLIC_API_URL=http://192.168.0.156:5000/api/v1` (Wi-Fi LAN IP), `EXPO_PUBLIC_SOCKET_URL=http://192.168.0.156:5000`. Emulator alt lines commented in `.env.example`.

## Environment gotchas (Windows + npm 12)

1. `create-expo-app --template` crashes parsing `npm pack` JSON → extract template tarball manually (`npm pack expo-template-tabs`, `tar -xzf`).
2. `npx expo install` fails (`EALLOWSCRIPTS`) → read version pins from `node_modules/expo/bundledNativeModules.json`, install with plain `npm install pkg@range`.
3. Babel 7.29 rejects `nativewind/babel` as a plugin (returns preset-shape) → babel.config.js = `babel-preset-expo` with `{ jsxImportSource: 'nativewind' }` only.
4. TS6 errors on side-effect CSS import → `declare module '*.css'` in `nativewind-env.d.ts`.
5. Expo Go from Play/App Store lags npm SDK releases ("project incompatible") → install matching build from <https://expo.dev/go> (v57.0.9 verified).
6. Metro warns on require cycles → `client.ts` must NOT statically import the zustand store. It exposes `setAuthClientListener()`; `authSlice.ts` registers itself at module scope and handles `user-refreshed` (→ `updateUser`) / `session-expired` (→ `logout`, which owns all local teardown incl. token clear — no double-clear). Never reintroduce a store import into client/api modules.

## Phase 1a — what exists now

```
src/api/tokenStorage.ts   SecureStore get/set/clear for token pair (only disk home for tokens)
src/api/client.ts         axios + Bearer interceptor + single-flight refresh→retry on 401,
                          AUTH_ENDPOINTS allow-list (no logout loop on login/register/forgot);
                          store-decoupled via setAuthClientListener events (gotcha #6);
                          exports { api } + { setAuthClientListener } (named only)
src/api/auth.api.ts       all 9 auth endpoints typed against ApiSuccess<T> envelope
src/store/authSlice.ts    zustand: user/status(idle|hydrating|authenticated|unauthenticated),
                          setAuth/logout/updateUser/hydrate (hydrate → hasRefreshToken? /auth/me)
src/hooks/useAuth.ts      useIsAuthenticated / useAuthStatus / useCurrentUser selectors
src/types/models.ts       User/AuthRole/envelope types mirroring backend User model
src/components/ToastConfig.tsx  branded toast cards (success/error/info)
src/components/Input.tsx  label + leftIcon/rightElement slots, forwards TextInputProps
app/_layout.tsx           hydrate() on mount, splash held until status settled, <Toast/> mounted
app/(auth)/_layout.tsx    guard: authenticated → redirect /(tabs); headerless stack
app/(tabs)/_layout.tsx    guard: unauthenticated → redirect /(auth)/login
app/(auth)/login.tsx      RHF+zod port of web Login.jsx (icons, show/hide pw, inline errors,
                          error toast via Toast.show — no logout loop)
app/(tabs)/profile.tsx    avatar/name/email/role badge/rep card + working Log Out
                          (POST /auth/logout { refreshToken } best-effort, then local teardown)
```

Conventions locked so far: named-only exports for api modules (`import { authApi }`), PascalCase component files, no comments in code, zero tsc errors + zero lint warnings required before commit.

## ⏳ Phase 1a+1b — pending device ACs (user, test together)

Auth-core (1a):
1. Wrong password → toast error, stays on login (no logout loop)
2. Kill + reopen app while logged in → still authenticated (splash → Home)
3. Manually expire access token → next API call auto-refreshes transparently
4. Logout → server revokes refresh token (reuse attempt must fail)

Screens (1b):
5. Login footer "Sign up" / "Forgot password?" navigate correctly
6. Register new account → auto-login held in memory → "Account Created" screen → Continue to App → Home tab authed; duplicate-email register shows server error toast
7. Forgot password with random email → generic confirmation (no enumeration leak)
8. Reset via `ideaconnect://reset-password?token=…` deep link (adb: `adb shell am start -a android.intent.action.VIEW -d "<url>"`) → set new password → lands authed on Home; bad/expired token → invalid-link screen with "Request a New Link"
9. Verify-email link (signed out) → auto-verifies or resend-by-email fallback works

Demo accounts: `priya@ideaconnect.dev` · `mentor@ideaconnect.dev` · `admin@ideaconnect.dev` / `password123`. Backend must run (`cd backend && npm run dev`). Deep links need a real reset token — easiest path: trigger forgot-password for a seeded user and read the token from the backend console/DB (emails point at web frontend, not the mobile scheme).

## Phase 1b — what was built

```
app/(auth)/register.tsx        name/email/password/confirm (zod refine); success holds AuthPayload
                               in state (guard-safe) → "Account Created" → Continue to App → setAuth → tabs
app/(auth)/forgot-password.tsx email → generic confirmation state; 404 treated as success
app/(auth)/reset-password.tsx  ?token= param; invalid/expired state screen; success → fresh
                               AuthPayload → setAuth → tabs (400 → invalid-token view)
app/(auth)/verify-email.tsx    auto-verify on mount when ?token= present (async-only setState);
                               verifying/success/error/no-token states; resend-by-email fallback;
                               strict guard kept — only reachable when signed out
login.tsx                      added Sign up / Forgot password? footer actions
```

Lint notes: react/no-unescaped-entities bites apostrophes inside RN <Text> (entities don't render natively) — rephrase instead ("we will", "New to IdeaConnect?"). react-hooks/set-state-in-effect forbids synchronous setState in effects — derive initial state via useState initializer. Hermes: array-spread of undefined (`[...x]`) throws "Cannot convert undefined value to object" — guard `x.data` not just `x` in every setQueryData updater (see chat cache utils pattern: `old?.data ?? []`).

## ⏳ Phase 2 — pending device ACs (user)

1. Ideas tab: feed loads with pull-to-refresh; scrolling to bottom fetches page 2 (footer spinner)
2. Search debounce works; changing category/status/sort chips resets pagination and shows fresh results
3. Draft ideas never appear in the public feed (create one via "Save as draft" then check feed)
4. IdeaCard tap → detail opens with author, badges, tags/skills, description
5. Like/bookmark toggle updates instantly (optimistic); survives pull-to-refresh refetch
6. Share pill opens native share sheet with `ideaconnect://ideas/<id>` link
7. Comments: post appears instantly at top (optimistic), reply thread indents under parent, delete-own works w/ confirm, comment like toggles heart
8. AI Insights card renders only when aiAnalysis exists; collapse/expand works
9. Mentor account (mentor@ideaconnect.dev) sees "Write a review" on others' ideas; star picker + publish shows review + avg rating updates; author does NOT see the form on own idea
10. Owner sees Edit idea / Delete buttons; Edit prefills form; Delete removes + navigates back
11. Create flow: validation errors inline (title ≥5, desc ≥20, category required); Publish → toast + back → new idea visible in feed; Save as draft → NOT in feed
12. Bookmark icon in Ideas tab header → Bookmarks screen lists saved ideas; unbookmarking from detail removes it after refresh

## Phase 2 — what was built

```
src/types/models.ts          +Idea/IdeaComment/MentorReview/IdeaAuthor/AiAnalysis/enums
src/api/idea.api.ts          ideaApi: browse/detail/CRUD/like/bookmark/my-*/review/comments (typed vs backend routes)
src/hooks/queries/useIdeas.ts ideaKeys + useIdeasFeed (useInfiniteQuery keyed by filters) +
                             useIdea/useIdeaComments/useMyBookmarks + optimistic mutations:
                             toggleLike/toggleBookmark patch EVERY list cache + detail + bookmarks/myIdeas;
                             add/delete/like-comment optimistic w/ temp-id swap & rollback;
                             mentor review upsert writes detail cache directly
src/components/IdeaCard.tsx  category/status badges, title/desc preview, author row, like/comment/view stats
src/components/Chip.tsx      filter/form chip (active state)
src/utils/format.ts          timeAgo/titleCase
src/utils/constants.ts       IDEA_CATEGORIES, FEED_STATUSES, IDEA_SORTS
app/(tabs)/ideas.tsx         search (400ms debounce) + category/status/sort chip rows +
                             FlatList (pull-to-refresh, onEndReached) + FAB → create
app/(tabs)/_layout.tsx       Ideas tab headerRight bookmark icon → /ideas/bookmarks
app/ideas/_layout.tsx        Stack (auth-guarded like tabs)
app/ideas/[id].tsx           detail: badges/author/actions(like/save/share)/description/tags/
                             skills/collapsible AI Insights/mentor reviews (+form if approved mentor,
                             not owner)/comments (reply threads, delete own/admin, likes)/owner edit+delete;
                             comments pill scrolls to section via onLayout y
app/ideas/create.tsx         RHF+zod (title≥5, desc≥20, category chip-select, comma-lists for
                             tags/skills, visibility+status chips); edit mode via ?id= prefill
                             (Form component mounted only when data ready — avoids effect setState)
app/ideas/bookmarks.tsx      GET /ideas/my/bookmarks list
app/_layout.tsx              root Stack registers 'ideas' group headerShown:false; QueryClient
                             defaults retry:1 staleTime:30s
```

Gotchas learned: mutation onSuccess results are axios envelopes (`res.data.data.*`); expo-router typed routes reject template-literal hrefs for dynamic segments → use `{ pathname: '/ideas/[id]', params }`; import type must precede exports (import/first); merge duplicate module imports (import/no-duplicates); infinite feeds sorted by createdAt DUPLICATE items across cached pages after any create/delete shifts positions — always dedupe by `_id` when flatMapping pages (see ideas/projects tabs); never use bare tag/tech strings as React keys (backend doesn't enforce uniqueness) — suffix with index; JWT_EXPIRE=15m means sockets die 15min after login — socket.ts self-heals via connect_error→refreshAccessTokenNow→re-auth (30s throttle), room shows amber "Reconnecting chat…" banner; Expo Go Android runs keyboard PAN mode and KAV behavior=undefined is a no-op — chat composer pads manually via keyboardDidShow/Hide height listeners (app.json now sets softwareKeyboardLayoutMode:resize for future builds); chat room MUST re-join on every socket 'connect' event (mount-time join races the async connect → emits into void); cache writers must SEED envelopes (`emptyPage()`) instead of dropping when absent — bailing on missing cache made sent messages invisible during load windows; render attachments BY MIME TYPE — `<Image>` silently renders nothing for videos/files; sendAttachment already broadcasts message:received (chat.controller.js); expo-notifications THROWS AT IMPORT TIME in Expo Go SDK53+ Android ("removed from Expo Go") — NEVER import statically: guard `Constants.appOwnership==='expo'` + dynamic `await import()` inside service functions; typed-route regeneration is flaky between `/notifications` vs `/notifications/index` — rerun `expo export` then match whatever router.d.ts emits.

## Next up — Phase 7 (Polish & release prep) scope preview

Loading skeletons for all lists; error states w/ retry; app icon/adaptive/splash (indigo brand); deep-link scheme verification (`ideaconnect://` for notifications + reset); EAS build profiles (development/preview/production) + internal distribution — validates closed-app push; performance pass (FlashList on long lists, image caching, Hermes already on); README/docs + known-issues list.

## ⏳ Phase 6 — pending device ACs

1. Profile tab shows stats row (ideas/projects/reputation), skills/interests chips, education/experience cards when present
2. Edit Profile: change name/bio → save → header card reflects changes immediately (store sync)
3. Skills/interests comma edits persist and render as chips
4. Education/Experience: Add creates entries; validation (institution/company required, 4-digit years); remove works; "Currently working here" chip hides end-date
5. Avatar: tap → picker → upload spinner → updates in header immediately AND after kill+reopen
6. Social links save and render under Links section
7. Approved-mentor profile shows "Request Mentorship" → prompt → toast sent; duplicate request surfaces pending-guard message
8. Mentors directory lists approved mentors (reputation-sorted); search filters live
9. My Requests segment shows sent requests with status chips
10. Web-flow AC: mentor accepts on the website → mobile flips to Accepted (+notification) → "Open Chat" opens the direct chat
11. Settings change-password works; wrong current password surfaces server error; new password logs in
12. Logout everywhere revokes sessions — other device's next API call force-signs-out

## Phase 6 — what was built

```
src/api/user.api.ts          +updateProfile/updateAvatar(FormData 'avatar')/changePassword/getMyStats/push tokens
src/api/mentor.api.ts        getMentors(search)/sendMentorRequest/getMyMentorRequests
src/hooks/queries/useProfile.ts stats key + mentorKeys + queries (stats/mentors/my-requests) +
                             useUpdateProfile & useUpdateAvatar → authStore.updateUser sync;
                             useChangePassword; useSendMentorRequest (invalidates my-requests)
app/(tabs)/profile.tsx       REBUILT: edit pencil btn, 3-cell stats row, bio, skills/interests chips,
                             education/experience display cards, social links, menu rows
                             (Edit Profile / Mentors / Settings), Log Out
app/profile/_layout+edit.tsx guarded group; RHF+zod: name/bio/skills-interests comma inputs,
                             socialLinks card, useFieldArray EDUCATION editor (institution/degree/
                             field/4-digit years) & EXPERIENCE editor (company/role/dates +
                             'Currently working here' toggle hides end-date), per-entry delete;
                             avatar tap → square-crop picker → multipart PUT → store sync;
                             year strings coerced to numbers on submit
app/users/[id].tsx           +Request Mentorship (approved mentors/admin ≠ self) via PromptModal,
                             dup-pending server message surfaced as toast
app/mentors/_layout+index    segmented Directory | My Requests; debounced search; mentor cards
                             (avatar/bio preview/skills line/rep badge + Request button);
                             requests w/ status chips; accepted rows → Open Chat
                             (createOrGetDirectChat idempotent reuse)
app/settings/_layout+index   Change Password card (RHF) · Log out of all devices (logout-all →
                             local teardown) · push explainer row · About card (expoConfig.version)
app/_layout.tsx              root Stack registers profile/mentors/settings groups
```

Backend contracts used: PUT /users/profile (whitelisted fields, arrays replaced wholesale) · /users/avatar multipart field `avatar` ≤5MB · /users/change-password · /users/me/stats · GET /mentors?search= (approved-only, reputation-sorted) · POST /mentors/:id/requests (dup-pending 400) · GET /mentors/requests/my (recipient populated) · accept creates/reuses direct chat (mentee gets chat id via notification actionUrl or createOrGetDirectChat reuse).

MEMBER-DUPE ROOT CAUSE (final): the Aug-26 accepts at 08:22/08:24/08:53 ran through a STALE backend process predating the sender-based fix — each pushed the accepting owner; the 08:55 accept on the restarted process correctly added james. Permanent invariant added in `models/Project.js`: `pre('save')` + `pre('findOneAndUpdate')` hooks de-dupe members by user id (findOneAndUpdate strips `$push.members` when target already member) — no code path can persist dupes even from stale processes. DB re-cleaned (check → owner+james). Mobile renders deduped `uniqueMembers` w/ index-suffixed keys. NOTE for testing: after ANY backend file change confirm nodemon actually restarted (`npm run dev`) or restart manually before re-testing accept flows.

## ⏳ Phase 5 — pending device ACs

1. Home header bell shows red badge with unread count on login (seeded notifications exist)
2. Like an idea from device A → device B (open, any tab): toast banner pops + bell badge increments live
3. Bell → Notifications screen lists rows w/ sender avatar, type icon, unread highlight; infinite scroll page 2 when >20
4. Tap a like/comment notification → mark-read + deep-links into the correct Idea detail; project/task ones → Project detail; mentor-accept → Chat room
5. Unread row loses highlight after tap; badge decrements immediately (optimistic) and stays correct after refetch
6. "Mark all read" clears highlight + badge instantly
7. New chat message does NOT create a notification row (chat uses its own path) — verify no dupes between Chat badge and bell
8. Logout → login: unread count refetches correctly
9. [Phase 7] Closed-app Expo push — deferred, requires EAS build + EXPO_PUBLIC_EAS_PROJECT_ID

## Phase 5 — what was built

```
src/types/models.ts          +AppNotification/NotificationType (mirrors backend enum)
src/api/notification.api.ts  list({notifications,total} shape!)/unread-count/markRead/markAllRead
src/api/user.api.ts          +registerPushToken/unregisterPushToken
src/hooks/queries/useNotifications.ts keys + useNotifications(infinite; has-more computed from
                             fetched-count vs total — endpoint has NO pagination meta!) +
                             useUnreadCount + optimistic mark-read/markAll (list flag + count delta)
                             + prependNotification() for socket events
src/utils/links.ts           resolveActionUrl mapper (/ideas|projects|chat/:24hex → typed routes)
src/services/pushTokens.ts   registerPushToken/unregisterPushToken — permission prompt +
                             getExpoPushTokenAsync(EXPO_PUBLIC_EAS_PROJECT_ID); silent skip in
                             Expo Go / no projectId / emulator / denied
app/notifications/_layout+index  guarded stack; rows = avatar+type-icon chip+title/message+
                             unread tint; tap→markRead→deep-link; "Mark all read" header action;
                             infinite list + pull-to-refresh + EmptyState
app/(tabs)/_layout.tsx       Home header bell w/ red unread badge (9+ cap)
app/_layout.tsx              SocketNotificationBridge inside provider: 'notification' event →
                             invalidate unread + prepend row + branded toast banner;
                             registerPushToken() on authenticated; root Stack registers group
app/(tabs)/profile.tsx       logout now unregisters push token BEFORE server revoke
.env.example                 EXPO_PUBLIC_EAS_PROJECT_ID placeholder
```

Backend already provided everything else: notificationService.create emits socket `notification` {type, notification(sender populated)} AND Expo-push dispatch w/ DeviceNotRegistered cleanup; actionUrls observed: `/ideas/:id(#comment-x)` · `/projects/:id` · `/chat/:id`.

## ✅ Phase 4 — device ACs passed (two-device realtime verified: sends, typing, receipts, presence dots, attachments, emoji, join flow)

## Phase 4 — what was built

```
BACKEND (small hardening):
config/socket.js            io.use() JWT handshake auth (token = handshake.auth.token,
                            decoded.id -> socket.userId); unauthenticated sockets rejected
sockets/chat.socket.js      'join' + 'message:send' now trust socket.userId ONLY
                            (client-supplied senderId ignored). NOTE: edit/delete/reaction
                            broadcasts already existed in chat.controller.js
                            (message:edited / message:deleted / message:reacted / message:deletedFor)

MOBILE:
src/types/models.ts         +Chat/ChatMessage/MessageAttachment/MessageReaction
src/api/chat.api.ts         chatApi: list/detail/direct/project-chat/messages(paginated)/
                            edit/delete(scope)/react/sendAttachment(FormData)
src/api/user.api.ts         getUserById (mini profile)
src/services/socket.ts      singleton socket.io client — token in handshake.auth, websocket
                            transport, registry-based onSocketEvent() that survives reconnects;
                            joinUserRoom/joinChatRoom/sendMessage/typing/markRead helpers
src/store/presenceSlice.ts  onlineUserIds[] fed by global user:online/offline listeners
app/_layout.tsx             connect+join personal room when authenticated; disconnect+reset on
                            logout; root Stack registers 'chat' + 'users' groups
src/hooks/queries/useChats.ts useChats/useChatDetail/useMessages(infinite, pages newest-first
                            ascending; screens reverse+dedupe) + cache utils: upsertMessage
                            (reconciles temp echo), replaceMessage, markDeleted, applyReactions,
                            applyReadReceipts, list-lastMessage patching
app/(tabs)/chat.tsx         chat rows: direct=other participant w/ green presence dot, group=name/
                            project title; preview (📎/deleted-aware), timeAgo, LOCAL unread badge
                            from socket 'notification' events (cleared on open) — server-side unread
                            counts deferred to Phase 5 polish
app/chat/[id].tsx           realtime room: inverted FlatList, day separators, bubbles (own right/
                            primary + ✓ vs peer ✓✓), typing indicator (1.6s debounce emit),
                            optimistic send via temp message reconciled by echo, long-press menu
                            (edit PromptModal / delete everyone-vs-me / curated 8-emoji react strip),
                            image attachments via expo-image-picker, mark-read on open+incoming,
                            live handlers for edited/deleted/reacted/read events
app/users/[id].tsx          mini profile (avatar/name/Mentor badge/bio/skills chips) + Message →
                            POST /chats/direct (idempotent) → replace into room
app/projects/[id].tsx       members see "Open Team Chat" → GET /chats/project/:id → room
```

## ⏳ Phase 3 — pending device ACs (user)

1. Projects tab: feed loads, pull-to-refresh, infinite scroll page 2; search debounce works
2. Status chips (planning/in-progress/on-hold/completed) filter correctly
3. FAB → New Project: validation inline; create lands back with project visible in feed; creator is Owner+lead member automatically
4. ProjectCard tap → detail: badges, owner row, progress %, tech chips, description all render
5. Non-member sees "Request to join" → modal message → toast sent; owner sees it under Join Requests
6. Owner accepts request → requester becomes member (detail refetch shows them); reject removes the entry
7. Private project: non-member gets "Project unavailable" screen; member/owner can open
8. Milestones: owner-only "+" adds one; owner tap toggles complete (strikethrough + count updates instantly)
9. Members section lists everyone with role badges; owner row marked "· Owner"
10. Tasks: "+ Add task" (members only) with title/assignee/priority chips appears in list instantly
11. Tap task → status picker modal → change to completed → progress bar % on detail updates immediately AND after refetch matches server value
12. Home widget shows my open tasks; status change from Home reflects in project detail too; tapping project name opens detail

## Phase 3 — what was built

```
src/types/models.ts          +Project/ProjectMember/Milestone/JoinRequest/ProjectTask + enums
src/api/project.api.ts       projectApi: browse(paginated)/my/detail/create/delete/join-request/
                             requests/handle/progress/milestones add+toggle (typed vs routes)
src/api/task.api.ts          taskApi: my/projectTasks/create/update(status,priority)/delete
src/hooks/queries/useProjects.ts projectKeys + useProjectsFeed(infinite keyed by filters) +
                             useProject/useProjectTasks/useMyTasks/useJoinRequests +
                             optimistic useUpdateTask — patchTasksEverywhere() rewrites task in ALL
                             tasks/my-tasks caches AND embedded detail.tasks, recomputing detail
                             progress locally (completed/total) then invalidating details for server truth;
                             optimistic useToggleMilestone (rollback snapshot);
                             createTask prepends + invalidates detail & my-tasks;
                             useCreateProject/useRequestToJoin/useHandleJoinRequest
src/components/ProjectCard.tsx  status/private badges, owner row, members count, tech line, progress bar
src/components/ProgressBar.tsx  reusable fill bar + optional % label
src/components/StatusPickerModal.tsx  RN Modal chip-picker (Android Alert caps at 3 buttons!)
src/components/PromptModal.tsx   generic text prompt modal (join msg / milestone title)
app/(tabs)/projects.tsx      search(400ms)+status chips+FlatList+FAB
app/projects/_layout.tsx     guarded Stack (mirrors ideas)
app/projects/[id].tsx        detail: badges/owner card/progress/join CTA/description/tech chips/
                             repo+demo links/milestones(owner toggle+add)/members w/ role badges/
                             owner join-request queue accept+reject/tasks grouped rows(priority dot,
                             strikethrough done)/Add-task panel(title+assignee member chips+priority)
app/projects/create.tsx      RHF+zod title≥3 desc≥10 + technologies comma-list + visibility chips
app/(tabs)/index.tsx         Home placeholder replaced by My Tasks widget (open tasks ≤8,
                             StatusPickerModal reuse, tap project label → detail)
app/_layout.tsx              root Stack registers 'projects' headerShown:false
```

Backend notes verified: task router mounted at API root (`/tasks/my`, `/projects/:id/tasks`, milestones paths) · browse returns public only · private 404s outsiders · updateTask recalcs progress server-side (+assignee reputation ±10) · createProject auto-adds owner as lead member. FIXED: `handleInvitation` accept pushed members without already-member check → duplicate member docs crashed detail screen keys; guard added + DB healed (one-off dedupe script) + frontend renders deduped members w/ index-suffixed keys. FIXED #2 (shared with web): accept branch pushed `req.user` (the ACCEPTOR) instead of the requester — for `type:'team-request'` it now adds `invitation.sender`; direct invites unchanged.

Chat debugging notes: inverted FlatList needs NEWEST-FIRST data (data[0] renders at BOTTOM) — chronological-ascending data put new sends off-screen at top ("app looks static"); day separator compares against index+1 in descending arrays. Sender visibility no longer depends on room broadcast: server acks `message:send` via callback `{ok, message}` and client reconciles from ack (echo dedupes by _id). Composer smiley opens 24-emoji grid; reaction strip stays on long-press. CRITICAL: the messages cache is an INFINITE query — value shape is `{pages: ApiPaginated[], pageParams[]}`; every cache writer MUST go through `updateMessagesCache()`/keep that wrapper (bare envelopes crash InfiniteQueryObserver with "Cannot read property 'length' of undefined" via getNextPageParam). WEB FIX (frontend/src/pages/Chat/Chat.jsx): echo dedupe now checks BOTH localMessages (inside updater) and serverMessages, plus render-level merge memo prunes locals once server list contains them — kills live duplicates. PRESENCE: transitions-only events meant late joiners never saw existing online users → server replies `presence:snapshot` (activeUsers keys) on EVERY `join`; socket.ts remembers joinedUserId and re-emits join on reconnect (restores user:X room + fresh snapshot); presenceSlice.setOnlineIds replaces state. Temporary console diagnostics prefixed `[chat]` (join/connected/sending/ack/received) — remove during Phase 7 polish.

## Open questions / risks

- None blocking. (NativeWind 5 preview ignored deliberately; Tailwind pinned v3.)
