import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Toast from 'react-native-toast-message';
import { isAxiosError } from 'axios';

import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { Input } from '@/components/Input';
import { useCreateProject } from '@/hooks/queries/useProjects';
import type { ApiError } from '@/types/models';

const projectFormSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title cannot exceed 200 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  technologiesInput: z.string(),
});

type ProjectFormData = z.infer<typeof projectFormSchema>;

export default function CreateProjectScreen() {
  const router = useRouter();
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const createMutation = useCreateProject();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: { title: '', description: '', technologiesInput: '' },
  });

  const onSubmit = async (data: ProjectFormData) => {
    const technologies = data.technologiesInput
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    try {
      await createMutation.mutateAsync({
        title: data.title.trim(),
        description: data.description.trim(),
        technologies,
        visibility,
      });
      Toast.show({ type: 'success', text1: 'Project created' });
      router.back();
    } catch (error) {
      let message = 'Failed to create project.';
      if (isAxiosError(error)) {
        const apiMessage = (error.response?.data as ApiError | undefined)?.message;
        if (apiMessage) message = apiMessage;
      }
      Toast.show({ type: 'error', text1: message });
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: 'New Project' }} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 bg-gray-50 dark:bg-[#0b0f19]">
        <ScrollView contentContainerClassName="px-4 pb-10 pt-3" keyboardShouldPersistTaps="handled">
          <View className="gap-4">
            <Controller
              control={control}
              name="title"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Title"
                  value={value}
                  onChangeText={onChange}
                  placeholder="A clear project name"
                  error={errors.title?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="description"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Description"
                  value={value}
                  onChangeText={onChange}
                  placeholder="What are you building and why?"
                  multiline
                  className="min-h-32"
                  error={errors.description?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="technologiesInput"
              render={({ field: { onChange, value } }) => (
                <View>
                  <Input
                    label="Technologies"
                    value={value}
                    onChangeText={onChange}
                    placeholder="React Native, Node.js, MongoDB"
                    error={errors.technologiesInput?.message}
                  />
                  <Text className="mt-1 font-sans text-xs text-gray-400 dark:text-gray-500">
                    Comma separated
                  </Text>
                </View>
              )}
            />

            <View>
              <Text className="mb-1.5 font-sans-medium text-sm text-gray-700 dark:text-gray-300">
                Visibility
              </Text>
              <View className="flex-row flex-wrap gap-2">
                <Chip
                  label="Public"
                  active={visibility === 'public'}
                  onPress={() => setVisibility('public')}
                />
                <Chip
                  label="Private"
                  active={visibility === 'private'}
                  onPress={() => setVisibility('private')}
                />
              </View>
              <Text className="mt-1.5 font-sans text-xs text-gray-400 dark:text-gray-500">
                Private projects are only visible to members
              </Text>
            </View>

            <Button
              title="Create project"
              onPress={handleSubmit(onSubmit)}
              loading={createMutation.isPending}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}
