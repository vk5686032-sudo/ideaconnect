import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CheckSquare, Plus, X, Trash2, Calendar, Flag, GripVertical, Pencil, User,
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

const PRIORITY_ORDER = { urgent: 0, high: 1, medium: 2, low: 3 };

const COLUMNS = [
  { key: 'todo', label: 'To Do', dot: 'bg-gray-400' },
  { key: 'in-progress', label: 'In Progress', dot: 'bg-blue-500' },
  { key: 'review', label: 'Review', dot: 'bg-purple-500' },
  { key: 'completed', label: 'Completed', dot: 'bg-green-500' },
];

const EMPTY_FORM = {
  title: '',
  description: '',
  assignedTo: '',
  priority: 'medium',
  status: 'todo',
  dueDate: '',
  labels: '',
};

// The drop handler writes `order` optimistically, so an in-flight refetch that
// lands before the reorder mutation settles would otherwise undo the user's
// drop. Carry that one field across, but let the server own everything else.
// Merging the whole local object instead (the previous behaviour) meant a
// status change from the edit modal never reached the board.
export const mergeServerTasks = (prev, serverTasks) => {
  const localOrder = new Map(prev.map((t) => [t._id, t.order]));
  return serverTasks.map((t) =>
    localOrder.has(t._id) ? { ...t, order: localOrder.get(t._id) } : t
  );
};

