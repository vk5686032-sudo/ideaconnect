import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Eye, CheckCircle2, XCircle, Loader2, Lightbulb, FolderKanban } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import adminApi from '../../api/admin.api';
import { timeSince } from '../../utils/helpers';

const AdminApprovals = () => {
  const [activeTab, setActiveTab] = useState('ideas');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-pending-approvals'],
    queryFn: () => adminApi.getPendingApprovals({ limit: 100 }),
  });

  const ideas = data?.data?.data?.ideas || [];
  const projects = data?.data?.data?.projects || [];

  const invalidate = () => {
    queryClient.invalidateQueries(['admin-pending-approvals']);
    queryClient.invalidateQueries(['admin-stats']);
  };

  const reviewIdeaMutation = useMutation({
    mutationFn: ({ id, approve, reason }) => adminApi.reviewIdeaApproval(id, approve, reason),
    onSuccess: (_, { approve }) => {
      invalidate();
      toast.success(approve ? 'Idea approved' : 'Idea rejected');
    },
    onError: () => toast.error('Failed to review idea'),
  });

  const reviewProjectMutation = useMutation({
    mutationFn: ({ id, approve, reason }) => adminApi.reviewProjectApproval(id, approve, reason),
    onSuccess: (_, { approve }) => {
      invalidate();
      toast.success(approve ? 'Project approved' : 'Project rejected');
    },
    onError: () => toast.error('Failed to review project'),
  });

  const renderIdeaRow = (idea) => (
    <tr key={idea._id} className="hover:bg-gray-50/50">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-yellow-500" />
          <span className="font-medium text-sm">{idea.title}</span>
        </div>
        <p className="text-xs text-gray-500 line-clamp-1 max-w-xs mt-0.5">{idea.description}</p>
      </td>
      <td className="px-4 py-3">
        <div>
          <p className="font-medium">{idea.author?.name || 'Unknown'}</p>
          <p className="text-xs text-gray-500">{idea.author?.email}</p>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className="badge-primary">{idea.category}</span>
      </td>
      <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
        {timeSince(idea.createdAt)}
      </td>
      <td className="px-4 py-3">
        <div className="flex justify-end gap-1">
          <Link to={`/ideas/${idea._id}`} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg" title="View">
            <Eye className="w-4 h-4" />
          </Link>
          <button
            onClick={() => {
              const reason = prompt('Rejection reason (optional):');
              if (reason !== null) {
                reviewIdeaMutation.mutate({ id: idea._id, approve: false, reason });
              }
            }}
            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
            title="Reject"
          >
            <XCircle className="w-4 h-4" />
          </button>
          <button
            onClick={() => reviewIdeaMutation.mutate({ id: idea._id, approve: true })}
            className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg"
            title="Approve"
          >
            <CheckCircle2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );

  const renderProjectRow = (project) => (
    <tr key={project._id} className="hover:bg-gray-50/50">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <FolderKanban className="w-5 h-5 text-blue-500" />
          <span className="font-medium text-sm">{project.title}</span>
        </div>
        <p className="text-xs text-gray-500 line-clamp-1 max-w-xs mt-0.5">{project.description}</p>
      </td>
      <td className="px-4 py-3">
        <div>
          <p className="font-medium">{project.owner?.name || 'Unknown'}</p>
          <p className="text-xs text-gray-500">{project.owner?.email}</p>
        </div>
      </td>
      <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
        {timeSince(project.createdAt)}
      </td>
      <td className="px-4 py-3">
        <div className="flex justify-end gap-1">
          <Link to={`/projects/${project._id}`} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg" title="View">
            <Eye className="w-4 h-4" />
          </Link>
          <button
            onClick={() => {
              const reason = prompt('Rejection reason (optional):');
              if (reason !== null) {
                reviewProjectMutation.mutate({ id: project._id, approve: false, reason });
              }
            }}
            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
            title="Reject"
          >
            <XCircle className="w-4 h-4" />
          </button>
          <button
            onClick={() => reviewProjectMutation.mutate({ id: project._id, approve: true })}
            className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg"
            title="Approve"
          >
            <CheckCircle2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );

  return (
    <div>
      <div className="flex gap-1 mb-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('ideas')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${activeTab === 'ideas' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          <Lightbulb className="w-4 h-4 inline mr-1" /> Ideas ({ideas.length})
        </button>
        <button
          onClick={() => setActiveTab('projects')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${activeTab === 'projects' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          <FolderKanban className="w-4 h-4 inline mr-1" /> Projects ({projects.length})
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto" />
        </div>
      ) : activeTab === 'ideas' ? (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                  <th className="px-4 py-3 font-medium">Idea</th>
                  <th className="px-4 py-3 font-medium">Author</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Submitted</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {ideas.map(renderIdeaRow)}
                {ideas.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                      No ideas pending approval.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                  <th className="px-4 py-3 font-medium">Project</th>
                  <th className="px-4 py-3 font-medium">Owner</th>
                  <th className="px-4 py-3 font-medium">Submitted</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {projects.map(renderProjectRow)}
                {projects.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                      No projects pending approval.
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

export default AdminApprovals;