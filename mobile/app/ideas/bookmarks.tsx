import { useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  View,
  type ListRenderItemInfo,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Bookmark } from 'lucide-react-native';

import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { IdeaCard } from '@/components/IdeaCard';
import { useMyBookmarks } from '@/hooks/queries/useIdeas';
import type { Idea } from '@/types/models';

export default function BookmarksScreen() {
  const router = useRouter();
  const query = useMyBookmarks();
  const ideas = useMemo(() => query.data?.data ?? [], [query.data]);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<Idea>) => (
      <IdeaCard
        idea={item}
        className="mb-3"
        onPress={() =>
          router.push({ pathname: '/ideas/[id]', params: { id: item._id } })
        }
      />
    ),
    [router]
  );

  return (
    <View className="flex-1 bg-gray-50 dark:bg-[#0b0f19]">
      <Stack.Screen options={{ title: 'Bookmarks' }} />

      <FlatList
        data={ideas}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerClassName="px-4 pb-6 pt-3"
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching}
            onRefresh={() => void query.refetch()}
            tintColor="#4f46e5"
            colors={['#4f46e5']}
          />
        }
        ListEmptyComponent={
          query.isLoading ? (
            <View className="items-center py-16">
              <ActivityIndicator size="large" color="#6366f1" />
            </View>
          ) : query.isError ? (
            <ErrorState
              title="Couldn't load bookmarks"
              onRetry={() => void query.refetch()}
              retrying={query.isFetching}
            />
          ) : (
            <EmptyState
              icon={Bookmark}
              title="No bookmarks yet"
              message="Save ideas you want to revisit and they will show up here."
            />
          )
        }
      />
    </View>
  );
}
