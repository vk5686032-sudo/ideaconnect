import { resolveActionRoute } from '@/utils/links';

const HEX = 'a'.repeat(24);

describe('resolveActionRoute', () => {
  it('maps an idea id', () => {
    expect(resolveActionRoute(`/ideas/${HEX}`)).toEqual({
      pathname: '/ideas/[id]',
      params: { id: HEX },
    });
  });

  it('maps a project id', () => {
    expect(resolveActionRoute(`/projects/${HEX}`)).toEqual({
      pathname: '/projects/[id]',
      params: { id: HEX },
    });
  });

  it('maps a chat id', () => {
    expect(resolveActionRoute(`/chat/${HEX}`)).toEqual({
      pathname: '/chat/[id]',
      params: { id: HEX },
    });
  });

  it('maps a user id, which has a real profile screen', () => {
    expect(resolveActionRoute(`/users/${HEX}`)).toEqual({
      pathname: '/users/[id]',
      params: { id: HEX },
    });
  });

  it('maps /dashboard to the home tab', () => {
    // The backend sends /dashboard for idea-invite and mentor-request
    // notifications; mobile has no dashboard screen, but Home is the
    // equivalent landing place.
    expect(resolveActionRoute('/dashboard')).toEqual({ pathname: '/(tabs)' });
  });

  it('maps /teams, for which mobile has no equivalent screen', () => {
    expect(resolveActionRoute('/teams')).toEqual({ pathname: '/notifications' });
  });

  it('ignores a trailing comment fragment', () => {
    expect(resolveActionRoute(`/ideas/${HEX}#comment-${HEX}`)).toEqual({
      pathname: '/ideas/[id]',
      params: { id: HEX },
    });
  });

  it('returns null for an absent or unrecognised url', () => {
    expect(resolveActionRoute(undefined)).toBeNull();
    expect(resolveActionRoute(null)).toBeNull();
    expect(resolveActionRoute('')).toBeNull();
    expect(resolveActionRoute('/nope/whatever')).toBeNull();
  });

  it('does not treat a non-hex segment as an id', () => {
    expect(resolveActionRoute('/ideas/not-an-id')).toBeNull();
  });
});
