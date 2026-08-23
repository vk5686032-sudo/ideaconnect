import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Loader2, Shield, User, Trash2, Archive, CheckCircle2, XCircle, FileText, FolderKanban, Lightbulb, Users } from 'lucide-react';
import adminApi from '../../api/admin.api';
import { timeSince } from '../../utils/helpers';

const AdminAuditLogs = () => {
  const [search, setSearch] = useState('');
  const [adminFilter, setAdminFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-audit-logs', search, adminFilter, actionFilter],
    queryFn: () => adminApi.getAuditLogs({ search, adminId: adminFilter, action: actionFilter, limit: 100 }),
  });

  const logs = data?.data?.data || [];
  const pagination = data?.data?.pagination;

  const getActionIcon = (action) => {
    if (action.includes('ban')) return <Shield className="w-4 h-4" />;
    if (action.includes('delete')) return <Trash2 className="w-4 h-4" />;
    if (action.includes('archive')) return <Archive className="w-4 h-4" />;
    if (action.includes('approve')) return <CheckCircle2 className="w-4 h-4" />;
    if (action.includes('reject')) return <XCircle className="w-4 h-4" />;
    if (action.includes('mentor')) return <User className="w-4 h-4" />;
    if (action.includes('bulk')) return <Users className="w-4 h-4" />;
    if (action.includes('idea')) return <Lightbulb className="w-4 h-4" />;
    if (action.includes('project')) return <FolderKanban className="w-4 h-4" />;
    if (action.includes('report')) return <FileText className="w-4 h-4" />;
    return <Shield className="w-4 h-4" />;
  };

  const getActionColor = (action) => {
    if (action.includes('delete')) return 'text-red-500';
    if (action.includes('ban')) return 'text-red-500';
    if (action.includes('approve')) return 'text-green-500';
    if (action.includes('reject')) return 'text-red-500';
    if (action.includes('archive')) return 'text-yellow-500';
    return 'text-blue-500';
  };

  const formatAction = (action) => {
    return action
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search audit logs..."
            className="input-field pl-9 py-2 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="input-field sm:w-44 py-2 text-sm"
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
        >
          <option value="">All actions</option>
          <option value="user-ban">User Ban</option>
          <option value="user-unban">User Unban</option>
          <option value="user-delete">User Delete</option>
          <option value="user-make-mentor">Make Mentor</option>
          <option value="user-role-change">Role Change</option>
          <option value="mentor-approve">Mentor Approve</option>
          <option value="idea-archive">Idea Archive</option>
          <option value="idea-delete">Idea Delete</option>
          <option value="idea-approve">Idea Approve</option>
          <option value="idea-reject">Idea Reject</option>
          <option value="project-archive">Project Archive</option>
          <option value="project-delete">Project Delete</option>
          <option value="project-approve">Project Approve</option>
          <option value="project-reject">Project Reject</option>
          <option value="report-resolve">Report Resolve</option>
          <option value="bulk-ban">Bulk Ban</option>
          <option value="bulk-unban">Bulk Unban</option>
          <option value="bulk-delete">Bulk Delete</option>
          <option value="bulk-make-mentor">Bulk Make Mentor</option>
          <option value="bulk-idea-archive">Bulk Idea Archive</option>
          <option value="bulk-idea-delete">Bulk Idea Delete</option>
          <option value="bulk-project-archive">Bulk Project Archive</option>
          <option value="bulk-project-delete">Bulk Project Delete</option>
        </select>
        <select
          className="input-field sm:w-44 py-2 text-sm"
          value={adminFilter}
          onChange={(e) => setAdminFilter(e.target.value)}
        >
          <option value="">All admins</option>
          {logs.map((log) => log.admin && (
            <option key={log.admin._id} value={log.admin._id}>
              {log.admin.name}
            </option>
          ))}
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
                  <th className="px-4 py-3 font-medium">Action</th>
                  <th className="px-4 py-3 font-medium">Admin</th>
                  <th className="px-4 py-3 font-medium">Target</th>
                  <th className="px-4 py-3 font-medium">Details</th>
                  <th className="px-4 py-3 font-medium">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className={getActionColor(log.action)}>
                          {getActionIcon(log.action)}
                        </span>
                        <span className="font-medium">{formatAction(log.action)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium">{log.admin?.name || 'System'}</p>
                        <p className="text-xs text-gray-500">{log.admin?.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {log.relatedIdea && (
                        <span className="badge-primary">Idea: {log.relatedIdea.title || log.relatedIdea._id}</span>
                      )}
                      {log.relatedProject && (
                        <span className="badge-primary">Project: {log.relatedProject.title || log.relatedProject._id}</span>
                      )}
                      {!log.relatedIdea && !log.relatedProject && (
                        <span className="text-gray-500">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-sm max-w-xs truncate">
                      {log.details || '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                      {timeSince(log.createdAt)}
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                      No audit logs found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {pagination && pagination.pages > 1 && (
            <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Page {pagination.page} of {pagination.pages} ({pagination.total} total)
              </p>
              <div className="flex gap-2">
                <button
                  disabled={pagination.page <= 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  disabled={pagination.page >= pagination.pages}
                  className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminAuditLogs;