import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';

import { chatApi } from '@/api/chat.api';
import type { ApiPaginated, Chat, ChatMessage } from '@/types/models';

export const chatKeys = {
  all: ['chats'] as const,
  lists: () => [...chatKeys.all, 'list'] as const,
  messages: (chatId: string) =>
    [...chatKeys.all, 'messages', chatId] as const,
};

const PAGE_SIZE = 30;

type MessagesPage = ApiPaginated<ChatMessage>;
export type MessagesCache = InfiniteData<MessagesPage, number>;

function isTempId(id: string): boolean {
  return id.startsWith('temp-');
}

function emptyPage(): MessagesPage {
  return {
    success: true,
    message: '',
    data: [],
    pagination: { page: 1, limit: PAGE_SIZE, total: 0, pages: 1 },
  };
}

function seedCache(first: ChatMessage[]): MessagesCache {
  return { pages: [{ ...emptyPage(), data: first }], pageParams: [1] };
}

// The messages query is an INFINITE query — its cache value is
// { pages: MessagesPage[], pageParams: number[] }. Every writer must keep
// that wrapper intact or the observer crashes computing next-page params.
function updateMessagesCache(
  qc: ReturnType<typeof useQueryClient>,
  chatId: string,
  transform: (messages: ChatMessage[]) => ChatMessage[]
): void {
  qc.setQueryData<MessagesCache>(chatKeys.messages(chatId), (old) => {
    if (!old?.pages?.length) {
      return seedCache(transform([]));
    }
    return {
      ...old,
      pages: old.pages.map((page) => ({
        ...page,
        data: transform(page.data ?? []),
      })),
    };
  });
}

export function replaceMessageInCache(
  qc: ReturnType<typeof useQueryClient>,
  chatId: string,
  message: ChatMessage
): void {
  updateMessagesCache(qc, chatId, (data) => {
    const next = data.map((existing) => {
      if (existing._id === message._id) return message;
      if (
        isTempId(existing._id) &&
        typeof message.sender !== 'string' &&
        typeof existing.sender !== 'string' &&
        existing.sender._id === message.sender._id &&
        existing.content === message.content
      ) {
        return message;
      }
      return existing;
    });
    return message.content
      ? next.filter((m) => !isTempId(m._id))
      : next;
  });
}

export function upsertMessageInCache(
  qc: ReturnType<typeof useQueryClient>,
  message: ChatMessage
): void {
  qc.setQueryData<MessagesCache>(chatKeys.messages(message.chat), (old) => {
    if (!old?.pages?.length) {
      return seedCache([message]);
    }
    const exists = old.pages.some((page) =>
      page.data.some((existing) => existing._id === message._id)
    );
    if (exists) return old;

    const pages = old.pages.map((page) => ({
      ...page,
      data: page.data.filter((existing) => {
        if (!isTempId(existing._id)) return true;
        if (typeof message.sender === 'string') return true;
        if (typeof existing.sender === 'string') return false;
        return !(
          existing.sender._id === message.sender._id &&
          existing.content === message.content
        );
      }),
    }));

    const lastIndex = pages.length - 1;
    const last = pages[lastIndex];
    pages[lastIndex] = {
      ...last,
      data: [...last.data, message],
      pagination: {
        ...last.pagination,
        total: last.pagination.total + 1,
      },
    };
    return { ...old, pages };
  });

  qc.setQueryData<Chat[]>(chatKeys.lists(), (old) => {
    if (!Array.isArray(old)) return old;
    return old.map((chat) =>
      chat._id === message.chat ? { ...chat, lastMessage: message } : chat
    );
  });
}

export function removeTempMessagesFor(
  qc: ReturnType<typeof useQueryClient>,
  chatId: string,
  content: string
): void {
  updateMessagesCache(qc, chatId, (data) =>
    data.filter((m) => !(isTempId(m._id) && m.content === content))
  );
}

export function markMessageDeleted(
  qc: ReturnType<typeof useQueryClient>,
  chatId: string,
  messageId: string
): void {
  updateMessagesCache(qc, chatId, (data) =>
    data.map((m) =>
      m._id === messageId
        ? { ...m, isDeleted: true, content: undefined, attachments: [] }
        : m
    )
  );
}

export function applyReactions(
  qc: ReturnType<typeof useQueryClient>,
  chatId: string,
  messageId: string,
  reactions: ChatMessage['reactions']
): void {
  updateMessagesCache(qc, chatId, (data) =>
    data.map((m) => (m._id === messageId ? { ...m, reactions } : m))
  );
}

export function applyReadReceipts(
  qc: ReturnType<typeof useQueryClient>,
  chatId: string,
  readerUserId: string
): void {
  updateMessagesCache(qc, chatId, (data) =>
    data.map((m) => {
      const alreadyRead = m.readBy.some(
        (entry) => entry.user === readerUserId
      );
      if (alreadyRead) return m;
      return { ...m, readBy: [...m.readBy, { user: readerUserId }] };
    })
  );
}

export function useChats() {
  return useQuery({
    queryKey: chatKeys.lists(),
    queryFn: async () => {
      const res = await chatApi.getChats();
      return res.data.data;
    },
  });
}

export function useChatDetail(chatId: string) {
  return useQuery({
    queryKey: [...chatKeys.all, 'detail', chatId],
    queryFn: async () => {
      const res = await chatApi.getChatById(chatId);
      return res.data;
    },
    enabled: !!chatId,
  });
}

export function useMessages(chatId: string) {
  return useInfiniteQuery({
    queryKey: chatKeys.messages(chatId),
    queryFn: async ({ pageParam }) => {
      const res = await chatApi.getMessages(chatId, {
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
    enabled: !!chatId,
  });
}
