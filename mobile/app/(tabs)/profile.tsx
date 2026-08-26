import { Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  ChevronRight,
  GraduationCap,
  Briefcase,
  Link2,
  Settings,
  Sparkles,
  SquarePen,
} from 'lucide-react-native';
import Toast from 'react-native-toast-message';

import { Avatar } from '@/components/Avatar';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Chip } from '@/components/Chip';
import { authApi } from '@/api/auth.api';
import { unregisterPushToken } from '@/services/pushTokens';
import { getRefreshToken } from '@/api/tokenStorage';
import { useAuthStore } from '@/store/authSlice';
import { useCurrentUser } from '@/hooks/useAuth';
import { useMyStats } from '@/hooks/queries/useProfile';

const roleBadgeTone = {
  admin: 'error',
  mentor: 'primary',
  user: 'success',
} as const;

function StatCell({ value, label }: { value: number | string; label: string }) {
  return (
    <View className="flex-1 items-center gap-0.5">
      <Text className="font-sans-bold text-lg text-gray-900 dark:text-gray-100">
        {value}
      </Text>
      <Text className="font-sans text-[11px] text-gray-400 dark:text-gray-500">
        {label}
      </Text>
    </View>
  );
}

function MenuRow({
  icon,
  label,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3.5 active:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:active:bg-gray-800">
      {icon}
      <Text className="flex-1 font-sans-medium text-sm text-gray-900 dark:text-gray-100">
        {label}
      </Text>
      <ChevronRight size={18} color="#9ca3af" strokeWidth={2} />
    </Pressable>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <Text className="mb-2 font-sans-medium text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500">
      {children}
    </Text>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const user = useCurrentUser();
  const logoutStore = useAuthStore((state) => state.logout);
  const statsQuery = useMyStats();
  const stats = statsQuery.data;

  if (!user) {
    return null;
  }

  const displayName = user.name || 'User';

  const handleLogout = async () => {
    try {
      await unregisterPushToken();
      const refreshToken = await getRefreshToken();
      if (refreshToken) {
        await authApi.logout(refreshToken);
      }
    } catch {
      // Server-side revocation failed; local session is cleared regardless.
    } finally {
      logoutStore();
      Toast.show({ type: 'success', text1: 'Logged out' });
    }
  };

  const socials = Object.entries(user.socialLinks ?? {}).filter(
    ([, value]) => !!value
  );

  return (
    <ScrollView
      className="flex-1 bg-gray-50 dark:bg-[#0b0f19]"
      contentContainerClassName="px-4 pt-4 pb-8 gap-4">
      <Card>
        <Pressable
          onPress={() => router.push({ pathname: '/profile/edit' })}
          className="absolute right-3 top-3 z-10 h-9 w-9 items-center justify-center rounded-full bg-gray-100 active:bg-gray-200 dark:bg-gray-800 dark:active:bg-gray-700">
          <SquarePen size={16} color="#6b7280" strokeWidth={2} />
        </Pressable>

        <View className="flex-row items-center gap-4 pr-8">
          <Avatar name={displayName} uri={user.avatar?.url ?? null} size={64} />
          <View className="flex-1 gap-1">
            <Text className="font-sans-bold text-lg text-gray-900 dark:text-gray-100">
              {displayName}
            </Text>
            <Text className="font-sans text-sm text-gray-500 dark:text-gray-400">
              {user.email ?? ''}
            </Text>
            <View className="flex-row items-center gap-2 mt-0.5">
              <Badge label={user.role} tone={roleBadgeTone[user.role] ?? 'neutral'} />
              {typeof user.reputation === 'number' ? (
                <Badge label={`${user.reputation} rep`} tone="warning" />
              ) : null}
            </View>
          </View>
        </View>
        {user.bio ? (
          <Text className="mt-3 font-sans text-sm leading-snug text-gray-600 dark:text-gray-400">
            {user.bio}
          </Text>
        ) : null}
      </Card>

      <Card>
        <View className="flex-row items-center">
          <StatCell value={stats?.ideasCount ?? '–'} label="Ideas" />
          <View className="h-8 w-px bg-gray-100 dark:bg-gray-800" />
          <StatCell value={stats?.projectsCount ?? '–'} label="Projects" />
          <View className="h-8 w-px bg-gray-100 dark:bg-gray-800" />
          <StatCell value={stats?.reputation ?? '–'} label="Reputation" />
        </View>
      </Card>

      {(user.skills?.length ?? 0) > 0 ? (
        <View>
          <SectionTitle>Skills</SectionTitle>
          <View className="flex-row flex-wrap gap-2">
            {user.skills?.map((skill, index) => (
              <Chip key={`${skill}-${index}`} label={skill} />
            ))}
          </View>
        </View>
      ) : null}

      {(user.interests?.length ?? 0) > 0 ? (
        <View>
          <SectionTitle>Interests</SectionTitle>
          <View className="flex-row flex-wrap gap-2">
            {user.interests?.map((interest, index) => (
              <Chip key={`${interest}-${index}`} label={interest} />
            ))}
          </View>
        </View>
      ) : null}

      {(user.education?.length ?? 0) > 0 ? (
        <View>
          <SectionTitle>Education</SectionTitle>
          <View className="gap-2">
            {user.education?.map((entry, index) => (
              <Card key={`edu-${index}`}>
                <View className="flex-row items-start gap-2.5">
                  <GraduationCap size={18} color="#4f46e5" strokeWidth={2} />
                  <View className="flex-1">
                    <Text className="font-sans-semibold text-sm text-gray-900 dark:text-gray-100">
                      {[entry.degree, entry.field].filter(Boolean).join(', ') ||
                        entry.institution}
                    </Text>
                    {entry.institution &&
                    entry.degree ? (
                      <Text className="font-sans text-xs text-gray-500 dark:text-gray-400">
                        {entry.institution}
                      </Text>
                    ) : null}
                    {entry.startYear || entry.endYear ? (
                      <Text className="mt-0.5 font-sans text-[11px] text-gray-400 dark:text-gray-500">
                        {[entry.startYear, entry.endYear].filter(Boolean).join(' – ')}
                      </Text>
                    ) : null}
                  </View>
                </View>
              </Card>
            ))}
          </View>
        </View>
      ) : null}

      {(user.experience?.length ?? 0) > 0 ? (
        <View>
          <SectionTitle>Experience</SectionTitle>
          <View className="gap-2">
            {user.experience?.map((entry, index) => (
              <Card key={`exp-${index}`}>
                <View className="flex-row items-start gap-2.5">
                  <Briefcase size={18} color="#4f46e5" strokeWidth={2} />
                  <View className="flex-1">
                    <Text className="font-sans-semibold text-sm text-gray-900 dark:text-gray-100">
                      {entry.position || entry.company}
                    </Text>
                    {entry.company && entry.position ? (
                      <Text className="font-sans text-xs text-gray-500 dark:text-gray-400">
                        {entry.company}
                      </Text>
                    ) : null}
                    <Text className="mt-0.5 font-sans text-[11px] text-gray-400 dark:text-gray-500">
                      {entry.current
                        ? 'Present'
                        : [entry.startDate, entry.endDate].filter(Boolean).join(' – ')}
                    </Text>
                    {entry.description ? (
                      <Text className="mt-1 font-sans text-xs leading-snug text-gray-500 dark:text-gray-400">
                        {entry.description}
                      </Text>
                    ) : null}
                  </View>
                </View>
              </Card>
            ))}
          </View>
        </View>
      ) : null}

      {socials.length > 0 ? (
        <View>
          <SectionTitle>Links</SectionTitle>
          <View className="gap-2">
            {socials.map(([key, value]) => (
              <Card key={key}>
                <View className="flex-row items-center gap-2.5">
                  <Link2 size={16} color="#4f46e5" strokeWidth={2} />
                  <Text className="font-sans-medium text-xs uppercase text-gray-500 dark:text-gray-400">
                    {key}
                  </Text>
                  <Text numberOfLines={1} className="flex-1 font-sans text-xs text-primary-600 dark:text-primary-400">
                    {value}
                  </Text>
                </View>
              </Card>
            ))}
          </View>
        </View>
      ) : null}

      <MenuRow
        icon={<SquarePen size={18} color="#4f46e5" strokeWidth={2} />}
        label="Edit Profile"
        onPress={() => router.push({ pathname: '/profile/edit' })}
      />
      <MenuRow
        icon={<Sparkles size={18} color="#4f46e5" strokeWidth={2} />}
        label="Mentors"
        onPress={() => router.push({ pathname: '/mentors' })}
      />
      <MenuRow
        icon={<Settings size={18} color="#4f46e5" strokeWidth={2} />}
        label="Settings"
        onPress={() => router.push({ pathname: '/settings' })}
      />

      <Button title="Log Out" variant="outline" onPress={handleLogout} />
    </ScrollView>
  );
}
