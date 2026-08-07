import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Archive, Trash2, Eye, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import adminApi from '../../api/admin.api';

const AdminIdeas = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-ideas', search, statusFilter],
    queryFn: () => adminApi.getIdeas({ search, status: statusFilter, limit: 50 }),
  });

  const ideas = data?.data?.data || [];

  const invalidate = () => {
    queryClient.invalidateQueries(['admin-ideas']);
    queryClient.invalidateQueries(['admin-stats']);
  };

  const moderateMutation = useMutation({
    mutationFn: ({ id, action }) => adminApi.moderateIdea(id, action),
    onSuccess: () => {
      invalidate();
      toast.success('Idea moderated');
    },
    onError: () => toast.error('Failed to moderate idea'),
  });

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search ideas..."
            className="input-field pl-9 py-2 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="input-field sm:w-44 py-2 text-sm"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All statuses</option>
          <option value="open">Open</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="archived">Archived</option>
          <option value="draft">Draft</option>
        </select>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto" />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                  <th className="px-4 py-3 font-medium">Idea</th>
                  <th className="px-4 py-3 font-medium">Author</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {ideas.map((idea) => (
                  <tr key={idea._id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <p className="font-medium line-clamp-1 max-w-[280px]">{idea.title}</p>
                      <p className="text-xs text-gray-500 line-clamp-1 max-w-[280px]">{idea.description}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{idea.author?.name || 'Unknown'}</td>
                    <td className="px-4 py-3">
                      <span className="badge-primary">{idea.category}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${
                        idea.status === 'archived' ? 'bg-red-100 text-red-700'
                        : idea.status === 'completed' ? 'bg-green-100 text-green-700'
                        : idea.status === 'draft' ? 'bg-gray-100 text-gray-700'
                        : 'bg-blue-100 text-blue-700'
                      }`}>
                        {idea.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Link to={`/ideas/${idea._id}`} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg" title="View">
                          <Eye className="w-4 h-4" />
                        </Link>
                        {idea.status !== 'archived' && (
                          <button
                            onClick={() => moderateMutation.mutate({ id: idea._id, action: 'archive' })}
                            className="p-1.5 text-yellow-600 hover:bg-yellow-50 rounded-lg"
                            title="Archive"
                          >
                            <Archive className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (window.confirm('Delete this idea permanently?')) {
                              moderateMutation.mutate({ id: idea._id, action: 'delete' });
                            }
                          }}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {ideas.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                      No ideas found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminIdeas;