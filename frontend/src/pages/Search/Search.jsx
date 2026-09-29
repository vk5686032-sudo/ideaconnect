import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Search as SearchIcon, Lightbulb, FolderKanban, Users,
} from 'lucide-react';
import api from '../../api/axios';
import useDebounce from '../../hooks/useDebounce';

const fetchSearch = async (query, type) => {
  if (!query) return [];

  if (type === 'users') {
    const res = await api.get(`/users?search=${query}&limit=20`);
    return (res.data.data || []).map((u) => ({ ...u, _searchType: 'user' }));
  }

  if (type === 'projects') {
    const res = await api.get(`/projects?search=${query}&limit=20`);
    return (res.data.data || []).map((p) => ({ ...p, _searchType: 'project' }));
  }

  if (type === 'ideas') {
    const res = await api.get(`/ideas?search=${query}&limit=20`);
    return (res.data.data || []).map((i) => ({ ...i, _searchType: 'idea' }));
  }

  // type === 'all' — search all three in parallel
  const [ideasRes, projectsRes, usersRes] = await Promise.allSettled([
    api.get(`/ideas?search=${query}&limit=10`),
    api.get(`/projects?search=${query}&limit=10`),
    api.get(`/users?search=${query}&limit=10`),
  ]);

  const ideas = (ideasRes.status === 'fulfilled' ? ideasRes.value.data.data : []).map((i) => ({ ...i, _searchType: 'idea' }));
  const projects = (projectsRes.status === 'fulfilled' ? projectsRes.value.data.data : []).map((p) => ({ ...p, _searchType: 'project' }));
  const users = (usersRes.status === 'fulfilled' ? usersRes.value.data.data : []).map((u) => ({ ...u, _searchType: 'user' }));

  return [...ideas, ...projects, ...users];
};

const Search = () => {
  const [query, setQuery] = useState('');
  const [type, setType] = useState('all');
  // Was a hand-rolled useState + setTimeout; now shares hooks/useDebounce.js
  // with the Ideas and Projects feeds.
  const debouncedQuery = useDebounce(query);

  const { data: results, isFetching } = useQuery({
    queryKey: ['search', debouncedQuery, type],
    queryFn: () => fetchSearch(debouncedQuery, type),
    enabled: debouncedQuery.length > 0,
  });

  const totalResults = results?.length || 0;

  const renderResult = (item) => {
    const type = item._searchType;

    if (type === 'user') {
      return (
        <Link key={`user-${item._id}`} to={`/users/${item._id}`} className="card-hover flex gap-4">
          <div className="w-16 h-16 rounded-lg flex items-center justify-center flex-shrink-0 bg-green-100">
            <Users className="w-8 h-8 text-green-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-lg line-clamp-1">{item.name}</h3>
              <span className="badge-success text-xs">User</span>
            </div>
            <p className="text-gray-500 text-sm">{item.email}</p>
            {item.skills?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {item.skills.slice(0, 5).map((s) => (
                  <span key={s} className="badge bg-gray-100 text-gray-600 text-xs">{s}</span>
                ))}
              </div>
            )}
          </div>
        </Link>
      );
    }

    if (type === 'project') {
      return (
        <Link key={`project-${item._id}`} to={`/projects/${item._id}`} className="card-hover flex gap-4">
          <div className="w-16 h-16 rounded-lg flex items-center justify-center flex-shrink-0 bg-blue-100">
            <FolderKanban className="w-8 h-8 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-lg line-clamp-1">{item.title}</h3>
              <span className="badge bg-blue-100 text-blue-700 text-xs">Project</span>
            </div>
            <p className="text-gray-600 text-sm line-clamp-2">{item.description}</p>
            <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
              <span>{item.owner?.name}</span>
              <span>{item.members?.length || 0} members</span>
              <span className={`badge ${
                item.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
              }`}>{item.status}</span>
            </div>
          </div>
        </Link>
      );
    }

    // idea (default)
    return (
      <Link key={`idea-${item._id}`} to={`/ideas/${item._id}`} className="card-hover flex gap-4">
        <div className="w-16 h-16 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <Lightbulb className="w-8 h-8 text-primary-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-lg line-clamp-1">{item.title}</h3>
            <span className="badge-primary text-xs">Idea</span>
          </div>
          <p className="text-gray-600 text-sm line-clamp-2">{item.description}</p>
          <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
            <span className="badge-primary text-xs">{item.category}</span>
            <span>{item.author?.name}</span>
          </div>
        </div>
      </Link>
    );
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-8">Search</h1>

      {/* Search bar + type filter */}
      <div className="card mb-6">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search ideas, projects, or users..."
              className="input-field pl-10"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
          </div>
          <select
            className="input-field sm:w-44"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="all">All</option>
            <option value="ideas">Ideas</option>
            <option value="projects">Projects</option>
            <option value="users">Users</option>
          </select>
        </div>
      </div>

      {/* Results count */}
      {debouncedQuery && !isFetching && totalResults > 0 && (
        <p className="text-sm text-gray-500 mb-4">
          {totalResults} result{totalResults !== 1 ? 's' : ''} for "{debouncedQuery}"
        </p>
      )}

      {/* Loading */}
      {isFetching && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto" />
        </div>
      )}

      {/* No results */}
      {debouncedQuery && !isFetching && totalResults === 0 && (
        <div className="card text-center py-12">
          <SearchIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No results found</h3>
          <p className="text-gray-600">Try different keywords or filters</p>
        </div>
      )}

      {/* Results */}
      {totalResults > 0 && (
        <div className="space-y-3">
          {results.map((item) => renderResult(item))}
        </div>
      )}

      {/* Empty state */}
      {!debouncedQuery && (
        <div className="card text-center py-12">
          <SearchIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">What are you looking for?</h3>
          <p className="text-gray-600 text-sm">Search across ideas, projects, and users</p>
        </div>
      )}
    </div>
  );
};

export default Search;