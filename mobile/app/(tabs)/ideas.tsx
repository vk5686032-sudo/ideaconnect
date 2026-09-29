import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
  type ListRenderItemInfo,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Lightbulb, Plus, Search } from 'lucide-react-native';

import { Chip } from '@/components/Chip';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { Input } from '@/components/Input';
import { IdeaCard } from '@/components/IdeaCard';
import { useIdeasFeed } from '@/hooks/queries/useIdeas';
import {
  FEED_STATUSES,
  IDEA_CATEGORIES,
  IDEA_SORTS,
} from '@/utils/constants';
import { titleCase } from '@/utils/format';
import type { Idea, IdeaCategory, IdeaSort } from '@/types/models';

type FeedStatus = (typeof FEED_STATUSES)[number];

export default function IdeasScreen() {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<IdeaCategory | ''>('');
  const [status, setStatus] = useState<FeedStatus | ''>('');
  const [sort, setSort] = useState<IdeaSort>('newest');

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const filters = useMemo(
    () => ({
      search: search || undefined,
      category: category || undefined,
      status: status || undefined,
      sort,
    }),
    [search, category, status, sort]
  );

  const feed = useIdeasFeed(filters);
  const ideas = useMemo(() => {
    const seen = new Set<string>();
    return (feed.data?.pages ?? [])
      .flatMap((page) => page.data)
      .filter((item) => !seen.has(item._id) && seen.add(item._id));
  }, [feed.data]);

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

  const handleEndReached = useCallback(() => {
    if (feed.hasNextPage && !feed.isFetchingNextPage) {
      void feed.fetchNextPage();
    }
  }, [feed]);

  return (
    <View className="flex-1 bg-gray-50 dark:bg-[#0b0f19]">
      <FlatList
        data={ideas}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerClassName="px-4 pb-24 pt-3"
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.4}
        refreshControl={
          <RefreshControl
            refreshing={feed.isRefetching && !feed.isFetchingNextPage}
            onRefresh={() => void feed.refetch()}
            tintColor="#4f46e5"
            colors={['#4f46e5']}
          />
        }
        ListHeaderComponent={
          <View className="mb-1 gap-3">
            <Input
              value={searchInput}
              onChangeText={setSearchInput}
              placeholder="Search ideas by title, description, tagsâ€¦"
              leftIcon={<Search size={18} color="#9ca3af" strokeWidth={2} />}
              returnKeyType="search"
            />

            <View>
              <Text className="mb-2 font-sans-medium text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500">
                Category
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerClassName="gap-2">
                <Chip
                  label="All"
                  active={category === ''}
                  onPress={() => setCategory('')}
                />
                {IDEA_CATEGORIES.map((item) => (
                  <Chip
                    key={item}
                    label={titleCase(item)}
                    active={category === item}
                    onPress={() => setCategory(item)}
                  />
                ))}
              </ScrollView>
            </View>

            <View>
              <Text className="mb-2 font-sans-medium text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500">
                Status
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerClassName="gap-2">
                <Chip
                  label="Any"
                  active={status === ''}
                  onPress={() => setStatus('')}
                />
                {FEED_STATUSES.map((item) => (
                  <Chip
                    key={item}
                    label={titleCase(item)}
                    active={status === item}
                    onPress={() => setStatus(item)}
                  />
                ))}
              </ScrollView>
            </View>

            <View>
              <Text className="mb-2 font-sans-medium text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500">
                Sort
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerClassName="gap-2">
                {IDEA_SORTS.map((option) => (
                  <Chip
                    key={option.value}
                    label={option.label}
                    active={sort === option.value}
                    onPress={() => setSort(option.value)}
                  />
                ))}
              </ScrollView>
            </View>
          </View>
        }
        ListEmptyComponent={
          feed.isLoading ? (
            <View className="items-center py-16">
              <ActivityIndicator size="large" color="#6366f1" />
            </View>
          ) : feed.isError ? (
            <ErrorState
              title="Couldn't load ideas"
              onRetry={() => void feed.refetch()}
              retrying={feed.isFetching}
            />
          ) : (
            <EmptyState
              icon={Lightbulb}
              title={search ? 'No matches' : 'No ideas yet'}
              message={
                search
                  ? 'Try a different search or clear the filters.'
                  : 'Be the first to share an idea with the community.'
              }
            />
          )
        }
        ListFooterComponent={
          feed.isFetchingNextPage ? (
            <View className="py-4">
              <ActivityIndicator size="small" color="#6366f1" />
            </View>
          ) : null
        }
      />

      <Pressable
        onPress={() => router.push('/ideas/create')}
        className="absolute bottom-6 right-5 h-14 w-14 items-center justify-center rounded-full bg-primary-600 active:bg-primary-700 dark:bg-primary-500">
        <Plus size={26} color="#ffffff" strokeWidth={2.4} />
      </Pressable>
    </View>
  );
}
