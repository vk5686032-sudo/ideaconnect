import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Lock, XCircle } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { isAxiosError } from 'axios';

import { authApi } from '@/api/auth.api';
import { useAuthStore } from '@/store/authSlice';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import type { ApiError } from '@/types/models';

const resetSchema = z
  .object({
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type ResetFormData = z.infer<typeof resetSchema>;

export default function ResetPasswordScreen() {
  const { token } = useLocalSearchParams<{ token?: string }>();
  const [showPassword, setShowPassword] = useState(false);
  const [invalidToken, setInvalidToken] = useState(false);
  const setAuth = useAuthStore((state) => state.setAuth);
  const router = useRouter();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const onSubmit = async (data: ResetFormData) => {
    if (!token) return;
    try {
      const response = await authApi.resetPassword(token, data.password);
      const payload = response.data?.data;
      if (payload?.user && payload?.token && payload?.refreshToken) {
        await setAuth(payload);
        Toast.show({ type: 'success', text1: 'Password reset successful!' });
        router.replace('/(tabs)');
      } else {
        Toast.show({
          type: 'success',
          text1: 'Password reset successful! Please log in.',
        });
        router.replace('/(auth)/login');
      }
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 400) {
        setInvalidToken(true);
      } else {
        let message = 'Failed to reset password.';
        if (isAxiosError(error)) {
          const apiMessage = (error.response?.data as ApiError | undefined)
            ?.message;
          if (apiMessage) message = apiMessage;
        }
        Toast.show({ type: 'error', text1: message });
      }
    }
  };

  if (!token || invalidToken) {
    return (
      <View className="flex-1 justify-center px-6 py-8 bg-gray-50 dark:bg-[#0b0f19]">
        <View className="items-center gap-3">
          <XCircle size={56} color="#f87171" strokeWidth={1.5} />
          <Text className="font-sans-bold text-xl text-gray-900 dark:text-gray-100">
            Link Invalid or Expired
          </Text>
          <Text className="text-center font-sans text-sm text-gray-500 dark:text-gray-400">
            This password reset link is invalid or has expired. Reset links are
            only valid for 10 minutes.
          </Text>
          <Button
            title="Request a New Link"
            className="mt-4 self-stretch"
            onPress={() => router.replace('/(auth)/forgot-password')}
          />
          <Text className="pt-1 font-sans text-sm text-gray-500 dark:text-gray-400">
            Back to{' '}
            <Text
              onPress={() => router.replace('/(auth)/login')}
              className="font-sans-semibold text-primary-600 dark:text-primary-400">
              login
            </Text>
          </Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1">
      <ScrollView
        contentContainerClassName="flex-grow justify-center px-5 py-8"
        keyboardShouldPersistTaps="handled">
        <View className="gap-1 mb-7">
          <Text className="font-sans-bold text-2xl text-gray-900 dark:text-gray-100">
            Reset Password
          </Text>
          <Text className="font-sans text-sm text-gray-500 dark:text-gray-400">
            Choose a new password for your account
          </Text>
        </View>

        <View className="gap-4">
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, value } }) => (
              <Input
                label="New Password"
                value={value}
                onChangeText={onChange}
                placeholder="••••••••"
                secureTextEntry={!showPassword}
                error={errors.password?.message}
                leftIcon={<Lock size={18} color="#9ca3af" strokeWidth={2} />}
                rightElement={
                  <Pressable
                    onPress={() => setShowPassword((prev) => !prev)}
                    accessibilityLabel={
                      showPassword ? 'Hide password' : 'Show password'
                    }>
                    {showPassword ? (
                      <EyeOff size={18} color="#9ca3af" strokeWidth={2} />
                    ) : (
                      <Eye size={18} color="#9ca3af" strokeWidth={2} />
                    )}
                  </Pressable>
                }
              />
            )}
          />

          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Confirm Password"
                value={value}
                onChangeText={onChange}
                placeholder="••••••••"
                secureTextEntry={!showPassword}
                error={errors.confirmPassword?.message}
                leftIcon={<Lock size={18} color="#9ca3af" strokeWidth={2} />}
              />
            )}
          />

          <Button
            title={isSubmitting ? 'Resetting…' : 'Reset Password'}
            onPress={handleSubmit(onSubmit)}
            loading={isSubmitting}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
