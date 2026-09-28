import type { Href } from 'expo-router';

type ResolvedRoute =
  | { pathname: '/ideas/[id]'; params: { id: string } }
  | { pathname: '/projects/[id]'; params: { id: string } }
  | { pathname: '/chat/[id]'; params: { id: string } }
  | { pathname: '/users/[id]'; params: { id: string } }
  | { pathname: '/(tabs)' }
  | { pathname: '/notifications' };

const ROUTE_PATTERN = /^\/(ideas|projects|chat|users)\/([a-fA-F0-9]{24})/;

const toPathname = (
  segment: string
): '/ideas/[id]' | '/projects/[id]' | '/chat/[id]' | '/users/[id]' => {
  switch (segment) {
    case 'projects':
      return '/projects/[id]';
    case 'chat':
      return '/chat/[id]';
    case 'users':
      return '/users/[id]';
    default:
      return '/ideas/[id]';
  }
};

/**
 * Map a backend `actionUrl` to an app route.
 *
 * The backend targets the *web* router, so it emits shapes the mobile app has
 * no route for. Every distinct shape the backend produces is handled here;
 * anything genuinely unknown resolves to the notifications list, which is
 * where the originating row lives, so a tap is never a silent no-op.
 */
export function resolveActionRoute(url?: string | null): ResolvedRoute | null {
  if (!url) return null;

  // Home stand-in for the web /dashboard.
  if (url === '/dashboard' || url === '/') return { pathname: '/(tabs)' };

  // The web has a /teams screen; mobile folds teams into project detail, so
  // the list of requests is the closest useful destination.
  if (url === '/teams') return { pathname: '/notifications' };

  const match = ROUTE_PATTERN.exec(url);
  if (match) {
    const [, segment, id] = match;
    return { pathname: toPathname(segment), params: { id } };
  }

  return null;
}

/** A destination that always exists, for a tap on a notification. */
export function fallbackRoute(): Href {
  return { pathname: '/notifications' } as Href;
}
