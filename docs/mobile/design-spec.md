# IdeaConnect Mobile — Design Spec

Design language mirrors the web app 1:1 (Tailwind tokens from `frontend/tailwind.config.js`) so both platforms feel like one product. Implemented with **NativeWind**; dark mode ships in v1 via `colorScheme`.

---

## 1. Color palette

### Primary — Indigo (identical to web)

| Token | Hex | Usage |
|---|---|---|
| `primary-50` | `#eef2ff` | subtle backgrounds (selected tab, hover fills) |
| `primary-100` | `#e0e7ff` | avatar placeholder bg, chip bg |
| `primary-200` | `#c7d2fe` | borders on highlighted cards |
| `primary-300` | `#a5b4fc` | disabled primary |
| `primary-400` | `#818cf8` | secondary text on primary surfaces |
| `primary-500` | `#6366f1` | **brand** — logo, links, focus rings |
| `primary-600` | `#4f46e5` | **buttons / active states / own chat bubbles** |
| `primary-700` | `#4338ca` | pressed state |
| `primary-800/900` | `#3730a3` / `#312e81` | deep accents |

### Neutrals & semantic

| Token | Light | Dark | Usage |
|---|---|---|---|
| background | `gray-50 #f9fafb` | `#0b0f19` (near-black indigo tint) | screen bg |
| surface (card) | `white` | `#111827 gray-900` | cards, sheets, app bars |
| border | `gray-100/200` | `gray-800` | hairlines |
| text-primary | `gray-900 #111827` | `gray-100` | headings/body |
| text-secondary | `gray-600` | `gray-400` | subtitles, meta |
| success | green-500 `#22c55e` / bg `green-50` | same hues, bg `green-500/10` | online dots, open status, ✓✓ read marks (`sky-300` on primary bubbles) |
| warning | amber-500/bg `amber-50` | amber-400/10% | pending states, private badges |
| error | red-500/red-600 | red-400 | destructive actions, badges |
| star | yellow-400 `#facc15` (filled) / gray-300 empty | same | ratings |

Rule: never hardcode hex in components — use Tailwind tokens (`bg-primary-600`, `dark:bg-gray-900`) so scheme switching is automatic.

## 2. Typography — Inter

| Style | Size/Weight (RN) | Web equivalent |
|---|---|---|
| h1 screen title | 24 / bold | `text-2xl font-bold` |
| h2 section | 20 / semibold | `text-xl font-semibold` |
| card title | 16 / semibold | `font-semibold text-lg` |
| body | 14 / regular | `text-sm` |
| caption/meta | 12 / regular | `text-xs` |
| badge/micro | 10–11 / medium | `text-[10px]` |

Load Inter via `expo-font`; fall back to system for CJK/emoji.

## 3. Layout system

- Spacing scale: Tailwind default (4pt). Screen padding: `px-4 pt-2`.
- Cards: `rounded-xl`, border hairline, **no drop shadows** in dark mode (border separates); light mode may use subtle shadow.
- Touch targets ≥ 44×44. Icon-only buttons get `accessibilityLabel`.
- Lists: `FlatList` + pull-to-refresh (`RefreshControl` tinted primary-500) + infinite scroll footer spinner.
- Bottom tabs: 5 tabs (Home, Ideas, Projects, Chat, Profile); notification bell with count badge lives in the Ideas/Home header AND as a badge dot on Profile per phase 5 decision.
- FAB (bottom-right, primary-600): New Idea (Ideas tab), New Project (Projects tab).

## 4. Component mapping (web → mobile)

| Web pattern | Mobile component | Notes |
|---|---|---|
| `.card` / `.card-hover` | `<Card>` | white/gray-900 surface, rounded-xl, p-4 |
| `.btn-primary` | `<Button variant="primary">` | bg-primary-600, active:primary-700 |
| `.btn-outline` / `.btn-secondary` | variants outline / soft | soft = `bg-primary-50 text-primary-700` |
| `.badge-primary/success/warning/error` | `<Badge tone>` | pill, 10–12px text |
| avatar fallback circle | `<Avatar name>` | initials on primary-100; ring when online (green-500 dot) |
| StarRating | `<StarRating value onChange>` | yellow fill, tap-to-set in review composer |
| toast | `react-native-toast-message` (or expo-banner) | top-positioned, mirrors react-hot-toast semantics |
| modal confirm | ActionSheet / Alert API | delete confirms, report sheet |
| chat bubble own/other | `<ChatBubble>` | own = primary-600 white text right-aligned; other = gray-100 dark:gray-800 |
| typing indicator | `<TypingDots>` | three animated dots in peer bubble style |

## 5. Screen layout notes

- **Ideas feed:** sticky search bar + horizontally scrollable filter chips row (category · status · sort) above list. Card = category+status badges → title (2-line clamp) → excerpt (3-line) → stats row (👍 💬 👁) → author row.
- **Idea detail:** hero content scroll; sticky bottom action bar (Like · Save · Comment jump) so actions never scroll away; comments below reviews section; composer docked above keyboard (`KeyboardAvoidingView`).
- **Chat room:** inverted FlatList; composer with paperclip → action sheet (photo library/camera/document); reply-preview bar above composer; long-press bubble → reaction quick-bar + edit/delete (own).
- **Notifications:** rows with sender avatar, bold verb phrase ("reviewed your idea"), time-ago; unread = primary-50/30 tint + dot; swipe or button mark-read.
- **Home:** greeting header with avatar → 4 stat tiles (grid 2×2) → "My Tasks" horizontal cards → "Recent Ideas" vertical preview list.
- **Dark mode specifics:** all `gray-50/100` backgrounds map to `gray-900/#0b0f19`; images get `opacity-90` in dark to reduce glare; badges use `/10` opacity backgrounds instead of solid pastels.

## 6. Motion & feedback (keep small)

- Pressable scale 0.97 on cards/buttons (Reanimated).
- List item entrance: none (perf first). Skeleton shimmer while initial query loads.
- Haptics: light impact on like/bookmark/send; success notification on submit.
