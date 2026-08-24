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
import { CheckCircle2, Eye, EyeOff, Lock, Mail, User } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { isAxiosError } from 'axios';

import { authApi } from '@/api/auth.api';
import { useAuthStore } from '@/store/authSlice';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import type { ApiError, AuthPayload } from '@/types/models';

const registerSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterScreen() {
  const [showPassword, setShowPassword] = useState(false);
  const [registered, setRegistered] = useState<{
    email: string;
    payload: AuthPayload;
  } | null>(null);
  const setAuth = useAuthStore((state) => state.setAuth);
  const router = useRouter();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      const response = await authApi.register({
        name: data.name,
        email: data.email,
        password: data.password,
      });
      const payload = response.data.data;
      if (!payload?.token || !payload?.refreshToken) {
        throw new Error('Malformed register response');
      }
      setRegistered({ email: data.email, payload });
    } catch (error) {
      let message = 'Registration failed. Please try again.';
      if (isAxiosError(error)) {
        const apiMessage = (error.response?.data as ApiError | undefined)
          ?.message;
        if (apiMessage) message = apiMessage;
      }
      Toast.show({ type: 'error', text1: message });
    }
  };

  const handleContinue = async () => {
    if (!registered) return;
    await setAuth(registered.payload);
    router.replace('/(tabs)');
  };

  if (registered) {
    return (
      <View className="flex-1 justify-center px-6 py-8 bg-gray-50 dark:bg-[#0b0f19]">
        <View className="items-center gap-3">
          <CheckCircle2 size={56} color="#22c55e" strokeWidth={1.5} />
          <Text className="font-sans-bold text-xl text-gray-900 dark:text-gray-100">
            Account Created!
          </Text>
          <Text className="text-center font-sans text-sm text-gray-500 dark:text-gray-400">
            We sent a verification link to{' '}
            <Text className="font-sans-semibold text-gray-700 dark:text-gray-300">
              {registered.email}
            </Text>
            . You can start exploring right away — verifying your email keeps
            your account secure and enables full features later.
          </Text>
          <Button
            title="Continue to App"
            variant="outline"
            className="mt-4 self-stretch"
            onPress={handleContinue}
          />
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
            Create Account
          </Text>
          <Text className="font-sans text-sm text-gray-500 dark:text-gray-400">
            Join the community and start building
          </Text>
        </View>

        <View className="gap-4">
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Full Name"
                value={value}
                onChangeText={onChange}
                placeholder="Priya Sharma"
                error={errors.name?.message}
                leftIcon={<User size={18} color="#9ca3af" strokeWidth={2} />}
              />
            )}
          />

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
                leftIcon={<Mail size={18} color="#9ca3af" strokeWidth={2} />}
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
            title={isSubmitting ? 'Creating account…' : 'Sign Up'}
            onPress={handleSubmit(onSubmit)}
            loading={isSubmitting}
          />

          <Text className="text-center font-sans text-sm text-gray-500 dark:text-gray-400">
            Already have an account?{' '}
            <Text
              onPress={() => router.back()}
              className="font-sans-semibold text-primary-600 dark:text-primary-400">
              Sign In
            </Text>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
