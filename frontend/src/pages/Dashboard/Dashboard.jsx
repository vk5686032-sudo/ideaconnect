import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus, Lightbulb, FolderKanban, CheckSquare, TrendingUp, ArrowRight, Calendar, Flag } from 'lucide-react';
import ideaApi from '../../api/idea.api';
import projectApi from '../../api/project.api';
import aiApi from '../../api/ai.api';
import taskApi from '../../api/task.api';

const Dashboard = () => {
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

  const ideas = ideasData?.data?.data || [];
  const projects = projectsData?.data?.data || [];
  const recommended = recommendations?.data?.data || [];
  const myTasks = tasksData?.data?.data || [];

  const stats = [
    { label: 'My Ideas', value: ideas.length, icon: Lightbulb, color: 'bg-yellow-100 text-yellow-600' },
    { label: 'My Projects', value: projects.length, icon: FolderKanban, color: 'bg-blue-100 text-blue-600' },
    { label: 'Open Tasks', value: myTasks.length, icon: CheckSquare, color: 'bg-green-100 text-green-600' },
    { label: 'Reputation', value: 0, icon: TrendingUp, color: 'bg-purple-100 text-purple-600' },
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{stat.label}</p>
                <p className="text-3xl font-bold mt-1">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* My Open Tasks */}
      {myTasks.length > 0 && (
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-green-600" /> My Tasks
              <span className="badge-success text-xs">{myTasks.length}</span>
            </h2>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50">
            {myTasks.slice(0, 6).map((task) => (
              <Link
                key={task._id}
                to={`/projects/${task.project?._id}`}
                className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50/50 transition-colors"
              >
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  task.priority === 'urgent' ? 'bg-red-500'
                  : task.priority === 'high' ? 'bg-yellow-500'
                  : task.priority === 'medium' ? 'bg-blue-500'
                  : 'bg-gray-400'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{task.title}</p>
                  <p className="text-xs text-gray-500 truncate">{task.project?.title}</p>
                </div>
                {task.dueDate && (
                  <span className={`text-xs flex items-center gap-1 whitespace-nowrap ${
                    new Date(task.dueDate) < new Date() ? 'text-red-500 font-medium' : 'text-gray-400'
                  }`}>
                    <Calendar className="w-3 h-3" />
                    {new Date(task.dueDate).toLocaleDateString()}
                  </span>
                )}
                <span className={`badge text-xs ${
                  task.status === 'in-progress' ? 'bg-blue-100 text-blue-600'
                  : task.status === 'review' ? 'bg-purple-100 text-purple-600'
                  : 'bg-gray-100 text-gray-600'
                }`}>
                  {task.status?.replace('-', ' ')}
                </span>
              </Link>
            ))}
            {myTasks.length > 6 && (
              <p className="text-center text-sm text-gray-500 py-3">
                +{myTasks.length - 6} more tasks
              </p>
            )}
          </div>
        </div>
      )}

      {/* Recent Ideas */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">My Recent Ideas</h2>
          <Link to="/ideas" className="text-primary-600 hover:text-primary-700 flex items-center gap-1 text-sm">
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ideas.slice(0, 3).map((idea) => (
            <Link key={idea._id} to={`/ideas/${idea._id}`} className="card-hover">
              <div className="flex items-center gap-2 mb-2">
                <span className="badge-primary">{idea.category}</span>
                <span className={`badge badge-${idea.status === 'open' ? 'success' : 'warning'}`}>
                  {idea.status}
                </span>
              </div>
              <h3 className="font-semibold mb-2 line-clamp-1">{idea.title}</h3>
              <p className="text-gray-600 text-sm line-clamp-2">{idea.description}</p>
            </Link>
          ))}
          {ideas.length === 0 && (
            <div className="card col-span-full text-center py-8">
              <Lightbulb className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600">No ideas yet. Create your first idea!</p>
            </div>
          )}
        </div>
      </div>

      {/* Active Projects */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Active Projects</h2>
          <Link to="/projects" className="text-primary-600 hover:text-primary-700 flex items-center gap-1 text-sm">
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {projects.slice(0, 4).map((project) => (
            <Link key={project._id} to={`/projects/${project._id}`} className="card-hover">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">{project.title}</h3>
                <span className={`badge badge-${project.status === 'completed' ? 'success' : 'primary'}`}>
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
                <span className="text-sm text-gray-600">{project.progress}%</span>
              </div>
            </Link>
          ))}
          {projects.length === 0 && (
            <div className="card col-span-full text-center py-8">
              <FolderKanban className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600">No projects yet. Start your first project!</p>
            </div>
          )}
        </div>
      </div>

      {/* AI Recommendations */}
      {recommended.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Recommended for You</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommended.slice(0, 3).map((idea) => (
              <Link key={idea._id} to={`/ideas/${idea._id}`} className="card-hover">
                <span className="badge-primary mb-2">{idea.category}</span>
                <h3 className="font-semibold mb-2 line-clamp-1">{idea.title}</h3>
                <p className="text-gray-600 text-sm line-clamp-2">{idea.description}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
