import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import {
    CheckCircle2,
    Circle,
    ExternalLink,
    FolderX,
    Plus,
  } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { isAxiosError } from 'axios';

import { Avatar } from '@/components/Avatar';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Chip } from '@/components/Chip';
import { EmptyState } from '@/components/EmptyState';
import { Input } from '@/components/Input';
import { ProgressBar } from '@/components/ProgressBar';
import { PromptModal } from '@/components/PromptModal';
import { StatusPickerModal } from '@/components/StatusPickerModal';
import { chatApi } from '@/api/chat.api';
import {
  projectKeys,
  useAddMilestone,
  useCreateTask,
  useHandleJoinRequest,
  useJoinRequests,
  useProject,
  useProjectTasks,
  useRequestToJoin,
  useToggleMilestone,
  useUpdateTask,
} from '@/hooks/queries/useProjects';
import { useCurrentUser } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import type {
  ApiError,
  IdeaAuthor,
  ProjectMemberRole,
  ProjectStatus,
  ProjectTask,
  TaskPriority,
  TaskStatus,
} from '@/types/models';
import { timeAgo, titleCase } from '@/utils/format';

type StatusTone = 'primary' | 'success' | 'warning' | 'error' | 'neutral';

const projectStatusTones: Record<ProjectStatus, StatusTone> = {
  planning: 'warning',
  'in-progress': 'primary',
  'on-hold': 'neutral',
  completed: 'success',
  cancelled: 'error',
  'pending-approval': 'warning',
  rejected: 'error',
};

const taskStatusTones: Record<TaskStatus, StatusTone> = {
  todo: 'neutral',
  'in-progress': 'primary',
  review: 'warning',
  completed: 'success',
  cancelled: 'error',
};

const priorityColors: Record<TaskPriority, string> = {
  urgent: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#9ca3af',
};

const roleTones: Record<ProjectMemberRole, StatusTone> = {
  lead: 'primary',
  developer: 'neutral',
  designer: 'neutral',
  researcher: 'neutral',
  mentor: 'success',
};

function resolveUser(user: IdeaAuthor | string | null | undefined): IdeaAuthor | null {
  return typeof user === 'string' ? null : (user ?? null);
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <Text className="mb-2 font-sans-bold text-base text-gray-900 dark:text-gray-100">
      {children}
    </Text>
  );
}

function TaskRow({
  task,
  onPress,
}: {
  task: ProjectTask;
  onPress: (task: ProjectTask) => void;
}) {
  const assignee = resolveUser(task.assignedTo ?? null);
  return (
    <Pressable
      onPress={() => onPress(task)}
      className="flex-row items-center gap-2 rounded-lg border border-gray-100 bg-white px-3 py-2.5 active:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:active:bg-gray-800">
      <View
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: priorityColors[task.priority] }}
      />
      <View className="flex-1">
        <Text
          numberOfLines={1}
          className={`font-sans-medium text-sm text-gray-900 dark:text-gray-100 ${
            task.status === 'completed' || task.status === 'cancelled'
              ? 'line-through opacity-60'
              : ''
          }`}>
          {task.title}
        </Text>
        {assignee ? (
          <Text className="font-sans text-[11px] text-gray-400 dark:text-gray-500">
            {assignee.name}
          </Text>
        ) : null}
      </View>
      <Badge label={titleCase(task.status)} tone={taskStatusTones[task.status]} />
    </Pressable>
  );
}

