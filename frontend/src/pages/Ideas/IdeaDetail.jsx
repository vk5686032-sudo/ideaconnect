import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
  Star, MessageSquare, Eye, Bookmark, Share2, ThumbsUp,
  Wrench, Users, ArrowRight,
  Send, Trash2, Edit3, Check, X, Send as SendIcon,
} from 'lucide-react';
import toast from 'react-hot-toast';
import BackButton from '../../components/common/BackButton';
import ideaApi from '../../api/idea.api';
import useAuthStore from '../../store/authSlice';

const IdeaDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuthStore();
  const [comment, setComment] = useState('');

  const { data: ideaData, isLoading } = useQuery({
    queryKey: ['idea', id],
    queryFn: () => ideaApi.getById(id),
    enabled: !!id,
  });

  const { data: commentsData } = useQuery({
    queryKey: ['comments', id],
    queryFn: () => ideaApi.getComments(id),
    enabled: !!id,
  });

  const idea = ideaData?.data?.data;
  const comments = commentsData?.data?.data || [];

  const isOwner = idea ? user?._id === idea.author?._id : false;

  const likeMutation = useMutation({
    mutationFn: () => ideaApi.toggleLike(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['idea', id]);
    },
  });

  const bookmarkMutation = useMutation({
    mutationFn: () => ideaApi.toggleBookmark(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['idea', id]);
      toast.success('Bookmark updated');
    },
  });

  const commentMutation = useMutation({
    mutationFn: (content) => ideaApi.addComment(id, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries(['comments', id]);
      queryClient.invalidateQueries(['idea', id]);
      setComment('');
      toast.success('Comment added');
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId) => ideaApi.deleteComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries(['comments', id]);
      queryClient.invalidateQueries(['idea', id]);
      toast.success('Comment deleted');
    },
  });

  // Start-project request mutations
  const requestStartProjectMutation = useMutation({
    mutationFn: (data) => ideaApi.requestStartProject(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['idea', id]);
      toast.success('Request sent to idea owner!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to send request');
    },
  });

  const getStartProjectRequestsQuery = useQuery({
    queryKey: ['start-project-requests', id],
    queryFn: () => ideaApi.getStartProjectRequests(id),
    enabled: isOwner && !!id,
  });
  const allStartProjectRequests = getStartProjectRequestsQuery.data?.data?.data || [];
  const pendingStartProjectRequests = allStartProjectRequests.filter(r => r.status === 'pending');

  const handleStartProjectRequestMutation = useMutation({
    mutationFn: ({ requestId, action }) => ideaApi.handleStartProjectRequest(requestId, action),
    onSuccess: () => {
      queryClient.invalidateQueries(['idea', id]);
      queryClient.invalidateQueries(['start-project-requests', id]);
      queryClient.invalidateQueries(['my-start-project-request', id]);
      toast.success(`Request ${action}d`);
    },
    onError: (error, { action }) => {
      toast.error(error.response?.data?.message || `Failed to ${action} request`);
    },
  });

  // Fetch current user's own request for this idea
  const { data: myRequestData } = useQuery({
    queryKey: ['my-start-project-request', id],
    queryFn: () => ideaApi.getMyStartProjectRequest(id),
    enabled: !isOwner && isAuthenticated && !!id,
  });
  const myStartProjectRequest = myRequestData?.data?.data;

  const requestStartProject = (message) => {
    requestStartProjectMutation.mutate({ message: message || '' });
  };

  const handleStartProjectRequest = (requestId, action) => {
    if (window.confirm(action === 'approve' ? 'Approve this request? The user will be able to convert the idea to a project.' : 'Reject this request?')) {
      handleStartProjectRequestMutation.mutate({ requestId, action });
    }
  };

  // Check if user already has a pending request or approved request
  const userHasPendingRequest = !isOwner && isAuthenticated && myStartProjectRequest && myStartProjectRequest.status === 'pending';
  const userRequestApproved = !isOwner && isAuthenticated && myStartProjectRequest && myStartProjectRequest.status === 'accepted';

  if (isLoading) {
    return (
      <div className="text-center py-24">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto" />
      </div>
    );
  }

  if (!idea) {
    return (
      <div className="text-center py-24">
        <h2 className="text-2xl font-bold mb-4">Idea not found</h2>
        <button onClick={() => navigate('/ideas')} className="btn-primary">
          Browse Ideas
        </button>
      </div>
    );
  }

  const isLiked = idea.likes?.includes(user?._id);
  const isBookmarked = idea.bookmarks?.includes(user?._id);

  const handleComment = () => {
    if (!comment.trim()) return;
    commentMutation.mutate(comment);
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-4">
        <BackButton />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <div className="card mb-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="badge-primary">{idea.category}</span>
              <span className={`badge ${idea.status === 'open' ? 'badge-success' : idea.status === 'completed' ? 'badge-success' : 'badge-warning'}`}>
                {idea.status}
              </span>
              {idea.visibility === 'private' && <span className="badge-warning">Private</span>}
            </div>

            <h1 className="text-2xl md:text-3xl font-bold mb-4">{idea.title}</h1>
            <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">{idea.description}</p>

            {idea.requiredSkills?.length > 0 && (
              <div className="mt-6">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Wrench className="w-5 h-5" /> Required Skills
                </h3>
                <div className="flex flex-wrap gap-2">
                  {idea.requiredSkills.map((skill) => (
                    <span key={skill} className="badge bg-gray-100 text-gray-700">{skill}</span>
                  ))}
                </div>
              </div>
            )}

            {idea.tags?.length > 0 && (
              <div className="mt-4">
                <div className="flex flex-wrap gap-2">
                  {idea.tags.map((tag) => (
                    <span key={tag} className="badge-primary">#{tag}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Author */}
            <div className="flex items-center gap-3 mt-6 pt-6 border-t border-gray-100">
              {idea.author?.avatar?.url ? (
                <img src={idea.author.avatar.url} alt="" className="w-10 h-10 rounded-full" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary-600" />
                </div>
              )}
              <div>
                <p className="font-medium">{idea.author?.name}</p>
                <p className="text-sm text-gray-500">
                  Posted {new Date(idea.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="card mb-6">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => likeMutation.mutate()}
                className={`flex items-center gap-1 px-4 py-2 rounded-lg transition-colors ${
                  isLiked ? 'bg-primary-600 text-white' : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                <ThumbsUp className="w-5 h-5" />
                {idea.likes?.length || 0}
              </button>
              <button
                onClick={() => bookmarkMutation.mutate()}
                className={`flex items-center gap-1 px-4 py-2 rounded-lg transition-colors ${
                  isBookmarked ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                <Bookmark className="w-5 h-5" />
                Save
              </button>
              <button className="flex items-center gap-1 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200">
                <Share2 className="w-5 h-5" />
                Share
              </button>
              <span className="ml-auto flex items-center gap-1 text-sm text-gray-500">
                <Eye className="w-4 h-4" /> {idea.views || 0} views
              </span>
            </div>
          </div>

          {/* Comments */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5" /> Comments ({comments.length})
            </h2>

            {isAuthenticated && (
              <div className="flex gap-2 sm:gap-3 mb-6">
                <input
                  type="text"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleComment()}
                  placeholder="Share your thoughts..."
                  className="input-field min-w-0"
                />
                <button onClick={handleComment} className="btn-primary flex items-center gap-1 sm:gap-2 flex-shrink-0">
                  <Send className="w-4 h-4" /> <span className="hidden sm:inline">Post</span>
                </button>
              </div>
            )}

            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment._id} className="flex gap-3">
                  {comment.author?.avatar?.url ? (
                    <img src={comment.author.avatar.url} alt="" className="w-8 h-8 rounded-full flex-shrink-0" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                      <Users className="w-4 h-4 text-primary-600" />
                    </div>
                  )}
                  <div className="flex-1 bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{comment.author?.name}</span>
                      <span className="text-xs text-gray-500">
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </span>
                      {user?._id === comment.author?._id && (
                        <button
                          onClick={() => deleteCommentMutation.mutate(comment._id)}
                          className="ml-auto -mr-2 p-2 text-gray-400 hover:text-red-500 rounded-lg active:bg-red-50"
                          title="Delete comment"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-gray-700">{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Team */}
          {idea.team?.length > 0 && (
            <div className="card">
              <h2 className="text-lg font-semibold mb-4">Team Members</h2>
              <div className="space-y-3">
                {idea.team.map((member) => (
                  <div key={member._id} className="flex items-center gap-3">
                    {member.user?.avatar?.url ? (
                      <img src={member.user.avatar.url} alt="" className="w-8 h-8 rounded-full" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                        <Users className="w-4 h-4 text-primary-600" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-sm">{member.user?.name}</p>
                      <p className="text-xs text-gray-500 capitalize">{member.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Owner: Convert to Project + Pending Requests */}
          {isOwner && !idea.convertedToProject && (
            <div className="card bg-primary-50 border-primary-200">
              <h2 className="text-lg font-semibold mb-2">Ready to Build?</h2>
              <p className="text-sm text-gray-600 mb-4">
                Convert this idea into a project and start collaborating.
              </p>
              <Link to={`/projects/new?idea=${idea._id}`} className="btn-primary w-full flex items-center justify-center gap-2">
                <ArrowRight className="w-5 h-5" /> Convert to Project
              </Link>

              {/* Pending Requests */}
              {pendingStartProjectRequests.length > 0 && (
                <div className="mt-4 pt-4 border-t border-primary-200">
                  <h3 className="font-medium text-sm mb-3">Pending Requests ({pendingStartProjectRequests.length})</h3>
                  <div className="space-y-3">
                    {pendingStartProjectRequests.map((req) => (
                      <div key={req._id} className="bg-white rounded-lg p-3 border border-gray-100">
                        <div className="flex items-center gap-2 mb-2">
                          {req.sender?.avatar?.url ? (
                            <img src={req.sender.avatar.url} alt="" className="w-6 h-6 rounded-full" />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center">
                              <Users className="w-3 h-3 text-primary-600" />
                            </div>
                          )}
                          <span className="text-sm font-medium">{req.sender?.name}</span>
                        </div>
                        {req.message && <p className="text-xs text-gray-600 mb-2">{req.message}</p>}
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleStartProjectRequest(req._id, 'approve')}
                            disabled={handleStartProjectRequestMutation.isLoading}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
                          >
                            <Check className="w-3 h-3" /> Approve
                          </button>
                          <button
                            onClick={() => handleStartProjectRequest(req._id, 'reject')}
                            disabled={handleStartProjectRequestMutation.isLoading}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50"
                          >
                            <X className="w-3 h-3" /> Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Owner: Already converted */}
          {isOwner && idea.convertedToProject && (
            <div className="card bg-green-50 border-green-200">
              <h2 className="text-lg font-semibold mb-2 text-green-800">Already Converted</h2>
              <p className="text-sm text-green-700 mb-4">
                This idea has been converted to a project.
              </p>
              <Link to={`/projects/${idea.convertedToProject}`} className="btn-primary w-full flex items-center justify-center gap-2">
                <ArrowRight className="w-5 h-5" /> View Project
              </Link>
            </div>
          )}

          {/* Non-owner: Request to Start Project (pending or no request) */}
          {!isOwner && isAuthenticated && !idea.convertedToProject && !userRequestApproved && (
            <div className="card bg-amber-50 border-amber-200">
              <h2 className="text-lg font-semibold mb-2">Start a Project</h2>
              {userHasPendingRequest ? (
                <>
                  <p className="text-sm text-amber-700 mb-4">
                    Your request is pending review by the idea owner.
                  </p>
                  <button
                    disabled={true}
                    className="btn-outline w-full flex items-center justify-center gap-2"
                  >
                    <SendIcon className="w-5 h-5" /> Request Sent
                  </button>
                </>
              ) : (
                <>
                  <p className="text-sm text-gray-600 mb-4">
                    Like this idea? Request to start a project from it.
                  </p>
                  <button
                    onClick={() => {
                      const message = prompt('Optional: Tell the author why you want to start this project:');
                      if (message !== null) requestStartProject(message);
                    }}
                    disabled={requestStartProjectMutation.isLoading}
                    className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <SendIcon className="w-5 h-5" />
                    {requestStartProjectMutation.isLoading ? 'Sending...' : 'Request to Start Project'}
                  </button>
                </>
              )}
            </div>
          )}

          {/* Non-owner: Request approved - Convert to Project */}
          {!isOwner && userRequestApproved && !idea.convertedToProject && (
            <div className="card bg-primary-50 border-primary-200">
              <h2 className="text-lg font-semibold mb-2">Request Approved!</h2>
              <p className="text-sm text-gray-600 mb-4">
                The idea owner approved your request. You can now convert this idea to a project.
              </p>
              <Link to={`/projects/new?idea=${idea._id}`} className="btn-primary w-full flex items-center justify-center gap-2">
                <ArrowRight className="w-5 h-5" /> Convert to Project
              </Link>
            </div>
          )}

          {/* Non-owner: Already converted */}
          {!isOwner && idea.convertedToProject && (
            <div className="card bg-green-50 border-green-200">
              <h2 className="text-lg font-semibold mb-2 text-green-800">Project Available</h2>
              <p className="text-sm text-green-700 mb-4">
                This idea has been converted to a project. You can request to join!
              </p>
              <Link to={`/projects/${idea.convertedToProject}`} className="btn-primary w-full flex items-center justify-center gap-2">
                <ArrowRight className="w-5 h-5" /> View Project
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default IdeaDetail;
