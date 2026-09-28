# IdeaConnect Mobile — Tech Stack

**Runtime:** React Native via **Expo (managed workflow)** · **Language: TypeScript**
**Navigation:** Expo Router (file-based, mirrors the web app's route mental model)

Version policy: install native modules with `npx expo install <pkg>` so versions match your Expo SDK. Library majors below mirror the web app where shared.

---

## Core

| Package | Why | Notes |
|---|---|---|
| `expo` | Managed runtime, OTA updates, EAS builds | Latest stable SDK |
| `expo-router` | File-based routing (`app/` directory), typed links, deep links | Matches web React-Router structure |
| `typescript` | Type-safe API shapes; catches backend contract drift early | `strict: true` recommended |
| `nativewind` + `tailwindcss` | Tailwind classes in RN — same utility vocabulary as the web app | Configure `darkMode: 'class'` for theming |

## Data & state

| Package | Why |
|---|---|
| `zustand@^5` | Auth/session slice — same store pattern as web (`store/authSlice.ts`) |
| `@tanstack/react-query@^5` | Server state: lists, pagination, optimistic like/bookmark, invalidation after mutations — identical patterns to web pages |
| `axios` | HTTP client; hosts the ported refresh-token interceptor (single-flight refresh → retry) |
| `zod` + `react-hook-form` + `@hookform/resolvers` | Forms & validation — reuse web validation schemas almost verbatim |

## Persistence & security

| Package | Why |
|---|---|
| `expo-secure-store` | **Only** place for `accessToken` + `refreshToken` (Keychain/Keystore-backed) |

> Rule: SecureStore = credentials. Never swap.
>
> **No general-purpose key-value store is installed.** Theme and filter state are not persisted:
> the Query cache is in-memory, the auth store hydrates from SecureStore on launch, and the
> theme follows the OS setting. If a non-sensitive preference ever needs persisting, add
> `@react-native-async-storage/async-storage` *then* — do not carry an unused dependency.

## Realtime & notifications

| Package | Why |
|---|---|
| `socket.io-client@^4.8` | Chat/presence; connect with `auth: { token }` exactly like web `services/socket.js` |
| `expo-notifications` | Push permission prompt, foreground banners, tap→deep-link handling; device token registration to `PUT /users/me/push-tokens` |

## Media & UI utilities

| Package | Why |
|---|---|
| `expo-image-picker` | Avatar upload + chat image attachments (multipart FormData) |
| `expo-image` | Fast cached images (feeds, avatars) |
| `lucide-react-native` | Same icon set as web (visual continuity) |
| `react-native-reanimated` | Required by NativeWind animations / gestures |
| `react-native-gesture-handler` | Swipe/press interactions (required by many nav components) |
| `expo-haptics`, `expo-font` (Inter), `date-fns@^4` | Polish: feedback, brand font, date formatting |

## Dev tooling

| Tool | Purpose |
|---|---|
| EAS CLI (`eas build`) | Development/preview/production builds |
| ESLint (`@typescript-eslint`, `eslint-plugin-react-hooks`) | Lint parity with web's zero-warning standard |
| Expo Go | Fastest inner loop for Phases 0–5 (push works in Go on Android; iOS push needs a dev build) |

---

## Explicitly NOT used (and why)

| Rejected | Reason |
|---|---|
| Redux Toolkit | Zustand already covers it; two state libs = confusion |
| Firebase JS SDK for push | Backend already speaks Expo push (`expo-server-sdk`); mixing providers doubles work |
| Styled-components / Tamagui | NativeWind leverages existing Tailwind knowledge from the web codebase |
| MMKV | AsyncStorage suffices at this scale; one less native module |

## Shared-contract cheat sheet (web ↔ mobile)

| Concern | Web | Mobile |
|---|---|---|
| API base | `VITE_API_URL=http://192.168.0.156:5000/api/v1` | `EXPO_PUBLIC_API_URL=same` |
| Socket URL | `VITE_SOCKET_URL` | `EXPO_PUBLIC_SOCKET_URL` |
| Token storage | localStorage | expo-secure-store |
| Refresh logic | `frontend/src/api/axios.js` | `src/api/client.ts` (port) |
| Theme source | `tailwind.config.js` | `tailwind.config.js` (mobile) — copy tokens |
