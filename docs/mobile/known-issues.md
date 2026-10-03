# Known issues

Live list of what is broken, unverified, or deliberately deferred. Ordered by how likely you are to
hit it. Anything here that is fixed should be deleted, not moved to a "previously fixed" section —
`git log` is the archive.

For the running session log, including which acceptance criteria have actually been verified against
a real app, see [handoff.md](./handoff.md).

## Unverified — not known to be broken, but never checked

These are the honest gaps. None has been proven to work; none is known to fail.

- **Closed-app push (Phase 5 AC 9).** Needs the EAS-built APK installed on a device. An APK *was*
  installed, and immediately exposed the cleartext failure below — but the phone disconnected
  during the install of the corrected build (`c137a7e0`), so push has never been tested on an app
  that can reach the API. Everything in-app is verified and working.
- **`ideaconnect://` deep links (Phase 1b #8 and #9).** #8, reset-password, is **verified working**
  on an installed build with Metro stopped. #9, verify-email, is not — same blocker as push.
  Expo Go cannot register a custom URL scheme, which is why this needed an APK at all.
- **Web socket recovery after a long idle.** The root cause is fixed (see handoff, "Sweep
  findings") and a normal session connects cleanly. But a simulated "returning user with an expired
  token" still ended with the socket down in testing. The tokens re-synced correctly; the socket
  did not come back up on its own. Prove or disprove this before calling it fixed.
- **Mobile UI beyond the Phase 1/3/5 sweeps.** Chat, profile editing, create forms, search, and
  the settings screens have not had a button-by-button pass. The web app has had a partial one.

## Known limitations, accepted

- **The built APK hardcodes a private LAN address.** `EXPO_PUBLIC_*` are inlined at build time, so
  `preview` and `development` ship with `http://192.168.0.156:5000`. Fine for a phone on the same
  wifi, useless anywhere else, and it breaks if the host's IP changes. A hosted build **must**
  override it: `EXPO_PUBLIC_API_URL=… eas build --profile production`.
- **The web build has one code path, so opening it from a phone on the wifi does not work.** The
  Vite proxy only helps browsers on the same machine. It needs the absolute URL back.
- **Five concurrent sessions per account.** `auth.controller.js` shifts the oldest refresh token
  past five. Signing in on a sixth device signs the first out. This bites during testing: a script
  logging in repeatedly will evict your phone's session, and the app will drop to the login screen
  looking like a bug.
- **`register` is a user-enumeration oracle.** It answers "Email already registered"; `/auth/login`
  does not. Closing this changes the UX and needs a product decision.
- **Refresh tokens live in client storage**, not httpOnly cookies. Fine for this app's threat model,
  weaker than it could be.
- **The universal APK is 112 MB** because `preview` sets `buildType: apk` with every ABI. A
  split-per-ABI or app-bundle build would be a fraction of that; it only matters for real
  distribution.
- **Mentor reputation sorting cannot be exercised** — the seed has exactly one approved mentor.

## Deliberately not built

- **FlashList.** Not installed. `FlatList` already virtualises the paginated feeds and the lists
  are not long enough for it to pay for a new dependency. Revisit if jank is actually observed.
- **Custom empty-state illustrations.** `EmptyState` takes an icon and all 13 call sites now pass
  one. Real illustrations would be new art assets for no functional gain.

## Environment traps that cost time

Not bugs in the app, but each one looks like one.

- **Expo Go hides release-only failures.** This is the big one. Every result in this project came
  from Expo Go until the first EAS build, and Expo Go does not enforce release policies — so the
  app passed everything while being unable to make a single network request in a real build. When
  a behaviour only appears in a released build, confirm the policy landed in the *artefact*.
- **`android.usesCleartextTraffic` in `app.json` is silently ignored by prebuild.** Expo accepts
  the key and `expo config --json` reports it, but the generated manifest has no cleartext
  attribute. Only the `expo-build-properties` plugin works. Verify with
  `android/app/src/main/AndroidManifest.xml` after `expo prebuild`.
- **`ping` from the phone always fails.** The host firewall drops ICMP even when every port is
  open. Test reachability with `adb shell "echo | nc -w 5 <host> 5000"`.
- **The tab bar only responds to a tap on its label,** not its icon.
- **`adb shell input keyevent 4` exits the app** to Expo Go's server list if the keyboard is already
  closed. Never send it to dismiss the keyboard.
- **A swipe from y=600 to y=1900 scrolls *down*.** Easy to get backwards and then conclude a header
  is missing when it is merely scrolled out.
- **Do not round-trip UTF-8 files through PowerShell cmdlets** on this machine. `Get-Content` +
  `WriteAllText` decodes as Windows-1252 and destroys every em-dash, emoji and CJK character.
  Use an editor, or pass `-Encoding utf8` / `UTF8Encoding $false` explicitly.
- **`fireEvent.press` in `@testing-library/react-native` is a silent no-op** when it finds no
  pressable ancestor — it does not throw. A test asserting only "the handler was called" passes
  against a completely dead component. Assert the responder wiring too.
- **Do not judge a screen's health from a spinner.** Load every route with console errors *and*
  failed requests captured; a blank page with a 401 storm looks fine if you only look at pixels.