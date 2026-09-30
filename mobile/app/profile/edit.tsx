import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { Stack } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, UserX } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { isAxiosError } from 'axios';

import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Chip } from '@/components/Chip';
import { EmptyState } from '@/components/EmptyState';
import { Input } from '@/components/Input';
import { useUpdateAvatar, useUpdateProfile } from '@/hooks/queries/useProfile';
import { useCurrentUser } from '@/hooks/useAuth';
import type { ApiError } from '@/types/models';

const educationSchema = z.object({
  institution: z.string().min(1, 'Institution required'),
  degree: z.string().optional(),
  field: z.string().optional(),
  startYear: z
    .string()
    .optional()
    .refine((value) => !value || /^\d{4}$/.test(value), '4-digit year'),
  endYear: z
    .string()
    .optional()
    .refine((value) => !value || /^\d{4}$/.test(value), '4-digit year'),
});

const experienceSchema = z.object({
  company: z.string().min(1, 'Company required'),
  position: z.string().optional(),
  description: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  current: z.boolean().optional(),
});

const profileFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  bio: z.string().max(500, 'Bio cannot exceed 500 characters').optional(),
  skillsInput: z.string().optional(),
  interestsInput: z.string().optional(),
  socialLinks: z
    .object({
      github: z.string().optional(),
      linkedin: z.string().optional(),
      twitter: z.string().optional(),
      portfolio: z.string().optional(),
    })
    .optional(),
  education: z.array(educationSchema).max(10).optional(),
  experience: z.array(experienceSchema).max(15).optional(),
});

type ProfileFormData = z.infer<typeof profileFormSchema>;

function parseList(value?: string): string[] {
  return (value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function toYearOrNull(value?: string): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <Text className="mb-1.5 font-sans-medium text-sm text-gray-700 dark:text-gray-300">
      {children}
    </Text>
  );
}

function SectionHeader({
  title,
  onAdd,
}: {
  title: string;
  onAdd: () => void;
}) {
  return (
    <View className="flex-row items-center justify-between">
      <FieldLabel>{title}</FieldLabel>
      <Pressable onPress={onAdd} className="flex-row items-center gap-1">
        <Plus size={16} color="#4f46e5" strokeWidth={2.2} />
        <Text className="font-sans-medium text-xs text-primary-600 dark:text-primary-400">
          Add
        </Text>
      </Pressable>
    </View>
  );
}

