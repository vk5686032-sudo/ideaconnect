import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Plus, X, Search, MessageSquare, Shield, User as UserIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import chatApi from '../../api/chat.api';
import userApi from '../../api/user.api';
import useAuthStore from '../../store/authSlice';

const Teams = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', members: [] });
  const [search, setSearch] = useState('');
  const [picked, setPicked] = useState([]);

  const { data: chatsData, isLoading } = useQuery({
    queryKey: ['chats'],
    queryFn: () => chatApi.getMy(),
  });

  const chats = chatsData?.data?.data || [];
  // Teams = group chats the user is part of
  const teams = chats.filter((c) => c.type === 'group');

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['all-users', search],
    queryFn: () => userApi.getAll({ limit: 30, search }),
    enabled: showCreate,
  });

  const users = (usersData?.data?.data || []).filter(
    (u) => u._id !== user?._id && !form.members.includes(u._id)
  );

  const createMutation = useMutation({
    mutationFn: (data) => chatApi.createGroup(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries(['chats']);
      toast.success('Team created');
      setShowCreate(false);
      setForm({ name: '', description: '', members: [] });
      setPicked([]);
      const chat = response?.data?.data;
      if (chat?._id) navigate(`/chat/${chat._id}`);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to create team'),
  });

  const handleCreate = () => {
    if (!form.name.trim()) {
      toast.error('Team name is required');
      return;
    }
    createMutation.mutate({
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      members: form.members,
    });
  };

  const toggleMember = (id) => {
    setForm((f) => ({
      ...f,
      members: f.members.includes(id)
        ? f.members.filter((m) => m !== id)
        : [...f.members, id],
    }));
  };

  const teamName = (chat) => chat.name || 'Team';
  const teamDescription = (chat) => chat.description || '';

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-6 h-6 text-primary-600" /> Teams
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Create teams and chat with members you choose.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="btn-primary flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" /> New Team
        </button>
      </div>

      {/* Team list */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto" />
        </div>
      ) : teams.length === 0 ? (
        <div className="card text-center py-12">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">You're not part of any team yet.</p>
          <p className="text-sm text-gray-400 mt-1 mb-4">
            Create a team to start chatting with your members.
          </p>
          <button onClick={() => setShowCreate(true)} className="btn-primary">
            Create your first team
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {teams.map((team) => {
            const memberCount = team.participants?.length || 0;
            return (
              <button
                key={team._id}
                onClick={() => navigate(`/chat/${team._id}`)}
                className="w-full card flex items-center gap-4 text-left hover:shadow-md transition-shadow group"
              >
                <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                  <Users className="w-6 h-6 text-primary-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold truncate">{teamName(team)}</p>
                    {team.creator?._id === user?._id && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">
                        Owner
                      </span>
                    )}
                  </div>
                  {teamDescription(team) && (
                    <p className="text-sm text-gray-500 truncate">{teamDescription(team)}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-0.5">{memberCount} members</p>
                </div>
                {/* Member avatar stack */}
                <div className="flex -space-x-2 flex-shrink-0">
                  {(team.participants || []).slice(0, 4).map((m) => (
                    <div
                      key={m._id}
                      className="w-7 h-7 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center"
                      title={m.name}
                    >
                      {m.avatar?.url ? (
                        <img src={m.avatar.url} alt="" className="w-full h-full rounded-full" />
                      ) : (
                        <span className="text-[10px] font-medium text-gray-600">
                          {m.name?.[0]?.toUpperCase()}
                        </span>
                      )}
                    </div>
                  ))}
                  {memberCount > 4 && (
                    <div className="w-7 h-7 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center">
                      <span className="text-[10px] text-gray-500">+{memberCount - 4}</span>
                    </div>
                  )}
                </div>
                <MessageSquare className="w-4 h-4 text-gray-300 group-hover:text-primary-500" />
              </button>
            );
          })}
        </div>
      )}

      {/* Create team modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowCreate(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="text-lg font-semibold">Create Team</h3>
              <button
                onClick={() => setShowCreate(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Team name *</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Startup Weekend 2026"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                <textarea
                  className="input-field resize-none"
                  rows={2}
                  placeholder="What's this team working on?"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Add members <span className="text-gray-400 font-normal">({form.members.length} selected)</span>
                </label>
                <div className="relative mb-2">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    className="input-field pl-9"
                    placeholder="Search users by name or skill..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>

                <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
                  {usersLoading ? (
                    <p className="text-sm text-gray-400 p-3">Loading users...</p>
                  ) : users.length === 0 ? (
                    <p className="text-sm text-gray-400 p-3">No users found.</p>
                  ) : (
                    users.map((u) => (
                      <button
                        key={u._id}
                        onClick={() => toggleMember(u._id)}
                        className={`w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 ${
                          form.members.includes(u._id) ? 'bg-primary-50' : ''
                        }`}
                      >
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                          {u.avatar?.url ? (
                            <img src={u.avatar.url} alt="" className="w-full h-full rounded-full" />
                          ) : (
                            <UserIcon className="w-4 h-4 text-gray-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{u.name}</p>
                          <p className="text-xs text-gray-400 truncate">
                            {u.role === 'mentor' && <Shield className="w-3 h-3 inline mr-0.5" />}
                            {u.role || 'member'}
                          </p>
                        </div>
                        <span
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            form.members.includes(u._id)
                              ? 'bg-primary-600 border-primary-600 text-white'
                              : 'border-gray-300'
                          }`}
                        >
                          {form.members.includes(u._id) && <span className="text-[10px]">✓</span>}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t">
                <button
                  onClick={() => setShowCreate(false)}
                  className="btn-secondary text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={createMutation.isLoading}
                  className="btn-primary text-sm ml-auto"
                >
                  {createMutation.isLoading ? 'Creating...' : 'Create Team'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Teams;
