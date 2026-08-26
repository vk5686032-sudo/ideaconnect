interface ResolvedRoute {
  pathname: '/ideas/[id]' | '/projects/[id]' | '/chat/[id]';
  params: { id: string };
}

const ROUTE_PATTERN = /^\/(ideas|projects|chat)\/([a-fA-F0-9]{24})/;

export function resolveActionRoute(url?: string | null): ResolvedRoute | null {
  if (!url) return null;
  const match = ROUTE_PATTERN.exec(url);
  if (!match) return null;

  const [, segment, id] = match;
  const pathname =
    segment === 'ideas'
      ? '/ideas/[id]'
      : segment === 'projects'
        ? '/projects/[id]'
        : '/chat/[id]';

  return { pathname, params: { id } };
}
