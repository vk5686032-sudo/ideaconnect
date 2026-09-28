# IdeaConnect Mobile — Setup Guide

From zero to the app running against your local IdeaConnect backend, on a device or emulator.

---

## 0. Prerequisites

| Tool | Check | Notes |
|---|---|---|
| Node.js 18+ | `node -v` | Same as backend/web |
| Backend running | `curl http://localhost:5000/api/v1/health` | `cd backend && npm run dev`; seed with `npm run seed` for demo accounts |
| Expo Go app | Play Store / App Store | Fastest way to run during development |
| Android Studio (emulator) *or* physical device | — | Emulator optional; device on same Wi-Fi is easiest |

Demo accounts (after seeding): `priya@ideaconnect.dev` · `mentor@ideaconnect.dev` · `admin@ideaconnect.dev` — password `password123`.

## 1. Scaffold (Phase 0)

```bash
# from repo root
npx create-expo-app@latest mobile --template tabs
cd mobile
npx expo install expo-router expo-secure-store expo-notifications \
  expo-image-picker expo-image expo-font expo-haptics \
  react-native-reanimated react-native-gesture-handler \
  lucide-react-native
npm install nativewind tailwindcss zustand @tanstack/react-query axios \
  socket.io-client react-hook-form @hookform/resolvers zod date-fns
```

Then wire NativeWind + path aliases per [folder-structure.md](./folder-structure.md), and copy the theme tokens from [design-spec.md](./design-spec.md) into `tailwind.config.js`.

## 2. Environment variables

Only one value is set by hand:

```env
EXPO_PUBLIC_EAS_PROJECT_ID=    # needed for real push tokens; empty in Expo Go
```

`EXPO_PUBLIC_API_URL` and `EXPO_PUBLIC_SOCKET_URL` are **generated for you**. `npm start` runs
`mobile/scripts/lan-ip.js` first, which finds this machine's LAN address, checks the backend
answers on it, and writes `mobile/.env.local` (gitignored). There is nothing to update when you
change network.

```bash
cd mobile
npm start
```

If it picks the wrong adapter, or you are on an emulator, override it:

```bash
LAN_IP=10.0.2.2 npm start     # Android emulator: the host is 10.0.2.2
```

An override is trusted without a health check, because `10.0.2.2` only resolves to the host from
*inside* the emulator — nothing answers on the host's own network stack, so probing it would reject
a working setup.

> The **web** app needs none of this. `frontend/vite.config.js` proxies `/api` and `/socket.io`, so
> the browser talks to one origin and no address is ever configured.

CORS note: RN clients send no Origin header; the backend already allows that, so no CORS changes are needed.

## 3. Run

```bash
npx expo start          # then scan QR with Expo Go (device) or press a (Android emulator)
```

Login with a demo account → you should land on Home with stats from `GET /users/me/stats`.

## 4. Push notifications setup (Phase 5)

1. Create a free account at https://expo.dev and a project (`eas init` inside `mobile/`).
2. In the app: request permissions via `expo-notifications`, then
   `getDevicePushTokenAsync()` (Android/Expo Go works out of the box).
3. Register it: `PUT /api/v1/users/me/push-tokens { token, platform }`.
4. Test: trigger a notification (e.g., like priya's idea from another account) — push arrives within seconds.
   - iOS push via Expo Go has limitations; use an EAS development build for real iOS push testing.
5. Backend needs **no extra configuration** — `expo-server-sdk` sends using the tokens you register.

## 5. EAS builds (Phase 7)

```bash
npm i -g eas-cli
eas login
eas build:configure       # creates eas.json (profiles: development / preview / production)
eas build --platform android --profile development   # internal distribution APK
```

Set `"scheme": "ideaconnect"` in `app.json` so notification taps and reset-password links deep-link into the app.

## 6. Troubleshooting

| Symptom | Fix |
|---|---|
| Network errors only on device, fine on emulator | Device + laptop not on same Wi-Fi, or wrong LAN IP in `.env` |
| `AxiosError 401` loop at launch | Stale tokens in SecureStore from an older backend run — logout (clears storage) or reinstall Expo Go |
| Socket never connects | Check `EXPO_PUBLIC_SOCKET_URL` has **no** `/api/v1` suffix — sockets mount at server root |
| Push token error in Expo Go on iOS | Expected limitation; use an EAS development build for iOS push |
| Env change not picked up | `npx expo start -c` (cache) |

## 7. Reference docs in this folder

- [prd.md](./prd.md) — what we're building and why
- [phases.md](./phases.md) — order of work + acceptance criteria
- [tech-stack.md](./tech-stack.md) — every dependency and why
- [folder-structure.md](./folder-structure.md) — where code lives
- [api-reference.md](./api-reference.md) — endpoint/socket contract
- [design-spec.md](./design-spec.md) — colors, type, components, layouts
