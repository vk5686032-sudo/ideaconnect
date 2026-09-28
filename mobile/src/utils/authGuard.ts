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
 */
const TOKEN_BEARING_SCREENS = new Set(['reset-password', 'verify-email']);

export const isTokenBearingScreen = (segment?: string | null): boolean =>
  Boolean(segment) && TOKEN_BEARING_SCREENS.has(segment as string);

export const shouldRedirectAuthenticated = (segment?: string | null): boolean =>
  !isTokenBearingScreen(segment);
