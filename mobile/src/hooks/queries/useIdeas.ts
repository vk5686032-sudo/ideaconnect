import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';

import { ideaApi, type IdeaFilters } from '@/api/idea.api';
import { useAuthStore } from '@/store/authSlice';
import type { ApiPaginated, ApiSuccess, Idea, IdeaComment } from '@/types/models';

export const ideaKeys = {
  all: ['ideas'] as const,
  lists: () => [...ideaKeys.all, 'list'] as const,
  list: (filters: IdeaFilters) => [...ideaKeys.lists(), filters] as const,
  details: () => [...ideaKeys.all, 'detail'] as const,
  detail: (id: string) => [...ideaKeys.details(), id] as const,
  comments: (ideaId: string) => [...ideaKeys.all, 'comments', ideaId] as const,
  bookmarks: () => [...ideaKeys.all, 'bookmarks'] as const,
  myIdeas: () => [...ideaKeys.all, 'mine'] as const,
};

const PAGE_SIZE = 10;

type FeedPage = ApiPaginated<Idea>;
type FeedData = InfiniteData<FeedPage, number>;
type CommentsData = ApiSuccess<IdeaComment[]>;

function resolveUserId(): string {
  const user = useAuthStore.getState().user;
  return user?._id || user?.id || '';
}

function updateIdeaInCache(
  qc: ReturnType<typeof useQueryClient>,
  ideaId: string,
  updater: (idea: Idea) => Idea
): void {
  const listEntries = qc.getQueriesData<FeedData>({ queryKey: ideaKeys.lists() });
  for (const [key, feed] of listEntries) {
    if (!feed) continue;
    qc.setQueryData<FeedData>(key, {
      pages: feed.pages.map((page) => ({
        ...page,
        data: page.data.map((idea) => (idea._id === ideaId ? updater(idea) : idea)),
      })),
      pageParams: feed.pageParams,
    });
  }

  const detail = qc.getQueryData<ApiSuccess<Idea>>(ideaKeys.detail(ideaId));
  if (detail?.data) {
    qc.setQueryData<ApiSuccess<Idea>>(ideaKeys.detail(ideaId), {
      ...detail,
      data: updater(detail.data),
    });
  }

  for (const key of [ideaKeys.bookmarks(), ideaKeys.myIdeas()]) {
    const collection = qc.getQueryData<ApiSuccess<Idea[]>>(key);
    if (collection?.data?.some((idea) => idea._id === ideaId)) {
      qc.setQueryData<ApiSuccess<Idea[]>>(key, {
        ...collection,
        data: collection.data.map((idea) =>
          idea._id === ideaId ? updater(idea) : idea
        ),
      });
    }
  }
}

export function useIdeasFeed(filters: Omit<IdeaFilters, 'page' | 'limit'>) {
  return useInfiniteQuery({
    queryKey: ideaKeys.list(filters),
    queryFn: async ({ pageParam }) => {
      const res = await ideaApi.getIdeas({
        ...filters,
        page: pageParam,
        limit: PAGE_SIZE,
      });
      return res.data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.page < lastPage.pagination.pages
        ? lastPage.pagination.page + 1
        : undefined,
  });
}

export function useIdea(ideaId: string) {
  return useQuery({
    queryKey: ideaKeys.detail(ideaId),
    queryFn: async () => {
      const res = await ideaApi.getIdeaById(ideaId);
      return res.data;
    },
    enabled: !!ideaId,
  });
}

export function useIdeaComments(ideaId: string) {
  return useQuery({
    queryKey: ideaKeys.comments(ideaId),
    queryFn: async () => {
      const res = await ideaApi.getComments(ideaId);
      return res.data;
    },
    enabled: !!ideaId,
  });
}

export function useMyBookmarks() {
  return useQuery({
    queryKey: ideaKeys.bookmarks(),
    queryFn: async () => {
      const res = await ideaApi.getMyBookmarks();
      return res.data;
    },
  });
}

export function useToggleLike() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ideaId: string) => ideaApi.toggleLike(ideaId),
    onMutate: (ideaId) => {
      const userId = resolveUserId();
      updateIdeaInCache(qc, ideaId, (idea) => ({
        ...idea,
        likes: idea.likes.includes(userId)
          ? idea.likes.filter((id) => id !== userId)
          : [...idea.likes, userId],
      }));
    },
    onSuccess: (res, ideaId) => {
      const userId = resolveUserId();
      updateIdeaInCache(qc, ideaId, (idea) => ({
        ...idea,
        likes: res.data.data.isLiked
          ? Array.from(new Set([...idea.likes, userId]))
          : idea.likes.filter((id) => id !== userId),
      }));
    },
    onError: (_error, ideaId) => {
      void qc.invalidateQueries({ queryKey: ideaKeys.lists() });
      void qc.invalidateQueries({ queryKey: ideaKeys.detail(ideaId) });
    },
  });
}

export function useToggleBookmark() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ideaId: string) => ideaApi.toggleBookmark(ideaId),
    onMutate: (ideaId) => {
      const userId = resolveUserId();
      updateIdeaInCache(qc, ideaId, (idea) => ({
        ...idea,
        bookmarks: idea.bookmarks.includes(userId)
          ? idea.bookmarks.filter((id) => id !== userId)
          : [...idea.bookmarks, userId],
      }));
    },
    onSuccess: (res, ideaId) => {
      const userId = resolveUserId();
      updateIdeaInCache(qc, ideaId, (idea) => ({
        ...idea,
        bookmarks: res.data.data.isBookmarked
          ? Array.from(new Set([...idea.bookmarks, userId]))
          : idea.bookmarks.filter((id) => id !== userId),
      }));
    },
    onError: (_error, ideaId) => {
      void qc.invalidateQueries({ queryKey: ideaKeys.lists() });
      void qc.invalidateQueries({ queryKey: ideaKeys.detail(ideaId) });
      void qc.invalidateQueries({ queryKey: ideaKeys.bookmarks() });
    },
  });
}

