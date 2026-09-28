/**
 * Should the auth guard bounce an already-signed-in user away from this screen?
 *
 * Password reset and email verification are reachable while signed in: a user
 * who forgot their password taps the link from their inbox while the app still
 * holds a session, and the old guard redirected them to the tabs and silently
 * dropped the token. Proving control of the email address is what authorises
 * the change, so the session is not a reason to refuse.
 *
 * A signed-in user must NOT be able to reach the login or register screens,
 * which have no token to act on.
 *
 * Takes the URL path, not the route segments: `useSegments()` includes the
 * '(auth)' group, so its first element is the group and never the screen.
 */
const TOKEN_BEARING_SCREENS = new Set(['reset-password', 'verify-email']);

const firstSegment = (pathname: string | null | undefined): string => {
  // Strip any query/hash: on web usePathname() can include the search string,
  // and 'reset-password?token=...' would not match the screen name.
  const [path] = (pathname ?? '').split(/[?#]/);
  return path.split('/').filter(Boolean)[0] ?? '';
};

export const isTokenBearingScreen = (pathname?: string | null): boolean =>
  TOKEN_BEARING_SCREENS.has(firstSegment(pathname));

export const shouldRedirectAuthenticated = (pathname?: string | null): boolean =>
  !isTokenBearingScreen(pathname);