export default function EditProfileScreen() {
  const currentUser = useCurrentUser();
  const [avatarUploading, setAvatarUploading] = useState(false);
  const updateProfile = useUpdateProfile();
  const updateAvatar = useUpdateAvatar();

  const defaults = useMemo(
    () => ({
      name: currentUser?.name ?? '',
      bio: currentUser?.bio ?? '',
      skillsInput: (currentUser?.skills ?? []).join(', '),
      interestsInput: (currentUser?.interests ?? []).join(', '),
      socialLinks: {
        github: currentUser?.socialLinks?.github ?? '',
        linkedin: currentUser?.socialLinks?.linkedin ?? '',
        twitter: currentUser?.socialLinks?.twitter ?? '',
        portfolio: currentUser?.socialLinks?.portfolio ?? '',
      },
      education: (currentUser?.education ?? []).map((entry) => ({
        institution: entry.institution ?? '',
        degree: entry.degree ?? '',
        field: entry.field ?? '',
        startYear: entry.startYear ? String(entry.startYear) : '',
        endYear: entry.endYear ? String(entry.endYear) : '',
      })),
      experience: (currentUser?.experience ?? []).map((entry) => ({
        company: entry.company ?? '',
        position: entry.position ?? '',
        description: entry.description ?? '',
        startDate: entry.startDate ?? '',
        endDate: entry.endDate ?? '',
        current: !!entry.current,
      })),
    }),
    [currentUser]
  );

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: defaults,
  });

  const educationArray = useFieldArray({ control, name: 'education' });
  const experienceArray = useFieldArray({ control, name: 'experience' });

  const handlePickAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Toast.show({ type: 'error', text1: 'Photo library permission needed' });
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (result.canceled || result.assets.length === 0) return;

    const asset = result.assets[0];
    setAvatarUploading(true);
    try {
      await updateAvatar.mutateAsync({
        uri: asset.uri,
        fileName: asset.fileName ?? `avatar-${Date.now()}.jpg`,
        mimeType: asset.mimeType ?? 'image/jpeg',
      });
      Toast.show({ type: 'success', text1: 'Avatar updated' });
    } catch (error) {
      let message = 'Failed to upload avatar.';
      if (isAxiosError(error)) {
        const apiMessage = (error.response?.data as ApiError | undefined)?.message;
        if (apiMessage) message = apiMessage;
      }
      Toast.show({ type: 'error', text1: message });
    } finally {
      setAvatarUploading(false);
    }
  };

  const onSubmit = async (data: ProfileFormData) => {
    try {
      await updateProfile.mutateAsync({
        name: data.name.trim(),
        bio: data.bio?.trim() ?? '',
        skills: parseList(data.skillsInput),
        interests: parseList(data.interestsInput),
        socialLinks: {
          github: data.socialLinks?.github?.trim() || undefined,
          linkedin: data.socialLinks?.linkedin?.trim() || undefined,
          twitter: data.socialLinks?.twitter?.trim() || undefined,
          portfolio: data.socialLinks?.portfolio?.trim() || undefined,
        },
        education: (data.education ?? []).map((entry) => ({
          institution: entry.institution.trim(),
          degree: entry.degree?.trim() || undefined,
          field: entry.field?.trim() || undefined,
          startYear: toYearOrNull(entry.startYear),
          endYear: toYearOrNull(entry.endYear),
        })),
        experience: (data.experience ?? []).map((entry) => ({
          company: entry.company.trim(),
          position: entry.position?.trim() || undefined,
          description: entry.description?.trim() || undefined,
          startDate: entry.startDate?.trim() || undefined,
          endDate: entry.current ? undefined : entry.endDate?.trim() || undefined,
          current: !!entry.current,
        })),
      });
      Toast.show({ type: 'success', text1: 'Profile updated' });
    } catch (error) {
      let message = 'Failed to update profile.';
      if (isAxiosError(error)) {
        const apiMessage = (error.response?.data as ApiError | undefined)?.message;
        if (apiMessage) message = apiMessage;
      }
      Toast.show({ type: 'error', text1: message });
    }
  };

  if (!currentUser) {
    return (
      <View className="flex-1 justify-center bg-gray-50 dark:bg-[#0b0f19]">
        <Stack.Screen options={{ title: 'Edit Profile' }} />
        <EmptyState icon={UserX} title="Not signed in" />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Edit Profile' }} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 bg-gray-50 dark:bg-[#0b0f19]">
        <ScrollView contentContainerClassName="px-4 pb-10 pt-3" keyboardShouldPersistTaps="handled">
          <View className="items-center gap-2">
            <Pressable onPress={() => void handlePickAvatar()} disabled={avatarUploading}>
              <View>
                <Avatar
                  name={currentUser.name}
                  uri={currentUser.avatar?.url ?? null}
                  size={88}
                />
                {avatarUploading ? (
                  <View className="absolute inset-0 items-center justify-center rounded-full bg-black/40">
                    <ActivityIndicator size="small" color="#ffffff" />
                  </View>
                ) : null}
              </View>
            </Pressable>
            <Text className="font-sans text-xs text-gray-400 dark:text-gray-500">
              Tap avatar to change photo
            </Text>
          </View>

          <View className="mt-5 gap-4">
            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Name"
                  value={value}
                  onChangeText={onChange}
                  error={errors.name?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="bio"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Bio"
                  value={value ?? ''}
                  onChangeText={onChange}
                  placeholder="Tell the community about yourself…"
                  multiline
                  error={errors.bio?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="skillsInput"
              render={({ field: { onChange, value } }) => (
                <View>
                  <Input
                    label="Skills"
                    value={value ?? ''}
                    onChangeText={onChange}
                    placeholder="React Native, Figma, Firebase"
                    autoCapitalize="none"
                  />
                  <Text className="mt-1 font-sans text-xs text-gray-400 dark:text-gray-500">
                    Comma separated
                  </Text>
                </View>
              )}
            />

            <Controller
              control={control}
              name="interestsInput"
              render={({ field: { onChange, value } }) => (
                <View>
                  <Input
                    label="Interests"
                    value={value ?? ''}
                    onChangeText={onChange}
                    placeholder="AI, sustainability, edtech"
                    autoCapitalize="none"
                  />
                  <Text className="mt-1 font-sans text-xs text-gray-400 dark:text-gray-500">
                    Comma separated
                  </Text>
                </View>
              )}
            />

            <Card>
              <FieldLabel>Social Links</FieldLabel>
              <Controller
                control={control}
                name="socialLinks.github"
                render={({ field: { onChange, value } }) => (
                  <Input
                    value={value ?? ''}
                    onChangeText={onChange}
                    placeholder="GitHub username or URL"
                    autoCapitalize="none"
                    containerClassName="mb-2"
                  />
                )}
              />
              <Controller
                control={control}
                name="socialLinks.linkedin"
                render={({ field: { onChange, value } }) => (
                  <Input
                    value={value ?? ''}
                    onChangeText={onChange}
                    placeholder="LinkedIn URL"
                    autoCapitalize="none"
                    containerClassName="mb-2"
                  />
                )}
              />
              <Controller
                control={control}
                name="socialLinks.twitter"
                render={({ field: { onChange, value } }) => (
                  <Input
                    value={value ?? ''}
                    onChangeText={onChange}
                    placeholder="Twitter / X handle"
                    autoCapitalize="none"
                    containerClassName="mb-2"
                  />
                )}
              />
              <Controller
                control={control}
                name="socialLinks.portfolio"
                render={({ field: { onChange, value } }) => (
                  <Input
                    value={value ?? ''}
                    onChangeText={onChange}
                    placeholder="Portfolio URL"
                    autoCapitalize="none"
                  />
                )}
              />
            </Card>

            <SectionHeader
              title="Education"
              onAdd={() =>
                educationArray.append({
                  institution: '',
                  degree: '',
                  field: '',
                  startYear: '',
                  endYear: '',
                })
              }
            />
            {educationArray.fields.length === 0 ? (
              <Text className="font-sans text-xs text-gray-400 dark:text-gray-500">
                No education added yet.
              </Text>
            ) : null}
            {educationArray.fields.map((field, index) => (
              <Card key={field.id}>
                <View className="flex-row items-start justify-between">
                  <Text className="font-sans-semibold text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500">
                    Education {index + 1}
                  </Text>
                  <Pressable
                    onPress={() => educationArray.remove(index)}
                    className="p-1">
                    <Trash2 size={16} color="#ef4444" strokeWidth={2} />
                  </Pressable>
                </View>
                <Controller
                  control={control}
                  name={`education.${index}.institution`}
                  render={({ field: { onChange, value } }) => (
                    <Input
                      value={value}
                      onChangeText={onChange}
                      placeholder="Institution *"
                      containerClassName="mt-2"
                      error={errors.education?.[index]?.institution?.message}
                    />
                  )}
                />
                <Controller
                  control={control}
                  name={`education.${index}.degree`}
                  render={({ field: { onChange, value } }) => (
                    <Input
                      value={value ?? ''}
                      onChangeText={onChange}
                      placeholder="Degree (e.g. B.Tech)"
                      containerClassName="mt-2"
                    />
                  )}
                />
                <Controller
                  control={control}
                  name={`education.${index}.field`}
                  render={({ field: { onChange, value } }) => (
                    <Input
                      value={value ?? ''}
                      onChangeText={onChange}
                      placeholder="Field of study"
                      containerClassName="mt-2"
                    />
                  )}
                />
                <View className="flex-row gap-2 mt-2">
                  <Controller
                    control={control}
                    name={`education.${index}.startYear`}
                    render={({ field: { onChange, value } }) => (
                      <Input
                        value={value ?? ''}
                        onChangeText={onChange}
                        placeholder="Start year"
                        keyboardType="number-pad"
                        maxLength={4}
                        containerClassName="flex-1"
                        error={errors.education?.[index]?.startYear?.message}
                      />
                    )}
                  />
                  <Controller
                    control={control}
                    name={`education.${index}.endYear`}
                    render={({ field: { onChange, value } }) => (
                      <Input
                        value={value ?? ''}
                        onChangeText={onChange}
                        placeholder="End year"
                        keyboardType="number-pad"
                        maxLength={4}
                        containerClassName="flex-1"
                        error={errors.education?.[index]?.endYear?.message}
                      />
                    )}
                  />
                </View>
              </Card>
            ))}

            <SectionHeader
              title="Experience"
              onAdd={() =>
                experienceArray.append({
                  company: '',
                  position: '',
                  description: '',
                  startDate: '',
                  endDate: '',
                  current: false,
                })
              }
            />
            {experienceArray.fields.length === 0 ? (
              <Text className="font-sans text-xs text-gray-400 dark:text-gray-500">
                No experience added yet.
              </Text>
            ) : null}
            {experienceArray.fields.map((field, index) => (
              <Card key={field.id}>
                <View className="flex-row items-start justify-between">
                  <Text className="font-sans-semibold text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500">
                    Experience {index + 1}
                  </Text>
                  <Pressable
                    onPress={() => experienceArray.remove(index)}
                    className="p-1">
                    <Trash2 size={16} color="#ef4444" strokeWidth={2} />
                  </Pressable>
                </View>
                <Controller
                  control={control}
                  name={`experience.${index}.company`}
                  render={({ field: { onChange, value } }) => (
                    <Input
                      value={value}
                      onChangeText={onChange}
                      placeholder="Company *"
                      containerClassName="mt-2"
                      error={errors.experience?.[index]?.company?.message}
                    />
                  )}
                />
                <Controller
                  control={control}
                  name={`experience.${index}.position`}
                  render={({ field: { onChange, value } }) => (
                    <Input
                      value={value ?? ''}
                      onChangeText={onChange}
                      placeholder="Role / Position"
                      containerClassName="mt-2"
                    />
                  )}
                />
                <Controller
                  control={control}
                  name={`experience.${index}.startDate`}
                  render={({ field: { onChange, value } }) => (
                    <Input
                      value={value ?? ''}
                      onChangeText={onChange}
                      placeholder="Start (e.g. Jan 2023)"
                      containerClassName="mt-2"
                    />
                  )}
                />
                <Controller
                  control={control}
                  name={`experience.${index}.current`}
                  render={({ field: { value, onChange } }) => (
                    <View className="mt-2 flex-row items-center gap-2">
                      <Chip
                        label="Currently working here"
                        active={!!value}
                        onPress={() => onChange(!value)}
                      />
                    </View>
                  )}
                />
                {!(
                  experienceArray.fields[index]?.current
                ) ? (
                  <Controller
                    control={control}
                    name={`experience.${index}.endDate`}
                    render={({ field: { onChange, value } }) => (
                      <Input
                        value={value ?? ''}
                        onChangeText={onChange}
                        placeholder="End (e.g. Mar 2025)"
                        containerClassName="mt-2"
                      />
                    )}
                  />
                ) : null}
                <Controller
                  control={control}
                  name={`experience.${index}.description`}
                  render={({ field: { onChange, value } }) => (
                    <Input
                      value={value ?? ''}
                      onChangeText={onChange}
                      placeholder="What did you work on?"
                      multiline
                      containerClassName="mt-2"
                    />
                  )}
                />
              </Card>
            ))}

            <Button
              title="Save changes"
              onPress={handleSubmit(onSubmit)}
              loading={updateProfile.isPending}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}
