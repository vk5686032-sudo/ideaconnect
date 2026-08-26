import { Modal, Pressable, Text, View } from 'react-native';

import { Chip } from './Chip';
import type { TaskStatus } from '@/types/models';
import { titleCase } from '@/utils/format';

const TASK_STATUSES: TaskStatus[] = [
  'todo',
  'in-progress',
  'review',
  'completed',
  'cancelled',
];

interface StatusPickerModalProps {
  visible: boolean;
  current?: TaskStatus;
  onClose: () => void;
  onSelect: (status: TaskStatus) => void;
}

export function StatusPickerModal({
  visible,
  current,
  onClose,
  onSelect,
}: StatusPickerModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/50 px-6" onPress={onClose}>
        <View className="flex-1 justify-center">
          <Pressable
            className="rounded-xl border border-gray-100 bg-white p-4 dark:border-gray-800 dark:bg-gray-900"
            onPress={() => {}}>
            <Text className="mb-3 font-sans-semibold text-base text-gray-900 dark:text-gray-100">
              Set task status
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {TASK_STATUSES.map((status) => (
                <Chip
                  key={status}
                  label={titleCase(status)}
                  active={current === status}
                  onPress={() => {
                    onClose();
                    if (status !== current) onSelect(status);
                  }}
                />
              ))}
            </View>
            <Pressable onPress={onClose} className="mt-4 items-center py-2">
              <Text className="font-sans-medium text-sm text-primary-600 dark:text-primary-400">
                Cancel
              </Text>
            </Pressable>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}
