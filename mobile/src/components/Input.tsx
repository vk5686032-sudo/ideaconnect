import { Text, TextInput, View } from 'react-native';
import type { TextInputProps } from 'react-native';

type InputProps = TextInputProps & {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
  containerClassName?: string;
};

export function Input({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  multiline,
  error,
  leftIcon,
  rightElement,
  containerClassName = '',
  ...rest
}: InputProps) {
  const borderClasses = error
    ? 'border-red-400 dark:border-red-500'
    : 'border-gray-200 dark:border-gray-700';

  return (
    <View className={containerClassName}>
      {label ? (
        <Text className="mb-1.5 font-sans-medium text-sm text-gray-700 dark:text-gray-300">
          {label}
        </Text>
      ) : null}
      <View
        className={`flex-row items-center rounded-lg border ${borderClasses} bg-white dark:bg-gray-900`}>
        {leftIcon ? <View className="pl-3">{leftIcon}</View> : null}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#9ca3af"
          secureTextEntry={secureTextEntry}
          multiline={multiline}
          className="flex-1 px-3 py-2.5 text-sm text-gray-900 dark:text-gray-100"
          {...rest}
        />
        {rightElement ? <View className="pr-3">{rightElement}</View> : null}
      </View>
      {error ? (
        <Text className="mt-1 font-sans text-xs text-red-500">{error}</Text>
      ) : null}
    </View>
  );
}
