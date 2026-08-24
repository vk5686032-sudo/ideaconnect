import { Text, View } from 'react-native';
import type { ToastConfig } from 'react-native-toast-message';
import { CheckCircle2, Info, XCircle } from 'lucide-react-native';

function ToastCard({
  tone,
  text1,
  text2,
}: {
  tone: 'success' | 'error' | 'info';
  text1?: string;
  text2?: string;
}) {
  const icon =
    tone === 'success' ? (
      <CheckCircle2 size={20} color="#22c55e" />
    ) : tone === 'error' ? (
      <XCircle size={20} color="#ef4444" />
    ) : (
      <Info size={20} color="#6366f1" />
    );

  return (
    <View className="flex-row items-center gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      {icon}
      <View className="flex-1">
        {text1 ? (
          <Text className="font-sans-semibold text-sm text-gray-900 dark:text-gray-100">
            {text1}
          </Text>
        ) : null}
        {text2 ? (
          <Text className="font-sans text-xs text-gray-500 dark:text-gray-400">
            {text2}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

export const toastConfig: ToastConfig = {
  success: (props) => <ToastCard tone="success" {...props} />,
  error: (props) => <ToastCard tone="error" {...props} />,
  info: (props) => <ToastCard tone="info" {...props} />,
};
