import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { MessageSquare, Send, Paperclip, Smile, ArrowLeft } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import chatApi from '../../api/chat.api';
import useAuthStore from '../../store/authSlice';
import useSocket from '../../hooks/useSocket';
import { getSocket } from '../../services/socket';

const Chat = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const socket = useSocket();

  const [message, setMessage] = useState('');
  const [typingUsers, setTypingUsers] = useState([]);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

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

  // Reset local messages when chat changes
  useEffect(() => {
    setLocalMessages([]);
    setTypingUsers([]);
  }, [id]);

  // Socket: join/leave chat room, listen for messages
  useEffect(() => {
    const s = getSocket();
    if (!s || !id) return;

    s.emit('chat:join', id);
    s.emit('messages:read', { chatId: id, userId: user?._id });

    const onMessageReceived = (msg) => {
      // Only add if for this chat and not already in server data
      if (msg.chat === id || msg.chat?._id === id) {
        if (!serverMessages.some((m) => m._id === msg._id)) {
          setLocalMessages((prev) => [...prev, msg]);
        }
      }
      // Refresh chat list so lastMessage updates
      queryClient.invalidateQueries(['chats']);
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
    s.on('typing:user', onTypingStart);
    s.on('typing:stopped', onTypingStop);

    return () => {
      s.emit('chat:leave', id);
      s.off('message:received', onMessageReceived);
      s.off('typing:user', onTypingStart);
      s.off('typing:stopped', onTypingStop);
    };
  }, [id, user?._id, serverMessages.length, queryClient]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send via socket
  const handleSend = () => {
    const s = getSocket();
    if (!message.trim() || !s?.connected || !id) return;

    s.emit('message:send', {
      chatId: id,
      content: message.trim(),
      senderId: user?._id,
      replyTo: null,
    });

    setMessage('');
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

  const getChatName = (chat) =>
    chat.type === 'direct'
      ? chat.participants?.filter((p) => p.name && p._id !== user?._id).map((p) => p.name).join(', ') || 'Direct Chat'
      : chat.name || 'Group Chat';

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
            <p className="p-4 text-sm text-gray-500 text-center">No conversations yet.</p>
          )}
          {chats.map((chat) => (
            <div
              key={chat._id}
              onClick={() => navigate(`/chat/${chat._id}`)}
              className={`p-4 cursor-pointer hover:bg-gray-50 active:bg-primary-50 ${
                id === chat._id ? 'bg-primary-50' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="w-5 h-5 text-primary-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{getChatName(chat)}</p>
                  <p className="text-sm text-gray-500 truncate">
                    {chat.lastMessage?.content || 'No messages yet'}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`${id ? 'flex' : 'hidden md:flex'} flex-1 flex-col min-w-0`}>
        {id ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 flex items-center gap-3">
              <button
                onClick={() => navigate('/chat')}
                className="md:hidden p-2 rounded-lg hover:bg-gray-100"
                aria-label="Back to chats"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h3 className="font-semibold truncate">{getChatName(currentChat)}</h3>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg._id}
                  className={`flex ${msg.sender?._id === user?._id ? 'justify-end' : ''}`}
                >
                  <div
                    className={`max-w-[85%] md:max-w-md p-3 rounded-lg ${
                      msg.sender?._id === user?._id
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    {msg.sender?._id !== user?._id && (
                      <p className="text-xs font-medium mb-1 opacity-70">{msg.sender?.name}</p>
                    )}
                    <p className="break-words">{msg.content}</p>
                    <p className="text-xs mt-1 opacity-60">
                      {new Date(msg.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}

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

              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-3 sm:p-4 border-t border-gray-200">
              <div className="flex items-center gap-2">
                <button className="hidden sm:block p-2 text-gray-500 hover:text-gray-700">
                  <Paperclip className="w-5 h-5" />
                </button>
                <input
                  type="text"
                  value={message}
                  onChange={handleTyping}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Type a message..."
                  className="flex-1 min-w-0 input-field"
                />
                <button className="hidden sm:block p-2 text-gray-500 hover:text-gray-700">
                  <Smile className="w-5 h-5" />
                </button>
                <button onClick={handleSend} className="btn-primary flex-shrink-0">
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="hidden md:flex flex-1 items-center justify-center">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Select a chat</h3>
              <p className="text-gray-500">Choose a conversation to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;