import { Text, View } from 'react-native';

type BadgeTone = 'primary' | 'success' | 'warning' | 'error' | 'neutral';

interface BadgeProps {
  label: string;
  tone?: BadgeTone;
  className?: string;
}

const toneClasses: Record<BadgeTone, string> = {
  primary: 'bg-primary-100 text-primary-700 dark:bg-primary-500/10 dark:text-primary-300',
  success: 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400',
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
  error: 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400',
  neutral: 'bg-gray-100 text-gray-700 dark:bg-gray-500/10 dark:text-gray-300',
};

export function Badge({ label, tone = 'primary', className = '' }: BadgeProps) {
  return (
    <View className={`self-start rounded-full px-2.5 py-1 ${toneClasses[tone]} ${className}`}>
      <Text className="font-sans-medium text-[11px] leading-none">{label}</Text>
    </View>
  );
}
