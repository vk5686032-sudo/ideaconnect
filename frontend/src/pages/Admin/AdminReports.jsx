import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, AlertCircle, Eye, Archive, Trash2, XCircle, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import adminApi from '../../api/admin.api';
import { timeSince } from '../../utils/helpers';

const AdminReports = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-reports', search, statusFilter],
    queryFn: () => adminApi.getReports({ search, status: statusFilter, limit: 50 }),
  });

  const reports = data?.data?.data || [];

  const invalidate = () => {
    queryClient.invalidateQueries(['admin-reports']);
    queryClient.invalidateQueries(['admin-stats']);
  };

  const resolveMutation = useMutation({
    mutationFn: ({ id, action, note }) => adminApi.resolveReport(id, action, note),
    onSuccess: () => {
      invalidate();
      toast.success('Report resolved');
    },
    onError: () => toast.error('Failed to resolve report'),
  });

  const getReportType = (report) => {
    if (report.relatedIdea) return { type: 'Idea', title: report.relatedIdea.title, link: `/ideas/${report.relatedIdea._id}` };
    if (report.relatedProject) return { type: 'Project', title: report.relatedProject.title, link: `/projects/${report.relatedProject._id}` };
    return { type: 'Unknown', title: 'Unknown content', link: '#' };
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search reports..."
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
          <option value="">All</option>
          <option value="pending">Pending</option>
          <option value="resolved">Resolved</option>
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
                  <th className="px-4 py-3 font-medium">Report</th>
                  <th className="px-4 py-3 font-medium">Reported By</th>
                  <th className="px-4 py-3 font-medium">Content</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {reports.map((report) => {
                  const content = getReportType(report);
                  return (
                    <tr key={report._id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-5 h-5 text-red-500" />
                          <span className="font-medium text-sm">{report.title}</span>
                        </div>
                        <p className="text-xs text-gray-500 line-clamp-1 max-w-xs mt-0.5">{report.message}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium">{report.sender?.name || 'Unknown'}</p>
                          <p className="text-xs text-gray-500">{report.sender?.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {content.link !== '#' ? (
                          <Link to={content.link} className="text-primary-600 hover:underline">
                            {content.type}: {content.title}
                          </Link>
                        ) : (
                          <span className="text-gray-500">{content.type}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`badge ${report.resolved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {report.resolved ? 'Resolved' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                        {timeSince(report.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          {report.relatedIdea && (
                            <Link to={`/ideas/${report.relatedIdea._id}`} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg" title="View idea">
                              <Eye className="w-4 h-4" />
                            </Link>
                          )}
                          {report.relatedProject && (
                            <Link to={`/projects/${report.relatedProject._id}`} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg" title="View project">
                              <Eye className="w-4 h-4" />
                            </Link>
                          )}
                          {!report.resolved && (
                            <>
                              {report.relatedIdea && (
                                <button
                                  onClick={() => {
                                    if (window.confirm('Archive this idea?')) {
                                      resolveMutation.mutate({ id: report._id, action: 'archive-idea' });
                                    }
                                  }}
                                  className="p-1.5 text-yellow-600 hover:bg-yellow-50 rounded-lg"
                                  title="Archive idea"
                                >
                                  <Archive className="w-4 h-4" />
                                </button>
                              )}
                              {report.relatedIdea && (
                                <button
                                  onClick={() => {
                                    if (window.confirm('Delete this idea permanently?')) {
                                      resolveMutation.mutate({ id: report._id, action: 'delete-idea' });
                                    }
                                  }}
                                  className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                                  title="Delete idea"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                              {report.relatedProject && (
                                <button
                                  onClick={() => {
                                    if (window.confirm('Archive this project?')) {
                                      resolveMutation.mutate({ id: report._id, action: 'archive-project' });
                                    }
                                  }}
                                  className="p-1.5 text-yellow-600 hover:bg-yellow-50 rounded-lg"
                                  title="Archive project"
                                >
                                  <Archive className="w-4 h-4" />
                                </button>
                              )}
                              {report.relatedProject && (
                                <button
                                  onClick={() => {
                                    if (window.confirm('Delete this project permanently?')) {
                                      resolveMutation.mutate({ id: report._id, action: 'delete-project' });
                                    }
                                  }}
                                  className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                                  title="Delete project"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  const note = prompt('Resolution note (optional):');
                                  if (note !== null) {
                                    resolveMutation.mutate({ id: report._id, action: 'dismiss', note });
                                  }
                                }}
                                className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg"
                                title="Dismiss report"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {reports.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      No reports found.
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

export default AdminReports;