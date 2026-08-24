import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CheckCircle2, Mail } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { isAxiosError } from 'axios';

import { authApi } from '@/api/auth.api';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import type { ApiError } from '@/types/models';

const forgotSchema = z.object({
  email: z.string().email('Invalid email address'),
});

type ForgotFormData = z.infer<typeof forgotSchema>;

export default function ForgotPasswordScreen() {
  const [sent, setSent] = useState(false);
  const [sentEmail, setSentEmail] = useState('');
  const router = useRouter();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotFormData>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (data: ForgotFormData) => {
    try {
      await authApi.forgotPassword(data.email);
      setSentEmail(data.email);
      setSent(true);
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 404) {
        setSentEmail(data.email);
        setSent(true);
      } else {
        let message = 'Failed to send reset email.';
        if (isAxiosError(error)) {
          const apiMessage = (error.response?.data as ApiError | undefined)
            ?.message;
          if (apiMessage) message = apiMessage;
        }
        Toast.show({ type: 'error', text1: message });
      }
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1">
      <ScrollView
        contentContainerClassName="flex-grow justify-center px-5 py-8"
        keyboardShouldPersistTaps="handled">
        {sent ? (
          <View className="items-center gap-3">
            <CheckCircle2 size={56} color="#22c55e" strokeWidth={1.5} />
            <Text className="font-sans text-sm text-gray-500 dark:text-gray-400">
              If an account exists for
            </Text>
            <Text className="font-sans-semibold text-base text-gray-900 dark:text-gray-100">
              {sentEmail}
            </Text>
            <Text className="text-center font-sans text-sm text-gray-500 dark:text-gray-400">
              A password reset link has been sent. It expires in 10 minutes.
            </Text>
            <Button
              title="Back to Login"
              variant="outline"
              className="mt-4 self-stretch"
              onPress={() => router.replace('/(auth)/login')}
            />
          </View>
        ) : (
          <>
            <View className="gap-1 mb-7">
              <Text className="font-sans-bold text-2xl text-gray-900 dark:text-gray-100">
                Forgot Password
              </Text>
              <Text className="font-sans text-sm text-gray-500 dark:text-gray-400">
                Enter your email and we will send you a reset link
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

              <Button
                title={isSubmitting ? 'Sending…' : 'Send Reset Link'}
                onPress={handleSubmit(onSubmit)}
                loading={isSubmitting}
              />

              <Text className="text-center font-sans text-sm text-gray-500 dark:text-gray-400">
                Back to{' '}
                <Text
                  onPress={() => router.replace('/(auth)/login')}
                  className="font-sans-semibold text-primary-600 dark:text-primary-400">
                  login
                </Text>
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
