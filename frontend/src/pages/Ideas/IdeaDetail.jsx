import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
  Star, MessageSquare, Eye, Bookmark, Share2, ThumbsUp,
  Wrench, Users, ArrowRight,
  Send, Trash2, Edit3,
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

  const isOwner = user?._id === idea.author?._id;
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

          {/* Convert to Project */}
          {isOwner && (
            <div className="card bg-primary-50 border-primary-200">
              <h2 className="text-lg font-semibold mb-2">Ready to Build?</h2>
              <p className="text-sm text-gray-600 mb-4">
                Convert this idea into a project and start collaborating.
              </p>
              <Link to={`/projects/new?idea=${idea._id}`} className="btn-primary w-full flex items-center justify-center gap-2">
                <ArrowRight className="w-5 h-5" /> Convert to Project
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default IdeaDetail;
