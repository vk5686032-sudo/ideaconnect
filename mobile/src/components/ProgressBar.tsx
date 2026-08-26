import { Text, View } from 'react-native';

interface ProgressBarProps {
  value: number;
  className?: string;
  showLabel?: boolean;
}

export function ProgressBar({
  value,
  className = '',
  showLabel = false,
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, Math.round(value)));

  return (
    <View className={`flex-row items-center gap-2 ${className}`}>
      <View className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
        <View
          className="h-full rounded-full bg-primary-600 dark:bg-primary-500"
          style={{ width: `${clamped}%` }}
        />
      </View>
      {showLabel ? (
        <Text className="font-sans-medium text-xs text-gray-500 dark:text-gray-400">
          {clamped}%
        </Text>
      ) : null}
    </View>
  );
}