const TaskBoard = ({ project }) => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const [modal, setModal] = useState(null); // { mode: 'create'|'edit', status?, task? }
  const [form, setForm] = useState(EMPTY_FORM);
  const [dragTaskId, setDragTaskId] = useState(null);
  const [dragOver, setDragOver] = useState(null); // { status, taskId } target
  const [localTasks, setLocalTasks] = useState([]);
  const didDrag = useRef(false); // suppress click that fires after an actual drag

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

  const serverTasks = tasksData?.data?.data || [];
  // Stable dependency: only re-sync when the fetched task list actually changes
  const serverTaskKey = serverTasks.map((t) => t._id + ':' + (t.status || '') + ':' + (t.title || '')).join('|');

  // Keep localTasks in sync with server data, preserving only the optimistic
  // drop order. See mergeServerTasks for why the local copy must not win.
  useEffect(() => {
    setLocalTasks((prev) => mergeServerTasks(prev, serverTasks));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverTaskKey]);

  const invalidate = () => {
    queryClient.invalidateQueries(['project-tasks', project._id]);
    queryClient.invalidateQueries(['project', project._id]); // progress recalcs server-side
  };

  const createMutation = useMutation({
    mutationFn: (data) => taskApi.create(project._id, data),
    onSuccess: () => {
      invalidate();
      toast.success('Task created');
      closeModal();
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to create task'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => taskApi.update(id, data),
    onSuccess: () => {
      invalidate();
      toast.success('Task updated');
      closeModal();
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to update task'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => taskApi.delete(id),
    onSuccess: () => {
      invalidate();
      toast.success('Task deleted');
      closeModal();
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to delete task'),
  });

  const reorderMutation = useMutation({
    mutationFn: (payload) => taskApi.reorder(project._id, payload),
    onSuccess: () => invalidate(),
    onError: () => {
      toast.error('Failed to reorder tasks');
      invalidate(); // refetch to revert to server order
    },
  });

  // Tasks grouped by status column, each sorted by order then priority
  const grouped = useMemo(() => {
    const map = Object.fromEntries(COLUMNS.map((c) => [c.key, []]));
    for (const t of localTasks) {
      if (map[t.status]) map[t.status].push(t);
      else map.todo.push(t);
    }
    for (const key of Object.keys(map)) {
      map[key].sort(
        (a, b) =>
          (a.order ?? 0) - (b.order ?? 0) ||
          (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9) ||
          new Date(a.createdAt) - new Date(b.createdAt)
      );
    }
    return map;
  }, [localTasks]);

  const completedCount = localTasks.filter((t) => t.status === 'completed').length;

  const openCreate = (status) => {
    setForm({ ...EMPTY_FORM, status: status || 'todo' });
    setModal({ mode: 'create', status: status || 'todo' });
  };

  const openEdit = (task) => {
    setForm({
      title: task.title || '',
      description: task.description || '',
      assignedTo: task.assignedTo?._id || task.assignedTo || '',
      priority: task.priority || 'medium',
      status: task.status || 'todo',
      dueDate: task.dueDate ? task.dueDate.slice(0, 10) : '',
      labels: (task.labels || []).join(', '),
    });
    setModal({ mode: 'edit', task });
  };

  const closeModal = () => {
    setModal(null);
    setForm(EMPTY_FORM);
  };

  const handleSave = () => {
    if (!form.title.trim()) {
      toast.error('Task title is required');
      return;
    }
    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      assignedTo: form.assignedTo || undefined,
      priority: form.priority,
      status: form.status,
      dueDate: form.dueDate || undefined,
      labels: form.labels
        ? form.labels.split(',').map((l) => l.trim()).filter(Boolean)
        : [],
    };

    if (modal.mode === 'edit') {
      updateMutation.mutate({ id: modal.task._id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleDelete = () => {
    if (!modal?.task) return;
    if (!window.confirm(`Delete task "${modal.task.title}"?`)) return;
    deleteMutation.mutate(modal.task._id);
  };

  // ── Drag & drop ─────────────────────────────────────────────
  const moveTask = (taskId, targetStatus, targetIndex) => {
    const task = localTasks.find((t) => t._id === taskId);
    if (!task) return;

    // 1. Remove from current position
    const without = localTasks.filter((t) => t._id !== taskId);
    // 2. Compute new column list with the task inserted at targetIndex
    const newCol = without.filter((t) => t.status === targetStatus);
    newCol.splice(targetIndex, 0, { ...task, status: targetStatus });

    // 3. Rebuild full list; assign order = index within its column
    const byCol = Object.fromEntries(COLUMNS.map((c) => [c.key, []]));
    for (const t of without) if (byCol[t.status]) byCol[t.status].push(t);
    byCol[targetStatus] = newCol;

    const reordered = [];
    const payload = [];
    for (const c of COLUMNS) {
      byCol[c.key].forEach((t, i) => {
        const order = i;
        reordered.push({ ...t, order });
        // Only send tasks whose order/status actually changed
        if (t._id === taskId || t.order !== order || t.status !== c.key) {
          payload.push({ _id: t._id, status: c.key, order });
        }
      });
    }

    // Optimistic update + persist
    setLocalTasks(reordered);
    setDragTaskId(null);
    setDragOver(null);
    if (payload.length) reorderMutation.mutate(payload);
  };

  const handleColumnDrop = (status) => (e) => {
    e.preventDefault();
    if (!dragTaskId) return;
    const colTasks = grouped[status];
    let index = colTasks.length;
    if (dragOver?.status === status && dragOver?.taskId) {
      const idx = colTasks.findIndex((t) => t._id === dragOver.taskId);
      if (idx >= 0) index = idx;
    }
    moveTask(dragTaskId, status, index);
  };

  const handleTaskDragOver = (task) => (e) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const before = e.clientY < rect.top + rect.height / 2;
    const over = { status: task.status, taskId: task._id };
    setDragOver((prev) => (prev?.status === over.status && prev?.taskId === over.taskId ? prev : over));
    if (before) {
      setDragOver({ status: task.status, taskId: task._id });
    } else {
      const col = grouped[task.status];
      const idx = col.findIndex((t) => t._id === task._id);
      const next = col[idx + 1];
      setDragOver({ status: task.status, taskId: next ? next._id : null });
    }
  };

  const isDragOver = (status, taskId) =>
    dragOver?.status === status && dragOver?.taskId === taskId;

  return (
    <div className="card">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <CheckSquare className="w-5 h-5" /> Tasks
          <span className="text-sm text-gray-400 font-normal">
            ({completedCount}/{localTasks.length} done)
          </span>
        </h2>
        {isMember && (
          <button onClick={() => openCreate('todo')} className="btn-primary text-sm flex items-center gap-1">
            <Plus className="w-4 h-4" /> Add Task
          </button>
        )}
      </div>

      {isMember && (
        <p className="text-[11px] text-gray-400 mb-3 flex items-center gap-1">
          <GripVertical className="w-3 h-3" />
          <span className="hidden sm:inline">Drag cards to move or reorder them.</span>
          <span className="sm:hidden">Tap a card to edit or change its status.</span>
        </p>
      )}

      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto" />
        </div>
      ) : localTasks.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-8">
          No tasks yet. {isMember ? 'Add the first task to get started.' : ''}
        </p>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-3 -mx-1 px-1 xl:grid xl:grid-cols-4 xl:gap-4 xl:overflow-visible">
          {COLUMNS.map((col) => {
            const tasks = grouped[col.key];
            return (
              <div
                key={col.key}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleColumnDrop(col.key)}
                className={`flex-none w-[78vw] sm:w-64 xl:w-auto rounded-xl p-2.5 min-h-[120px] transition-colors ${
                  dragTaskId ? 'bg-gray-50' : 'bg-transparent'
                }`}
              >
                {/* Column header */}
                <div className="flex items-center justify-between px-1 mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${col.dot}`} />
                    <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      {col.label}
                    </span>
                    <span className="text-xs text-gray-400">{tasks.length}</span>
                  </div>
                  {isMember && (
                    <button
                      onClick={() => openCreate(col.key)}
                      className="p-1 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded"
                      title={`Add task to ${col.label}`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Column body */}
                <div className="space-y-2">
                  {tasks.length === 0 && (
                    <div
                      onDragOver={(e) => e.preventDefault()}
                      className={`rounded-lg border-2 border-dashed py-6 text-center text-xs text-gray-300 ${
                        dragTaskId ? 'border-primary-300 text-primary-400' : ''
                      }`}
                    >
                      {dragTaskId ? 'Drop here' : 'Empty'}
                    </div>
                  )}
                  {tasks.map((task) => (
                    <div
                      key={task._id}
                      draggable={isMember}
                      onDragStart={(e) => {
                        e.dataTransfer.effectAllowed = 'move';
                        e.dataTransfer.setData('text/plain', task._id);
                        setDragTaskId(task._id);
                        didDrag.current = true;
                      }}
                      onDragEnd={() => {
                        setDragTaskId(null);
                        setDragOver(null);
                        setTimeout(() => (didDrag.current = false), 0); // let the click resolve first
                      }}
                      onDragOver={handleTaskDragOver(task)}
                      onClick={() => {
                        if (didDrag.current) return; // skip click that follows an actual drag
                        if (isMember) openEdit(task);
                      }}
                      className={`group relative rounded-lg border p-3 cursor-grab active:cursor-grabbing transition-all bg-white ${
                        task.status === 'completed' ? 'opacity-60' : ''
                      } ${
                        isDragOver(col.key, task._id)
                          ? 'border-primary-400 ring-2 ring-primary-100 translate-y-1'
                          : 'border-gray-100 hover:border-gray-200 hover:shadow-sm'
                      }`}
                    >
                      {isMember && (
                        <GripVertical className="hidden sm:block w-3.5 h-3.5 text-gray-300 group-hover:text-gray-400 absolute -left-1 top-2.5" />
                      )}
                      <div className="flex items-start justify-between gap-2 pl-1">
                        <p className={`font-medium text-sm ${task.status === 'completed' ? 'line-through text-gray-400' : ''}`}>
                          {task.title}
                        </p>
                        <span className={`badge shrink-0 ${PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.medium}`}>
                          <Flag className="w-3 h-3 inline mr-0.5 -mt-0.5" />
                          {task.priority}
                        </span>
                      </div>

                      {task.description && (
                        <p className="text-xs text-gray-500 mt-1 pl-1 line-clamp-2">{task.description}</p>
                      )}

                      {task.labels?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2 pl-1">
                          {task.labels.slice(0, 3).map((l) => (
                            <span key={l} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
                              {l}
                            </span>
                          ))}
                          {task.labels.length > 3 && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-400">
                              +{task.labels.length - 3}
                            </span>
                          )}
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-2.5 mt-2 pl-1 text-[11px] text-gray-500">
                        {task.assignedTo && (
                          <span className="flex items-center gap-1">
                            {task.assignedTo.avatar?.url ? (
                              <img src={task.assignedTo.avatar.url} alt="" className="w-4 h-4 rounded-full" />
                            ) : (
                              <span className="w-4 h-4 rounded-full bg-primary-100 inline-flex items-center justify-center">
                                <User className="w-2.5 h-2.5 text-primary-500" />
                              </span>
                            )}
                            <span className="truncate max-w-[80px]">{task.assignedTo.name}</span>
                          </span>
                        )}
                        {task.dueDate && (
                          <span
                            className={`flex items-center gap-1 ${
                              new Date(task.dueDate) < new Date() && task.status !== 'completed'
                                ? 'text-red-500 font-medium'
                                : ''
                            }`}
                          >
                            <Calendar className="w-3 h-3" />
                            {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                        )}
                        {isMember && (
                          <span className="ml-auto flex items-center gap-1.5 text-gray-400 sm:opacity-0 sm:group-hover:opacity-100 sm:transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openEdit(task);
                              }}
                              className="p-1 hover:text-primary-600 hover:bg-primary-50 rounded"
                              title="Edit task"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm(`Delete task "${task.title}"?`)) deleteMutation.mutate(task._id);
                              }}
                              className="p-1 hover:text-red-500 hover:bg-red-50 rounded"
                              title="Delete task"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={closeModal} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="text-lg font-semibold">
                {modal.mode === 'edit' ? 'Edit Task' : 'New Task'}
              </h3>
              <button onClick={closeModal} className="p-1 text-gray-400 hover:text-gray-600 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Title *</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Task title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                <textarea
                  className="input-field resize-none"
                  rows={3}
                  placeholder="What needs to be done?"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Assignee</label>
                  <select
                    className="input-field"
                    value={form.assignedTo}
                    onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
                  >
                    <option value="">Unassigned</option>
                    {memberOptions.map((m) => (
                      <option key={m._id} value={m._id}>{m.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Priority</label>
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
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                  <select
                    className="input-field"
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                  >
                    {COLUMNS.map((c) => (
                      <option key={c.key} value={c.key}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Due date</label>
                  <input
                    type="date"
                    className="input-field"
                    value={form.dueDate}
                    onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Labels <span className="text-gray-400 font-normal">(comma separated)</span>
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="frontend, bug, urgent"
                  value={form.labels}
                  onChange={(e) => setForm({ ...form, labels: e.target.value })}
                />
              </div>

              <div className="flex items-center gap-2 pt-2 border-t">
                {modal.mode === 'edit' && (
                  <button
                    onClick={handleDelete}
                    disabled={deleteMutation.isLoading}
                    className="btn-danger text-sm flex items-center gap-1"
                  >
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
                )}
                <button
                  onClick={closeModal}
                  className="btn-secondary text-sm ml-auto"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={createMutation.isLoading || updateMutation.isLoading}
                  className="btn-primary text-sm"
                >
                  {modal.mode === 'edit' ? 'Save Changes' : 'Create Task'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskBoard;