export function useAddComment(ideaId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { content: string; parentId?: string }) =>
      ideaApi.addComment(ideaId, data),
    onMutate: (data) => {
      const tempId = `temp-${Date.now()}`;
      const user = useAuthStore.getState().user;
      const optimistic: IdeaComment = {
        _id: tempId,
        content: data.content,
        author: {
          _id: user?._id || '',
          name: user?.name || '',
          avatar: user?.avatar ?? null,
        },
        parent: data.parentId ?? null,
        replies: [],
        likes: [],
        createdAt: new Date().toISOString(),
      };
      const previous =
        qc.getQueryData<CommentsData>(ideaKeys.comments(ideaId)) ?? undefined;
      qc.setQueryData<CommentsData>(ideaKeys.comments(ideaId), (old) => ({
        ...(old ?? { success: true as const, message: '', data: [] as IdeaComment[] }),
        data: [optimistic, ...(old?.data ?? [])],
      }));
      updateIdeaInCache(qc, ideaId, (idea) => ({
        ...idea,
        commentsCount: idea.commentsCount + 1,
      }));
      return { tempId, previous };
    },
    onSuccess: (res, _vars, context) => {
      qc.setQueryData<CommentsData>(ideaKeys.comments(ideaId), (old) => ({
        ...(old ?? { success: true as const, message: '', data: [] as IdeaComment[] }),
        data: (old?.data ?? []).map((comment) =>
          comment._id === context?.tempId ? res.data.data : comment
        ),
      }));
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) {
        qc.setQueryData<CommentsData>(
          ideaKeys.comments(ideaId),
          context.previous
        );
      }
      updateIdeaInCache(qc, ideaId, (idea) => ({
        ...idea,
        commentsCount: Math.max(0, idea.commentsCount - 1),
      }));
    },
  });
}

export function useDeleteComment(ideaId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (commentId: string) => ideaApi.deleteComment(commentId),
    onMutate: (commentId) => {
      const previous =
        qc.getQueryData<CommentsData>(ideaKeys.comments(ideaId)) ?? undefined;
      qc.setQueryData<CommentsData>(ideaKeys.comments(ideaId), (old) => ({
        ...(old ?? { success: true as const, message: '', data: [] as IdeaComment[] }),
        data: (old?.data ?? []).filter(
          (comment) =>
            comment._id !== commentId &&
            comment.parent !== commentId &&
            !(comment.replies ?? []).some(
              (reply) => typeof reply !== 'string' && reply._id === commentId
            )
        ),
      }));
      updateIdeaInCache(qc, ideaId, (idea) => ({
        ...idea,
        commentsCount: Math.max(0, idea.commentsCount - 1),
      }));
      return { previous };
    },
    onError: (_error, _commentId, context) => {
      if (context?.previous) {
        qc.setQueryData<CommentsData>(
          ideaKeys.comments(ideaId),
          context.previous
        );
      }
    },
  });
}

export function useLikeComment(ideaId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (commentId: string) => ideaApi.likeComment(commentId),
    onMutate: (commentId) => {
      const userId = resolveUserId();
      qc.setQueryData<CommentsData>(ideaKeys.comments(ideaId), (old) => ({
        ...(old ?? { success: true as const, message: '', data: [] as IdeaComment[] }),
        data: (old?.data ?? []).map((comment) => mapCommentLike(comment, commentId, userId)),
      }));
    },
  });
}

function mapCommentLike(
  comment: IdeaComment,
  commentId: string,
  userId: string
): IdeaComment {
  const mapReplies = (replies?: (IdeaComment | string)[]) =>
    replies?.map((reply) =>
      typeof reply === 'string' ? reply : mapCommentLike(reply, commentId, userId)
    );

  if (comment._id === commentId) {
    return {
      ...comment,
      likes: comment.likes.includes(userId)
        ? comment.likes.filter((id) => id !== userId)
        : [...comment.likes, userId],
    };
  }
  return { ...comment, replies: mapReplies(comment.replies) };
}

export function useAddMentorReview(ideaId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { review: string; rating: number }) =>
      ideaApi.addMentorReview(ideaId, data),
    onSuccess: (res) => {
      qc.setQueryData<ApiSuccess<Idea>>(ideaKeys.detail(ideaId), (old) =>
        old
          ? { ...old, data: { ...old.data, mentorReviews: res.data.data.mentorReviews } }
          : old
      );
    },
  });
}

export function useCreateIdea() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ideaApi.createIdea,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ideaKeys.lists() });
      void qc.invalidateQueries({ queryKey: ideaKeys.myIdeas() });
    },
  });
}

export function useUpdateIdea(ideaId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof ideaApi.updateIdea>[1]) =>
      ideaApi.updateIdea(ideaId, data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ideaKeys.detail(ideaId) });
      void qc.invalidateQueries({ queryKey: ideaKeys.lists() });
      void qc.invalidateQueries({ queryKey: ideaKeys.myIdeas() });
    },
  });
}

export function useDeleteIdea() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ideaId: string) => ideaApi.deleteIdea(ideaId),
    onSuccess: (_res, ideaId) => {
      void qc.invalidateQueries({ queryKey: ideaKeys.lists() });
      void qc.invalidateQueries({ queryKey: ideaKeys.myIdeas() });
      void qc.invalidateQueries({ queryKey: ideaKeys.bookmarks() });
      qc.removeQueries({ queryKey: ideaKeys.detail(ideaId) });
    },
  });
}
