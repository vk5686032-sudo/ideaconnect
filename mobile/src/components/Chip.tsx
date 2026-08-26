import { Pressable, Text } from 'react-native';

interface ChipProps {
  label: string;
  active?: boolean;
  onPress?: () => void;
}

export function Chip({ label, active = false, onPress }: ChipProps) {
  const containerClasses = active
    ? 'border-primary-600 bg-primary-600 active:bg-primary-700 dark:border-primary-500 dark:bg-primary-500'
    : 'border-gray-200 bg-white active:bg-gray-50 dark:border-gray-700 dark:bg-gray-900';

  const labelClasses = active
    ? 'text-white'
    : 'text-gray-600 dark:text-gray-300';

  return (
    <Pressable
      onPress={onPress}
      className={`rounded-full border px-3.5 py-1.5 ${containerClasses}`}>
      <Text className={`font-sans-medium text-xs ${labelClasses}`}>{label}</Text>
    </Pressable>
  );
}
