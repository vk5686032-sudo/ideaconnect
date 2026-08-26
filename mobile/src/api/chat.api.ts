import { api } from './client';
import type {
  ApiPaginated,
  ApiSuccess,
  Chat,
  ChatMessage,
} from '@/types/models';

export interface MessagesPageParams {
  page?: number;
  limit?: number;
}

export const chatApi = {
  getChats: () => api.get<ApiSuccess<Chat[]>>('/chats'),

  getChatById: (chatId: string) =>
    api.get<ApiSuccess<Chat>>(`/chats/${chatId}`),

  createOrGetDirectChat: (recipientId: string) =>
    api.post<ApiSuccess<Chat>>('/chats/direct', { recipientId }),

  getProjectChat: (projectId: string) =>
    api.get<ApiSuccess<Chat>>(`/chats/project/${projectId}`),

  getMessages: (chatId: string, params: MessagesPageParams = {}) =>
    api.get<ApiPaginated<ChatMessage>>(`/chats/${chatId}/messages`, { params }),

  editMessage: (chatId: string, messageId: string, content: string) =>
    api.patch<ApiSuccess<ChatMessage>>(
      `/chats/${chatId}/messages/${messageId}`,
      { content }
    ),

  deleteMessage: (
    chatId: string,
    messageId: string,
    scope: 'everyone' | 'me' = 'everyone'
  ) =>
    api.delete<ApiSuccess<{ chatId: string; messageId: string; scope: string }>>(
      `/chats/${chatId}/messages/${messageId}`,
      { params: { scope } }
    ),

  reactToMessage: (chatId: string, messageId: string, emoji: string) =>
    api.post<
      ApiSuccess<{ messageId: string; reactions: ChatMessage['reactions'] }>
    >(`/chats/${chatId}/messages/${messageId}/reactions`, { emoji }),

  sendAttachment: (chatId: string, fileUri: string, fileName: string, mimeType: string) => {
    const formData = new FormData();
    formData.append('file', {
      uri: fileUri,
      name: fileName,
      type: mimeType,
    } as unknown as Blob);
    return api.post<ApiSuccess<ChatMessage>>(
      `/chats/${chatId}/attachments`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
  },
};
