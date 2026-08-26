import { io, type Socket } from 'socket.io-client';

import { refreshAccessTokenNow } from '@/api/client';
import { getAccessToken } from '@/api/tokenStorage';
import type { ChatMessage } from '@/types/models';
import { SOCKET_URL } from '@/utils/constants';

type SocketHandler = (...args: unknown[]) => void;

export interface MessageAck {
  ok: boolean;
  message?: ChatMessage;
}

let socket: Socket | null = null;
const handlers = new Map<string, Set<SocketHandler>>();

let authRetryInFlight = false;
let lastAuthRetryAt = 0;
let joinedUserId: string | null = null;

function bindAll(target: Socket): void {
  handlers.forEach((set, event) => {
    set.forEach((handler) => {
      target.on(event, handler as never);
    });
  });
}

function attachLifecycle(target: Socket): void {
  target.on('connect', () => {
    authRetryInFlight = false;
    // Restore personal-room membership after any reconnect; the server
    // replies with a fresh presence snapshot on every join.
    if (joinedUserId) {
      target.emit('join', joinedUserId);
    }
  });

  target.on('connect_error', (rawError) => {
    const message = String((rawError as Error)?.message ?? '');
    if (!/token|auth/i.test(message)) return;
    if (authRetryInFlight) return;

    const now = Date.now();
    if (now - lastAuthRetryAt < 30_000) return;
    authRetryInFlight = true;
    lastAuthRetryAt = now;

    void (async () => {
      try {
        const token = await refreshAccessTokenNow();
        if (token && socket === target) {
          target.auth = { token };
          target.connect();
        }
      } finally {
        setTimeout(() => {
          authRetryInFlight = false;
        }, 1_500);
      }
    })();
  });
}

export async function connectSocket(): Promise<Socket | null> {
  if (socket?.connected) {
    return socket;
  }

  const token = await getAccessToken();
  if (!token || !SOCKET_URL) {
    return null;
  }

  if (socket && !socket.connected) {
    socket.connect();
    return socket;
  }

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket'],
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
  });
  bindAll(socket);
  attachLifecycle(socket);
  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

export function isSocketConnected(): boolean {
  return !!socket?.connected;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
  joinedUserId = null;
}

export function onSocketEvent(event: string, handler: SocketHandler): () => void {
  if (!handlers.has(event)) {
    handlers.set(event, new Set());
  }
  handlers.get(event)!.add(handler);

  if (socket) {
    socket.on(event, handler as never);
  }

  return () => {
    handlers.get(event)?.delete(handler);
    socket?.off(event, handler as never);
  };
}

export function joinUserRoom(userId: string): void {
  joinedUserId = userId;
  socket?.emit('join', userId);
}

export function joinChatRoom(chatId: string): void {
  socket?.emit('chat:join', chatId);
}

export function leaveChatRoom(chatId: string): void {
  socket?.emit('chat:leave', chatId);
}

interface SendMessagePayload {
  chatId: string;
  content: string;
  replyTo?: string;
}

export function sendMessage(
  payload: SendMessagePayload,
  onAck?: (ack: MessageAck) => void
): void {
  if (!socket) return;
  if (onAck) {
    socket.emit('message:send', payload, onAck as never);
  } else {
    socket.emit('message:send', payload);
  }
}

export function startTyping(chatId: string, userId: string, userName: string): void {
  socket?.emit('typing:start', { chatId, userId, userName });
}

export function stopTyping(chatId: string, userId: string): void {
  socket?.emit('typing:stop', { chatId, userId });
}

export function markChatRead(chatId: string, userId: string): void {
  socket?.emit('messages:read', { chatId, userId });
}
