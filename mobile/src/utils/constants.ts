import type { IdeaCategory, IdeaSort } from '@/types/models';

export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? '';
export const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL ?? '';

export const IDEA_CATEGORIES: IdeaCategory[] = [
  'technology',
  'business',
  'healthcare',
  'education',
  'environment',
  'social',
  'entertainment',
  'finance',
  'other',
];

export const FEED_STATUSES = ['open', 'in-progress', 'completed', 'archived'] as const;

export const IDEA_SORTS: { value: IdeaSort; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'popular', label: 'Popular' },
  { value: 'trending', label: 'Trending' },
  { value: 'oldest', label: 'Oldest' },
];
