import { Text, View } from 'react-native';

import { Badge } from '@/components/Badge';
import { Card } from '@/components/Card';

export default function ProjectsScreen() {
  return (
    <View className="flex-1 items-center justify-center gap-3 bg-gray-50 p-4 dark:bg-[#0b0f19]">
      <Text className="font-sans-bold text-2xl text-gray-900 dark:text-gray-100">Projects</Text>
      <Card className="w-full max-w-xs">
        <View className="gap-2">
          <Badge label="Coming soon" tone="warning" />
          <Text className="font-sans text-sm text-gray-500 dark:text-gray-400">
            Projects list with progress bars arrives in Phase 3.
          </Text>
        </View>
      </Card>
    </View>
  );
}
