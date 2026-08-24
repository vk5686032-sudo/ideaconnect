import { Image } from 'expo-image';
import { Text, View } from 'react-native';

interface AvatarProps {
  name: string;
  uri?: string | null;
  size?: number;
  online?: boolean;
}

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function Avatar({ name, uri, size = 40, online = false }: AvatarProps) {
  const dotSize = Math.max(8, Math.round(size * 0.25));

  return (
    <View style={{ width: size, height: size }}>
      {uri ? (
        <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2 }} />
      ) : (
        <View
          className="items-center justify-center rounded-full bg-primary-100 dark:bg-primary-500/20"
          style={{ width: size, height: size }}>
          <Text
            className="font-sans-semibold text-primary-700 dark:text-primary-300"
            style={{ fontSize: size * 0.38 }}>
            {initialsOf(name)}
          </Text>
        </View>
      )}
      {online ? (
        <View
          className="absolute bottom-0 right-0 rounded-full bg-green-500"
          style={{
            width: dotSize,
            height: dotSize,
            borderWidth: 2,
            borderColor: '#ffffff',
          }}
        />
      ) : null}
    </View>
  );
}
