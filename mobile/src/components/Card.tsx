import { View } from 'react-native';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <View
      className={`rounded-xl border border-gray-100 bg-white p-4 dark:border-gray-800 dark:bg-gray-900 ${className}`}>
      {children}
    </View>
  );
}
