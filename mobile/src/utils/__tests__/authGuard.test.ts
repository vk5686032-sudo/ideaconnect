import {
  isTokenBearingScreen,
  shouldRedirectAuthenticated,
} from '@/utils/authGuard';

describe('auth guard', () => {
  it('lets a signed-in user reach password reset', () => {
    // The deep link arrives while the app still holds a session; redirecting
    // discarded the token and left the user unable to reset anything.
    expect(isTokenBearingScreen('/reset-password')).toBe(true);
    expect(shouldRedirectAuthenticated('/reset-password')).toBe(false);
  });

  it('lets a signed-in user reach email verification', () => {
    expect(isTokenBearingScreen('/verify-email')).toBe(true);
    expect(shouldRedirectAuthenticated('/verify-email')).toBe(false);
  });

  it('ignores the token query param the deep link carries', () => {
    // usePathname() drops the query, but be explicit about it anyway.
    expect(shouldRedirectAuthenticated('/reset-password?token=abc123')).toBe(false);
  });

  it('still bounces a signed-in user away from login', () => {
    expect(shouldRedirectAuthenticated('/login')).toBe(true);
  });

  it('still bounces a signed-in user away from register', () => {
    expect(shouldRedirectAuthenticated('/register')).toBe(true);
  });

  it('does not treat a nested path as a token-bearing screen', () => {
    // Only the first segment counts: /ideas/reset-password is an idea route.
    expect(shouldRedirectAuthenticated('/ideas/reset-password')).toBe(true);
  });

  it('treats a missing path as redirectable', () => {
    // Nothing identifies a screen, so do not assume it is safe to render.
    expect(isTokenBearingScreen(undefined)).toBe(false);
    expect(shouldRedirectAuthenticated(null)).toBe(true);
    expect(shouldRedirectAuthenticated('')).toBe(true);
    expect(shouldRedirectAuthenticated('/')).toBe(true);
  });
});
