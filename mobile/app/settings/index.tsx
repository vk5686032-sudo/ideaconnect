import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
} from 'react-native';
import { Stack } from 'expo-router';
import Constants from 'expo-constants';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Toast from 'react-native-toast-message';
import { isAxiosError } from 'axios';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Input } from '@/components/Input';
import { authApi } from '@/api/auth.api';
import { useAuthStore } from '@/store/authSlice';
import { useChangePassword } from '@/hooks/queries/useProfile';
import { unregisterPushToken } from '@/services/pushTokens';
import type { ApiError } from '@/types/models';

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password required'),
    newPassword: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type PasswordFormData = z.infer<typeof passwordSchema>;

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <Text className="mb-2 font-sans-medium text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500">
      {children}
    </Text>
  );
}

export default function SettingsScreen() {
  const logoutStore = useAuthStore((state) => state.logout);
  const changePassword = useChangePassword();
  const [loggingOutAll, setLoggingOutAll] = useState(false);
  const [disablingPush, setDisablingPush] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const onSubmitPassword = async (data: PasswordFormData) => {
    try {
      await changePassword.mutateAsync({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      reset();
      Toast.show({ type: 'success', text1: 'Password changed' });
    } catch (error) {
      let message = 'Failed to change password.';
      if (isAxiosError(error)) {
        const apiMessage = (error.response?.data as ApiError | undefined)?.message;
        if (apiMessage) message = apiMessage;
      }
      Toast.show({ type: 'error', text1: message });
    }
  };

  const handleDisablePush = async () => {
    setDisablingPush(true);
    try {
      await unregisterPushToken();
      Toast.show({ type: 'success', text1: 'Push disabled on this device' });
    } catch {
      Toast.show({
        type: 'error',
        text1: 'Could not turn off push',
        text2: 'No push token was registered for this device.',
      });
    } finally {
      setDisablingPush(false);
    }
  };

  const handleLogoutEverywhere = async () => {
    setLoggingOutAll(true);
    try {
      await authApi.logoutAll();
    } catch {
      // Continue with local teardown even if server revoke fails.
    } finally {
      setLoggingOutAll(false);
      logoutStore();
      Toast.show({ type: 'success', text1: 'Logged out on all devices' });
    }
  };

  const appVersion = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <>
      <Stack.Screen options={{ title: 'Settings' }} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 bg-gray-50 dark:bg-[#0b0f19]">
        <ScrollView contentContainerClassName="px-4 pb-10 pt-4 gap-5" keyboardShouldPersistTaps="handled">
          <Card>
            <FieldLabel>Change Password</FieldLabel>
            <Controller
              control={control}
              name="currentPassword"
              render={({ field: { onChange, value } }) => (
                <Input
                  value={value}
                  onChangeText={onChange}
                  placeholder="Current password"
                  secureTextEntry
                  error={errors.currentPassword?.message}
                />
              )}
            />
            <Controller
              control={control}
              name="newPassword"
              render={({ field: { onChange, value } }) => (
                <Input
                  value={value}
                  onChangeText={onChange}
                  placeholder="New password (min 6)"
                  secureTextEntry
                  containerClassName="mt-2"
                  error={errors.newPassword?.message}
                />
              )}
            />
            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { onChange, value } }) => (
                <Input
                  value={value}
                  onChangeText={onChange}
                  placeholder="Confirm new password"
                  secureTextEntry
                  containerClassName="mt-2"
                  error={errors.confirmPassword?.message}
                />
              )}
            />
            <Button
              title="Update password"
              variant="soft"
              className="mt-3"
              loading={changePassword.isPending}
              onPress={handleSubmit(onSubmitPassword)}
            />
          </Card>

          <Card>
            <FieldLabel>Sessions</FieldLabel>
            <Button
              title={
                loggingOutAll ? 'Signing out everywhere…' : 'Log out of all devices'
              }
              variant="outline"
              loading={loggingOutAll}
              onPress={() => void handleLogoutEverywhere()}
            />
            <Text className="mt-2 font-sans text-[11px] leading-snug text-gray-400 dark:text-gray-500">
              Revokes every refresh token, including this device.
            </Text>
          </Card>

          <Card>
            <FieldLabel>Push Notifications</FieldLabel>
            <Text className="font-sans text-sm text-gray-700 dark:text-gray-300">
              Managed by your device system settings.
            </Text>
            <Text className="mt-1.5 font-sans text-[11px] leading-snug text-gray-400 dark:text-gray-500">
              Realtime in-app alerts work everywhere. Full push delivery to a
              closed app requires the installed app build (Expo Go cannot
              receive remote push).
            </Text>
            <Button
              title={
                disablingPush ? 'Turning off…' : 'Turn off push on this device'
              }
              variant="outline"
              loading={disablingPush}
              onPress={() => void handleDisablePush()}
              className="mt-3"
            />
            <Text className="mt-2 font-sans text-[11px] leading-snug text-gray-400 dark:text-gray-500">
              Removes the push token for this device, so IdeaConnect stops
              sending notifications here. To re-enable, grant notification
              permission and sign in again.
            </Text>
          </Card>

          <Card>
            <FieldLabel>About</FieldLabel>
            <Text className="font-sans text-sm text-gray-700 dark:text-gray-300">
              IdeaConnect · v{appVersion}
            </Text>
            <Text className="mt-1 font-sans text-[11px] text-gray-400 dark:text-gray-500">
              Collaborative innovation platform — share ideas, build teams,
              ship projects together.
            </Text>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}
