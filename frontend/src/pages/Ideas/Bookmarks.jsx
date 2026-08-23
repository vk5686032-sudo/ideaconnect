import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Bookmark, Star, MessageSquare, Eye, Lightbulb } from 'lucide-react';
import BackButton from '../../components/common/BackButton';
import ideaApi from '../../api/idea.api';

const Bookmarks = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['my-bookmarks'],
    queryFn: () => ideaApi.getBookmarks(),
  });

  const ideas = data?.data?.data || [];

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-4">
        <BackButton />
      </div>
      <div className="flex items-center gap-2 mb-8">
        <Bookmark className="w-6 h-6 text-primary-600" />
        <h1 className="text-2xl font-bold">Saved Ideas</h1>
        {ideas.length > 0 && (
          <span className="badge bg-primary-100 text-primary-700">{ideas.length}</span>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto" />
        </div>
      ) : ideas.length === 0 ? (
        <div className="card text-center py-12">
          <Lightbulb className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No saved ideas yet</h3>
          <p className="text-gray-600 mb-4">Bookmark ideas you like and they'll show up here.</p>
          <Link to="/ideas" className="btn-primary">
            Browse Ideas
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ideas.map((idea) => (
            <Link key={idea._id} to={`/ideas/${idea._id}`} className="card-hover">
              <div className="flex items-center gap-2 mb-3">
                <span className="badge-primary">{idea.category}</span>
                <span className={`badge ${idea.status === 'open' ? 'badge-success' : 'badge-warning'}`}>
                  {idea.status}
                </span>
              </div>
              <h3 className="font-semibold text-lg mb-2 line-clamp-2">{idea.title}</h3>
              <p className="text-gray-600 text-sm line-clamp-3 mb-4">{idea.description}</p>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4" /> {idea.likes?.length || 0}
                </div>
                <div className="flex items-center gap-1">
                  <MessageSquare className="w-4 h-4" /> {idea.commentsCount || 0}
                </div>
                <div className="flex items-center gap-1">
                  <Eye className="w-4 h-4" /> {idea.views || 0}
                </div>
              </div>
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
                {idea.author?.avatar?.url ? (
                  <img src={idea.author.avatar.url} alt="" className="w-6 h-6 rounded-full" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-primary-100" />
                )}
                <span className="text-sm text-gray-600">{idea.author?.name}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Bookmarks;
