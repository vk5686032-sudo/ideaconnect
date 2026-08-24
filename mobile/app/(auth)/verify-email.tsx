import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { CheckCircle2, XCircle } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { isAxiosError } from 'axios';

import { authApi } from '@/api/auth.api';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import type { ApiError } from '@/types/models';

type VerifyState = 'verifying' | 'success' | 'error' | 'no-token';

export default function VerifyEmailScreen() {
  const { token } = useLocalSearchParams<{ token?: string }>();
  const [state, setState] = useState<VerifyState>(token ? 'verifying' : 'no-token');
  const [email, setEmail] = useState('');
  const [resent, setResent] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!token) {
      return;
    }

    let cancelled = false;

    const verify = async () => {
      try {
        await authApi.verifyEmail(token);
        if (!cancelled) setState('success');
      } catch {
        if (!cancelled) setState('error');
      }
    };

    verify();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleResend = async () => {
    if (!email.trim()) {
      Toast.show({ type: 'error', text1: 'Enter your email address' });
      return;
    }
    try {
      await authApi.resendVerification(email.trim());
      setResent(true);
      Toast.show({ type: 'success', text1: 'Verification email sent' });
    } catch (error) {
      let message = 'Failed to send verification email.';
      if (isAxiosError(error)) {
        const apiMessage = (error.response?.data as ApiError | undefined)
          ?.message;
        if (apiMessage) message = apiMessage;
      }
      Toast.show({ type: 'error', text1: message });
    }
  };

  return (
    <View className="flex-1 justify-center px-6 py-8 bg-gray-50 dark:bg-[#0b0f19]">
      {state === 'verifying' && (
        <View className="items-center gap-3">
          <ActivityIndicator size="large" color="#6366f1" />
          <Text className="font-sans-bold text-xl text-gray-900 dark:text-gray-100">
            Verifying your email…
          </Text>
          <Text className="text-center font-sans text-sm text-gray-500 dark:text-gray-400">
            This will only take a moment.
          </Text>
        </View>
      )}

      {state === 'success' && (
        <View className="items-center gap-3">
          <CheckCircle2 size={56} color="#22c55e" strokeWidth={1.5} />
          <Text className="font-sans-bold text-xl text-gray-900 dark:text-gray-100">
            Email Verified!
          </Text>
          <Text className="text-center font-sans text-sm text-gray-500 dark:text-gray-400">
            Your email address has been confirmed. You now have full access to
            IdeaConnect.
          </Text>
          <Button
            title="Go to Login"
            variant="outline"
            className="mt-4 self-stretch"
            onPress={() => router.replace('/(auth)/login')}
          />
        </View>
      )}

      {(state === 'error' || state === 'no-token') && (
        <View className="items-center gap-3">
          {state === 'error' ? (
            <XCircle size={56} color="#f87171" strokeWidth={1.5} />
          ) : null}
          <Text className="font-sans-bold text-xl text-gray-900 dark:text-gray-100">
            {resent ? 'Check Your Inbox' : state === 'error' ? 'Verification Failed' : 'Verify Your Email'}
          </Text>
          <Text className="text-center font-sans text-sm text-gray-500 dark:text-gray-400">
            {resent
              ? `We sent a new verification link to ${email.trim()}. It expires in 24 hours.`
              : state === 'error'
                ? 'This verification link is invalid or has expired. Enter your email to receive a new one.'
                : 'Enter the email you registered with and we will send you a verification link.'}
          </Text>

          {!resent ? (
            <View className="mt-4 gap-4 self-stretch">
              <Input
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                autoCapitalize="none"
                keyboardType="email-address"
              />
              <Button title="Resend Verification Email" onPress={handleResend} />
            </View>
          ) : null}

          <Text className="pt-1 font-sans text-sm text-gray-500 dark:text-gray-400">
            Back to{' '}
            <Text
              onPress={() => router.replace('/(auth)/login')}
              className="font-sans-semibold text-primary-600 dark:text-primary-400">
              login
            </Text>
          </Text>
        </View>
      )}
    </View>
  );
}
