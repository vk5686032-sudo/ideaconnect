import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Lightbulb, FolderKanban, CheckSquare, TrendingUp, ArrowRight, Calendar, GraduationCap, Check, X, Users, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import ideaApi from '../../api/idea.api';
import projectApi from '../../api/project.api';
import aiApi from '../../api/ai.api';
import taskApi from '../../api/task.api';
import mentorApi from '../../api/mentor.api';
import userApi from '../../api/user.api';
import useAuthStore from '../../store/authSlice';

const Dashboard = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const isApprovedMentor =
    user?.role === 'mentor' && user?.isMentorApproved;
  const { data: ideasData } = useQuery({
    queryKey: ['my-ideas'],
    queryFn: () => ideaApi.getMy(),
  });

  const { data: projectsData } = useQuery({
    queryKey: ['my-projects'],
    queryFn: () => projectApi.getMy(),
  });

  const { data: recommendations } = useQuery({
    queryKey: ['recommendations'],
    queryFn: () => aiApi.getRecommendations(),
  });

  const { data: tasksData } = useQuery({
    queryKey: ['my-tasks'],
    queryFn: () => taskApi.getMy(),
  });

  const { data: mentorRequestsData } = useQuery({
    queryKey: ['mentor-requests-incoming'],
    queryFn: () => mentorApi.getIncomingRequests(),
    enabled: isApprovedMentor,
  });

  const { data: statsData } = useQuery({
    queryKey: ['my-stats'],
    queryFn: () => userApi.getStats(),
  });
  const userStats = statsData?.data?.data;

  const handleMentorRequestMutation = useMutation({
    mutationFn: ({ requestId, action }) => mentorApi.handleRequest(requestId, action),
    onSuccess: (response, { action }) => {
      queryClient.invalidateQueries(['mentor-requests-incoming']);
      toast.success(action === 'accept' ? 'Request accepted — a direct chat was opened' : 'Request declined');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to handle request');
    },
  });

  // Incoming idea-team invitations
  const { data: ideaInvitesData } = useQuery({
    queryKey: ['my-idea-invites'],
    queryFn: () => ideaApi.getMyIdeaInvites(),
  });

  const handleIdeaInviteMutation = useMutation({
    mutationFn: ({ invitationId, action }) => ideaApi.handleIdeaInvite(invitationId, action),
    onSuccess: (response, { action, invitationId }) => {
      queryClient.invalidateQueries(['my-idea-invites']);
      if (action === 'accept') {
        const invite = (ideaInvitesData?.data?.data || []).find((i) => i._id === invitationId);
        if (invite?.relatedIdea?._id) {
          queryClient.invalidateQueries(['idea', invite.relatedIdea._id]);
          navigate(`/ideas/${invite.relatedIdea._id}`);
        }
        toast.success('Invitation accepted!');
      } else {
        toast.success('Invitation declined');
      }
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to handle invitation');
    },
  });

  const ideaInvites = (ideaInvitesData?.data?.data || []).filter((i) => i.status === 'pending');

  const mentorRequests = mentorRequestsData?.data?.data || [];
  const pendingMentorRequests = mentorRequests.filter((r) => r.status === 'pending');

  const ideas = ideasData?.data?.data || [];
  const projects = projectsData?.data?.data || [];
  const recommended = recommendations?.data?.data || [];
  const myTasks = tasksData?.data?.data || [];

  const stats = [
    { label: 'My Ideas', value: ideas.length, icon: Lightbulb, color: 'bg-yellow-100 text-yellow-600' },
    { label: 'My Projects', value: projects.length, icon: FolderKanban, color: 'bg-blue-100 text-blue-600' },
    { label: 'Open Tasks', value: myTasks.length, icon: CheckSquare, color: 'bg-green-100 text-green-600' },
    { label: 'Reputation', value: userStats?.reputation ?? 0, icon: TrendingUp, color: 'bg-purple-100 text-purple-600' },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-8">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex gap-3">
          <Link to="/ideas/new" className="btn-primary flex items-center gap-2 flex-1 sm:flex-none justify-center">
            <Plus className="w-5 h-5" /> New Idea
          </Link>
          <Link to="/projects/new" className="btn-outline flex items-center gap-2 flex-1 sm:flex-none justify-center">
            <Plus className="w-5 h-5" /> New Project
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">{stat.label}</p>
                <p className="text-xl sm:text-3xl font-bold mt-1">{stat.value}</p>
              </div>
              <div className={`w-9 h-9 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-4 h-4 sm:w-6 sm:h-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Incoming Idea Team Invitations */}
      {ideaInvites.length > 0 && (
        <div className="mb-6 sm:mb-8">
          <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-1.5 mb-3 sm:mb-4">
            <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600" /> Team Invitations
            <span className="badge bg-yellow-100 text-yellow-700 text-[10px] sm:text-xs">{ideaInvites.length}</span>
          </h2>
          <div className="space-y-3">
            {ideaInvites.map((invite) => (
              <div key={invite._id} className="card flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {invite.sender?.avatar?.url ? (
                    <img src={invite.sender.avatar.url} alt="" className="w-10 h-10 rounded-full flex-shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                      <Users className="w-5 h-5 text-primary-600" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <Link to={`/ideas/${invite.relatedIdea?._id}`} className="font-medium text-sm hover:text-primary-600 truncate block">
                      {invite.relatedIdea?.title || 'An idea'}
                    </Link>
                    <p className="text-xs text-gray-500 truncate">
                      Invited by {invite.sender?.name}
                      {invite.message ? ` — "${invite.message}"` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleIdeaInviteMutation.mutate({ invitationId: invite._id, action: 'accept' })}
                    disabled={handleIdeaInviteMutation.isPending}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
                  >
                    <Check className="w-3 h-3" /> Accept
                  </button>
                  <button
                    onClick={() => handleIdeaInviteMutation.mutate({ invitationId: invite._id, action: 'reject' })}
                    disabled={handleIdeaInviteMutation.isPending}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50"
                  >
                    <X className="w-3 h-3" /> Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Incoming Mentor Requests */}
      {isApprovedMentor && pendingMentorRequests.length > 0 && (
        <div className="mb-6 sm:mb-8">
          <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-1.5 mb-3 sm:mb-4">
            <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" /> Mentorship Requests
            <span className="badge bg-yellow-100 text-yellow-700 text-[10px] sm:text-xs">{pendingMentorRequests.length}</span>
          </h2>
          <div className="space-y-3">
            {pendingMentorRequests.map((request) => (
              <div key={request._id} className="card flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {request.sender?.avatar?.url ? (
                    <img src={request.sender.avatar.url} alt="" className="w-10 h-10 rounded-full flex-shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                      <Users className="w-5 h-5 text-primary-600" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{request.sender?.name}</p>
                    {request.message && (
                      <p className="text-xs text-gray-600 line-clamp-2">{request.message}</p>
                    )}
                    <p className="text-[10px] sm:text-xs text-gray-400">
                      {new Date(request.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleMentorRequestMutation.mutate({ requestId: request._id, action: 'accept' })}
                    disabled={handleMentorRequestMutation.isPending}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
                  >
                    <Check className="w-3 h-3" /> Accept
                  </button>
                  <button
                    onClick={() => handleMentorRequestMutation.mutate({ requestId: request._id, action: 'reject' })}
                    disabled={handleMentorRequestMutation.isPending}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50"
                  >
                    <X className="w-3 h-3" /> Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* My Open Tasks */}
      {myTasks.length > 0 && (
        <div className="mb-6 sm:mb-8">
          <div className="flex justify-between items-center mb-3 sm:mb-4">
            <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-1.5">
              <CheckSquare className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" /> My Tasks
              <span className="badge-success text-[10px] sm:text-xs">{myTasks.length}</span>
            </h2>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50">
            {myTasks.slice(0, 5).map((task) => (
              <Link
                key={task._id}
                to={task.project?._id ? `/projects/${task.project._id}` : '#'}
                className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50/50 transition-colors"
              >
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                  task.priority === 'urgent' ? 'bg-red-500'
                  : task.priority === 'high' ? 'bg-yellow-500'
                  : task.priority === 'medium' ? 'bg-blue-500'
                  : 'bg-gray-400'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-xs sm:text-sm truncate">{task.title}</p>
                  <p className="text-[10px] sm:text-xs text-gray-500 truncate">{task.project?.title}</p>
                </div>
                {task.dueDate && (
                  <span className={`text-[10px] sm:text-xs flex items-center gap-1 whitespace-nowrap ${
                    new Date(task.dueDate) < new Date() ? 'text-red-500 font-medium' : 'text-gray-400'
                  }`}>
                    <Calendar className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    {new Date(task.dueDate).toLocaleDateString()}
                  </span>
                )}
                <span className={`badge text-[10px] sm:text-xs ${
                  task.status === 'in-progress' ? 'bg-blue-100 text-blue-600'
                  : task.status === 'review' ? 'bg-purple-100 text-purple-600'
                  : 'bg-gray-100 text-gray-600'
                }`}>
                  {task.status?.replace('-', ' ')}
                </span>
              </Link>
            ))}
            {myTasks.length > 5 && (
              <p className="text-center text-xs sm:text-sm text-gray-500 py-2 sm:py-3">
                +{myTasks.length - 5} more tasks
              </p>
            )}
          </div>
        </div>
      )}

      {/* Recent Ideas */}
      <div className="mb-6 sm:mb-8">
        <div className="flex justify-between items-center mb-3 sm:mb-4">
          <h2 className="text-lg sm:text-xl font-semibold">My Recent Ideas</h2>
          <Link to="/ideas" className="text-primary-600 hover:text-primary-700 flex items-center gap-1 text-xs sm:text-sm">
            View All <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {ideas.slice(0, 3).map((idea) => (
            <Link key={idea._id} to={`/ideas/${idea._id}`} className="card-hover">
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="badge-primary text-[10px] sm:text-xs">{idea.category}</span>
                <span className={`badge text-[10px] sm:text-xs ${idea.status === 'open' ? 'badge-success' : 'badge-warning'}`}>
                  {idea.status}
                </span>
              </div>
              <h3 className="font-semibold text-sm sm:text-base mb-1.5 line-clamp-1">{idea.title}</h3>
              <p className="text-gray-600 text-xs sm:text-sm line-clamp-2">{idea.description}</p>
            </Link>
          ))}
          {ideas.length === 0 && (
            <div className="card col-span-full text-center py-6 sm:py-8">
              <Lightbulb className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-2 sm:mb-3" />
              <p className="text-gray-600 text-sm">No ideas yet. Create your first idea!</p>
            </div>
          )}
        </div>
      </div>

      {/* Active Projects */}
      <div className="mb-6 sm:mb-8">
        <div className="flex justify-between items-center mb-3 sm:mb-4">
          <h2 className="text-lg sm:text-xl font-semibold">Active Projects</h2>
          <Link to="/projects" className="text-primary-600 hover:text-primary-700 flex items-center gap-1 text-xs sm:text-sm">
            View All <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {projects.slice(0, 4).map((project) => (
            <Link key={project._id} to={`/projects/${project._id}`} className="card-hover">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <h3 className="font-semibold text-sm sm:text-base">{project.title}</h3>
                <span className={`badge text-xs ${project.status === 'completed' ? 'badge-success' : 'badge-primary'}`}>
                  {project.status}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary-600 h-2 rounded-full"
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
                <span className="text-xs sm:text-sm text-gray-600 whitespace-nowrap">{project.progress}%</span>
              </div>
            </Link>
          ))}
          {projects.length === 0 && (
            <div className="card col-span-full text-center py-6 sm:py-8">
              <FolderKanban className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-2 sm:mb-3" />
              <p className="text-gray-600 text-sm">No projects yet. Start your first project!</p>
            </div>
          )}
        </div>
      </div>

      {/* AI Recommendations */}
      {recommended.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-3 sm:mb-4">
            <h2 className="text-lg sm:text-xl font-semibold">Recommended for You</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {recommended.slice(0, 3).map((idea) => (
              <Link key={idea._id} to={`/ideas/${idea._id}`} className="card-hover">
                <span className="badge-primary text-[10px] sm:text-xs mb-1.5">{idea.category}</span>
                <h3 className="font-semibold text-sm sm:text-base mb-1.5 line-clamp-1">{idea.title}</h3>
                <p className="text-gray-600 text-xs sm:text-sm line-clamp-2">{idea.description}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
