import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import {
  Check,
  CheckCheck,
  FileText,
  Paperclip,
  Send,
  Smile,
} from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { isAxiosError } from 'axios';

import { Avatar } from '@/components/Avatar';
import { Input } from '@/components/Input';
import { PromptModal } from '@/components/PromptModal';
import {
  chatKeys,
  applyReadReceipts,
  applyReactions,
  markMessageDeleted,
  replaceMessageInCache,
  upsertMessageInCache,
  useChatDetail,
  useMessages,
  type MessagesCache,
} from '@/hooks/queries/useChats';
import { useCurrentUser } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import {
  getSocket,
  isSocketConnected,
  joinChatRoom,
  leaveChatRoom,
  markChatRead,
  sendMessage,
  onSocketEvent,
  startTyping,
  stopTyping,
  type MessageAck,
} from '@/services/socket';
import { chatApi } from '@/api/chat.api';
import type { ApiError, ChatMessage, IdeaAuthor, MessageAttachment } from '@/types/models';
import { timeAgo } from '@/utils/format';

const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🎉', '🔥', '👏'];

const COMPOSER_EMOJIS = [
  '😀', '😅', '😂', '🥹', '😍', '😎', '🤔', '🙃',
  '😢', '😡', '🥳', '😴', '👍', '👎', '👏', '🙏',
  '💪', '🔥', '🎉', '❤️', '✨', '🚀', '💡', '☕',
];

function resolveSender(sender: IdeaAuthor | string | undefined): IdeaAuthor | null {
  return typeof sender === 'string' ? null : (sender ?? null);
}

function AttachmentView({
  attachment,
  own,
}: {
  attachment: MessageAttachment;
  own: boolean;
}) {
  const mimeType = attachment.type ?? '';
  const isImage = mimeType.startsWith('image/') || /\.(png|jpe?g|gif|webp)$/i.test(attachment.url);

  if (isImage) {
    return (
      <Image
        source={{ uri: attachment.url }}
        className="h-44 w-56 rounded-lg"
        resizeMode="cover"
      />
    );
  }

  const fileName = attachment.name ?? 'Attachment';
  return (
    <Pressable
      onPress={() => void Linking.openURL(attachment.url)}
      className={`flex-row items-center gap-2 rounded-lg px-3 py-2.5 ${
        own ? 'bg-white/15' : 'bg-gray-100 dark:bg-gray-800'
      }`}>
      <FileText size={18} color={own ? '#ffffff' : '#6b7280'} strokeWidth={2} />
      <View className="flex-1">
        <Text
          numberOfLines={1}
          className={`font-sans-medium text-xs ${own ? 'text-white' : 'text-gray-800 dark:text-gray-100'}`}>
          {fileName}
        </Text>
        <Text
          className={`font-sans text-[10px] ${own ? 'text-white/70' : 'text-gray-400'}`}>
          Tap to open
        </Text>
      </View>
    </Pressable>
  );
}

function dayLabel(iso: string): string {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today.getTime() - 86_400_000);
  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() === today.getFullYear() ? undefined : 'numeric',
  });
}

