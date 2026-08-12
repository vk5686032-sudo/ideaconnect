import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
  FolderKanban, Users, Calendar, Globe, Link as LinkIcon,
  UserPlus, Check, X, Trash2, MessageSquare, Play, Plus, Flag, Edit2, Search,
} from 'lucide-react';
import { GithubIcon } from '../../components/common/BrandIcons';
import toast from 'react-hot-toast';
import BackButton from '../../components/common/BackButton';
import projectApi from '../../api/project.api';
import taskApi from '../../api/task.api';
import userApi from '../../api/user.api';
import chatApi from '../../api/chat.api';
import useAuthStore from '../../store/authSlice';
import TaskBoard from '../../components/projects/TaskBoard';

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuthStore();
  const [showMilestoneForm, setShowMilestoneForm] = useState(false);
  const [milestoneForm, setMilestoneForm] = useState({ title: '', description: '' });
  const [showAddMember, setShowAddMember] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');

  const { data: projectData, isLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: () => projectApi.getById(id),
    enabled: !!id,
  });

  const project = projectData?.data?.data;

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['all-users', memberSearch],
    queryFn: () => userApi.getAll({ limit: 20, search: memberSearch }),
    enabled: showAddMember,
  });

  const addableUsers = (usersData?.data?.data || []).filter(
    (u) =>
      u._id !== user?._id &&
      !project?.members?.some((m) => m.user?._id === u._id)
  );

  const addMemberMutation = useMutation({
    mutationFn: (data) => projectApi.addMember(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['project', id]);
      toast.success('Member added');
      setShowAddMember(false);
      setMemberSearch('');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to add member');
    },
  });

  const openProjectChatMutation = useMutation({
    mutationFn: () => chatApi.getOrCreateProjectChat(id),
    onSuccess: (response) => {
      const chat = response?.data?.data;
      if (chat?._id) navigate(`/chat/${chat._id}?from=project&projectId=${id}`);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to open project chat');
    },
  });

  const [joinRequestMessage, setJoinRequestMessage] = useState('');
  const joinMutation = useMutation({
    mutationFn: (data) => projectApi.requestToJoin(id, data),
    onSuccess: () => {
      toast.success('Join request sent!');
      setJoinRequestMessage('');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to send join request');
    },
  });

  const requestToJoin = () => {
    if (joinRequestMessage.trim()) {
      joinMutation.mutate({ message: joinRequestMessage });
    }
  };

  const removeMemberMutation = useMutation({
    mutationFn: (userId) => projectApi.removeMember(id, userId),
    onSuccess: () => {
      queryClient.invalidateQueries(['project', id]);
      toast.success('Member removed');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to remove member');
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }) => projectApi.updateMemberRole(id, userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries(['project', id]);
      toast.success('Role updated');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update role');
    },
  });

  const progressMutation = useMutation({
    mutationFn: (progress) => projectApi.updateProgress(id, progress),
    onSuccess: () => {
      queryClient.invalidateQueries(['project', id]);
      toast.success('Progress updated');
    },
  });

  const invalidateProject = () => queryClient.invalidateQueries(['project', id]);

  const addMilestoneMutation = useMutation({
    mutationFn: (data) => taskApi.addMilestone(id, data),
    onSuccess: () => {
      invalidateProject();
      toast.success('Milestone added');
      setMilestoneForm({ title: '', description: '' });
      setShowMilestoneForm(false);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to add milestone'),
  });

  const toggleMilestoneMutation = useMutation({
    mutationFn: ({ milestoneId, completed }) =>
      taskApi.updateMilestone(id, milestoneId, { completed }),
    onSuccess: () => {
      invalidateProject();
    },
  });

  const deleteMilestoneMutation = useMutation({
    mutationFn: (milestoneId) => taskApi.deleteMilestone(id, milestoneId),
    onSuccess: () => {
      invalidateProject();
      toast.success('Milestone deleted');
    },
  });

  const handleAddMilestone = () => {
    if (!milestoneForm.title.trim()) return;
    addMilestoneMutation.mutate({
      title: milestoneForm.title.trim(),
      description: milestoneForm.description.trim() || undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="text-center py-24">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-24">
        <h2 className="text-2xl font-bold mb-4">Project not found</h2>
        <button onClick={() => navigate('/projects')} className="btn-primary">
          Browse Projects
        </button>
      </div>
    );
  }

  const isOwner = user?._id === project.owner?._id;
  const isMember = project.members?.some((m) => m.user?._id === user?._id) || isOwner;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-4">
        <BackButton />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <div className="card mb-6">
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <span className={`badge ${project.status === 'completed' ? 'badge-success' : project.status === 'in-progress' ? 'badge-primary' : 'badge-warning'}`}>
                {project.status}
              </span>
              {project.visibility === 'private' && <span className="badge-warning">Private</span>}
              {isOwner && (
                <button
                  onClick={() => navigate(`/projects/${project._id}/edit`)}
                  className="ml-auto btn-outline text-sm flex items-center gap-1.5"
                >
                  <Edit2 className="w-4 h-4" /> Edit Project
                </button>
              )}
            </div>

            <h1 className="text-2xl md:text-3xl font-bold mb-4">{project.title}</h1>
            <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">{project.description}</p>

            {project.technologies?.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-6">
                {project.technologies.map((tech) => (
                  <span key={tech} className="badge bg-gray-100 text-gray-700">{tech}</span>
                ))}
              </div>
            )}

            {/* Progress */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">Progress</h3>
                <span className="font-bold text-primary-600">{project.progress}%</span>
              </div>
              <div className="w-full bg-white rounded-full h-3">
                <div
                  className="bg-primary-600 h-3 rounded-full transition-all"
                  style={{ width: `${project.progress}%` }}
                />
              </div>
            </div>

            {/* Milestones */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Flag className="w-4 h-4 text-primary-600" /> Milestones
                </h3>
                {isOwner && (
                  <button
                    onClick={() => setShowMilestoneForm(!showMilestoneForm)}
                    className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
                  >
                    {showMilestoneForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    {showMilestoneForm ? 'Cancel' : 'Add'}
                  </button>
                )}
              </div>

              {showMilestoneForm && (
                <div className="bg-gray-50 rounded-lg p-3 mb-3 space-y-2">
                  <input
                    type="text"
                    placeholder="Milestone title"
                    className="input-field"
                    value={milestoneForm.title}
                    onChange={(e) => setMilestoneForm({ ...milestoneForm, title: e.target.value })}
                  />
                  <input
                    type="text"
                    placeholder="Description (optional)"
                    className="input-field"
                    value={milestoneForm.description}
                    onChange={(e) => setMilestoneForm({ ...milestoneForm, description: e.target.value })}
                  />
                  <button
                    onClick={handleAddMilestone}
                    disabled={!milestoneForm.title.trim()}
                    className="btn-primary text-sm disabled:opacity-50"
                  >
                    Add Milestone
                  </button>
                </div>
              )}

              {project.milestones?.length > 0 ? (
                <div className="space-y-3">
                  {project.milestones.map((milestone) => (
                    <div key={milestone._id} className="flex items-start gap-3 group">
                      <button
                        onClick={() => isOwner && toggleMilestoneMutation.mutate({
                          milestoneId: milestone._id,
                          completed: !milestone.completed,
                        })}
                        disabled={!isOwner}
                        className={`mt-0.5 w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          milestone.completed ? 'bg-green-500 border-green-500' : 'border-gray-300'
                        } ${isOwner ? 'cursor-pointer hover:border-primary-500' : 'cursor-default'}`}
                        title={isOwner ? (milestone.completed ? 'Mark incomplete' : 'Mark complete') : ''}
                      >
                        {milestone.completed && <Check className="w-3 h-3 text-white" />}
                      </button>
                      <div className="flex-1">
                        <p className={`font-medium ${milestone.completed ? 'line-through text-gray-400' : ''}`}>
                          {milestone.title}
                        </p>
                        {milestone.description && (
                          <p className="text-sm text-gray-500">{milestone.description}</p>
                        )}
                        {milestone.dueDate && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            Due {new Date(milestone.dueDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      {isOwner && (
                        <button
                          onClick={() => deleteMilestoneMutation.mutate(milestone._id)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded sm:opacity-0 sm:group-hover:opacity-100 sm:transition-opacity"
                          title="Delete milestone"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">
                  {isOwner ? 'No milestones yet — add one to track key deliverables.' : 'No milestones yet.'}
                </p>
              )}
            </div>
          </div>

          {/* Task Board */}
          <div className="mb-6">
            <TaskBoard project={project} />
          </div>

          {/* Links */}
          <div className="card mb-6">
            <h2 className="text-lg font-semibold mb-4">Project Links</h2>
            <div className="space-y-2">
              {project.repository && (
                <a href={project.repository} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary-600 hover:text-primary-700">
                  <GithubIcon className="w-5 h-5" /> Repository
                </a>
              )}
              {project.demoUrl && (
                <a href={project.demoUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary-600 hover:text-primary-700">
                  <Globe className="w-5 h-5" /> Live Demo
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Team Members */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Users className="w-5 h-5" /> Team ({project.members?.length || 0})
              </h2>
              {isOwner && (
                <button
                  onClick={() => setShowAddMember(true)}
                  className="flex items-center gap-1 text-xs font-medium text-primary-600 hover:bg-primary-50 px-2 py-1 rounded-lg"
                  title="Add member"
                >
                  <UserPlus className="w-3.5 h-3.5" /> Add
                </button>
              )}
            </div>
            <div className="space-y-3">
              {project.members?.map((member) => {
                const isOwnerMember = member.user?._id === project.owner?._id;
                return (
                  <div key={member._id} className="flex items-center gap-3">
                    {member.user?.avatar?.url ? (
                      <img src={member.user.avatar.url} alt="" className="w-8 h-8 rounded-full" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                        <Users className="w-4 h-4 text-primary-600" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {member.user?.name}
                        {isOwnerMember && <span className="text-xs text-amber-600 font-normal ml-1">(Owner)</span>}
                      </p>
                      {isOwner && !isOwnerMember ? (
                        <select
                          value={member.role || 'developer'}
                          onChange={(e) =>
                            updateRoleMutation.mutate({
                              userId: member.user?._id,
                              role: e.target.value,
                            })
                          }
                          className="text-xs text-gray-500 bg-transparent border border-gray-200 rounded px-1 py-0.5 mt-0.5 capitalize"
                          title="Change role"
                        >
                          {['developer', 'designer', 'researcher', 'mentor', 'lead'].map((r) => (
                            <option key={r} value={r} className="capitalize">{r}</option>
                          ))}
                        </select>
                      ) : (
                        <p className="text-xs text-gray-500 capitalize">{member.role}</p>
                      )}
                    </div>
                    {isOwner && !isOwnerMember && (
                      <button
                        onClick={() => {
                          if (window.confirm(`Remove ${member.user?.name} from the team?`)) {
                            removeMemberMutation.mutate(member.user?._id);
                          }
                        }}
                        className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg"
                        title="Remove member"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          {isMember && (
            <div className="card">
              <h2 className="text-lg font-semibold mb-4">Project Chat</h2>
              <button
                onClick={() => openProjectChatMutation.mutate()}
                disabled={openProjectChatMutation.isLoading}
                className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <MessageSquare className="w-5 h-5" />
                {openProjectChatMutation.isLoading ? 'Opening...' : 'Open Chat'}
              </button>
            </div>
          )}

          {/* Request to Join */}
          {!isMember && !isOwner && (
            <div className="card">
              <h2 className="text-lg font-semibold mb-4">Request to Join</h2>
              <p className="text-sm text-gray-600 mb-4">
                Want to contribute to this project? Send a request to the owner.
              </p>
              <textarea
                value={joinRequestMessage}
                onChange={(e) => setJoinRequestMessage(e.target.value)}
                placeholder="Tell the owner why you'd like to join..."
                className="input-field mb-3"
                rows={3}
              />
              <button
                onClick={requestToJoin}
                disabled={joinMutation.isLoading || !joinRequestMessage.trim()}
                className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <UserPlus className="w-5 h-5" />
                {joinMutation.isLoading ? 'Sending...' : 'Request to Join'}
              </button>
            </div>
          )}

          {/* Quick Stats */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Project Info</h2>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="w-4 h-4" />
                Created {new Date(project.createdAt).toLocaleDateString()}
              </div>
              {project.deadline && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="w-4 h-4" />
                  Deadline {new Date(project.deadline).toLocaleDateString()}
                </div>
              )}
              <div className="flex items-center gap-2 text-gray-600">
                <FolderKanban className="w-4 h-4" />
                {project.tasks?.length || 0} tasks
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add member modal */}
      {showAddMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowAddMember(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-primary-600" /> Add Member
              </h3>
              <button
                onClick={() => setShowAddMember(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  className="input-field pl-9"
                  placeholder="Search users by name or skill..."
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
              {usersLoading ? (
                <p className="text-sm text-gray-400 p-4 text-center">Loading users...</p>
              ) : addableUsers.length === 0 ? (
                <p className="text-sm text-gray-400 p-4 text-center">
                  No users found{project?.members?.length ? ' (all members already added)' : ''}
                </p>
              ) : (
                addableUsers.map((u) => (
                  <button
                    key={u._id}
                    onClick={() => addMemberMutation.mutate({ userId: u._id, role: 'developer' })}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50"
                  >
                    <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                      {u.avatar?.url ? (
                        <img src={u.avatar.url} alt="" className="w-full h-full rounded-full" />
                      ) : (
                        <span className="text-xs font-medium text-gray-600">{u.name?.[0]?.toUpperCase()}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{u.name}</p>
                      <p className="text-xs text-gray-400 capitalize">{u.role || 'member'}</p>
                    </div>
                    <span className="text-xs text-primary-600 font-medium">Add</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetail;
