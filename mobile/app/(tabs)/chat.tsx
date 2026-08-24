import { Inbox } from 'lucide-react-native';
import { View } from 'react-native';

import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';

export default function ChatScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-gray-50 dark:bg-[#0b0f19]">
      <EmptyState
        icon={Inbox}
        title="No conversations yet"
        message="Realtime chat lands in Phase 4."
      />
      <Button title="Phase 0 scaffold" variant="outline" onPress={() => {}} />
    </View>
  );
}
