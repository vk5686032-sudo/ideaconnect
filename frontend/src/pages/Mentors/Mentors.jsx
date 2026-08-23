import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { GraduationCap, Search, Loader2, Users, Check, X, Clock, Send, UserCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import BackButton from '../../components/common/BackButton';
import mentorApi from '../../api/mentor.api';
import useAuthStore from '../../store/authSlice';

const STATUS_STYLES = {
  pending: { icon: Clock, className: 'bg-yellow-100 text-yellow-700', label: 'Pending' },
  accepted: { icon: UserCheck, className: 'bg-green-100 text-green-700', label: 'Accepted' },
  rejected: { icon: X, className: 'bg-red-100 text-red-600', label: 'Declined' },
  expired: { icon: X, className: 'bg-gray-100 text-gray-500', label: 'Expired' },
};

const Mentors = () => {
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuthStore();
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('directory'); // directory | my-requests

  const { data: mentorsData, isLoading } = useQuery({
    queryKey: ['mentors', search],
    queryFn: () => mentorApi.getMentors({ search: search || undefined }),
  });

  const { data: myRequestsData } = useQuery({
    queryKey: ['my-mentor-requests'],
    queryFn: () => mentorApi.getMyRequests(),
    enabled: isAuthenticated && tab === 'my-requests',
  });

  const requestMutation = useMutation({
    mutationFn: ({ mentorId, message }) => mentorApi.sendRequest(mentorId, { message }),
    onSuccess: () => {
      queryClient.invalidateQueries(['my-mentor-requests']);
      toast.success('Mentorship request sent!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to send request');
    },
  });

  const handleRequest = (mentor) => {
    const message = prompt(`Ask ${mentor.name} to be your mentor (optional message):`);
    if (message !== null) {
      requestMutation.mutate({ mentorId: mentor._id, message });
    }
  };

  // Map of mentorId -> latest pending sent request
  const sentRequests = myRequestsData?.data?.data || [];
  const pendingByMentor = {};
  sentRequests.forEach((r) => {
    if (r.status === 'pending' && r.recipient?._id) {
      pendingByMentor[r.recipient._id] = true;
    }
  });

  const mentors = mentorsData?.data?.data || [];

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-4">
        <BackButton />
      </div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-8">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-6 h-6 text-primary-600" />
          <h1 className="text-2xl font-bold">Find a Mentor</h1>
        </div>
        {isAuthenticated && (
          <div className="flex gap-2">
            <button
              onClick={() => setTab('directory')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === 'directory' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Directory
            </button>
            <button
              onClick={() => setTab('my-requests')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === 'my-requests' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              My Requests
              {sentRequests.filter((r) => r.status === 'pending').length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 text-[10px] rounded-full bg-white/25">
                  {sentRequests.filter((r) => r.status === 'pending').length}
                </span>
              )}
            </button>
          </div>
        )}
      </div>

      {tab === 'directory' ? (
        <>
          {/* Search */}
          <div className="card mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search mentors by name, skill, or bio..."
                className="input-field pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Mentor Grid */}
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto" />
            </div>
          ) : mentors.length === 0 ? (
            <div className="card text-center py-12">
              <GraduationCap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No mentors found</h3>
              <p className="text-gray-600">Try a different search term.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mentors.map((mentor) => {
                const isSelf = user?._id === mentor._id;
                const hasPending = pendingByMentor[mentor._id];
                return (
                  <div key={mentor._id} className="card flex flex-col">
                    <div className="flex items-start gap-3 mb-3">
                      {mentor.avatar?.url ? (
                        <img src={mentor.avatar.url} alt="" className="w-12 h-12 rounded-full flex-shrink-0" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                          <Users className="w-6 h-6 text-green-600" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <Link to={`/users/${mentor._id}`} className="font-semibold hover:text-primary-600 truncate block">
                          {mentor.name}
                        </Link>
                        <span className="badge-success text-[10px]">✓ Approved Mentor</span>
                      </div>
                    </div>

                    {mentor.bio && (
                      <p className="text-sm text-gray-600 line-clamp-2 mb-3">{mentor.bio}</p>
                    )}

                    {mentor.skills?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {mentor.skills.slice(0, 4).map((skill) => (
                          <span key={skill} className="badge bg-gray-100 text-gray-600 text-[10px]">{skill}</span>
                        ))}
                        {mentor.skills.length > 4 && (
                          <span className="badge bg-gray-100 text-gray-400 text-[10px]">+{mentor.skills.length - 4}</span>
                        )}
                      </div>
                    )}

                    <div className="mt-auto">
                      {!isAuthenticated || isSelf ? (
                        <Link to={`/users/${mentor._id}`} className="btn-outline w-full text-sm text-center">
                          View Profile
                        </Link>
                      ) : hasPending ? (
                        <button disabled className="w-full text-sm px-4 py-2 rounded-lg bg-yellow-50 text-yellow-700 border border-yellow-200 flex items-center justify-center gap-2 cursor-not-allowed">
                          <Clock className="w-4 h-4" /> Request Pending
                        </button>
                      ) : (
                        <button
                          onClick={() => handleRequest(mentor)}
                          disabled={requestMutation.isPending}
                          className="btn-primary w-full text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {requestMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                          Request Mentorship
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        /* My Requests tab */
        <div className="space-y-3 max-w-3xl">
          {sentRequests.length === 0 ? (
            <div className="card text-center py-12">
              <Send className="w-14 h-14 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No requests sent yet</h3>
              <p className="text-gray-600 text-sm">Browse the directory and reach out to a mentor.</p>
            </div>
          ) : (
            sentRequests.map((request) => {
              const style = STATUS_STYLES[request.status] || STATUS_STYLES.pending;
              const StatusIcon = style.icon;
              return (
                <div key={request._id} className="card flex items-center gap-3">
                  <Link to={`/users/${request.recipient?._id}`} className="flex items-center gap-3 flex-1 min-w-0">
                    {request.recipient?.avatar?.url ? (
                      <img src={request.recipient.avatar.url} alt="" className="w-10 h-10 rounded-full flex-shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                        <Users className="w-5 h-5 text-green-600" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{request.recipient?.name}</p>
                      {request.message && <p className="text-xs text-gray-500 line-clamp-1">{request.message}</p>}
                      <p className="text-[10px] text-gray-400">{new Date(request.createdAt).toLocaleDateString()}</p>
                    </div>
                  </Link>
                  <span className={`badge ${style.className} flex-shrink-0 flex items-center gap-1`}>
                    <StatusIcon className="w-3 h-3" /> {style.label}
                  </span>
                  {request.status === 'accepted' && (
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default Mentors;
