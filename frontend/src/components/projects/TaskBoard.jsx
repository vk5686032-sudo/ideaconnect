import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CheckSquare, Check, Plus, X, Trash2, Calendar, Flag,
} from 'lucide-react';
import toast from 'react-hot-toast';
import taskApi from '../../api/task.api';
import useAuthStore from '../../store/authSlice';

const PRIORITY_STYLES = {
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-blue-100 text-blue-600',
  high: 'bg-yellow-100 text-yellow-700',
  urgent: 'bg-red-100 text-red-600',
};

const STATUS_STYLES = {
  todo: 'bg-gray-100 text-gray-600',
  'in-progress': 'bg-blue-100 text-blue-600',
  review: 'bg-purple-100 text-purple-600',
  completed: 'bg-green-100 text-green-600',
  cancelled: 'bg-red-100 text-red-600',
};

const TaskBoard = ({ project }) => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', assignedTo: '', priority: 'medium', dueDate: '' });

  const isMember =
    project?.owner?._id === user?._id ||
    project?.members?.some((m) => m.user?._id === user?._id || m._id === user?._id);

  const members = project?.members || [];
  const memberOptions = [
    ...members.map((m) => ({ _id: m.user?._id || m._id, name: m.user?.name || m.name })),
    ...(project?.owner ? [{ _id: project.owner._id, name: project.owner.name }] : []),
  ].filter((m, i, arr) => m._id && arr.findIndex((x) => x._id === m._id) === i);

  const { data: tasksData, isLoading } = useQuery({
    queryKey: ['project-tasks', project?._id],
    queryFn: () => taskApi.getByProject(project._id),
    enabled: !!project?._id,
  });

  const tasks = tasksData?.data?.data || [];

  const invalidate = () => {
    queryClient.invalidateQueries(['project-tasks', project._id]);
    queryClient.invalidateQueries(['project', project._id]); // progress recalcs server-side
  };

  const createMutation = useMutation({
    mutationFn: (data) => taskApi.create(project._id, data),
    onSuccess: () => {
      invalidate();
      toast.success('Task created');
      setForm({ title: '', description: '', assignedTo: '', priority: 'medium', dueDate: '' });
      setShowForm(false);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to create task'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => taskApi.update(id, data),
    onSuccess: () => {
      invalidate();
      toast.success('Task updated');
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to update task'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => taskApi.delete(id),
    onSuccess: () => {
      invalidate();
      toast.success('Task deleted');
    },
  });

  const handleCreate = () => {
    if (!form.title.trim()) return;
    createMutation.mutate({
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      assignedTo: form.assignedTo || undefined,
      priority: form.priority,
      dueDate: form.dueDate || undefined,
    });
  };

  const toggleComplete = (task) => {
    updateMutation.mutate({
      id: task._id,
      data: { status: task.status === 'completed' ? 'todo' : 'completed' },
    });
  };

  return (
    <div className="card">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <CheckSquare className="w-5 h-5" /> Tasks
          <span className="text-sm text-gray-400 font-normal">
            ({tasks.filter((t) => t.status === 'completed').length}/{tasks.length} done)
          </span>
        </h2>
        {isMember && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn-primary text-sm flex items-center gap-1"
          >
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showForm ? 'Cancel' : 'Add Task'}
          </button>
        )}
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-3">
          <input
            type="text"
            placeholder="Task title"
            className="input-field"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <textarea
            placeholder="Description (optional)"
            className="input-field resize-none"
            rows={2}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <select
              className="input-field"
              value={form.assignedTo}
              onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
            >
              <option value="">Assign to...</option>
              {memberOptions.map((m) => (
                <option key={m._id} value={m._id}>{m.name}</option>
              ))}
            </select>
            <select
              className="input-field"
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
            <input
              type="date"
              className="input-field"
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
            />
          </div>
          <button
            onClick={handleCreate}
            disabled={!form.title.trim() || createMutation.isLoading}
            className="btn-primary w-full sm:w-auto disabled:opacity-50"
          >
            Create Task
          </button>
        </div>
      )}

      {/* Task list */}
      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto" />
        </div>
      ) : tasks.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-8">
          No tasks yet. {isMember ? 'Add the first task to get started.' : ''}
        </p>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => (
            <div
              key={task._id}
              className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                task.status === 'completed' ? 'bg-gray-50 border-gray-100' : 'bg-white border-gray-100 hover:border-gray-200'
              }`}
            >
              {/* Toggle complete */}
              <button
                onClick={() => toggleComplete(task)}
                className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                  task.status === 'completed'
                    ? 'bg-green-500 border-green-500 text-white'
                    : 'border-gray-300 hover:border-primary-500'
                }`}
                title="Toggle done"
              >
                {task.status === 'completed' && <Check className="w-3 h-3" />}
              </button>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className={`font-medium ${task.status === 'completed' ? 'line-through text-gray-400' : ''}`}>
                    {task.title}
                  </p>
                  <span className={`badge ${PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.medium}`}>
                    <Flag className="w-3 h-3 inline mr-0.5 -mt-0.5" />
                    {task.priority}
                  </span>
                  <span className={`badge ${STATUS_STYLES[task.status] || STATUS_STYLES.todo}`}>
                    {task.status.replace('-', ' ')}
                  </span>
                </div>

                {task.description && (
                  <p className="text-sm text-gray-500 mt-1">{task.description}</p>
                )}

                <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-500">
                  {task.assignedTo && (
                    <span className="flex items-center gap-1.5">
                      {task.assignedTo.avatar?.url ? (
                        <img src={task.assignedTo.avatar.url} alt="" className="w-4 h-4 rounded-full" />
                      ) : (
                        <span className="w-4 h-4 rounded-full bg-primary-100 inline-block" />
                      )}
                      {task.assignedTo.name}
                    </span>
                  )}
                  {task.dueDate && (
                    <span className={`flex items-center gap-1 ${new Date(task.dueDate) < new Date() && task.status !== 'completed' ? 'text-red-500' : ''}`}>
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(task.dueDate).toLocaleDateString()}
                    </span>
                  )}
                  {isMember && (
                    <span className="ml-auto flex items-center gap-1">
                      <select
                        value={task.status}
                        onChange={(e) => updateMutation.mutate({ id: task._id, data: { status: e.target.value } })}
                        className="text-xs bg-gray-50 border border-gray-200 rounded px-1.5 py-1"
                      >
                        <option value="todo">Todo</option>
                        <option value="in-progress">In Progress</option>
                        <option value="review">Review</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                      <button
                        onClick={() => deleteMutation.mutate(task._id)}
                        className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                        title="Delete task"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TaskBoard;