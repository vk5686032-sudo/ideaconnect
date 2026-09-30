import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  View,
  type ListRenderItemInfo,
} from 'react-native';
import { useRouter } from 'expo-router';
import { FolderKanban, Plus, Search } from 'lucide-react-native';

import { Chip } from '@/components/Chip';
import { EmptyState } from '@/components/EmptyState';
import { ListSkeleton } from '@/components/Skeleton';
import { ErrorState } from '@/components/ErrorState';
import { Input } from '@/components/Input';
import { ProjectCard } from '@/components/ProjectCard';
import { useProjectsFeed } from '@/hooks/queries/useProjects';
import { titleCase } from '@/utils/format';
import type { Project } from '@/types/models';

const STATUS_FILTERS = ['planning', 'in-progress', 'on-hold', 'completed'] as const;

type FeedStatus = (typeof STATUS_FILTERS)[number];

export default function ProjectsScreen() {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<FeedStatus | ''>('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const filters = useMemo(
    () => ({
      search: search || undefined,
      status: status || undefined,
    }),
    [search, status]
  );

  const feed = useProjectsFeed(filters);
  const projects = useMemo(() => {
    const seen = new Set<string>();
    return (feed.data?.pages ?? [])
      .flatMap((page) => page.data)
      .filter((item) => !seen.has(item._id) && seen.add(item._id));
  }, [feed.data]);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<Project>) => (
      <ProjectCard
        project={item}
        className="mb-3"
        onPress={() =>
          router.push({ pathname: '/projects/[id]', params: { id: item._id } })
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
        data={projects}
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
              placeholder="Search projects by title or technologyÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦"
              leftIcon={<Search size={18} color="#9ca3af" strokeWidth={2} />}
              returnKeyType="search"
            />

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerClassName="gap-2">
              <Chip
                label="All"
                active={status === ''}
                onPress={() => setStatus('')}
              />
              {STATUS_FILTERS.map((item) => (
                <Chip
                  key={item}
                  label={titleCase(item)}
                  active={status === item}
                  onPress={() => setStatus(item)}
                />
              ))}
            </ScrollView>
          </View>
        }
        ListEmptyComponent={
          feed.isLoading ? (
            <ListSkeleton />
          ) : feed.isError ? (
            <ErrorState
              title="Couldn't load projects"
              onRetry={() => void feed.refetch()}
              retrying={feed.isFetching}
            />
          ) : (
            <EmptyState
              icon={FolderKanban}
              title={search ? 'No matches' : 'No projects yet'}
              message={
                search
                  ? 'Try a different search or clear the filters.'
                  : 'Start a project to turn ideas into reality.'
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
        onPress={() => router.push('/projects/create')}
        className="absolute bottom-6 right-5 h-14 w-14 items-center justify-center rounded-full bg-primary-600 active:bg-primary-700 dark:bg-primary-500">
        <Plus size={26} color="#ffffff" strokeWidth={2.4} />
      </Pressable>
    </View>
  );
}
