import { Link, Stack } from 'expo-router';
import { Text, View } from 'react-native';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View className="flex-1 items-center justify-center gap-3 bg-gray-50 p-6 dark:bg-[#0b0f19]">
        <Text className="font-sans-bold text-2xl text-gray-900 dark:text-gray-100">
          This screen does not exist.
        </Text>
        <Link href="/" className="font-sans-medium text-primary-600 dark:text-primary-400">
          Go to home
        </Link>
      </View>
    </>
  );
}
