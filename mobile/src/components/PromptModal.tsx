import { useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';

import { Button } from './Button';
import { Input } from './Input';

interface PromptModalProps {
  visible: boolean;
  title: string;
  placeholder?: string;
  multiline?: boolean;
  submitLabel?: string;
  loading?: boolean;
  initialValue?: string;
  onClose: () => void;
  onSubmit: (value: string) => void;
}

export function PromptModal({
  visible,
  title,
  placeholder,
  multiline = false,
  submitLabel = 'Submit',
  loading = false,
  initialValue = '',
  onClose,
  onSubmit,
}: PromptModalProps) {
  const [value, setValue] = useState(initialValue);

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    setValue('');
    onSubmit(trimmed);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/50 px-6" onPress={onClose}>
        <View className="flex-1 justify-center">
          <Pressable
            className="rounded-xl border border-gray-100 bg-white p-4 dark:border-gray-800 dark:bg-gray-900"
            onPress={() => {}}>
            <Text className="mb-3 font-sans-semibold text-base text-gray-900 dark:text-gray-100">
              {title}
            </Text>
            <Input
              value={value}
              onChangeText={setValue}
              placeholder={placeholder}
              multiline={multiline}
            />
            <View className="mt-4 gap-2">
              <Button title={submitLabel} onPress={submit} loading={loading} disabled={!value.trim()} />
              <Button title="Cancel" variant="outline" onPress={onClose} />
            </View>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}
