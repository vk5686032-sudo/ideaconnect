import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, FolderKanban, Users } from 'lucide-react';
import projectApi from '../../api/project.api';
import { PROJECT_STATUSES } from '../../utils/constants';

const Projects = () => {
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    page: 1,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['projects', filters],
    queryFn: () => projectApi.getAll(filters),
    keepPreviousData: true,
  });

  const projects = data?.data?.data || [];
  const pagination = data?.data?.pagination;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-8">
        <h1 className="text-2xl font-bold">Explore Projects</h1>
        <Link to="/projects/new" className="btn-primary flex items-center gap-2 justify-center">
          <Plus className="w-5 h-5" /> New Project
        </Link>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search projects..."
              className="input-field pl-10"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
            />
          </div>
          <select
            className="input-field"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
          >
            <option value="">All Statuses</option>
            {PROJECT_STATUSES.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
          <button
            onClick={() => setFilters({ search: '', status: '', page: 1 })}
            className="btn-secondary"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Projects Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto" />
        </div>
      ) : projects.length === 0 ? (
        <div className="card text-center py-12">
          <FolderKanban className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No projects found</h3>
          <p className="text-gray-600">Be the first to create a project!</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {projects.map((project) => (
            <Link key={project._id} to={`/projects/${project._id}`} className="card-hover">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <Users className="w-4 h-4" />
                  {project.members?.length || 0}
                </div>
              </div>
              <h3 className="font-semibold text-lg mb-2">{project.title}</h3>
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">{project.description}</p>
              <div className="mb-3">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-600">Progress</span>
                  <span className="font-medium">{project.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary-600 h-2 rounded-full transition-all"
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
              </div>
              {project.technologies?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {project.technologies.slice(0, 3).map((tech) => (
                    <span key={tech} className="badge bg-gray-100 text-gray-700">{tech}</span>
                  ))}
                  {project.technologies.length > 3 && (
                    <span className="badge bg-gray-100 text-gray-700">+{project.technologies.length - 3}</span>
                  )}
                </div>
              )}
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
                {project.owner?.avatar?.url ? (
                  <img src={project.owner.avatar.url} alt="" className="w-6 h-6 rounded-full" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-primary-100" />
                )}
                <span className="text-sm text-gray-600">{project.owner?.name}</span>
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

export default Projects;
