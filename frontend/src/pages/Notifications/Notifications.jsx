import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck, Check, X } from 'lucide-react';
import BackButton from '../../components/common/BackButton';
import notificationApi from '../../api/notification.api';
import projectApi from '../../api/project.api';
import { timeSince } from '../../utils/helpers';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const Notifications = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationApi.getMy({ limit: 50 }),
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

  const handleInvitation = useMutation({
    mutationFn: ({ invitationId, action }) => projectApi.handleInvitation(invitationId, action),
    onSuccess: (data, { action, notificationId }) => {
      toast.success(action === 'accept' ? 'Invitation accepted!' : 'Invitation declined');
      // Mark notification as read after handling
      if (notificationId) {
        notificationApi.markAsRead(notificationId);
      }
      queryClient.invalidateQueries(['notifications']);
      queryClient.invalidateQueries(['projects']);
    },
    onError: () => {
      toast.error('Failed to respond to invitation');
    },
  });

  const notifications = data?.data?.data?.notifications || [];
  const unreadCount = notifications.filter((n) => !n.read).length;

  const getNotificationText = (n) => {
    switch (n.type) {
      case 'like':                   return `liked your idea`;
      case 'comment':                return `commented on your idea`;
      case 'reply':                  return `replied to your comment`;
      case 'mention':                return `mentioned you`;
      case 'invitation':             return `sent you a project invitation`;
      case 'join-request':           return `requested to join your project`;
      case 'project-update':         return `updated a project`;
      case 'task-assigned':          return `assigned you a task`;
      case 'mentor-review':          return `reviewed your idea`;
      case 'mentor-request':         return `requested your mentorship`;
      case 'mentor-request-accepted':  return `accepted your mentorship request`;
      case 'mentor-request-rejected':  return `declined your mentorship request`;
      case 'ai-analysis':            return `AI analysis is complete`;
      case 'start-project-request':  return `requested to start a project from your idea`;
      case 'start-project-approved': return `approved your request to start a project`;
      case 'start-project-rejected': return `declined your request to start a project`;
      default:                       return n.message || 'sent a notification';
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.read) markRead.mutate(notification._id);
    if (notification.actionUrl) navigate(notification.actionUrl);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-4">
        <BackButton />
      </div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-8">
        <div className="flex items-center gap-2">
          <Bell className="w-6 h-6 text-primary-600" />
          <h1 className="text-2xl font-bold">Notifications</h1>
          {unreadCount > 0 && (
            <span className="badge bg-red-100 text-red-700">{unreadCount}</span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllRead.mutate()}
            className="btn-outline text-sm flex items-center gap-1"
          >
            <CheckCheck className="w-4 h-4" /> Mark all as read
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="card text-center py-12">
          <Bell className="w-14 h-14 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No notifications yet</h3>
          <p className="text-gray-500 text-sm">You'll see updates about your ideas, projects, and team here.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50">
          {notifications.map((n) => (
            <div
              key={n._id}
              className={`px-5 py-4 flex items-start gap-3 transition-colors ${
                !n.read ? 'bg-primary-50/30' : ''
              }`}
            >
              <button
                onClick={() => handleNotificationClick(n)}
                className="flex items-start gap-3 flex-1 text-left hover:opacity-75"
              >
                {n.sender?.avatar?.url ? (
                  <img src={n.sender.avatar.url} alt="" className="w-10 h-10 rounded-full flex-shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                    <Bell className="w-5 h-5 text-primary-500" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm leading-relaxed">
                    <span className="font-medium">{n.sender?.name}</span>{' '}
                    {getNotificationText(n)}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">{timeSince(n.createdAt)}</p>
                  {n.title && n.type === 'invitation' && (
                    <div className="mt-2 text-xs bg-primary-50 text-primary-700 px-2 py-1 rounded inline-block">
                      {n.title}
                    </div>
                  )}
                </div>
                {!n.read && <div className="w-2 h-2 rounded-full bg-primary-500 mt-2 flex-shrink-0" />}
              </button>

              {/* Action buttons for join-request and invitation */}
              {(n.type === 'join-request' || n.type === 'invitation') && n.relatedInvitation && (
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() =>
                      handleInvitation.mutate({
                        invitationId: n.relatedInvitation,
                        action: 'accept',
                        notificationId: n._id,
                      })
                    }
                    disabled={handleInvitation.isPending}
                    className="btn-primary text-xs px-2 py-1 flex items-center gap-1 hover:bg-primary-700"
                  >
                    <Check className="w-3 h-3" />
                    Accept
                  </button>
                  <button
                    onClick={() =>
                      handleInvitation.mutate({
                        invitationId: n.relatedInvitation,
                        action: 'reject',
                        notificationId: n._id,
                      })
                    }
                    disabled={handleInvitation.isPending}
                    className="btn-outline text-xs px-2 py-1 flex items-center gap-1"
                  >
                    <X className="w-3 h-3" />
                    Decline
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;