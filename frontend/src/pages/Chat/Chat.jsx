import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import {
  MessageSquare, Send, Paperclip, Smile, ArrowLeft, Loader2, FileText, X,
  CornerUpLeft, SmilePlus, Pencil, Trash2, MoreHorizontal,
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import chatApi from '../../api/chat.api';
import useAuthStore from '../../store/authSlice';
import useSocket from '../../hooks/useSocket';
import { getSocket } from '../../services/socket';

const EMOJIS = [
  '😀', '😁', '😂', '🤣', '😊', '😍', '😘', '😎',
  '🤔', '😅', '😉', '🙃', '🥺', '😢', '😭', '😤',
  '👍', '👎', '👏', '🙌', '🤝', '💪', '✌️', '🙏',
  '❤️', '💔', '🔥', '✨', '🎉', '🎊', '💯', '🚀',
  '✅', '❌', '⭐', '🌟', '☕', '🍕', '🎁', '💡',
];

// Quick reactions shown on hover (WhatsApp-style)
const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

const Chat = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const socket = useSocket();

  const [message, setMessage] = useState('');
  const [typingUsers, setTypingUsers] = useState([]);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);

  // WhatsApp-style state
  const [replyingTo, setReplyingTo] = useState(null);       // message being replied to
  const [editingMessage, setEditingMessage] = useState(null); // message being edited
  const [editingText, setEditingText] = useState('');
  const [reactionBarFor, setReactionBarFor] = useState(null); // message id showing quick reactions
  const [deleteTarget, setDeleteTarget] = useState(null);   // message in delete confirmation
  const [actionsFor, setActionsFor] = useState(null);       // message id showing hover actions

  const { data: chatsData } = useQuery({
    queryKey: ['chats'],
    queryFn: () => chatApi.getMy(),
  });

  const { data: messagesData } = useQuery({
    queryKey: ['messages', id],
    queryFn: () => chatApi.getMessages(id, {}),
    enabled: !!id,
  });

  const chats = chatsData?.data?.data || [];
  const [localMessages, setLocalMessages] = useState([]);
  const serverMessages = messagesData?.data?.data || [];
  const messages = [...serverMessages, ...localMessages];
  const currentChat = chats.find((c) => c._id === id);

  // Reset local state when chat changes
  useEffect(() => {
    setLocalMessages([]);
    setTypingUsers([]);
    setReplyingTo(null);
    setEditingMessage(null);
    setEditingText('');
    setReactionBarFor(null);
    setDeleteTarget(null);
    setActionsFor(null);
  }, [id]);

  // Update a message (by id) in whichever source holds it (server cache or local state)
  const updateMessageById = (messageId, updater) => {
    setLocalMessages((prev) => {
      const idx = prev.findIndex((m) => m._id === messageId);
      if (idx === -1) return prev;
      const next = [...prev];
      next[idx] = updater(next[idx]);
      return next;
    });
    queryClient.setQueryData(['messages', id], (old) => {
      if (!old?.data?.data) return old;
      const idx = old.data.data.findIndex((m) => m._id === messageId);
      if (idx === -1) return old;
      const next = [...old.data.data];
      next[idx] = updater(next[idx]);
      return { ...old, data: { ...old.data, data: next } };
    });
  };

  const removeMessageById = (messageId) => {
    setLocalMessages((prev) => prev.filter((m) => m._id !== messageId));
    queryClient.setQueryData(['messages', id], (old) => {
      if (!old?.data?.data) return old;
      return {
        ...old,
        data: { ...old.data, data: old.data.data.filter((m) => m._id !== messageId) },
      };
    });
  };

  // Resolve a replyTo (may be populated object or raw id)
  const resolveReply = (msg) => {
    if (!msg.replyTo) return null;
    if (typeof msg.replyTo === 'object' && msg.replyTo._id) return msg.replyTo;
    return messages.find((m) => m._id === msg.replyTo) || null;
  };

  // Socket: join/leave chat room, listen for messages + message mutations
  useEffect(() => {
    const s = getSocket();
    if (!s || !id) return;

    s.emit('chat:join', id);
    s.emit('messages:read', { chatId: id, userId: user?._id });

    const onMessageReceived = (msg) => {
      if (msg.chat === id || msg.chat?._id === id) {
        if (!serverMessages.some((m) => m._id === msg._id)) {
          setLocalMessages((prev) => [...prev, msg]);
        }
      }
      queryClient.invalidateQueries(['chats']);
    };

    const onMessageEdited = (msg) => {
      if (msg.chat === id || msg.chat?._id === id) {
        updateMessageById(msg._id, () => msg);
      }
      if (editingMessage?._id === msg._id) {
        setEditingMessage(null);
        setEditingText('');
      }
    };

    const onMessageDeleted = ({ chatId, messageId }) => {
      if (chatId === id) {
        updateMessageById(messageId, (m) => ({ ...m, isDeleted: true }));
      }
    };

    const onMessageDeletedFor = ({ chatId, messageId }) => {
      if (chatId === id) removeMessageById(messageId);
    };

    const onMessageReacted = ({ chatId, messageId, reactions }) => {
      if (chatId === id) {
        updateMessageById(messageId, (m) => ({ ...m, reactions }));
      }
    };

    const onTypingStart = ({ userId, userName }) => {
      if (userId !== user?._id) {
        setTypingUsers((prev) => {
          if (prev.some((u) => u.userId === userId)) return prev;
          return [...prev, { userId, userName }];
        });
      }
    };

    const onTypingStop = ({ userId }) => {
      setTypingUsers((prev) => prev.filter((u) => u.userId !== userId));
    };

    s.on('message:received', onMessageReceived);
    s.on('message:edited', onMessageEdited);
    s.on('message:deleted', onMessageDeleted);
    s.on('message:deletedFor', onMessageDeletedFor);
    s.on('message:reacted', onMessageReacted);
    s.on('typing:user', onTypingStart);
    s.on('typing:stopped', onTypingStop);

    return () => {
      s.emit('chat:leave', id);
      s.off('message:received', onMessageReceived);
      s.off('message:edited', onMessageEdited);
      s.off('message:deleted', onMessageDeleted);
      s.off('message:deletedFor', onMessageDeletedFor);
      s.off('message:reacted', onMessageReacted);
      s.off('typing:user', onTypingStart);
      s.off('typing:stopped', onTypingStop);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user?._id, serverMessages.length, queryClient]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send via socket (supports reply)
  const handleSend = () => {
    const s = getSocket();
    if (!message.trim() || !s?.connected || !id) return;

    s.emit('message:send', {
      chatId: id,
      content: message.trim(),
      senderId: user?._id,
      replyTo: replyingTo?._id || null,
    });

    setMessage('');
    setReplyingTo(null);
    s.emit('typing:stop', { chatId: id, userId: user?._id });
  };

  // Typing indicator
  const handleTyping = (e) => {
    setMessage(e.target.value);
    const s = getSocket();
    if (!s?.connected || !id) return;

    s.emit('typing:start', { chatId: id, userId: user?._id, userName: user?.name });

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      s.emit('typing:stop', { chatId: id, userId: user?._id });
    }, 2000);
  };

  // Insert emoji at the end of the message input
  const insertEmoji = (emoji) => {
    setMessage((prev) => prev + emoji);
    setEmojiPickerOpen(false);
  };

  // Upload a file and send it as an attachment message
  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file
    if (!file || !id) return;

    setUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (message.trim()) {
        formData.append('content', message.trim());
      }

      await chatApi.sendAttachment(id, formData);

      setMessage('');
      setReplyingTo(null);
      setUploadingFile(false);
      toast.success('File sent');
    } catch (error) {
      setUploadingFile(false);
      toast.error(error.response?.data?.message || 'Failed to send file');
    }
  };

  // ---- Edit ----
  const startEdit = (msg) => {
    setEditingMessage(msg);
    setEditingText(msg.content || '');
    setActionsFor(null);
  };

  const saveEdit = async () => {
    if (!editingMessage || !editingText.trim()) return;
    try {
      await chatApi.editMessage(id, editingMessage._id, editingText.trim());
      setEditingMessage(null);
      setEditingText('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to edit message');
    }
  };

  const cancelEdit = () => {
    setEditingMessage(null);
    setEditingText('');
  };

  // ---- Delete ----
  const confirmDelete = async (scope) => {
    if (!deleteTarget) return;
    try {
      await chatApi.deleteMessage(id, deleteTarget._id, scope);
      if (scope === 'me') {
        removeMessageById(deleteTarget._id);
      }
      setDeleteTarget(null);
      toast.success(scope === 'me' ? 'Deleted for you' : 'Deleted for everyone');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete message');
    }
  };

  // ---- Reactions ----
  const toggleReaction = async (msg, emoji) => {
    setReactionBarFor(null);
    try {
      await chatApi.reactToMessage(id, msg._id, emoji);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to react');
    }
  };

  const myReaction = (msg) => {
    const found = msg.reactions?.find(
      (r) => r.user === user?._id || r.user?._id === user?._id || r.user?.toString?.() === user?._id
    );
    return found?.emoji || null;
  };

  // Group reactions by emoji for display
  const groupedReactions = (msg) => {
    const counts = {};
    msg.reactions?.forEach((r) => {
      counts[r.emoji] = (counts[r.emoji] || 0) + 1;
    });
    return Object.entries(counts);
  };

  const getChatName = (chat) => {
    if (!chat) return 'Chat';
    return chat.type === 'direct'
      ? chat.participants?.filter((p) => p.name && p._id !== user?._id).map((p) => p.name).join(', ') || 'Direct Chat'
      : chat.name || 'Group Chat';
  };

  const isOwn = (msg) => msg.sender?._id === user?._id;
  const isDeleted = (msg) => msg.isDeleted;
  const isEdited = (msg) => msg.isEdited;

  return (
    <div className="h-[calc(100vh-160px)] lg:h-[calc(100vh-120px)] flex bg-white rounded-xl overflow-hidden border border-gray-200">
      {/* Chats Sidebar */}
      <div
        className={`${
          id ? 'hidden md:flex' : 'flex'
        } w-full md:w-80 md:flex-shrink-0 border-r border-gray-200 flex-col`}
      >
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="font-semibold text-lg">Messages</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {chats.length === 0 && (
            <p className="text-sm text-gray-500 p-4 text-center">No conversations yet</p>
          )}
          {chats.map((chat) => (
            <button
              key={chat._id}
              onClick={() => navigate(`/chat/${chat._id}`)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                chat._id === id ? 'bg-primary-50 border-l-4 border-primary-600' : ''
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                <MessageSquare className="w-5 h-5 text-primary-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{getChatName(chat)}</p>
                <p className="text-xs text-gray-500 truncate">
                  {chat.lastMessage
                    ? chat.lastMessage.isDeleted
                      ? 'This message was deleted'
                      : chat.lastMessage.content || (chat.lastMessage.attachments?.length ? '📎 Attachment' : '')
                    : 'Start a conversation'}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      {id ? (
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 flex items-center gap-3">
            <button
              onClick={() => navigate('/chat')}
              className="md:hidden -ml-2 p-2.5 rounded-lg active:bg-gray-100"
              title="Back to conversations"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
              <MessageSquare className="w-5 h-5 text-primary-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold truncate">{getChatName(currentChat)}</h3>
              <p className="text-xs text-gray-500">Chat</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => {
              const own = isOwn(msg);
              const deleted = isDeleted(msg);
              const reply = resolveReply(msg);
              const editing = editingMessage?._id === msg._id;
              const reactions = groupedReactions(msg);
              const myReactionEmoji = myReaction(msg);

              return (
                <div
                  key={msg._id}
                  className={`flex ${own ? 'justify-end' : ''}`}
                  onMouseEnter={() => setActionsFor(msg._id)}
                  onMouseLeave={() => setActionsFor(null)}
                >
                  <div
                    className={`max-w-[85%] md:max-w-md p-3 rounded-lg relative ${
                      own ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    {!own && (
                      <p className="text-xs font-medium mb-1 opacity-70">{msg.sender?.name}</p>
                    )}

                    {/* Reply preview */}
                    {reply && !deleted && (
                      <button
                        onClick={() => document.getElementById(`msg-${reply._id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                        className={`w-full text-left text-xs rounded px-2 py-1.5 mb-1.5 border-l-2 ${
                          own
                            ? 'bg-white/20 border-white/40'
                            : 'bg-white border-primary-300'
                        }`}
                      >
                        <p className={`font-medium truncate ${own ? 'text-white/90' : 'text-primary-700'}`}>
                          {reply.sender?.name || 'Message'}
                        </p>
                        <p className="truncate opacity-80">
                          {reply.isDeleted ? 'This message was deleted' : reply.content || (reply.attachments?.length ? '📎 Attachment' : '')}
                        </p>
                      </button>
                    )}

                    {/* Deleted for everyone */}
                    {deleted ? (
                      <p className="italic opacity-60 text-sm">🚫 This message was deleted</p>
                    ) : editing ? (
                      /* Inline edit — Enter saves, click elsewhere cancels */
                      <div className="space-y-2">
                        <textarea
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              saveEdit();
                            }
                          }}
                          onBlur={cancelEdit}
                          className="w-full input-field text-gray-900 text-sm"
                          rows={2}
                          autoFocus
                          placeholder="Edit message... (Enter to save, click away to cancel)"
                        />
                      </div>
                    ) : (
                      <>
                        {/* Attachments */}
                        {msg.attachments?.length > 0 && (
                          <div className="flex flex-col gap-1.5 mb-1.5">
                            {msg.attachments.map((att, i) =>
                              att.type?.startsWith('image/') ? (
                                <a key={i} href={att.url} target="_blank" rel="noopener noreferrer">
                                  <img
                                    src={att.url}
                                    alt={att.name || 'attachment'}
                                    className="max-w-[220px] max-h-48 rounded-lg object-cover cursor-pointer hover:opacity-90"
                                  />
                                </a>
                              ) : (
                                <a
                                  key={i}
                                  href={att.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`flex items-center gap-2 p-2 rounded-lg text-sm ${
                                    own ? 'bg-white/20 text-white' : 'bg-white text-gray-700 border border-gray-200'
                                  }`}
                                >
                                  <FileText className="w-4 h-4 flex-shrink-0" />
                                  <span className="truncate max-w-[180px]">{att.name || 'File'}</span>
                                </a>
                              )
                            )}
                          </div>
                        )}
                        {msg.content && <p className="break-words whitespace-pre-wrap">{msg.content}</p>}
                      </>
                    )}

                    {/* Meta row: time + edited */}
                    <p className="text-xs mt-1 opacity-60">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {isEdited(msg) && !deleted && <span> · edited</span>}
                    </p>

                    {/* Reactions */}
                    {reactions.length > 0 && (
                      <div className={`flex flex-wrap gap-1 mt-1.5 ${own ? 'justify-end' : ''}`}>
                        {reactions.map(([emoji, count]) => (
                          <button
                            key={emoji}
                            onClick={() => toggleReaction(msg, emoji)}
                            className={`flex items-center gap-0.5 text-xs rounded-full px-2 py-0.5 border ${
                              myReactionEmoji === emoji
                                ? 'border-primary-500 bg-primary-50 text-primary-700'
                                : own
                                ? 'border-white/30 bg-white/15'
                                : 'border-gray-200 bg-white text-gray-600'
                            }`}
                          >
                            <span>{emoji}</span>
                            {count > 1 && <span>{count}</span>}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Mobile "⋯" toggle — no hover on touch devices */}
                    {!deleted && !editing && (
                      <button
                        onClick={() => setActionsFor(actionsFor === msg._id ? null : msg._id)}
                        className={`lg:hidden absolute -top-3 ${own ? 'right-2' : 'left-2'} w-7 h-7 bg-white rounded-full shadow-md border border-gray-100 flex items-center justify-center text-gray-500 active:bg-gray-100`}
                        title="Message options"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    )}

                    {/* Hover actions (WhatsApp-style) — also opened by the mobile ⋯ toggle */}
                    {actionsFor === msg._id && !deleted && !editing && (
                      <div
                        className={`absolute -top-3 ${own ? 'right-9 lg:right-2' : 'left-9 lg:left-2'} flex items-center gap-0.5 bg-white rounded-full shadow-md border border-gray-100 px-1 py-0.5`}
                        onMouseEnter={() => setActionsFor(msg._id)}
                      >
                        {reactionBarFor === msg._id ? (
                          <div className="flex items-center gap-0.5 px-1">
                            {QUICK_REACTIONS.map((e) => (
                              <button
                                key={e}
                                onClick={() => toggleReaction(msg, e)}
                                className="text-base hover:scale-125 transition-transform p-0.5"
                              >
                                {e}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={() => setReactionBarFor(msg._id)}
                              className="p-1.5 text-gray-500 hover:text-primary-600 rounded-full hover:bg-gray-100"
                              title="React"
                            >
                              <SmilePlus className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => { setReplyingTo(msg); setActionsFor(null); }}
                              className="p-1.5 text-gray-500 hover:text-primary-600 rounded-full hover:bg-gray-100"
                              title="Reply"
                            >
                              <CornerUpLeft className="w-4 h-4" />
                            </button>
                            {own && (
                              <>
                                <button
                                  onClick={() => startEdit(msg)}
                                  className="p-1.5 text-gray-500 hover:text-primary-600 rounded-full hover:bg-gray-100"
                                  title="Edit"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setDeleteTarget(msg)}
                                  className="p-1.5 text-gray-500 hover:text-red-600 rounded-full hover:bg-red-50"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Typing indicator */}
            {typingUsers.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-gray-500 px-1">
                <span className="flex gap-0.5">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
                <span>{typingUsers.map((u) => u.userName).join(', ')} typing</span>
              </div>
            )}

            <div id="msg-end" ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="relative p-3 sm:p-4 border-t border-gray-200">
            {/* Emoji picker popover */}
            {emojiPickerOpen && (
              <div className="absolute bottom-full left-3 mb-2 w-72 p-3 bg-white rounded-xl border border-gray-200 shadow-lg grid grid-cols-8 gap-1 z-20 max-h-52 overflow-y-auto">
                {EMOJIS.map((e) => (
                  <button
                    key={e}
                    onClick={() => insertEmoji(e)}
                    className="text-xl p-1 rounded hover:bg-gray-100 transition-colors"
                  >
                    {e}
                  </button>
                ))}
              </div>
            )}

            {/* Reply bar */}
            {replyingTo && (
              <div className="mb-2 flex items-center gap-2 bg-gray-50 border-l-4 border-primary-500 rounded-r-lg px-3 py-2 text-sm">
                <CornerUpLeft className="w-4 h-4 text-primary-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-primary-700 truncate">{replyingTo.sender?.name || 'Message'}</p>
                  <p className="text-gray-500 truncate">
                    {replyingTo.isDeleted ? 'This message was deleted' : replyingTo.content || (replyingTo.attachments?.length ? '📎 Attachment' : '')}
                  </p>
                </div>
                <button onClick={() => setReplyingTo(null)} className="text-gray-400 hover:text-gray-600 p-1">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {uploadingFile && (
              <div className="mb-2 flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" /> Uploading file...
              </div>
            )}

            <div className="flex items-center gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingFile}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                title="Attach file"
              >
                <Paperclip className="w-5 h-5" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileSelect}
                disabled={uploadingFile}
              />
              <input
                type="text"
                value={message}
                onChange={handleTyping}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder={replyingTo ? 'Reply...' : 'Type a message...'}
                className="flex-1 min-w-0 input-field"
              />
              <button
                onClick={() => setEmojiPickerOpen(!emojiPickerOpen)}
                className={`p-2 rounded-lg transition-colors ${
                  emojiPickerOpen ? 'text-primary-600 bg-primary-50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
                title="Emoji"
              >
                <Smile className="w-5 h-5" />
              </button>
              <button onClick={handleSend} disabled={uploadingFile} className="btn-primary flex-shrink-0 disabled:opacity-50">
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Empty state (no chat selected) */
        <div className="flex-1 hidden md:flex flex-col items-center justify-center text-gray-400">
          <MessageSquare className="w-16 h-16 mb-4" />
          <p className="text-lg font-medium">Select a conversation</p>
          <p className="text-sm">Choose a chat to start messaging</p>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setDeleteTarget(null)}>
          <div
            className="bg-white rounded-xl p-6 w-full max-w-sm shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-1">Delete message?</h3>
            <p className="text-sm text-gray-600 mb-4">
              This action cannot be undone. If you delete for everyone, others will see a "deleted" placeholder.
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => confirmDelete('everyone')}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" /> Delete for everyone
              </button>
              <button
                onClick={() => confirmDelete('me')}
                className="btn-outline w-full"
              >
                Delete for me
              </button>
              <button onClick={() => setDeleteTarget(null)} className="text-sm text-gray-500 hover:text-gray-700 py-1">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;