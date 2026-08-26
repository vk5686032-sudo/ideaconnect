import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { projectApi, type ProjectFilters } from '@/api/project.api';
import { taskApi, type CreateTaskPayload } from '@/api/task.api';
import type {
  ApiSuccess,
  Project,
  ProjectTask,
  TaskStatus,
} from '@/types/models';

export const projectKeys = {
  all: ['projects'] as const,
  lists: () => [...projectKeys.all, 'list'] as const,
  list: (filters: ProjectFilters) => [...projectKeys.lists(), filters] as const,
  details: () => [...projectKeys.all, 'detail'] as const,
  detail: (id: string) => [...projectKeys.details(), id] as const,
  tasks: (projectId: string) => [...projectKeys.all, 'tasks', projectId] as const,
  myTasks: () => [...projectKeys.all, 'my-tasks'] as const,
  joinRequests: (projectId: string) =>
    [...projectKeys.all, 'join-requests', projectId] as const,
};

const PAGE_SIZE = 10;

type TasksData = ApiSuccess<ProjectTask[]>;

function recomputeProgress(project: Project, tasks: ProjectTask[]): number {
  if (tasks.length === 0) return project.progress;
  const completed = tasks.filter((task) => task.status === 'completed').length;
  return Math.round((completed / tasks.length) * 100);
}

function patchTasksEverywhere(
  qc: ReturnType<typeof useQueryClient>,
  taskId: string,
  updater: (task: ProjectTask) => ProjectTask
): void {
  const taskEntries = qc.getQueriesData<TasksData>({
    queryKey: projectKeys.all,
  });

  for (const [key, data] of taskEntries) {
    const keyString = JSON.stringify(key);
    const isTasksCache =
      keyString.includes('"tasks"') || keyString.includes('"my-tasks"');
    if (!isTasksCache || !data?.data) continue;

    let changed = false;
    const nextData: ProjectTask[] = data.data.map((task) => {
      if (task._id !== taskId) return task;
      changed = true;
      return updater(task);
    });
    if (changed) {
      qc.setQueryData<TasksData>(key, { ...data, data: nextData });
    }
  }

  const detailEntries = qc.getQueriesData<ApiSuccess<Project>>({
    queryKey: projectKeys.details(),
  });

  for (const [key, detail] of detailEntries) {
    if (!detail?.data) continue;
    const embeddedTasks = (detail.data.tasks ?? []).filter(
      (task): task is ProjectTask => typeof task !== 'string'
    );
    if (!embeddedTasks.some((task) => task._id === taskId)) continue;

    const nextTasks = embeddedTasks.map((task) =>
      task._id === taskId ? updater(task) : task
    );
    qc.setQueryData<ApiSuccess<Project>>(key, {
      ...detail,
      data: {
        ...detail.data,
        progress: recomputeProgress(detail.data, nextTasks),
        tasks: nextTasks,
      },
    });
  }
}

export function useProjectsFeed(
  filters: Omit<ProjectFilters, 'page' | 'limit'>
) {
  return useInfiniteQuery({
    queryKey: projectKeys.list(filters),
    queryFn: async ({ pageParam }) => {
      const res = await projectApi.getProjects({
        ...filters,
        page: pageParam,
        limit: PAGE_SIZE,
      });
      return res.data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.page < lastPage.pagination.pages
        ? lastPage.pagination.page + 1
        : undefined,
  });
}

export function useProject(projectId: string) {
  return useQuery({
    queryKey: projectKeys.detail(projectId),
    queryFn: async () => {
      const res = await projectApi.getProjectById(projectId);
      return res.data;
    },
    enabled: !!projectId,
  });
}

export function useProjectTasks(projectId: string) {
  return useQuery({
    queryKey: projectKeys.tasks(projectId),
    queryFn: async () => {
      const res = await taskApi.getProjectTasks(projectId);
      return res.data;
    },
    enabled: !!projectId,
  });
}

export function useMyTasks() {
  return useQuery({
    queryKey: projectKeys.myTasks(),
    queryFn: async () => {
      const res = await taskApi.getMyTasks();
      return res.data;
    },
  });
}

export function useJoinRequests(projectId: string) {
  return useQuery({
    queryKey: projectKeys.joinRequests(projectId),
    queryFn: async () => {
      const res = await projectApi.getJoinRequests(projectId);
      return res.data;
    },
    enabled: !!projectId,
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      taskId,
      status,
    }: {
      taskId: string;
      status: TaskStatus;
    }) => taskApi.updateTask(taskId, { status }),
    onMutate: ({ taskId, status }) => {
      patchTasksEverywhere(qc, taskId, (task) => ({
        ...task,
        status,
        dueDate: task.dueDate ?? null,
      }));
    },
    onSuccess: (res) => {
      patchTasksEverywhere(qc, res.data.data._id, () => res.data.data);
      void qc.invalidateQueries({ queryKey: projectKeys.details() });
    },
    onError: () => {
      void qc.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}

export function useCreateTask(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTaskPayload) => taskApi.createTask(projectId, data),
    onSuccess: (res) => {
      qc.setQueryData<TasksData>(projectKeys.tasks(projectId), (old) => ({
        ...(old ?? { success: true as const, message: '', data: [] as ProjectTask[] }),
        data: [res.data.data, ...(old?.data ?? [])],
      }));
      void qc.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
      void qc.invalidateQueries({ queryKey: projectKeys.myTasks() });
    },
  });
}

export function useToggleMilestone(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      milestoneId,
      completed,
    }: {
      milestoneId: string;
      completed: boolean;
    }) => projectApi.updateMilestone(projectId, milestoneId, { completed }),
    onMutate: ({ milestoneId, completed }) => {
      const previous =
        qc.getQueryData<ApiSuccess<Project>>(projectKeys.detail(projectId)) ??
        undefined;
      qc.setQueryData<ApiSuccess<Project>>(
        projectKeys.detail(projectId),
        (old) => {
          if (!old?.data) return old;
          return {
            ...old,
            data: {
              ...old.data,
              milestones: old.data.milestones.map((milestone) =>
                milestone._id === milestoneId
                  ? {
                      ...milestone,
                      completed,
                      completedAt: completed
                        ? new Date().toISOString()
                        : null,
                    }
                  : milestone
              ),
            },
          };
        }
      );
      return { previous };
    },
    onSuccess: (res) => {
      qc.setQueryData<ApiSuccess<Project>>(
        projectKeys.detail(projectId),
        (old) =>
          old?.data
            ? { ...old, data: { ...old.data, milestones: res.data.data } }
            : old
      );
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) {
        qc.setQueryData<ApiSuccess<Project>>(
          projectKeys.detail(projectId),
          context.previous
        );
      }
    },
  });
}

export function useAddMilestone(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { title: string; description?: string }) =>
      projectApi.addMilestone(projectId, data),
    onSuccess: (res) => {
      qc.setQueryData<ApiSuccess<Project>>(
        projectKeys.detail(projectId),
        (old) =>
          old?.data
            ? { ...old, data: { ...old.data, milestones: res.data.data } }
            : old
      );
    },
  });
}

export function useRequestToJoin(projectId: string) {
  return useMutation({
    mutationFn: (message: string) => projectApi.requestToJoin(projectId, message),
  });
}

export function useHandleJoinRequest(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      invitationId,
      action,
    }: {
      invitationId: string;
      action: 'accept' | 'reject';
    }) => projectApi.handleJoinRequest(invitationId, action),
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: projectKeys.joinRequests(projectId),
      });
      void qc.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
    },
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: projectApi.createProject,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: projectKeys.lists() });
    },
  });
}
