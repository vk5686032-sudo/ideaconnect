# IdeaConnect Mobile — Folder & File Structure

Target layout for the `mobile/` Expo app (Expo Router v3+ conventions). Create folders/files progressively per [phases.md](./phases.md); this is the end-state map.

```
mobile/
├── app/                              # ═══ EXPO ROUTER: routes only ═══
│   ├── _layout.tsx                   # Root layout: providers (Query, Auth, Theme), font load, scheme sync
│   ├── +not-found.tsx                # 404 screen
│   │
│   ├── (auth)/                       # Guest-only group → redirects authed users out
│   │   ├── _layout.tsx               # Stack, headerless; guard redirect
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   ├── forgot-password.tsx
│   │   ├── reset-password.tsx        # reads ?token=
│   │   └── verify-email.tsx          # reads ?token=, auto-verifies
│   │
│   ├── (tabs)/                       # Authed bottom-tab shell
│   │   ├── _layout.tsx               # Tabs: Home · Ideas · Projects · Chat · Profile (+ bell icon)
│   │   ├── index.tsx                 # Home (dashboard)
│   │   ├── ideas.tsx                 # Ideas feed (search/filter/sort/infinite)
│   │   ├── projects.tsx              # My projects
│   │   ├── chat.tsx                  # Conversation list
│   │   └── profile.tsx               # Own profile + quick links
│   │
│   ├── ideas/
│   │   ├── [id].tsx                  # Detail: content, actions, mentor reviews, comments
│   │   └── create.tsx                # Create/Edit (reads ?id= for edit mode)
│   │
│   ├── projects/
│   │   ├── [id].tsx                  # Detail: progress, milestones, members, tasks, chat link
│   │   └── create.tsx
│   │
│   ├── chat/
│   │   └── [id].tsx                  # Chat room (messages, composer, typing, receipts)
│   │
│   ├── users/
│   │   └── [id].tsx                  # Other-user profile (Message / Request Mentorship)
│   │
│   ├── bookmarks.tsx                 # Saved ideas
│   ├── notifications.tsx             # Notification center (push tap target)
│   ├── mentors.tsx                   # Directory + My Requests tabs
│   └── settings.tsx                  # Avatar, password, sessions, push prefs
│
├── src/                              # ═══ ALL NON-ROUTE CODE ═══
│   ├── api/
│   │   ├── client.ts                 # axios instance + Bearer header + refresh-retry interceptor
│   │   ├── tokenStorage.ts           # expo-secure-store get/set/clear for token pair
│   │   ├── auth.api.ts               # login/register/refresh/logout/logout-all/forgot/reset/me
│   │   ├── idea.api.ts               # ideas CRUD, like/bookmark, comments, reviews, teams
│   │   ├── project.api.ts            # projects, members, invitations
│   │   ├── task.api.ts               # tasks + milestones
│   │   ├── chat.api.ts               # chats REST (list, messages page, attachments, participants)
│   │   ├── notification.api.ts       # list / unread-count / mark read
│   │   ├── mentor.api.ts             # directory + requests
│   │   └── user.api.ts               # profiles, avatar, password, stats, push tokens
│   │
│   ├── store/
│   │   ├── authSlice.ts              # user, status; hydrate from SecureStore; login/logout actions
│   │   └── uiSlice.ts                # theme override, onboarded flag
│   │
│   ├── hooks/
│   │   ├── useAuth.ts                # selector helpers over authSlice + route guards
│   │   ├── useSocket.ts              # connect/disconnect lifecycle keyed to auth state
│   │   ├── usePresence.ts            # online-users Set fed by socket events
│   │   ├── usePushNotifications.ts   # permissions, token registration, listeners
│   │   └── queries/                  # TanStack Query hooks grouped by feature
│   │       ├── useIdeas.ts
│   │       ├── useProjects.ts
│   │       ├── useTasks.ts
│   │       ├── useChats.ts
│   │       ├── useNotifications.ts
│   │       └── useMentors.ts
│   │
│   ├── services/
│   │   ├── socket.ts                 # port of web services/socket.js (JWT auth, reconnect)
│   │   └── notifications.ts          # push permission/token helpers, foreground/tap handlers
│   │
│   ├── components/                   # Shared presentational components
│   │   ├── Button.tsx  Card.tsx  Badge.tsx  Input.tsx  Textarea.tsx
│   │   ├── Avatar.tsx  EmptyState.tsx  ErrorState.tsx  SkeletonRow.tsx
│   │   ├── StarRating.tsx  ProgressBar.tsx  UserRow.tsx
│   │   ├── IdeaCard.tsx  CommentItem.tsx  TaskCard.tsx
│   │   ├── ChatBubble.tsx  TypingDots.tsx
│   │   └── ReportModal.tsx           # (post-v1)
│   │
│   ├── theme/
│   │   ├── tailwind.config.js        # NativeWind config — tokens copied from web tailwind.config.js
│   │   └── colors.ts                 # TS constants for both schemes (used by non-Tailwind APIs)
│   │
│   ├── types/
│   │   ├── api.ts                    # Response envelopes: ApiSuccess<T>, ApiPaginated<T>
│   │   ├── models.ts                 # User, Idea, Project, Task, Chat, Message, Notification, Invitation
│   │   └── socket.ts                 # Socket event payload types
│   │
│   └── utils/
│       ├── constants.ts              # API_URL/SOCKET_URL from process.env.EXPO_PUBLIC_*
│       ├── dates.ts                  # date-fns formatting helpers
│       └── navigation.ts             # actionUrl → router path mapper (notification taps)
│
├── assets/                           # icon.png, adaptive-icon.png, splash.png, fonts/Inter/*
├── .env                              # EXPO_PUBLIC_API_URL / EXPO_PUBLIC_SOCKET_URL (gitignored)
├── .env.example
├── app.json                          # scheme: "ideaconnect", icons, splash, plugins
├── eas.json                          # build profiles: development / preview / production
├── tailwind.config.js                # re-exports src/theme/tailwind.config.js
├── global.css                        # NativeWind entry stylesheet
├── babel.config.js / metro.config.js # NativeWind wiring
└── tsconfig.json                     # "@/*" path alias → "./src/*" (and "app/*")
```

## Conventions

1. **Routes are thin.** Screens compose queries/hooks + shared components; no direct `fetch`, no business logic inline.
2. **One API module per backend resource**, mirroring the web `frontend/src/api/*` files so contracts stay diffable across platforms.
3. **Types live beside their domain** (`types/models.ts`) and mirror backend documents exactly as returned by `/api/v1` (camelCase, `_id`, embedded subdocs).
4. **Naming:** screens Pascal-free files (`[id].tsx`), components PascalCase files, hooks camelCase.
5. **Path alias** `@/` → `src/` in tsconfig + metro for clean imports (`@/api/client`).
6. **Env vars must be prefixed `EXPO_PUBLIC_`** to reach JS runtime; never put secrets there (there are none — tokens come from login).

## What intentionally does NOT exist

- No Redux/redux-toolkit store — Zustand slices only.
- No separate "services/api" layer duplication between features — one `src/api/*` module per resource consumed by query hooks.
- No custom navigation state machine — Expo Router owns it; guards are tiny redirect components in `(auth)/_layout` and root layout.
