// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// The bookmark toggle did the right thing server-side and still told the user
// nothing: the button's label was the literal "Save", so an already-saved idea
// read identically to an unsaved one -- before and after a reload. Only the
// background colour followed `isBookmarked`, which is invisible to anyone not
// looking for it. These tests pin the label and the pressed state.

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useParams: () => ({ id: 'idea-1' }), useNavigate: () => () => {} };
});

vi.mock('../../api/idea.api', () => ({
  default: {
    getById: vi.fn(),
    getComments: vi.fn(),
    toggleBookmark: vi.fn(),
    toggleLike: vi.fn(),
    getStartProjectRequests: vi.fn(),
    getMyStartProjectRequest: vi.fn(),
    addComment: vi.fn(),
  },
}));

vi.mock('../../api/ai.api', () => ({
  default: { getSimilarIdeas: vi.fn(), suggestTeammates: vi.fn(), analyzeIdea: vi.fn() },
}));

vi.mock('../../api/user.api', () => ({ default: { getAll: vi.fn() } }));
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }));

import ideaApi from '../../api/idea.api';
import useAuthStore from '../../store/authSlice';
import IdeaDetail from './IdeaDetail';

const ME = 'user-me';
const OTHER = 'user-other';

const makeIdea = (bookmarks) => ({
  _id: 'idea-1',
  title: 'Sweep Test Idea',
  description: 'x',
  category: 'technology',
  status: 'open',
  visibility: 'public',
  author: { _id: OTHER, name: 'Someone Else' },
  likes: [],
  bookmarks,
  tags: [],
  createdAt: new Date('2026-01-01').toISOString(),
});

const setup = async (bookmarks) => {
  ideaApi.getById.mockResolvedValue({ data: { success: true, data: makeIdea(bookmarks) } });
  ideaApi.getComments.mockResolvedValue({ data: { success: true, data: [] } });
  ideaApi.getStartProjectRequests.mockResolvedValue({ data: { success: true, data: [] } });
  ideaApi.getMyStartProjectRequest.mockResolvedValue({ data: { success: true, data: null } });

  useAuthStore.setState({ user: { _id: ME, name: 'Me' }, isAuthenticated: true });

  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/ideas/idea-1']}>
        <Routes>
          <Route path="/ideas/:id" element={<IdeaDetail />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
  return screen.findByRole('button', { name: /save/i });
};

describe('IdeaDetail bookmark button', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => cleanup());

  it('reads "Saved" when the current user already bookmarked it', async () => {
    const btn = await setup([ME]);
    await waitFor(() => expect(btn.textContent).toBe('Saved'));
    expect(btn.getAttribute('aria-pressed')).toBe('true');
  });

  it('reads "Save" when the current user has not', async () => {
    const btn = await setup([OTHER]);
    await waitFor(() => expect(btn.textContent).toBe('Save'));
    expect(btn.getAttribute('aria-pressed')).toBe('false');
  });
});
