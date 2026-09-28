import {
  isTokenBearingScreen,
  shouldRedirectAuthenticated,
} from '@/utils/authGuard';

describe('auth guard', () => {
  it('lets a signed-in user reach password reset', () => {
    // The deep link arrives while the app still holds a session; redirecting
    // discarded the token and left the user unable to reset anything.
    expect(isTokenBearingScreen('reset-password')).toBe(true);
    expect(shouldRedirectAuthenticated('reset-password')).toBe(false);
  });

  it('lets a signed-in user reach email verification', () => {
    expect(isTokenBearingScreen('verify-email')).toBe(true);
    expect(shouldRedirectAuthenticated('verify-email')).toBe(false);
  });

  it('still bounces a signed-in user away from login', () => {
    expect(shouldRedirectAuthenticated('login')).toBe(true);
  });

  it('still bounces a signed-in user away from register', () => {
    expect(shouldRedirectAuthenticated('register')).toBe(true);
  });

  it('treats a missing segment as not redirectable', () => {
    // Nothing identifies a screen, so do not bounce; the screen decides.
    expect(isTokenBearingScreen(undefined)).toBe(false);
    expect(shouldRedirectAuthenticated(null)).toBe(true);
  });
});
