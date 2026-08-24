import { Text, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  message?: string;
  className?: string;
}

export function EmptyState({ icon: Icon, title, message, className = '' }: EmptyStateProps) {
  return (
    <View className={`items-center justify-center gap-2 px-6 py-10 ${className}`}>
      {Icon ? <Icon size={40} color="#a5b4fc" strokeWidth={1.5} /> : null}
      <Text className="font-sans-semibold text-base text-gray-900 dark:text-gray-100">{title}</Text>
      {message ? (
        <Text className="text-center font-sans text-sm text-gray-500 dark:text-gray-400">
          {message}
        </Text>
      ) : null}
    </View>
  );
}
