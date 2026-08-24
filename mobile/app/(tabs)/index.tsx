import { Text, View } from 'react-native';

import { Badge } from '@/components/Badge';

export default function HomeScreen() {
  return (
    <View className="flex-1 items-center justify-center gap-3 bg-gray-50 p-4 dark:bg-[#0b0f19]">
      <Text className="font-sans-bold text-2xl text-gray-900 dark:text-gray-100">Home</Text>
      <Text className="text-center font-sans text-sm text-gray-500 dark:text-gray-400">
        Dashboard with stats and tasks arrives in Phase 3.
      </Text>
      <Badge label="Phase 0 scaffold" tone="primary" />
    </View>
  );
}
