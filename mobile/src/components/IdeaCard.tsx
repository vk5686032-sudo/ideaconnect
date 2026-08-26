import { Pressable, Text, View } from 'react-native';
import { Eye, Heart, MessageCircle } from 'lucide-react-native';

import { Avatar } from './Avatar';
import { Badge } from './Badge';
import type { Idea, IdeaAuthor, IdeaStatus } from '@/types/models';
import { timeAgo, titleCase } from '@/utils/format';

type StatusTone = 'primary' | 'success' | 'warning' | 'error' | 'neutral';

const statusTones: Record<IdeaStatus, StatusTone> = {
  open: 'success',
  'in-progress': 'warning',
  completed: 'primary',
  archived: 'neutral',
  draft: 'neutral',
  'pending-approval': 'warning',
  rejected: 'error',
};

interface IdeaCardProps {
  idea: Idea;
  onPress?: () => void;
  className?: string;
}

function Stat({ icon, value }: { icon: React.ReactNode; value: number }) {
  return (
    <View className="flex-row items-center gap-1">
      {icon}
      <Text className="font-sans-medium text-xs text-gray-500 dark:text-gray-400">
        {value}
      </Text>
    </View>
  );
}

export function IdeaCard({ idea, onPress, className = '' }: IdeaCardProps) {
  const author: IdeaAuthor | null =
    typeof idea.author === 'string' ? null : idea.author;

  return (
    <Pressable
      onPress={onPress}
      className={`rounded-xl border border-gray-100 bg-white p-4 active:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:active:bg-gray-800 ${className}`}>
      <View className="mb-2 flex-row items-center justify-between">
        <Badge label={titleCase(idea.category)} />
        {idea.status !== 'open' ? (
          <Badge
            label={titleCase(idea.status)}
            tone={statusTones[idea.status]}
          />
        ) : null}
      </View>

      <Text
        numberOfLines={2}
        className="font-sans-semibold text-base leading-snug text-gray-900 dark:text-gray-100">
        {idea.title}
      </Text>
      <Text
        numberOfLines={3}
        className="mt-1 font-sans text-sm leading-snug text-gray-500 dark:text-gray-400">
        {idea.description}
      </Text>

      {author ? (
        <View className="mt-3 flex-row items-center gap-2">
          <Avatar name={author.name} uri={author.avatar?.url ?? null} size={24} />
          <Text className="flex-1 font-sans-medium text-xs text-gray-600 dark:text-gray-300" numberOfLines={1}>
            {author.name}
          </Text>
          <Text className="font-sans text-xs text-gray-400 dark:text-gray-500">
            {timeAgo(idea.createdAt)}
          </Text>
        </View>
      ) : null}

      <View className="mt-3 flex-row items-center gap-4 border-t border-gray-100 pt-3 dark:border-gray-800">
        <Stat
          icon={<Heart size={14} color="#f87171" strokeWidth={2.2} />}
          value={idea.likes.length}
        />
        <Stat
          icon={<MessageCircle size={14} color="#9ca3af" strokeWidth={2.2} />}
          value={idea.commentsCount}
        />
        <Stat
          icon={<Eye size={14} color="#9ca3af" strokeWidth={2.2} />}
          value={idea.views}
        />
      </View>
    </Pressable>
  );
}
