import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ListTodo } from 'lucide-react-native';

import { Badge } from '@/components/Badge';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { ListSkeleton } from '@/components/Skeleton';
import { ErrorState } from '@/components/ErrorState';
import { StatusPickerModal } from '@/components/StatusPickerModal';
import { projectKeys, useMyTasks, useUpdateTask } from '@/hooks/queries/useProjects';
import { useQueryClient } from '@tanstack/react-query';
import type { ProjectTask } from '@/types/models';
import { titleCase } from '@/utils/format';

type TaskStatusTone = 'primary' | 'success' | 'warning' | 'error' | 'neutral';

const taskStatusTones: Record<ProjectTask['status'], TaskStatusTone> = {
  todo: 'neutral',
  'in-progress': 'primary',
  review: 'warning',
  completed: 'success',
  cancelled: 'error',
};

export default function HomeScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const myTasks = useMyTasks();
  const updateTask = useUpdateTask();
  const [pickerTask, setPickerTask] = useState<ProjectTask | null>(null);

  const openTasks = useMemo(
    () =>
      (myTasks.data?.data ?? [])
        .filter((task) => task.status !== 'completed' && task.status !== 'cancelled')
        .slice(0, 8),
    [myTasks.data]
  );

  const resolveProjectId = (task: ProjectTask): string =>
    typeof task.project === 'string' ? task.project : task.project._id;

  const resolveProjectTitle = (task: ProjectTask): string =>
    typeof task.project === 'string' ? 'Project' : task.project.title;

  return (
    <View className="flex-1 bg-gray-50 dark:bg-[#0b0f19]">
      <ScrollView contentContainerClassName="px-4 pb-8 pt-4">
        <View className="gap-1 mb-6">
          <Text className="font-sans-bold text-2xl text-gray-900 dark:text-gray-100">
            Home
          </Text>
          <Text className="font-sans text-sm text-gray-500 dark:text-gray-400">
            Your tasks at a glance
          </Text>
        </View>

        <View className="flex-row items-center justify-between mb-3">
          <Text className="font-sans-bold text-base text-gray-900 dark:text-gray-100">
            My Tasks
          </Text>
          {(myTasks.data?.data.length ?? 0) > 0 ? (
            <Text className="font-sans text-xs text-gray-400 dark:text-gray-500">
              tap a task to change status
            </Text>
          ) : null}
        </View>

        {myTasks.isLoading ? (
          <ListSkeleton rows={4} />
        ) : myTasks.isError ? (
          <ErrorState
            title="Couldn't load your tasks"
            onRetry={() => void myTasks.refetch()}
            retrying={myTasks.isFetching}
          />
        ) : openTasks.length === 0 ? (
          <EmptyState
            icon={ListTodo}
            title="No open tasks"
            message={
              myTasks.data?.data.length
                ? 'All caught up ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â nice work!'
                : 'Tasks assigned to you across your projects will appear here.'
            }
          />
        ) : (
          <View className="gap-2">
            {openTasks.map((task) => (
              <Card key={task._id} className="p-0">
                <Pressable
                  onPress={() => setPickerTask(task)}
                  className="flex-row items-center gap-2.5 px-3 py-3 active:opacity-70">
                  <Badge label={titleCase(task.status)} tone={taskStatusTones[task.status]} />
                  <View className="flex-1">
                    <Text
                      numberOfLines={1}
                      className="font-sans-medium text-sm text-gray-900 dark:text-gray-100">
                      {task.title}
                    </Text>
                    <Pressable
                      onPress={() =>
                        router.push({
                          pathname: '/projects/[id]',
                          params: { id: resolveProjectId(task) },
                        })
                      }>
                      <Text numberOfLines={1} className="font-sans text-[11px] text-primary-600 dark:text-primary-400">
                        {resolveProjectTitle(task)}
                      </Text>
                    </Pressable>
                  </View>
                </Pressable>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>

      <StatusPickerModal
        visible={pickerTask !== null}
        current={pickerTask?.status}
        onClose={() => setPickerTask(null)}
        onSelect={(status) => {
          if (!pickerTask) return;
          updateTask.mutate({ taskId: pickerTask._id, status });
          void qc.invalidateQueries({ queryKey: projectKeys.myTasks() });
          void qc.invalidateQueries({
            queryKey: projectKeys.tasks(resolveProjectId(pickerTask)),
          });
        }}
      />
    </View>
  );
}
