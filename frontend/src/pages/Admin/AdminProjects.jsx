import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Eye, Loader2, Users, Archive, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import adminApi from '../../api/admin.api';

const AdminProjects = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedProjects, setSelectedProjects] = useState([]);
  const [bulkAction, setBulkAction] = useState('');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-projects', search, statusFilter],
    queryFn: () => adminApi.getProjects({ search, status: statusFilter, limit: 50 }),
  });

  const projects = data?.data?.data || [];

  const statusStyles = {
    'in-progress': 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    planning: 'bg-gray-100 text-gray-700',
    'on-hold': 'bg-yellow-100 text-yellow-700',
    cancelled: 'bg-red-100 text-red-700',
  };

  const invalidate = () => {
    queryClient.invalidateQueries(['admin-projects']);
    queryClient.invalidateQueries(['admin-stats']);
  };

  const moderateMutation = useMutation({
    mutationFn: ({ id, action }) => adminApi.moderateProject(id, action),
    onSuccess: () => {
      invalidate();
      toast.success('Project moderated');
    },
    onError: () => toast.error('Failed to moderate project'),
  });

  const bulkMutation = useMutation({
    mutationFn: ({ ids, action }) => adminApi.bulkProjectAction(ids, action),
    onSuccess: (_, { action }) => {
      invalidate();
      toast.success(`Bulk ${action} completed`);
      setSelectedProjects([]);
      setBulkAction('');
    },
    onError: () => toast.error('Bulk action failed'),
  });

  const toggleSelectAll = () => {
    if (selectedProjects.length === projects.length) {
      setSelectedProjects([]);
    } else {
      setSelectedProjects(projects.map((p) => p._id));
    }
  };

  const toggleSelect = (id) => {
    setSelectedProjects((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleBulkAction = () => {
    if (!bulkAction || selectedProjects.length === 0) return;
    if (!window.confirm(`Apply "${bulkAction}" to ${selectedProjects.length} project(s)?`)) return;
    bulkMutation.mutate({ ids: selectedProjects, action: bulkAction });
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search projects..."
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
          <option value="planning">Planning</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="on-hold">On Hold</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto" />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          {selectedProjects.length > 0 && (
            <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-3 flex items-center justify-between">
              <span className="text-sm font-medium text-yellow-800">
                {selectedProjects.length} project(s) selected
              </span>
              <div className="flex items-center gap-2">
                <select
                  className="input-field py-1.5 text-sm w-auto"
                  value={bulkAction}
                  onChange={(e) => setBulkAction(e.target.value)}
                >
                  <option value="">Bulk action...</option>
                  <option value="archive">Archive</option>
                  <option value="delete">Delete</option>
                </select>
                <button
                  onClick={handleBulkAction}
                  disabled={!bulkAction}
                  className="btn-primary text-sm px-3 py-1.5 disabled:opacity-50"
                >
                  Apply
                </button>
              </div>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                  <th className="px-4 py-3 font-medium w-10">
                    <input
                      type="checkbox"
                      checked={selectedProjects.length === projects.length && projects.length > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-gray-300 text-primary-600"
                    />
                  </th>
                  <th className="px-4 py-3 font-medium">Project</th>
                  <th className="px-4 py-3 font-medium">Owner</th>
                  <th className="px-4 py-3 font-medium">Members</th>
                  <th className="px-4 py-3 font-medium">Progress</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {projects.map((p) => (
                  <tr key={p._id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedProjects.includes(p._id)}
                        onChange={() => toggleSelect(p._id)}
                        className="w-4 h-4 rounded border-gray-300 text-primary-600"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium line-clamp-1 max-w-[240px]">{p.title}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{p.owner?.name || 'Unknown'}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-gray-500">
                        <Users className="w-4 h-4" /> {p.members?.length || 0}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 w-32">
                        <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                          <div className="bg-primary-500 h-1.5 rounded-full" style={{ width: `${p.progress || 0}%` }} />
                        </div>
                        <span className="text-xs text-gray-500">{p.progress || 0}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${statusStyles[p.status] || 'bg-gray-100 text-gray-700'}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Link to={`/projects/${p._id}`} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg" title="View">
                          <Eye className="w-4 h-4" />
                        </Link>
                        {p.status !== 'cancelled' && (
                          <button
                            onClick={() => {
                              if (window.confirm('Archive this project?')) {
                                moderateMutation.mutate({ id: p._id, action: 'archive' });
                              }
                            }}
                            className="p-1.5 text-yellow-600 hover:bg-yellow-50 rounded-lg"
                            title="Archive"
                          >
                            <Archive className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (window.confirm('Delete this project permanently?')) {
                              moderateMutation.mutate({ id: p._id, action: 'delete' });
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
                {projects.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                      No projects found.
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

export default AdminProjects;