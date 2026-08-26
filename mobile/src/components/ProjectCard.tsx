import { Pressable, Text, View } from 'react-native';
import { Users } from 'lucide-react-native';

import { Avatar } from './Avatar';
import { Badge } from './Badge';
import { ProgressBar } from './ProgressBar';
import type { IdeaAuthor, Project, ProjectStatus } from '@/types/models';
import { timeAgo, titleCase } from '@/utils/format';

type StatusTone = 'primary' | 'success' | 'warning' | 'error' | 'neutral';

const statusTones: Record<ProjectStatus, StatusTone> = {
  planning: 'warning',
  'in-progress': 'primary',
  'on-hold': 'neutral',
  completed: 'success',
  cancelled: 'error',
  'pending-approval': 'warning',
  rejected: 'error',
};

interface ProjectCardProps {
  project: Project;
  onPress?: () => void;
  className?: string;
}

function resolveOwner(owner: IdeaAuthor | string): IdeaAuthor | null {
  return typeof owner === 'string' ? null : owner;
}

export function ProjectCard({ project, onPress, className = '' }: ProjectCardProps) {
  const owner = resolveOwner(project.owner);
  const activeMembers = project.members.filter(
    (member) => typeof member.user !== 'string'
  ).length;

  return (
    <Pressable
      onPress={onPress}
      className={`rounded-xl border border-gray-100 bg-white p-4 active:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:active:bg-gray-800 ${className}`}>
      <View className="mb-2 flex-row items-center justify-between">
        <Badge label={titleCase(project.status)} tone={statusTones[project.status]} />
        {project.visibility === 'private' ? (
          <Badge label="Private" tone="neutral" />
        ) : null}
      </View>

      <Text
        numberOfLines={2}
        className="font-sans-semibold text-base leading-snug text-gray-900 dark:text-gray-100">
        {project.title}
      </Text>
      <Text
        numberOfLines={2}
        className="mt-1 font-sans text-sm leading-snug text-gray-500 dark:text-gray-400">
        {project.description}
      </Text>

      {owner ? (
        <View className="mt-3 flex-row items-center gap-2">
          <Avatar name={owner.name} uri={owner.avatar?.url ?? null} size={24} />
          <Text
            numberOfLines={1}
            className="flex-1 font-sans-medium text-xs text-gray-600 dark:text-gray-300">
            {owner.name}
          </Text>
          <View className="flex-row items-center gap-1">
            <Users size={13} color="#9ca3af" strokeWidth={2.2} />
            <Text className="font-sans-medium text-xs text-gray-500 dark:text-gray-400">
              {Math.max(activeMembers, 1)}
            </Text>
          </View>
          <Text className="font-sans text-xs text-gray-400 dark:text-gray-500">
            {timeAgo(project.createdAt)}
          </Text>
        </View>
      ) : null}

      {project.technologies.length > 0 ? (
        <Text
          numberOfLines={1}
          className="mt-2 font-sans text-[11px] text-gray-400 dark:text-gray-500">
          {project.technologies.slice(0, 4).join(' · ')}
        </Text>
      ) : null}

      <View className="mt-3 border-t border-gray-100 pt-3 dark:border-gray-800">
        <ProgressBar value={project.progress} showLabel />
      </View>
    </Pressable>
  );
}