export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const currentUser = useCurrentUser();
  const userId = currentUser?._id || currentUser?.id || '';

  const projectQuery = useProject(id);
  const tasksQuery = useProjectTasks(id);
  const joinRequestsQuery = useJoinRequests(id);

  const updateTask = useUpdateTask();
  const createTask = useCreateTask(id);
  const toggleMilestone = useToggleMilestone(id);
  const addMilestone = useAddMilestone(id);
  const requestToJoin = useRequestToJoin(id);
  const handleJoinRequest = useHandleJoinRequest(id);

  const [openingChat, setOpeningChat] = useState(false);

  const [statusPickerTask, setStatusPickerTask] = useState<ProjectTask | null>(null);
  const [joinPromptVisible, setJoinPromptVisible] = useState(false);
  const [milestonePromptVisible, setMilestonePromptVisible] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState<string>('me');
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>('medium');

  const project = projectQuery.data?.data;
  const tasks = useMemo(
    () => tasksQuery.data?.data ?? [],
    [tasksQuery.data]
  );

  const owner = useMemo(
    () => resolveUser(project?.owner ?? null),
    [project]
  );

  const isOwner =
    !!owner && !!userId && (owner._id || owner.id) === userId;

  const isMember = useMemo(
    () =>
      !!project &&
      !!userId &&
      project.members.some((member) => {
        if (typeof member.user === 'string') {
          return member.user === userId;
        }
        return (member.user._id || member.user.id) === userId;
      }),
    [project, userId]
  );

  const pendingRequests = useMemo(
    () =>
      (joinRequestsQuery.data?.data ?? []).filter(
        (request) => request.status === 'pending'
      ),
    [joinRequestsQuery.data]
  );

  const memberOptions = useMemo(() => {
    const members = (project?.members ?? [])
      .map((member) => resolveUser(member.user))
      .filter((member): member is IdeaAuthor => !!member);
    return members.length > 0 ? members : [];
  }, [project]);

  const uniqueMembers = useMemo(() => {
    const seen = new Set<string>();
    return (
      project?.members.filter((member) => {
        if (typeof member.user === 'string') {
          if (!member.user || seen.has(member.user)) return false;
          seen.add(member.user);
          return true;
        }
        const memberId = member.user._id || member.user.id || '';
        if (!memberId || seen.has(memberId)) return false;
        seen.add(memberId);
        return true;
      }) ?? []
    );
  }, [project]);

  const getErrorMessage = (error: unknown, fallback: string): string => {
    if (isAxiosError(error)) {
      const apiMessage = (error.response?.data as ApiError | undefined)?.message;
      if (apiMessage) return apiMessage;
    }
    return fallback;
  };

  const openTeamChat = async () => {
    setOpeningChat(true);
    try {
      const res = await chatApi.getProjectChat(project?._id ?? id);
      router.push({ pathname: '/chat/[id]', params: { id: res.data.data._id } });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: getErrorMessage(error, 'Failed to open team chat.'),
      });
    } finally {
      setOpeningChat(false);
    }
  };

  const submitJoinRequest = async (message: string) => {
    setJoinPromptVisible(false);
    try {
      await requestToJoin.mutateAsync(message);
      Toast.show({ type: 'success', text1: 'Request sent to the owner' });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: getErrorMessage(error, 'Failed to send request.'),
      });
    }
  };

  const handleAcceptReject = async (
    invitationId: string,
    action: 'accept' | 'reject'
  ) => {
    try {
      await handleJoinRequest.mutateAsync({ invitationId, action });
      Toast.show({
        type: 'success',
        text1: action === 'accept' ? 'Member added' : 'Request rejected',
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: getErrorMessage(error, `Failed to ${action} request.`),
      });
    }
  };

  const submitNewTask = async () => {
    const title = newTaskTitle.trim();
    if (!title) return;
    const assigneeOption =
      newTaskAssignee === 'me' ? null : newTaskAssignee;
    const assignedTo =
      assigneeOption ??
      (currentUser?._id || currentUser?.id || undefined);

    try {
      await createTask.mutateAsync({
        title,
        assignedTo,
        priority: newTaskPriority,
      });
      setNewTaskTitle('');
      setShowAddTask(false);
      Toast.show({ type: 'success', text1: 'Task added' });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: getErrorMessage(error, 'Failed to create task.'),
      });
    }
  };

  if (projectQuery.isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 dark:bg-[#0b0f19]">
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  if (projectQuery.isError || !project) {
    return (
      <View className="flex-1 justify-center bg-gray-50 dark:bg-[#0b0f19]">
        <Stack.Screen options={{ title: 'Not found' }} />
<EmptyState
      icon={FolderX}
      title="Project unavailable"
      message="It may have been deleted, or you don't have access to it."
    />
        <Button
          title="Go back"
          variant="outline"
          className="mx-6"
          onPress={() => router.back()}
        />
      </View>
    );
  }

  const milestones = project.milestones ?? [];
  const completedMilestones = milestones.filter(
    (milestone) => milestone.completed
  ).length;

  return (
    <>
      <Stack.Screen options={{ title: 'Project' }} />

      <ScrollView contentContainerClassName="px-4 pb-10 pt-3">
        <View className="mb-2 flex-row flex-wrap items-center gap-2">
          <Badge
            label={titleCase(project.status)}
            tone={projectStatusTones[project.status]}
          />
          {project.visibility === 'private' ? (
            <Badge label="Private" tone="neutral" />
          ) : null}
        </View>

        <Text className="font-sans-bold text-xl leading-tight text-gray-900 dark:text-gray-100">
          {project.title}
        </Text>

        {owner ? (
          <View className="mt-3 flex-row items-center gap-2.5">
            <Avatar name={owner.name} uri={owner.avatar?.url ?? null} size={36} />
            <View className="flex-1">
              <Text className="font-sans-semibold text-sm text-gray-900 dark:text-gray-100">
                {owner.name}
              </Text>
              <Text className="font-sans text-xs text-gray-400 dark:text-gray-500">
                Owner · started {timeAgo(project.createdAt)}
              </Text>
            </View>
          </View>
        ) : null}

        <Card className="mt-4">
          <View className="flex-row items-center justify-between">
            <Text className="font-sans-semibold text-sm text-gray-900 dark:text-gray-100">
              Progress
            </Text>
            <Text className="font-sans-bold text-sm text-primary-600 dark:text-primary-400">
              {Math.round(project.progress)}%
            </Text>
          </View>
          <ProgressBar value={project.progress} className="mt-2" />
        </Card>

        {!isMember && !isOwner ? (
          <Button
            title={requestToJoin.isPending ? 'Sending…' : 'Request to join'}
            variant="soft"
            className="mt-4"
            onPress={() => setJoinPromptVisible(true)}
          />
        ) : null}

        {isMember || isOwner ? (
          <Button
            title={openingChat ? 'Opening chat…' : 'Open Team Chat'}
            variant="soft"
            className="mt-4"
            onPress={() => void openTeamChat()}
          />
        ) : null}

        <Text className="mt-4 font-sans text-[15px] leading-relaxed text-gray-700 dark:text-gray-300">
          {project.description}
        </Text>

        {project.technologies.length > 0 ? (
          <View className="mt-3 flex-row flex-wrap gap-2">
            {project.technologies.map((tech) => (
              <Chip key={tech} label={tech} />
            ))}
          </View>
        ) : null}

        {project.repository || project.demoUrl ? (
          <View className="mt-4 gap-2">
            {project.repository ? (
              <Pressable
                onPress={() => void Linking.openURL(project.repository!)}
                className="flex-row items-center gap-2">
                <ExternalLink size={15} color="#4f46e5" strokeWidth={2} />
                <Text numberOfLines={1} className="flex-1 font-sans-medium text-sm text-primary-600 dark:text-primary-400">
                  {project.repository}
                </Text>
              </Pressable>
            ) : null}
            {project.demoUrl ? (
              <Pressable
                onPress={() => void Linking.openURL(project.demoUrl!)}
                className="flex-row items-center gap-2">
                <ExternalLink size={15} color="#4f46e5" strokeWidth={2} />
                <Text numberOfLines={1} className="flex-1 font-sans-medium text-sm text-primary-600 dark:text-primary-400">
                  {project.demoUrl}
                </Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        <View className="mt-6">
          <View className="flex-row items-center justify-between">
            <SectionTitle>Milestones ({completedMilestones}/{milestones.length})</SectionTitle>
            {isOwner ? (
              <Pressable onPress={() => setMilestonePromptVisible(true)}>
                <Plus size={20} color="#4f46e5" strokeWidth={2.2} />
              </Pressable>
            ) : null}
          </View>

          {milestones.length === 0 ? (
            <Text className="font-sans text-sm text-gray-500 dark:text-gray-400">
              No milestones yet.
            </Text>
          ) : (
            <View className="gap-2">
              {milestones.map((milestone) => (
                <Pressable
                  key={milestone._id}
                  disabled={!isOwner}
                  onPress={() => {
                    if (!milestone._id) return;
                    toggleMilestone.mutate({
                      milestoneId: milestone._id,
                      completed: !milestone.completed,
                    });
                  }}
                  className="flex-row items-center gap-2.5 rounded-lg border border-gray-100 bg-white px-3 py-2.5 active:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:active:bg-gray-800">
                  {milestone.completed ? (
                    <CheckCircle2 size={20} color="#22c55e" strokeWidth={2} />
                  ) : (
                    <Circle size={20} color="#9ca3af" strokeWidth={2} />
                  )}
                  <View className="flex-1">
                    <Text
                      className={`font-sans-medium text-sm text-gray-900 dark:text-gray-100 ${
                        milestone.completed ? 'line-through opacity-60' : ''
                      }`}>
                      {milestone.title}
                    </Text>
                    {milestone.dueDate ? (
                      <Text className="font-sans text-[11px] text-gray-400 dark:text-gray-500">
                        Due {new Date(milestone.dueDate).toLocaleDateString()}
                      </Text>
                    ) : null}
                  </View>
                  {isOwner ? (
                    <Text className="font-sans text-[10px] text-gray-300 dark:text-gray-600">
                      tap to toggle
                    </Text>
                  ) : null}
                </Pressable>
              ))}
            </View>
          )}
        </View>

        <View className="mt-6">
          <SectionTitle>Members ({uniqueMembers.length})</SectionTitle>
          <View className="gap-2">
            {uniqueMembers.map((member, index) => {
              const user = resolveUser(member.user);
              if (!user) return null;
              const isProjectOwner =
                owner && (user._id || user.id) === (owner._id || owner.id);
              return (
                <View
                  key={`${(user._id || user.id) ?? 'member'}-${index}`}
                  className="flex-row items-center gap-2.5 rounded-lg border border-gray-100 bg-white px-3 py-2 dark:border-gray-800 dark:bg-gray-900">
                  <Avatar name={user.name} uri={user.avatar?.url ?? null} size={32} />
                  <Text
                    numberOfLines={1}
                    className="flex-1 font-sans-medium text-sm text-gray-900 dark:text-gray-100">
                    {isProjectOwner ? `${user.name} · Owner` : user.name}
                  </Text>
                  <Badge label={titleCase(member.role)} tone={roleTones[member.role]} />
                </View>
              );
            })}
          </View>
        </View>

        {isOwner && pendingRequests.length > 0 ? (
          <View className="mt-6">
            <SectionTitle>Join Requests ({pendingRequests.length})</SectionTitle>
            <View className="gap-2">
              {pendingRequests.map((request) => {
                const sender = resolveUser(request.sender);
                return (
                  <Card key={request._id}>
                    <View className="flex-row items-center gap-2.5">
                      <Avatar
                        name={sender?.name ?? '?'}
                        uri={sender?.avatar?.url ?? null}
                        size={32}
                      />
                      <View className="flex-1">
                        <Text className="font-sans-semibold text-sm text-gray-900 dark:text-gray-100">
                          {sender?.name ?? 'Unknown'}
                        </Text>
                        <Text className="font-sans text-xs text-gray-500 dark:text-gray-400" numberOfLines={2}>
                          {request.message || 'Wants to join your project'}
                        </Text>
                      </View>
                    </View>
                    <View className="mt-3 flex-row gap-2">
                      <Button
                        title="Accept"
                        className="flex-1"
                        loading={handleJoinRequest.isPending}
                        onPress={() => void handleAcceptReject(request._id, 'accept')}
                      />
                      <Button
                        title="Reject"
                        variant="outline"
                        className="flex-1"
                        onPress={() => void handleAcceptReject(request._id, 'reject')}
                      />
                    </View>
                  </Card>
                );
              })}
            </View>
          </View>
        ) : null}

        <View className="mt-6">
          <View className="flex-row items-center justify-between">
            <SectionTitle>Tasks ({tasks.length})</SectionTitle>
            {isMember || isOwner ? (
              <Pressable onPress={() => setShowAddTask((prev) => !prev)}>
                <Plus size={20} color="#4f46e5" strokeWidth={2.2} />
              </Pressable>
            ) : null}
          </View>

          {showAddTask && (isMember || isOwner) ? (
            <Card>
              <Input
                value={newTaskTitle}
                onChangeText={setNewTaskTitle}
                placeholder="Task title"
              />
              {memberOptions.length > 0 ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerClassName="mt-3 gap-2">
                  <Chip
                    label="Me"
                    active={newTaskAssignee === 'me'}
                    onPress={() => setNewTaskAssignee('me')}
                  />
                  {memberOptions.map((member) => (
                    <Chip
                      key={member._id || member.id}
                      label={member.name.split(' ')[0]}
                      active={newTaskAssignee === (member._id || member.id)}
                      onPress={() =>
                        setNewTaskAssignee(member._id || member.id || member.name)
                      }
                    />
                  ))}
                </ScrollView>
              ) : null}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerClassName="mt-2 gap-2">
                {(['low', 'medium', 'high', 'urgent'] as TaskPriority[]).map(
                  (priority) => (
                    <Chip
                      key={priority}
                      label={titleCase(priority)}
                      active={newTaskPriority === priority}
                      onPress={() => setNewTaskPriority(priority)}
                    />
                  )
                )}
              </ScrollView>
              <Button
                title="Add task"
                className="mt-3"
                loading={createTask.isPending}
                disabled={!newTaskTitle.trim()}
                onPress={() => void submitNewTask()}
              />
            </Card>
          ) : null}

          <View className="mt-3 gap-2 pb-2">
            {tasks.map((task) => (
              <TaskRow
                key={task._id}
                task={task}
                onPress={(target) => {
                  if (isMember || isOwner) {
                    setStatusPickerTask(target);
                  }
                }}
              />
            ))}
          </View>

          {!tasksQuery.isLoading && tasks.length === 0 ? (
            <Text className="font-sans text-sm text-gray-500 dark:text-gray-400">
              No tasks yet{isMember || isOwner ? ' — add the first one.' : '.'}
            </Text>
          ) : null}
        </View>
      </ScrollView>

      <StatusPickerModal
        visible={statusPickerTask !== null}
        current={statusPickerTask?.status}
        onClose={() => setStatusPickerTask(null)}
        onSelect={(status) => {
          if (!statusPickerTask) return;
          updateTask.mutate({ taskId: statusPickerTask._id, status });
          void qc.invalidateQueries({ queryKey: projectKeys.tasks(id) });
        }}
      />

      <PromptModal
        visible={joinPromptVisible}
        title="Request to join"
        placeholder="Tell the owner why you'd be a good fit…"
        multiline
        submitLabel="Send request"
        onClose={() => setJoinPromptVisible(false)}
        onSubmit={(value) => void submitJoinRequest(value)}
      />

      <PromptModal
        visible={milestonePromptVisible}
        title="New milestone"
        placeholder="e.g. MVP complete"
        submitLabel="Add milestone"
        loading={addMilestone.isPending}
        onClose={() => setMilestonePromptVisible(false)}
        onSubmit={(title) => {
          setMilestonePromptVisible(false);
          addMilestone.mutate({ title });
        }}
      />
    </>
  );
}
