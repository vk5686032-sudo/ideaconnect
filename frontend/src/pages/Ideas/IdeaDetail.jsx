import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
  Star, MessageSquare, Eye, Bookmark, Share2, ThumbsUp,
  Wrench, Users, ArrowRight,
  Send, Trash2, Edit3, Check, X, Send as SendIcon, GraduationCap,
  Sparkles, Heart, Pencil, AlertTriangle, Flag, UserPlus, UserMinus, Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import BackButton from '../../components/common/BackButton';
import ReportModal from '../../components/reports/ReportModal';
import ideaApi from '../../api/idea.api';
import aiApi from '../../api/ai.api';
import userApi from '../../api/user.api';
import useAuthStore from '../../store/authSlice';

const StarRating = ({ value, onChange }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((star) => (
      <button
        key={star}
        type="button"
        onClick={() => onChange?.(star)}
        // Icon-only, so without these they have no accessible name at all.
        aria-label={onChange ? `Rate ${star} of 5` : `${value} of 5 stars`}
        title={onChange ? `Rate ${star} of 5` : undefined}
        className={`p-0.5 ${onChange ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}
      >
        <Star className={`w-5 h-5 ${star <= value ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
      </button>
    ))}
  </div>
);

const IdeaDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuthStore();
  const [comment, setComment] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(0);
  const [isEditingReview, setIsEditingReview] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState(null);
  // Deleting a comment used to fire immediately on a single click, with no way
  // back. The idea delete has always confirmed first; this matches it.
  const [confirmDeleteCommentId, setConfirmDeleteCommentId] = useState(null);
  const [editedContent, setEditedContent] = useState('');
  const [showDeleteIdea, setShowDeleteIdea] = useState(false);
  // Set only when the clipboard is unavailable, so Share is never a dead end.
  const [shareFallbackUrl, setShareFallbackUrl] = useState('');
  const [reportOpen, setReportOpen] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [reportingCommentId, setReportingCommentId] = useState(null);

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

  // Mentor reviews
  const mentorReviews = idea?.mentorReviews || [];
  const isEligibleMentor =
    isAuthenticated &&
    ((user?.role === 'mentor' && user?.isMentorApproved) || user?.role === 'admin');
  const myReview = mentorReviews.find((r) => r.mentor?._id === user?._id);

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

  const editCommentMutation = useMutation({
    mutationFn: ({ commentId, content }) => ideaApi.updateComment(commentId, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries(['comments', id]);
      setEditingCommentId(null);
      setEditedContent('');
      toast.success('Comment updated');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update comment');
    },
  });

  const likeCommentMutation = useMutation({
    mutationFn: (commentId) => ideaApi.likeComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries(['comments', id]);
    },
  });

  // Share. This button previously had no onClick at all, so it did nothing.
  // Web Share API where the browser has it, copy-to-clipboard everywhere else —
  // which is every desktop browser that does not implement it, and every
  // browser where the user has dismissed it.
  const shareUrl = `${window.location.origin}/ideas/${id}`;
  const handleShare = async () => {
    const payload = { title: idea?.title || 'Idea on IdeaConnect', url: shareUrl };
    try {
      if (navigator.share) {
        await navigator.share(payload);
        return;
      }
      throw new Error('no share');
    } catch (error) {
      // AbortError means the user dismissed the sheet, which is not a failure.
      if (error?.name === 'AbortError') return;
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Link copied to clipboard');
    } catch {
      // Clipboard can be blocked (insecure context, permissions). Fall back to
      // showing the URL so the button is never a dead end.
      setShareFallbackUrl(shareUrl);
    }
  };

  // Delete idea (owner or admin)
  const deleteIdeaMutation = useMutation({
    mutationFn: () => ideaApi.delete(id),
    onSuccess: () => {
      toast.success('Idea deleted');
      navigate('/ideas');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete idea');
    },
  });

  // AI features
  const analyzeMutation = useMutation({
    mutationFn: () => aiApi.analyzeIdea(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['idea', id]);
      toast.success('AI analysis complete!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'AI analysis failed');
    },
  });

  // Team management (owner)
  const inviteMutation = useMutation({
    mutationFn: ({ userId, message }) => ideaApi.inviteToTeam(id, { userId, message }),
    onSuccess: () => {
      queryClient.invalidateQueries(['idea', id]);
      toast.success('Invitation sent!');
      setShowInviteModal(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to send invitation');
    },
  });

  const removeTeamMemberMutation = useMutation({
    mutationFn: (userId) => ideaApi.removeTeamMember(id, userId),
    onSuccess: () => {
      queryClient.invalidateQueries(['idea', id]);
      toast.success('Member removed');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to remove member');
    },
  });

  const { data: similarData } = useQuery({
    queryKey: ['similar-ideas', id],
    queryFn: () => aiApi.getSimilarIdeas(id),
    enabled: !!id,
  });
  const similarIdeas = similarData?.data?.data || [];

  const { data: teammatesData } = useQuery({
    queryKey: ['suggested-teammates', id],
    queryFn: () => aiApi.suggestTeammates(id),
    enabled: isOwner && !!id,
  });
  const suggestedTeammates = teammatesData?.data?.data || [];

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

  // Mentor review mutations
  const reviewMutation = useMutation({
    mutationFn: (data) => ideaApi.addMentorReview(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['idea', id]);
      toast.success(myReview ? 'Review updated' : 'Review submitted');
      setIsEditingReview(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to submit review');
    },
  });

  const deleteReviewMutation = useMutation({
    mutationFn: () => ideaApi.deleteMentorReview(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['idea', id]);
      setReviewText('');
      setReviewRating(0);
      setIsEditingReview(false);
      toast.success('Review deleted');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete review');
    },
  });

  const submitReview = () => {
    if (reviewText.trim().length < 10 || !reviewRating) {
      toast.error('Please add a rating and at least 10 characters of feedback');
      return;
    }
    reviewMutation.mutate({ review: reviewText, rating: reviewRating });
  };

  const startEditingReview = () => {
    setRatingFromMyReview();
    setIsEditingReview(true);
  };

  const setRatingFromMyReview = () => {
    if (myReview) {
      setReviewRating(myReview.rating);
      setReviewText(myReview.review);
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
              {idea.visibility === 'invite-only' && <span className="badge-warning">Invite Only</span>}
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
              <button
                onClick={handleShare}
                title="Share this idea"
                aria-label="Share this idea"
                className="flex items-center gap-1 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200"
              >
                <Share2 className="w-5 h-5" />
                Share
              </button>
              {!isOwner && (
                <button
                  onClick={() => setReportOpen(true)}
                  className="flex items-center gap-1 px-4 py-2 rounded-lg bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-600"
                  title="Report this idea"
                >
                  <Flag className="w-5 h-5" />
                </button>
              )}
              {isOwner && (
                <>
                  {/* The edit route and CreateIdea's prefill both already existed;
                      only this link was missing, so an owner had no way to reach
                      them. Projects have had theirs all along. */}
                  <button
                    onClick={() => navigate(`/ideas/${id}/edit`)}
                    className="flex items-center gap-1 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700"
                  >
                    <Edit3 className="w-5 h-5" /> Edit
                  </button>
                  <button
                    onClick={() => setShowDeleteIdea(!showDeleteIdea)}
                    className="flex items-center gap-1 px-4 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100"
                  >
                    <Trash2 className="w-5 h-5" /> Delete
                  </button>
                </>
              )}
              <span className="ml-auto flex items-center gap-1 text-sm text-gray-500">
                <Eye className="w-4 h-4" /> {idea.views || 0} views
              </span>
            </div>

            {shareFallbackUrl && (
              <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-3">
                <p className="text-sm text-gray-600 flex-1">Copy this link:</p>
                <input
                  readOnly
                  value={shareFallbackUrl}
                  onFocus={(e) => e.target.select()}
                  className="input-field text-xs flex-1 font-mono"
                  aria-label="Share link"
                />
                <button
                  onClick={() => setShareFallbackUrl('')}
                  className="btn-outline text-xs px-3 py-1.5"
                >
                  Close
                </button>
              </div>
            )}

            {showDeleteIdea && isOwner && (
              <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-3">
                <p className="text-sm text-gray-600 flex items-center gap-1 flex-1">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  Permanently delete this idea and its comments?
                </p>
                <button
                  onClick={() => deleteIdeaMutation.mutate()}
                  disabled={deleteIdeaMutation.isPending}
                  className="px-3 py-1.5 text-xs font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {deleteIdeaMutation.isPending ? 'Deleting...' : 'Yes, delete'}
                </button>
                <button onClick={() => setShowDeleteIdea(false)} className="btn-outline text-xs px-3 py-1.5">
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* Mentor Reviews */}
          <div className="card mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <GraduationCap className="w-5 h-5" /> Mentor Reviews ({mentorReviews.length})
              </h2>
              {isEligibleMentor && !isOwner && myReview && !isEditingReview && (
                <button
                  onClick={startEditingReview}
                  className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
                >
                  <Edit3 className="w-4 h-4" /> Edit
                </button>
              )}
            </div>

            {/* Review form (eligible mentors only) */}
            {isEligibleMentor && !isOwner && (isEditingReview || !myReview) && (
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                {myReview && (
                  <p className="text-sm text-gray-600 mb-2">Editing your review</p>
                )}
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-sm font-medium text-gray-700">Your rating:</span>
                  <StarRating value={reviewRating} onChange={setReviewRating} />
                </div>
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  rows={3}
                  placeholder="Share your expert feedback on feasibility, innovation, and market potential..."
                  className="input-field"
                />
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={submitReview}
                    disabled={reviewMutation.isPending}
                    className="btn-primary flex items-center gap-2 text-sm disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    {reviewMutation.isPending ? 'Submitting...' : myReview ? 'Update Review' : 'Submit Review'}
                  </button>
                  {isEditingReview && (
                    <button
                      onClick={() => setIsEditingReview(false)}
                      className="btn-outline text-sm"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Reviews list */}
            <div className="space-y-4">
              {mentorReviews.map((review) => (
                <div key={(review.mentor?._id) || review._id} className="flex gap-3">
                  {review.mentor?.avatar?.url ? (
                    <img src={review.mentor.avatar.url} alt="" className="w-8 h-8 rounded-full flex-shrink-0" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <GraduationCap className="w-4 h-4 text-green-600" />
                    </div>
                  )}
                  <div className="flex-1 bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-medium text-sm">{review.mentor?.name}</span>
                      <span className="badge-success text-[10px]">Mentor</span>
                      <span className="text-xs text-gray-400">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                      {user?._id === review.mentor?._id && (
                        <button
                          onClick={() => {
                            if (window.confirm('Delete your review?')) deleteReviewMutation.mutate();
                          }}
                          disabled={deleteReviewMutation.isPending}
                          className="ml-auto -mr-1 p-2 text-gray-400 hover:text-red-500 rounded-lg active:bg-red-50 disabled:opacity-50"
                          title="Delete review"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <StarRating value={review.rating} />
                    <p className="text-sm text-gray-700 mt-1">{review.review}</p>
                  </div>
                </div>
              ))}
              {mentorReviews.length === 0 && !isEligibleMentor && (
                <p className="text-sm text-gray-500">No mentor reviews yet.</p>
              )}
              {mentorReviews.length === 0 && isEligibleMentor && isOwner && (
                <p className="text-sm text-gray-500">No mentor reviews yet. Share your idea to get expert feedback!</p>
              )}
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
              {comments.map((comment) => {
                const isOwnComment = user?._id === comment.author?._id;
                const isCommentLiked = comment.likes?.includes(user?._id);
                return (
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
                          {comment.isEdited ? ' (edited)' : ''}
                        </span>
                      </div>
                      {editingCommentId === comment._id ? (
                        <div className="space-y-2">
                          <textarea
                            value={editedContent}
                            onChange={(e) => setEditedContent(e.target.value)}
                            rows={2}
                            className="input-field text-sm"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => editCommentMutation.mutate({ commentId: comment._id, content: editedContent })}
                              disabled={!editedContent.trim() || editCommentMutation.isPending}
                              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                            >
                              <Check className="w-3 h-3" /> Save
                            </button>
                            <button onClick={() => setEditingCommentId(null)} className="px-3 py-1.5 text-xs font-medium bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="text-sm text-gray-700">{comment.content}</p>
                          <div className="flex items-center gap-1 mt-2 -mb-1">
                            {isAuthenticated && (
                              <button
                                onClick={() => likeCommentMutation.mutate(comment._id)}
                                className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors ${
                                  isCommentLiked ? 'text-red-500 bg-red-50' : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                                }`}
                              >
                                <Heart className={`w-3.5 h-3.5 ${isCommentLiked ? 'fill-red-500' : ''}`} />
                                {comment.likes?.length || 0}
                              </button>
                            )}
                            {isOwnComment && (
                              <>
                                <button
                                  onClick={() => {
                                    setEditingCommentId(comment._id);
                                    setEditedContent(comment.content);
                                  }}
                                  className="flex items-center gap-1 px-2 py-1 rounded-md text-xs text-gray-400 hover:text-primary-600 hover:bg-primary-50"
                                >
                                  <Pencil className="w-3.5 h-3.5" /> Edit
                                </button>
                                <button
                                  onClick={() => setConfirmDeleteCommentId(comment._id)}
                                  className="p-2 text-gray-400 hover:text-red-500 rounded-lg active:bg-red-50"
                                  title="Delete comment"
                                  aria-label="Delete comment"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                                {confirmDeleteCommentId === comment._id && (
                                  <span className="flex items-center gap-1 text-xs text-red-600">
                                    Delete this comment?
                                    <button
                                      onClick={() => {
                                        setConfirmDeleteCommentId(null);
                                        deleteCommentMutation.mutate(comment._id);
                                      }}
                                      disabled={deleteCommentMutation.isPending}
                                      className="px-2 py-1 font-medium bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                                    >
                                      {deleteCommentMutation.isPending ? 'Deleting...' : 'Yes, delete'}
                                    </button>
                                    <button
                                      onClick={() => setConfirmDeleteCommentId(null)}
                                      className="px-2 py-1 font-medium bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                                    >
                                      Cancel
                                    </button>
                                  </span>
                                )}
                              </>
                            )}
                            {!isOwnComment && isAuthenticated && (
                              <button
                                onClick={() => setReportingCommentId(comment._id)}
                                className="p-2 text-gray-300 hover:text-red-500 rounded-lg hover:bg-red-50"
                                title="Report comment"
                              >
                                <Flag className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Team */}
          {(idea.team?.length > 0 || isOwner) && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Team Members</h2>
                {isOwner && (
                  <button
                    onClick={() => setShowInviteModal(true)}
                    className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1"
                  >
                    <UserPlus className="w-3.5 h-3.5" /> Invite
                  </button>
                )}
              </div>
              {idea.team?.length > 0 ? (
                <div className="space-y-3">
                  {idea.team.map((member) => (
                    <div key={member.user?._id} className="flex items-center gap-3">
                      {member.user?.avatar?.url ? (
                        <img src={member.user.avatar.url} alt="" className="w-8 h-8 rounded-full" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                          <Users className="w-4 h-4 text-primary-600" />
                        </div>
                      )}
                      <Link to={`/users/${member.user?._id}`} className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{member.user?.name}</p>
                        <p className="text-xs text-gray-500 capitalize">{member.role || 'member'}</p>
                      </Link>
                      {isOwner && member.user?._id !== user?._id && (
                        <button
                          onClick={() => {
                            if (window.confirm(`Remove ${member.user?.name} from the team?`)) {
                              removeTeamMemberMutation.mutate(member.user._id);
                            }
                          }}
                          disabled={removeTeamMemberMutation.isPending}
                          className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 disabled:opacity-50"
                          title="Remove from team"
                        >
                          <UserMinus className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  No team members yet.{idea.visibility === 'invite-only' ? ' Invite people so they can view and join this idea.' : ''}
                </p>
              )}
            </div>
          )}

          {/* AI Insights */}
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-500" /> AI Insights
              </h2>
              {isOwner && (
                <button
                  onClick={() => analyzeMutation.mutate()}
                  disabled={analyzeMutation.isPending}
                  className="text-xs font-medium px-3 py-1.5 rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-100 disabled:opacity-50 flex items-center gap-1"
                >
                  {analyzeMutation.isPending ? (
                    <Sparkles className="w-3 h-3 animate-spin" />
                  ) : idea.aiAnalysis?.analyzedAt ? (
                    <><Sparkles className="w-3 h-3" /> Re-analyze</>
                  ) : (
                    <><Sparkles className="w-3 h-3" /> Analyze</>
                  )}
                </button>
              )}
            </div>

            {idea.aiAnalysis?.analyzedAt ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-purple-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-600">Feasibility</p>
                    {/* Scores are 0-100: the Mongoose model pins min 0 / max 100
                        and the service prompt asks for 0-100. This used to read
                        "/10", which rendered the mock's 75 as "75/10". */}
                    <p className="text-xl font-bold text-purple-600">{idea.feasibilityScore ?? '—'}/100</p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-600">Innovation</p>
                    <p className="text-xl font-bold text-blue-600">{idea.innovationScore ?? '—'}/100</p>
                  </div>
                </div>

                {idea.aiAnalysis.suggestions?.length > 0 && (
                  <div>
                    <h3 className="font-medium text-sm mb-1.5">Suggestions</h3>
                    <ul className="space-y-1">
                      {idea.aiAnalysis.suggestions.map((s, i) => (
                        <li key={i} className="text-xs text-gray-600 flex gap-1.5">
                          <span className="text-purple-400 mt-0.5">•</span> {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {idea.aiAnalysis.challenges?.length > 0 && (
                  <div>
                    <h3 className="font-medium text-sm mb-1.5">Challenges</h3>
                    <ul className="space-y-1">
                      {idea.aiAnalysis.challenges.map((c, i) => (
                        <li key={i} className="text-xs text-gray-600 flex gap-1.5">
                          <span className="text-orange-400 mt-0.5">▲</span> {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {idea.aiAnalysis.recommendedTechnologies?.length > 0 && (
                  <div>
                    <h3 className="font-medium text-sm mb-1.5">Recommended Tech</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {idea.aiAnalysis.recommendedTechnologies.map((t) => (
                        <span key={t} className="badge bg-gray-100 text-gray-600 text-[10px]">{t}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                {isOwner
                  ? 'Run an AI analysis to get feasibility scores, suggestions, and challenge breakdowns.'
                  : 'No analysis yet.'}
              </p>
            )}

            {/* Similar ideas */}
            {similarIdeas.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <h3 className="font-medium text-sm mb-2">Similar Ideas</h3>
                <div className="space-y-1.5">
                  {similarIdeas.slice(0, 3).map((s) => (
                    <Link
                      key={s.idea?._id || s._id}
                      to={`/ideas/${s.idea?._id || s._id}`}
                      className="block text-xs text-primary-600 hover:text-primary-700 truncate"
                    >
                      → {(s.idea?.title) || s.title} {s.similarityScore ? `(${Math.round(s.similarityScore)}%)` : ''}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Suggested teammates */}
            {isOwner && suggestedTeammates.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <h3 className="font-medium text-sm mb-2">Suggested Teammates</h3>
                <div className="space-y-2">
                  {suggestedTeammates.slice(0, 3).map((m) => (
                    <Link key={m.user?._id || m._id} to={`/users/${m.user?._id || m._id}`} className="flex items-center gap-2 group">
                      {m.user?.avatar?.url ? (
                        <img src={m.user.avatar.url} alt="" className="w-6 h-6 rounded-full" />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center">
                          <Users className="w-3 h-3 text-primary-600" />
                        </div>
                      )}
                      <span className="text-xs font-medium group-hover:text-primary-600 truncate">{m.user?.name || m.name}</span>
                      {m.matchReason && <span className="text-[10px] text-gray-400 truncate hidden sm:inline">{m.matchReason}</span>}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

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

      {/* Report dialog */}
      {reportOpen && (
        <ReportModal
          targetType="idea"
          targetId={id}
          targetLabel={idea.title}
          onClose={() => setReportOpen(false)}
        />
      )}

      {/* Comment report dialog */}
      {reportingCommentId && (
        <ReportModal
          targetType="comment"
          targetId={reportingCommentId}
          targetLabel="a comment on this idea"
          onClose={() => setReportingCommentId(null)}
        />
      )}

      {/* Invite-to-team modal (owner) */}
      {showInviteModal && (
        <InviteUserModal
          excludeIds={[...(idea.team || []).map((m) => m.user?._id), idea.author?._id, user?._id]}
          onClose={() => setShowInviteModal(false)}
          onPick={(u) => {
            const message = prompt(`Optional message for ${u.name}:`);
            if (message !== null) inviteMutation.mutate({ userId: u._id, message });
          }}
          isSubmitting={inviteMutation.isPending}
        />
      )}
    </div>
  );
};

// Lightweight user-search picker used by the team invite flow
const InviteUserModal = ({ excludeIds = [], onClose, onPick, isSubmitting }) => {
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['invite-user-search', search],
    queryFn: () => userApi.getAll({ limit: 10, search }),
  });

  const candidates = (data?.data?.data || []).filter(
    (u) => !excludeIds.includes(u._id)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-xl max-w-md w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h3 className="font-semibold flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary-600" /> Invite to Team
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="p-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users by name..."
            className="input-field mb-3"
            autoFocus
          />
          {isLoading ? (
            <div className="text-center py-6">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary-500" />
            </div>
          ) : candidates.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-6">No users found</p>
          ) : (
            <div className="space-y-1">
              {candidates.map((u) => (
                <button
                  key={u._id}
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => onPick(u)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-primary-50 text-left disabled:opacity-50"
                >
                  {u.avatar?.url ? (
                    <img src={u.avatar.url} alt="" className="w-8 h-8 rounded-full" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                      <Users className="w-4 h-4 text-primary-600" />
                    </div>
                  )}
                  <span className="text-sm font-medium">{u.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default IdeaDetail;
