import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { isAxiosError } from 'axios';

import { authApi } from '@/api/auth.api';
import { useAuthStore } from '@/store/authSlice';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import type { ApiError } from '@/types/models';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const [showPassword, setShowPassword] = useState(false);
  const setAuth = useAuthStore((state) => state.setAuth);
  const router = useRouter();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      const response = await authApi.login(data);
      const payload = response.data.data;
      if (!payload?.token || !payload?.refreshToken) {
        throw new Error('Malformed login response');
      }
      await setAuth(payload);
      Toast.show({ type: 'success', text1: 'Login successful!' });
      router.replace('/(tabs)');
    } catch (error) {
      let message = 'Login failed. Please try again.';
      if (isAxiosError(error)) {
        const apiMessage = (error.response?.data as ApiError | undefined)
          ?.message;
        if (apiMessage) message = apiMessage;
      }
      Toast.show({ type: 'error', text1: message });
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1">
      <ScrollView
        contentContainerClassName="flex-grow justify-center px-5 py-8"
        keyboardShouldPersistTaps="handled">
        <View className="gap-1 mb-7">
          <Text className="font-sans-bold text-2xl text-gray-900 dark:text-gray-100">
            Welcome Back
          </Text>
          <Text className="font-sans text-sm text-gray-500 dark:text-gray-400">
            Sign in to continue your innovation journey
          </Text>
        </View>

        <View className="gap-4">
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Email"
                value={value}
                onChangeText={onChange}
                placeholder="you@example.com"
                autoCapitalize="none"
                keyboardType="email-address"
                error={errors.email?.message}
                leftIcon={
                  <Mail size={18} color="#9ca3af" strokeWidth={2} />
                }
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Password"
                value={value}
                onChangeText={onChange}
                placeholder="Ã¢â‚¬Â¢Ã¢â‚¬Â¢Ã¢â‚¬Â¢Ã¢â‚¬Â¢Ã¢â‚¬Â¢Ã¢â‚¬Â¢Ã¢â‚¬Â¢Ã¢â‚¬Â¢"
                secureTextEntry={!showPassword}
                error={errors.password?.message}
                leftIcon={
                  <Lock size={18} color="#9ca3af" strokeWidth={2} />
                }
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

          <Button
            title={isSubmitting ? 'Signing inÃ¢â‚¬Â¦' : 'Sign In'}
            onPress={handleSubmit(onSubmit)}
            loading={isSubmitting}
          />
        </View>

        <View className="mt-6 items-center gap-2.5">
          <Pressable onPress={() => router.push('/(auth)/forgot-password')}>
            <Text className="font-sans-medium text-sm text-primary-600 dark:text-primary-400">
              Forgot password?
            </Text>
          </Pressable>
          <Text className="font-sans text-sm text-gray-500 dark:text-gray-400">
            New to IdeaConnect?{' '}
            <Text
              onPress={() => router.push('/(auth)/register')}
              className="font-sans-semibold text-primary-600 dark:text-primary-400">
              Sign up
            </Text>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
