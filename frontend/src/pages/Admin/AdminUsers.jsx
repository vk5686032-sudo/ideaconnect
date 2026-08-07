import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Shield, Ban, CheckCircle2, RefreshCw, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import adminApi from '../../api/admin.api';
import { timeSince } from '../../utils/helpers';

const AdminUsers = () => {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', search, roleFilter],
    queryFn: () => adminApi.getUsers({ search, role: roleFilter, limit: 50 }),
  });

  const users = data?.data?.data || [];

  const invalidate = () => {
    queryClient.invalidateQueries(['admin-users']);
    queryClient.invalidateQueries(['admin-stats']);
  };

  const roleMutation = useMutation({
    mutationFn: ({ id, role }) => adminApi.updateUserRole(id, role),
    onSuccess: () => {
      invalidate();
      toast.success('Role updated');
    },
    onError: () => toast.error('Failed to update role'),
  });

  const banMutation = useMutation({
    mutationFn: (id) => adminApi.toggleBan(id),
    onSuccess: () => {
      invalidate();
      toast.success('User status updated');
    },
    onError: () => toast.error('Failed to update user'),
  });

  const mentorMutation = useMutation({
    mutationFn: (id) => adminApi.approveMentor(id),
    onSuccess: () => {
      invalidate();
      toast.success('Mentor approved');
    },
    onError: () => toast.error('Failed to approve mentor'),
  });

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            className="input-field pl-9 py-2 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="input-field sm:w-44 py-2 text-sm"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="">All roles</option>
          <option value="user">User</option>
          <option value="mentor">Mentor</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {/* Table */}
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
                  <th className="px-4 py-3 font-medium">User</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Joined</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {u.avatar?.url ? (
                          <img src={u.avatar.url} alt="" className="w-8 h-8 rounded-full flex-shrink-0" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-primary-100 flex-shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className="font-medium truncate">{u.name}</p>
                          <p className="text-xs text-gray-500 truncate">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={u.role}
                        disabled={u._id === 'current-admin'}
                        onChange={(e) => roleMutation.mutate({ id: u._id, role: e.target.value })}
                        className="text-xs bg-gray-50 border border-gray-200 rounded px-2 py-1 capitalize"
                      >
                        <option value="user">user</option>
                        <option value="mentor">mentor</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className={`badge ${u.isActive === false ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                          {u.isActive === false ? 'Banned' : u.isVerified ? 'Active' : 'Unverified'}
                        </span>
                        {u.role === 'mentor' && !u.isMentorApproved && (
                          <span className="badge bg-yellow-100 text-yellow-700">Pending mentor</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                      {timeSince(u.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        {u.role === 'mentor' && !u.isMentorApproved && (
                          <button
                            onClick={() => mentorMutation.mutate(u._id)}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg"
                            title="Approve mentor"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => banMutation.mutate(u._id)}
                          className={`p-1.5 rounded-lg ${
                            u.isActive === false
                              ? 'text-green-600 hover:bg-green-50'
                              : 'text-red-500 hover:bg-red-50'
                          }`}
                          title={u.isActive === false ? 'Unban user' : 'Ban user'}
                        >
                          {u.isActive === false ? <RefreshCw className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                      No users found.
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

export default AdminUsers;