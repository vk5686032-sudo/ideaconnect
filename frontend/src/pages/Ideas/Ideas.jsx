import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Star, MessageSquare, Eye } from 'lucide-react';
import ideaApi from '../../api/idea.api';
import { CATEGORIES, IDEA_STATUSES, SORT_OPTIONS } from '../../utils/constants';
import useDebounce from '../../hooks/useDebounce';

const Ideas = () => {
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    status: '',
    sort: 'newest',
    page: 1,
  });

  // The text box updates filters.search immediately so typing stays responsive,
  // but the query reads the debounced copy — otherwise every prefix ("M", "Me",
  // "Med", ...) becomes its own request.
  const debouncedSearch = useDebounce(filters.search);

  const { data, isLoading } = useQuery({
    queryKey: ['ideas', { ...filters, search: debouncedSearch }],
    queryFn: () => ideaApi.getAll({ ...filters, search: debouncedSearch }),
    keepPreviousData: true,
  });

  const ideas = data?.data?.data || [];
  const pagination = data?.data?.pagination;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-8">
        <h1 className="text-2xl font-bold">Browse Ideas</h1>
        <Link to="/ideas/new" className="btn-primary flex items-center gap-2 justify-center">
          <Plus className="w-5 h-5" /> New Idea
        </Link>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search ideas..."
              className="input-field pl-10"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
            />
          </div>
          <select
            className="input-field"
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value, page: 1 })}
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
          <select
            className="input-field"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
          >
            <option value="">All Statuses</option>
            {IDEA_STATUSES.filter((s) => s.value !== 'draft').map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <select
            className="input-field"
            value={filters.sort}
            onChange={(e) => setFilters({ ...filters, sort: e.target.value, page: 1 })}
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <button
            onClick={() => setFilters({ search: '', category: '', status: '', sort: 'newest', page: 1 })}
            className="btn-secondary"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Ideas Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto" />
        </div>
      ) : ideas.length === 0 ? (
        <div className="card text-center py-12">
          <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No ideas found</h3>
          <p className="text-gray-600">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ideas.map((idea) => (
            <Link key={idea._id} to={`/ideas/${idea._id}`} className="card-hover">
              <div className="flex items-center gap-2 mb-3">
                <span className="badge-primary">{idea.category}</span>
                <span className={`badge ${idea.status === 'open' ? 'badge-success' : idea.status === 'completed' ? 'badge-success' : 'badge-warning'}`}>
                  {idea.status}
                </span>
              </div>
              <h3 className="font-semibold text-lg mb-2 line-clamp-2">{idea.title}</h3>
              <p className="text-gray-600 text-sm line-clamp-3 mb-4">{idea.description}</p>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4" />
                  {idea.likes?.length || 0}
                </div>
                <div className="flex items-center gap-1">
                  <MessageSquare className="w-4 h-4" />
                  {idea.commentsCount || 0}
                </div>
                <div className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  {idea.views || 0}
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

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-8">
          <button
            onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
            disabled={filters.page === 1}
            className="btn-secondary disabled:opacity-50 flex-1 sm:flex-none"
          >
            Previous
          </button>
          <span className="px-2 sm:px-4 py-2 text-sm sm:text-base">
            Page {filters.page} of {pagination.pages}
          </span>
          <button
            onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
            disabled={filters.page === pagination.pages}
            className="btn-secondary disabled:opacity-50 flex-1 sm:flex-none"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default Ideas;
