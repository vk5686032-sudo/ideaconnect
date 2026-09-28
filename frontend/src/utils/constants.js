import { resolveApiUrl, resolveSocketUrl } from '../config/endpoints';

export const CATEGORIES = [
  { value: 'technology', label: 'Technology' },
  { value: 'business', label: 'Business' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'education', label: 'Education' },
  { value: 'environment', label: 'Environment' },
  { value: 'social', label: 'Social' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'finance', label: 'Finance' },
  { value: 'other', label: 'Other' },
];

export const IDEA_STATUSES = [
  { value: 'draft', label: 'Draft', color: 'gray' },
  { value: 'open', label: 'Open', color: 'blue' },
  { value: 'in-progress', label: 'In Progress', color: 'yellow' },
  { value: 'completed', label: 'Completed', color: 'green' },
  { value: 'archived', label: 'Archived', color: 'red' },
];

export const PROJECT_STATUSES = [
  { value: 'planning', label: 'Planning', color: 'gray' },
  { value: 'in-progress', label: 'In Progress', color: 'blue' },
  { value: 'on-hold', label: 'On Hold', color: 'yellow' },
  { value: 'completed', label: 'Completed', color: 'green' },
  { value: 'cancelled', label: 'Cancelled', color: 'red' },
];

export const VISIBILITY_OPTIONS = [
  { value: 'public', label: 'Public' },
  { value: 'private', label: 'Private' },
  { value: 'invite-only', label: 'Invite Only' },
];

export const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'trending', label: 'Trending' },
];

export const COMMON_SKILLS = [
  'JavaScript',
  'TypeScript',
  'React',
  'Node.js',
  'Python',
  'Java',
  'C++',
  'Go',
  'Rust',
  'Swift',
  'Kotlin',
  'Flutter',
  'React Native',
  'Vue.js',
  'Angular',
  'Next.js',
  'Express',
  'Django',
  'Flask',
  'Spring Boot',
  'MongoDB',
  'PostgreSQL',
  'MySQL',
  'Redis',
  'Docker',
  'Kubernetes',
  'AWS',
  'Azure',
  'GCP',
  'Machine Learning',
  'AI',
  'Data Science',
  'Blockchain',
  'UI/UX Design',
  'Figma',
  'Product Management',
  'DevOps',
];

// Same-origin by default — see config/endpoints.js for why an empty setting
// must not fall back to http://localhost:5000.
export const API_URL = resolveApiUrl(import.meta.env.VITE_API_URL);
export const SOCKET_URL = resolveSocketUrl(import.meta.env.VITE_SOCKET_URL);
