import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Toast from 'react-native-toast-message';
import { isAxiosError } from 'axios';

import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { EmptyState } from '@/components/EmptyState';
import { Input } from '@/components/Input';
import { useCreateIdea, useIdea, useUpdateIdea } from '@/hooks/queries/useIdeas';
import { IDEA_CATEGORIES } from '@/utils/constants';
import type { ApiError, IdeaCategory, IdeaVisibility } from '@/types/models';

const VISIBILITIES: { value: IdeaVisibility; label: string }[] = [
  { value: 'public', label: 'Public' },
  { value: 'private', label: 'Private' },
  { value: 'invite-only', label: 'Invite-only' },
];

const ideaFormSchema = z.object({
  title: z
    .string()
    .min(5, 'Title must be at least 5 characters')
    .max(200, 'Title cannot exceed 200 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  category: z
    .string()
    .refine((value) => IDEA_CATEGORIES.includes(value as IdeaCategory), {
      message: 'Select a category',
    }),
  tagsInput: z.string(),
  skillsInput: z.string(),
});

type IdeaFormData = z.infer<typeof ideaFormSchema>;

interface IdeaFormDefaults {
  title: string;
  description: string;
  category: IdeaCategory;
  tagsInput: string;
  skillsInput: string;
  visibility: IdeaVisibility;
  status: 'open' | 'draft';
}

function parseListInput(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function ChipRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View>
      <Text className="mb-1.5 font-sans-medium text-sm text-gray-700 dark:text-gray-300">
        {label}
      </Text>
      <View className="flex-row flex-wrap gap-2">{children}</View>
    </View>
  );
}

function IdeaForm({ editId, defaults }: { editId?: string; defaults: IdeaFormDefaults }) {
  const router = useRouter();
  const [visibility, setVisibility] = useState<IdeaVisibility>(defaults.visibility);
  const [status, setStatus] = useState<'open' | 'draft'>(defaults.status);

  const createMutation = useCreateIdea();
  const updateMutation = useUpdateIdea(editId ?? '');

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<IdeaFormData>({
    resolver: zodResolver(ideaFormSchema),
    defaultValues: {
      title: defaults.title,
      description: defaults.description,
      category: defaults.category,
      tagsInput: defaults.tagsInput,
      skillsInput: defaults.skillsInput,
    },
  });

  const onSubmit = async (data: IdeaFormData) => {
    const payload = {
      title: data.title.trim(),
      description: data.description.trim(),
      category: data.category as IdeaCategory,
      tags: parseListInput(data.tagsInput.toLowerCase()),
      requiredSkills: parseListInput(data.skillsInput),
      visibility,
      status,
    };

    try {
      if (editId) {
        await updateMutation.mutateAsync(payload);
        Toast.show({ type: 'success', text1: 'Idea updated' });
      } else {
        await createMutation.mutateAsync(payload);
        Toast.show({
          type: 'success',
          text1: status === 'draft' ? 'Draft saved' : 'Idea published',
        });
      }
      router.back();
    } catch (error) {
      let message = 'Failed to save idea.';
      if (isAxiosError(error)) {
        const apiMessage = (error.response?.data as ApiError | undefined)?.message;
        if (apiMessage) message = apiMessage;
      }
      Toast.show({ type: 'error', text1: message });
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
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
                placeholder="A short catchy title"
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
                placeholder="Describe the problem, your idea, and the impact…"
                multiline
                className="min-h-32"
                error={errors.description?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="tagsInput"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Tags"
                value={value}
                onChangeText={onChange}
                placeholder="ai, mobile, sustainability"
                autoCapitalize="none"
                error={errors.tagsInput?.message}
              />
            )}
          />
          <Text className="-mt-3 font-sans text-xs text-gray-400 dark:text-gray-500">
            Comma separated
          </Text>

          <Controller
            control={control}
            name="skillsInput"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Required Skills"
                value={value}
                onChangeText={onChange}
                placeholder="React Native, Figma, Firebase"
                error={errors.skillsInput?.message}
              />
            )}
          />
          <Text className="-mt-3 font-sans text-xs text-gray-400 dark:text-gray-500">
            Comma separated
          </Text>

          <Controller
            control={control}
            name="category"
            render={({ field: { onChange, value } }) => (
              <View>
                <ChipRow label="Category">
                  {IDEA_CATEGORIES.map((item) => (
                    <Chip
                      key={item}
                      label={item.charAt(0).toUpperCase() + item.slice(1)}
                      active={value === item}
                      onPress={() => onChange(value === item ? '' : item)}
                    />
                  ))}
                </ChipRow>
                {errors.category ? (
                  <Text className="mt-1.5 font-sans text-xs text-red-500">
                    {errors.category.message}
                  </Text>
                ) : null}
              </View>
            )}
          />

          <ChipRow label="Visibility">
            {VISIBILITIES.map((option) => (
              <Chip
                key={option.value}
                label={option.label}
                active={visibility === option.value}
                onPress={() => setVisibility(option.value)}
              />
            ))}
          </ChipRow>

          <ChipRow label="Status">
            <Chip
              label="Open"
              active={status === 'open'}
              onPress={() => setStatus('open')}
            />
            <Chip
              label="Save as draft"
              active={status === 'draft'}
              onPress={() => setStatus('draft')}
            />
          </ChipRow>

          <Button
            title={editId ? 'Save changes' : status === 'draft' ? 'Save draft' : 'Publish idea'}
            onPress={handleSubmit(onSubmit)}
            loading={isSaving}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export default function CreateIdeaScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const editId = typeof params.id === 'string' ? params.id : undefined;
  const existingQuery = useIdea(editId ?? '');

  const defaults = useMemo<IdeaFormDefaults>(() => {
    const idea = existingQuery.data?.data;
    return {
      title: idea?.title ?? '',
      description: idea?.description ?? '',
      category: idea?.category ?? ('' as IdeaCategory),
      tagsInput: idea?.tags.join(', ') ?? '',
      skillsInput: idea?.requiredSkills.join(', ') ?? '',
      visibility: idea?.visibility ?? 'public',
      status: idea?.status === 'draft' ? 'draft' : 'open',
    };
  }, [existingQuery.data]);

  return (
    <>
      <Stack.Screen options={{ title: editId ? 'Edit Idea' : 'New Idea' }} />

      {editId && existingQuery.isLoading ? (
        <View className="flex-1 items-center justify-center bg-gray-50 dark:bg-[#0b0f19]">
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      ) : editId && (existingQuery.isError || !existingQuery.data?.data) ? (
        <View className="flex-1 justify-center bg-gray-50 dark:bg-[#0b0f19]">
          <Stack.Screen options={{ title: 'Not found' }} />
          <EmptyState
            title="Idea unavailable"
            message="It may have been deleted, or you don't have access to it."
          />
        </View>
      ) : (
        <IdeaForm key={editId ?? 'new'} editId={editId} defaults={defaults} />
      )}
    </>
  );
}
