import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Bell, CheckCheck } from 'lucide-react';
import notificationApi from '../../api/notification.api';
import useSocket from '../../hooks/useSocket';
import { getSocket } from '../../services/socket';
import { timeSince } from '../../utils/helpers';

const NotificationsBell = () => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const queryClient = useQueryClient();

  // Call useSocket so its connect effect runs (declared first) and the socket
  // is available when the listener effect below executes. MainLayout shares the
  // same singleton connection.
  useSocket();

  const { data: countData } = useQuery({
    queryKey: ['unread-notifications'],
    queryFn: () => notificationApi.getUnreadCount(),
    refetchInterval: 30000, // safety fallback; realtime updates arrive via socket
  });

  // Listen for realtime notification pushes and refresh badge + list instantly
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onNotification = () => {
      queryClient.invalidateQueries(['unread-notifications']);
      queryClient.invalidateQueries(['notifications']);
    };

    socket.on('notification', onNotification);
    return () => socket.off('notification', onNotification);
  }, [queryClient]);

  const { data: listData } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationApi.getMy({ limit: 10 }),
    enabled: open,
  });

  const markRead = useMutation({
    mutationFn: (id) => notificationApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['unread-notifications']);
      queryClient.invalidateQueries(['notifications']);
    },
  });

  const markAllRead = useMutation({
    mutationFn: () => notificationApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries(['unread-notifications']);
      queryClient.invalidateQueries(['notifications']);
    },
  });

  const unreadCount = countData?.data?.data?.count || 0;
  const notifications = listData?.data?.data?.notifications || [];

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const getNotificationText = (n) => {
    switch (n.type) {
      case 'like':       return `liked your idea`;
      case 'comment':    return `commented on your idea`;
      case 'reply':      return `replied to your comment`;
      case 'invitation': return `sent you a project invitation`;
      case 'mentor-review': return `reviewed your idea`;
      case 'ai-analysis':    return `AI analysis is complete`;
      default:           return n.message || 'sent a notification';
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[320px] max-w-[calc(100vw-1rem)] sm:w-[380px] bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="font-semibold text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllRead.mutate()}
                className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1"
              >
                <CheckCheck className="w-3.5 h-3.5" /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">No notifications yet.</p>
            ) : (
              notifications.map((n) => (
                <button
                  key={n._id}
                  onClick={() => {
                    if (!n.read) markRead.mutate(n._id);
                    setOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-start gap-3 ${
                    !n.read ? 'bg-primary-50/40' : ''
                  }`}
                >
                  {n.sender?.avatar?.url ? (
                    <img src={n.sender.avatar.url} alt="" className="w-8 h-8 rounded-full flex-shrink-0 mt-0.5" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary-100 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm leading-snug">
                      <span className="font-medium">{n.sender?.name}</span>{' '}
                      {getNotificationText(n)}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">{timeSince(n.createdAt)}</p>
                  </div>
                  {!n.read && <div className="w-2 h-2 rounded-full bg-primary-500 mt-2 flex-shrink-0" />}
                </button>
              ))
            )}
          </div>

          <Link
            to="/notifications"
            onClick={() => setOpen(false)}
            className="block text-center text-sm text-primary-600 hover:text-primary-700 hover:bg-gray-50 py-3 border-t border-gray-100 font-medium"
          >
            View all notifications
          </Link>
        </div>
      )}
    </div>
  );
};

export default NotificationsBell;