export default function ChatRoomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const qc = useQueryClient();
  const currentUser = useCurrentUser();
  const userId = currentUser?._id || currentUser?.id || '';

  const detailQuery = useChatDetail(id);
  const messagesQuery = useMessages(id);

  const [draft, setDraft] = useState('');
  const [typingUsers, setTypingUsers] = useState<Record<string, string>>({});
  const [sendingAttachment, setSendingAttachment] = useState(false);
  const [actionMessage, setActionMessage] = useState<ChatMessage | null>(null);
  const [reactVisible, setReactVisible] = useState(false);
  const [editTarget, setEditTarget] = useState<ChatMessage | null>(null);
  const [emojiPickerVisible, setEmojiPickerVisible] = useState(false);
  const [connected, setConnected] = useState(isSocketConnected());
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingActive = useRef(false);
  const listRef = useRef<FlatList>(null);

  const chat = detailQuery.data?.data;

  const otherParticipant = useMemo(() => {
    if (!chat) return null;
    const others = chat.participants.filter((participant) => {
      if (typeof participant === 'string') return participant !== userId;
      return (participant._id || participant.id) !== userId;
    });
    const first = others[0];
    return typeof first === 'string' ? null : (first ?? null);
  }, [chat, userId]);

  const displayName =
    chat?.type === 'group'
      ? (chat.name ||
        (typeof chat.relatedProject === 'object'
          ? chat.relatedProject?.title
          : undefined) ||
        'Team chat')
      : (otherParticipant?.name ?? 'Direct chat');

  const messages = useMemo(() => {
    const pages = messagesQuery.data?.pages ?? [];
    const seen = new Set<string>();
    const ascending = [...pages]
      .reverse()
      .flatMap((page) => page.data)
      .filter((message) => !seen.has(message._id) && seen.add(message._id));
    return [...ascending].reverse();
  }, [messagesQuery.data]);

  useEffect(() => {
    joinChatRoom(id);
    markChatRead(id, userId);
    console.log('[chat] joined room', id);
    const offConnect = onSocketEvent('connect', () => {
      console.log('[chat] socket connected → rejoining', id);
      joinChatRoom(id);
      markChatRead(id, userId);
    });
    return () => {
      offConnect();
      leaveChatRoom(id);
      stopTyping(id, userId);
    };
  }, [id, userId]);

  useEffect(() => {
    const offs = [
      onSocketEvent('connect', () => setConnected(true)),
      onSocketEvent('disconnect', () => setConnected(false)),
      onSocketEvent('connect_error', () => setConnected(false)),
    ];
    return () => offs.forEach((off) => off());
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const showListener = Keyboard.addListener('keyboardDidShow', (event) => {
      setKeyboardHeight(event.endCoordinates.height);
    });
    const hideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
    });
    return () => {
      showListener.remove();
      hideListener.remove();
    };
  }, []);

  useEffect(() => {
    const offs = [
      onSocketEvent('message:received', (payload) => {
        const message = payload as ChatMessage;
        if (!message || message.chat !== id) return;
        console.log('[chat] received echo', message._id);
        upsertMessageInCache(qc, message);
        const senderId =
          typeof message.sender === 'string'
            ? message.sender
            : message.sender._id;
        if (senderId !== userId) {
          markChatRead(id, userId);
        }
      }),
      onSocketEvent('message:edited', (payload) => {
        const message = payload as ChatMessage;
        if (message?.chat !== id) return;
        replaceMessageInCache(qc, id, message);
      }),
      onSocketEvent('message:deleted', (payload) => {
        const data = payload as { chatId?: string; messageId?: string };
        if (data?.chatId !== id || !data.messageId) return;
        markMessageDeleted(qc, id, data.messageId);
      }),
      onSocketEvent('message:reacted', (payload) => {
        const data = payload as {
          chatId?: string;
          messageId?: string;
          reactions?: ChatMessage['reactions'];
        };
        if (
          data?.chatId !== id ||
          !data.messageId ||
          !Array.isArray(data.reactions)
        ) {
          return;
        }
        applyReactions(qc, id, data.messageId, data.reactions);
      }),
      onSocketEvent('messages:read', (payload) => {
        const data = payload as { chatId?: string; userId?: string };
        if (data?.chatId !== id || !data.userId || data.userId === userId) return;
        applyReadReceipts(qc, id, data.userId);
      }),
      onSocketEvent('typing:user', (payload) => {
        const data = payload as { chatId?: string; userId?: string; userName?: string };
        if (data?.chatId !== id || !data.userId || data.userId === userId) return;
        setTypingUsers((prev) => ({
          ...prev,
          [data.userId as string]: data.userName ?? 'Someone',
        }));
      }),
      onSocketEvent('typing:stopped', (payload) => {
        const data = payload as { chatId?: string; userId?: string };
        if (data?.chatId !== id || !data.userId) return;
        setTypingUsers((prev) => {
          const next = { ...prev };
          delete next[data.userId as string];
          return next;
        });
      }),
    ];
    return () => offs.forEach((off) => off());
  }, [id, userId, qc]);

  const flushTypingStop = useCallback(() => {
    if (typingActive.current) {
      typingActive.current = false;
      stopTyping(id, userId);
    }
  }, [id, userId]);

  const handleChangeText = (text: string) => {
    setDraft(text);
    if (!text.trim()) {
      if (typingTimer.current) clearTimeout(typingTimer.current);
      flushTypingStop();
      return;
    }
    if (!typingActive.current) {
      typingActive.current = true;
      startTyping(id, userId, currentUser?.name ?? '');
    }
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(flushTypingStop, 1600);
  };

  const appendTempMessage = (content: string): void => {
    const temp: ChatMessage = {
      _id: `temp-${Date.now()}`,
      chat: id,
      sender: {
        _id: userId,
        name: currentUser?.name ?? '',
        avatar: currentUser?.avatar ?? null,
      },
      content,
      attachments: [],
      reactions: [],
      readBy: [{ user: userId }],
      createdAt: new Date().toISOString(),
    };
    qc.setQueryData<MessagesCache>(chatKeys.messages(id), (old): MessagesCache => {
      if (!old?.pages?.length) {
        return {
          pages: [
            {
              success: true as const,
              message: '',
              data: [temp],
              pagination: { page: 1, limit: 30, total: 1, pages: 1 },
            },
          ],
          pageParams: [1],
        };
      }
      const lastIndex = old.pages.length - 1;
      const last = old.pages[lastIndex];
      if (last.data.some((existing) => existing._id === temp._id)) {
        return old;
      }
      const nextPages = [...old.pages];
      nextPages[lastIndex] = { ...last, data: [...last.data, temp] };
      return { ...old, pageParams: old.pageParams, pages: nextPages };
    });
  };

  const handleSend = () => {
    const content = draft.trim();
    if (!content || !getSocket()?.connected) {
      if (!getSocket()?.connected) {
        Toast.show({ type: 'error', text1: 'Connecting… try again in a moment' });
      }
      return;
    }
    if (typingTimer.current) clearTimeout(typingTimer.current);
    flushTypingStop();
    appendTempMessage(content);
    console.log('[chat] sending', { chatId: id, length: content.length });
    sendMessage({ chatId: id, content }, (ack: MessageAck) => {
      console.log('[chat] ack', ack?.ok, ack?.message?._id);
      if (ack?.ok && ack.message) {
        upsertMessageInCache(qc, ack.message);
        markChatRead(id, userId);
      } else {
        Toast.show({ type: 'error', text1: 'Message failed to send' });
      }
    });
    setDraft('');
  };

  const handlePickAttachment = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Toast.show({ type: 'error', text1: 'Photo library permission needed' });
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
    });
    if (result.canceled || result.assets.length === 0) return;

    const asset = result.assets[0];
    setSendingAttachment(true);
    try {
      const res = await chatApi.sendAttachment(
        id,
        asset.uri,
        asset.fileName ?? `photo-${Date.now()}.jpg`,
        asset.mimeType ?? 'image/jpeg'
      );
      upsertMessageInCache(qc, res.data.data);
    } catch (error) {
      let message = 'Failed to send attachment.';
      if (isAxiosError(error)) {
        const apiMessage = (error.response?.data as ApiError | undefined)?.message;
        if (apiMessage) message = apiMessage;
      }
      Toast.show({ type: 'error', text1: message });
    } finally {
      setSendingAttachment(false);
    }
  };

  const handleReaction = async (emoji: string) => {
    if (!actionMessage || actionMessage._id.startsWith('temp-')) return;
    setReactVisible(false);
    try {
      const res = await chatApi.reactToMessage(id, actionMessage._id, emoji);
      applyReactions(qc, id, actionMessage._id, res.data.data.reactions);
    } catch (error) {
      let message = 'Failed to react.';
      if (isAxiosError(error)) {
        const apiMessage = (error.response?.data as ApiError | undefined)?.message;
        if (apiMessage) message = apiMessage;
      }
      Toast.show({ type: 'error', text1: message });
    }
  };

  const handleDelete = (scope: 'everyone' | 'me') => {
    if (!actionMessage) return;
    const messageId = actionMessage._id;
    setActionMessage(null);
    void chatApi
      .deleteMessage(id, messageId, scope)
      .then(() => {
        if (scope === 'everyone') {
          markMessageDeleted(qc, id, messageId);
        } else {
          qc.setQueryData<MessagesCache>(chatKeys.messages(id), (old) => {
            if (!old?.pages?.length) return old;
            return {
              ...old,
              pages: old.pages.map((page) => ({
                ...page,
                data: page.data.filter((m) => m._id !== messageId),
              })),
            };
          });
        }
      })
      .catch(() => {
        Toast.show({ type: 'error', text1: 'Failed to delete message.' });
      });
  };

  const renderItem = ({
    item,
    index,
  }: {
    item: ChatMessage;
    index: number;
  }) => {
    const sender = resolveSender(item.sender);
    const senderId = sender?._id ?? (item.sender as string);
    const own = senderId === userId;
    const isGroup = chat?.type === 'group';
    const next = index < messages.length - 1 ? messages[index + 1] : null;
    const showDaySeparator =
      !next || dayLabel(next.createdAt) !== dayLabel(item.createdAt);
    const myMessageReadByPeer =
      own &&
      item.readBy.some((entry) => entry.user !== userId);

    if (item.isDeleted) {
      return (
        <View key={item._id}>
          <Text className="my-1 text-center font-sans text-[11px] italic text-gray-400 dark:text-gray-500">
            This message was deleted
          </Text>
        </View>
      );
    }

    return (
      <View>
        {showDaySeparator ? (
          <View className="items-center py-2">
            <Text className="rounded-full bg-gray-200/80 px-3 py-1 font-sans-medium text-[10px] text-gray-600 dark:bg-gray-800 dark:text-gray-300">
              {dayLabel(item.createdAt)}
            </Text>
          </View>
        ) : null}

        <Pressable
          onLongPress={() => {
            setActionMessage(item);
            if (!own) setReactVisible(true);
          }}
          delayLongPress={300}
          className={`mb-1.5 max-w-[78%] flex-row items-end gap-2 ${
            own ? 'self-end flex-row-reverse' : 'self-start'
          }`}>
            {!own && isGroup ? (
              <Avatar name={sender?.name ?? '?'} uri={sender?.avatar?.url ?? null} size={26} />
            ) : null}

          <View
            className={`rounded-2xl px-3 py-2 ${
              own
                ? 'rounded-br-sm bg-primary-600 dark:bg-primary-500'
                : 'rounded-bl-sm bg-white border border-gray-100 dark:bg-gray-900 dark:border-gray-800'
            }`}>
            {!own && isGroup ? (
              <Text className="mb-0.5 font-sans-semibold text-[11px] text-primary-600 dark:text-primary-400">
                {sender?.name}
              </Text>
            ) : null}

            {(item.attachments?.length ?? 0) > 0 ? (
              <View className="mb-1 gap-1">
                {item.attachments?.map((attachment, attachmentIndex) => (
                  <AttachmentView
                    key={`${attachment.url}-${attachmentIndex}`}
                    attachment={attachment}
                    own={own}
                  />
                ))}
              </View>
            ) : null}

            {item.content ? (
              <Text
                className={`font-sans text-sm leading-snug ${
                  own ? 'text-white' : 'text-gray-800 dark:text-gray-100'
                }`}>
                {item.content}
              </Text>
            ) : null}

            <View className="mt-1 flex-row items-center justify-end gap-1.5">
              {item.isEdited ? (
                <Text
                  className={`font-sans text-[9px] ${
                    own ? 'text-white/70' : 'text-gray-400'
                  }`}>
                  edited
                </Text>
              ) : null}
              <Text
                className={`font-sans text-[9px] ${
                  own ? 'text-white/70' : 'text-gray-400'
                }`}>
                {timeAgo(item.createdAt)}
              </Text>
              {own ? (
                myMessageReadByPeer ? (
                  <CheckCheck size={13} color="#bfdbfe" strokeWidth={2.4} />
                ) : (
                  <Check size={13} color="#ffffff90" strokeWidth={2.4} />
                )
              ) : null}
            </View>
          </View>
        </Pressable>

        {(item.reactions?.length ?? 0) > 0 ? (
          <View className={`flex-row flex-wrap gap-1 pb-1 ${own ? 'justify-end pr-1' : 'pl-1'}`}>
            {item.reactions.map((reaction, reactionIndex) => (
              <View
                key={`${reaction.user}-${reactionIndex}`}
                className="flex-row items-center gap-0.5 rounded-full bg-gray-100 px-1.5 py-0.5 dark:bg-gray-800">
                <Text className="text-[11px]">{reaction.emoji}</Text>
                {reaction.user === userId ? (
                  <Text className="font-sans text-[8px] text-primary-600">you</Text>
                ) : null}
              </View>
            ))}
          </View>
        ) : null}
      </View>
    );
  };

  const typingNames = Object.values(typingUsers);

  return (
    <>
      <Stack.Screen options={{ title: displayName }} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 bg-gray-50 dark:bg-[#0b0f19]"
        style={
          Platform.OS === 'android' && keyboardHeight > 0
            ? { paddingBottom: keyboardHeight }
            : undefined
        }>
        {!connected ? (
          <View className="bg-amber-100 px-4 py-1.5 dark:bg-amber-500/15">
            <Text className="text-center font-sans-medium text-xs text-amber-700 dark:text-amber-400">
              Reconnecting chat…
            </Text>
          </View>
        ) : null}

        {messagesQuery.isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#6366f1" />
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            inverted
            keyExtractor={(item) => item._id}
            renderItem={renderItem}
            contentContainerClassName="px-3 py-3"
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            onEndReachedThreshold={0.5}
            onEndReached={() => {
              if (messagesQuery.hasNextPage && !messagesQuery.isFetchingNextPage) {
                void messagesQuery.fetchNextPage();
              }
            }}
            ListFooterComponent={
              messagesQuery.isFetchingNextPage ? (
                <View className="py-3">
                  <ActivityIndicator size="small" color="#6366f1" />
                </View>
              ) : null
            }
            ListEmptyComponent={
              <View className="items-center py-16">
                <Text className="font-sans text-sm text-gray-400">
                  No messages yet — say hi!
                </Text>
              </View>
            }
          />
        )}

        {typingNames.length > 0 ? (
          <Text className="px-4 pb-1 font-sans text-xs italic text-gray-400 dark:text-gray-500">
            {typingNames.join(', ')} {typingNames.length === 1 ? 'is' : 'are'} typing…
          </Text>
        ) : null}

        <View className="flex-row items-center gap-2 border-t border-gray-100 bg-white px-3 py-2.5 dark:border-gray-800 dark:bg-gray-900">
          <Pressable
            onPress={() => void handlePickAttachment()}
            disabled={sendingAttachment}
            className="h-10 w-10 items-center justify-center rounded-full active:bg-gray-100 dark:active:bg-gray-800">
            {sendingAttachment ? (
              <ActivityIndicator size="small" color="#4f46e5" />
            ) : (
              <Paperclip size={20} color="#6b7280" strokeWidth={2} />
            )}
          </Pressable>

          <Input
            value={draft}
            onChangeText={handleChangeText}
            placeholder="Type a message…"
            multiline
            containerClassName="flex-1"
          />

          <Pressable
            onPress={() => setEmojiPickerVisible(true)}
            className="h-10 w-10 items-center justify-center rounded-full active:bg-gray-100 dark:active:bg-gray-800">
            <Smile size={20} color="#6b7280" strokeWidth={2} />
          </Pressable>

          <Pressable
            onPress={handleSend}
            disabled={!draft.trim() || messagesQuery.isLoading}
            className={`h-11 w-11 items-center justify-center rounded-full ${
              draft.trim() && !messagesQuery.isLoading
                ? 'bg-primary-600 active:bg-primary-700 dark:bg-primary-500'
                : 'bg-gray-200 dark:bg-gray-800'
            }`}>
            <Send
              size={18}
              color={draft.trim() && !messagesQuery.isLoading ? '#ffffff' : '#9ca3af'}
              strokeWidth={2.2}
            />
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      <Modal visible={actionMessage !== null} transparent animationType="fade" onRequestClose={() => setActionMessage(null)}>
        <Pressable className="flex-1 bg-black/50 px-6" onPress={() => setActionMessage(null)}>
          <View className="flex-1 justify-center">
            <Pressable onPress={() => {}} className="rounded-xl bg-white p-4 dark:bg-gray-900">
              <Text className="mb-3 font-sans-semibold text-base text-gray-900 dark:text-gray-100">
                Message actions
              </Text>
              {actionMessage && actionMessage._id.startsWith('temp-') ? (
                <Text className="py-2 text-center font-sans text-sm text-gray-400">
                  Sending…
                </Text>
              ) : (
                <View className="gap-2">
                  {actionMessage &&
                  resolveSender(actionMessage.sender)?._id === userId ? (
                    <>
                      <Pressable
                        onPress={() => {
                          setEditTarget(actionMessage);
                          setActionMessage(null);
                        }}
                        className="rounded-lg bg-gray-50 py-2.5 dark:bg-gray-800">
                        <Text className="text-center font-sans-medium text-sm text-gray-800 dark:text-gray-100">
                          Edit
                        </Text>
                      </Pressable>
                      <Pressable
                        onPress={() => Alert.alert('Delete message?', '', [
                          { text: 'Cancel', style: 'cancel' },
                          { text: 'For me', style: 'default', onPress: () => handleDelete('me') },
                          { text: 'For everyone', style: 'destructive', onPress: () => handleDelete('everyone') },
                        ])}
                        className="rounded-lg bg-red-50 py-2.5 dark:bg-red-500/10">
                        <Text className="text-center font-sans-medium text-sm text-red-600 dark:text-red-400">
                          Delete…
                        </Text>
                      </Pressable>
                    </>
                  ) : null}
                  <Pressable
                    onPress={() => {
                      setActionMessage(null);
                      setReactVisible(true);
                    }}
                    className="rounded-lg bg-gray-50 py-2.5 dark:bg-gray-800">
                    <Text className="text-center font-sans-medium text-sm text-gray-800 dark:text-gray-100">
                      React
                    </Text>
                  </Pressable>
                  <Pressable onPress={() => setActionMessage(null)} className="py-1.5">
                    <Text className="text-center font-sans text-sm text-gray-400">Cancel</Text>
                  </Pressable>
                </View>
              )}
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      <Modal visible={reactVisible} transparent animationType="fade" onRequestClose={() => setReactVisible(false)}>
        <Pressable className="flex-1 bg-black/50 px-6" onPress={() => setReactVisible(false)}>
          <View className="flex-1 justify-center">
            <Pressable onPress={() => {}} className="rounded-xl bg-white p-4 dark:bg-gray-900">
              <Text className="mb-3 font-sans-semibold text-base text-gray-900 dark:text-gray-100">
                React with
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {QUICK_EMOJIS.map((emoji) => (
                  <Pressable
                    key={emoji}
                    onPress={() => void handleReaction(emoji)}
                    className="h-12 w-12 items-center justify-center rounded-full bg-gray-50 active:bg-gray-100 dark:bg-gray-800 dark:active:bg-gray-700">
                    <Text className="text-xl">{emoji}</Text>
                  </Pressable>
                ))}
              </View>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      <Modal visible={emojiPickerVisible} transparent animationType="fade" onRequestClose={() => setEmojiPickerVisible(false)}>
        <Pressable className="flex-1 bg-black/50 px-6" onPress={() => setEmojiPickerVisible(false)}>
          <View className="flex-1 justify-center">
            <Pressable onPress={() => {}} className="rounded-xl bg-white p-4 dark:bg-gray-900">
              <Text className="mb-3 font-sans-semibold text-base text-gray-900 dark:text-gray-100">
                Emoji
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {COMPOSER_EMOJIS.map((emoji) => (
                  <Pressable
                    key={emoji}
                    onPress={() => {
                      setDraft((prev) => `${prev}${emoji}`);
                      setEmojiPickerVisible(false);
                    }}
                    className="h-12 w-12 items-center justify-center rounded-full bg-gray-50 active:bg-gray-100 dark:bg-gray-800 dark:active:bg-gray-700">
                    <Text className="text-xl">{emoji}</Text>
                  </Pressable>
                ))}
              </View>
              <Pressable onPress={() => setEmojiPickerVisible(false)} className="mt-4 items-center py-1">
                <Text className="font-sans-medium text-sm text-primary-600 dark:text-primary-400">
                  Close
                </Text>
              </Pressable>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {editTarget ? (
        <PromptModal
          key={`edit-${editTarget._id}`}
          visible
          title="Edit message"
          initialValue={editTarget.content ?? ''}
          multiline
          submitLabel="Save"
          onClose={() => setEditTarget(null)}
          onSubmit={(value) => {
            const target = editTarget;
            setEditTarget(null);
            void chatApi
              .editMessage(id, target._id, value)
              .then((res) => replaceMessageInCache(qc, id, res.data.data))
              .catch(() => {
                Toast.show({ type: 'error', text1: 'Failed to edit message.' });
              });
          }}
        />
      ) : null}
    </>
  );
}
