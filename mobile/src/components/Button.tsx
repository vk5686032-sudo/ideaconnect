import { ActivityIndicator, Pressable, Text } from 'react-native';

type ButtonVariant = 'primary' | 'outline' | 'soft';

interface ButtonProps {
  title: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-primary-600 active:bg-primary-700 dark:bg-primary-500 dark:active:bg-primary-600',
  outline:
    'border border-gray-200 bg-white active:bg-gray-50 dark:border-gray-700 dark:bg-transparent dark:active:bg-gray-800',
  soft: 'bg-primary-50 active:bg-primary-100 dark:bg-primary-500/10 dark:active:bg-primary-500/20',
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  className = '',
}: ButtonProps) {
  const labelColor =
    variant === 'primary'
      ? 'text-white'
      : 'text-primary-600 dark:text-primary-300';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      className={`h-11 items-center justify-center rounded-lg px-4 ${variantClasses[variant]} ${disabled || loading ? 'opacity-60' : ''} ${className}`}>
      {loading ? (
        <ActivityIndicator size="small" color={variant === 'primary' ? '#ffffff' : '#4f46e5'} />
      ) : (
        <Text className={`font-sans-semibold text-sm ${labelColor}`}>{title}</Text>
      )}
    </Pressable>
  );
}
