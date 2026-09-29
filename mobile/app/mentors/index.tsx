import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Sparkles } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { isAxiosError } from 'axios';

import { Avatar } from '@/components/Avatar';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Chip } from '@/components/Chip';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { Input } from '@/components/Input';
import { PromptModal } from '@/components/PromptModal';
import { chatApi } from '@/api/chat.api';
import type { MentorRequest } from '@/api/mentor.api';
import {
  useMentors,
  useMyMentorRequests,
  useSendMentorRequest,
} from '@/hooks/queries/useProfile';
import type { ApiError, IdeaAuthor, User } from '@/types/models';
import { timeAgo, titleCase } from '@/utils/format';

type Segment = 'directory' | 'requests';

const requestStatusTone: Record<MentorRequest['status'], 'primary' | 'success' | 'error' | 'neutral' | 'warning'> = {
  pending: 'warning',
  accepted: 'success',
  rejected: 'error',
  expired: 'neutral',
};

function resolveUser(user: IdeaAuthor | string | null | undefined) {
  return typeof user === 'string' ? null : (user ?? null);
}

export default function MentorsScreen() {
  const router = useRouter();
  const [segment, setSegment] = useState<Segment>('directory');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [requestTarget, setRequestTarget] = useState<User | null>(null);
  const [openingChatId, setOpeningChatId] = useState<string | null>(null);

  const sendRequest = useSendMentorRequest();
  const mentorsQuery = useMentors(search);
  const requestsQuery = useMyMentorRequests();

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const mentors = useMemo(() => mentorsQuery.data ?? [], [mentorsQuery.data]);
  const requests = useMemo(
    () => requestsQuery.data ?? [],
    [requestsQuery.data]
  );

  const submitRequest = async (message: string) => {
    if (!requestTarget) return;
    setRequestTarget(null);
    try {
      await sendRequest.mutateAsync({
        mentorId: requestTarget._id || requestTarget.id || '',
        message,
      });
      Toast.show({ type: 'success', text1: 'Mentorship request sent' });
    } catch (error) {
      let message = 'Failed to send request.';
      if (isAxiosError(error)) {
        const apiMessage = (error.response?.data as ApiError | undefined)?.message;
        if (apiMessage) message = apiMessage;
      }
      Toast.show({ type: 'error', text1: message });
    }
  };

  const openAcceptedChat = async (mentorId: string) => {
    setOpeningChatId(mentorId);
    try {
      const res = await chatApi.createOrGetDirectChat(mentorId);
      router.push({ pathname: '/chat/[id]', params: { id: res.data.data._id } });
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to open chat.' });
    } finally {
      setOpeningChatId(null);
    }
  };

  return (
    <View className="flex-1 bg-gray-50 dark:bg-[#0b0f19]">
      <Stack.Screen options={{ title: 'Mentors' }} />

      <View className="flex-row gap-2 px-4 pt-3 pb-2">
        <Chip
          label="Find Mentors"
          active={segment === 'directory'}
          onPress={() => setSegment('directory')}
        />
        <Chip
          label={`My Requests${requests.length > 0 ? ` (${requests.length})` : ''}`}
          active={segment === 'requests'}
          onPress={() => setSegment('requests')}
        />
      </View>

      {segment === 'directory' ? (
        <>
          <View className="px-4 pb-2">
            <Input
              value={searchInput}
              onChangeText={setSearchInput}
              placeholder="Search mentors by name or skillâ€¦"
              returnKeyType="search"
            />
          </View>

          <FlatList
            data={mentors}
            keyExtractor={(item) => item._id || item.id || ''}
            contentContainerClassName="px-4 pb-6"
            ItemSeparatorComponent={() => <View className="h-2" />}
            refreshControl={
              <RefreshControl
                refreshing={mentorsQuery.isRefetching}
                onRefresh={() => void mentorsQuery.refetch()}
                tintColor="#4f46e5"
                colors={['#4f46e5']}
              />
            }
            ListEmptyComponent={
              mentorsQuery.isLoading ? (
                <View className="items-center py-16">
                  <ActivityIndicator size="large" color="#6366f1" />
                </View>
              ) : mentorsQuery.isError ? (
                <ErrorState
                  title="Couldn't load mentors"
                  onRetry={() => void mentorsQuery.refetch()}
                  retrying={mentorsQuery.isFetching}
                />
              ) : (
                <EmptyState
                  icon={Sparkles}
                  title={searchInput ? 'No matches' : 'No mentors yet'}
                  message={
                    searchInput
                      ? 'Try a different name or skill.'
                      : 'Approved mentors will appear here.'
                  }
                />
              )
            }
            renderItem={({ item }) => (
              <Card>
                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: '/users/[id]',
                      params: { id: item._id || item.id || '' },
                    })
                  }>
                  <View className="flex-row items-start gap-3">
                    <Avatar
                      name={item.name || '?'}
                      uri={item.avatar?.url ?? null}
                      size={44}
                    />
                    <View className="flex-1">
                      <View className="flex-row items-center justify-between gap-2">
                        <Text className="flex-1 font-sans-semibold text-sm text-gray-900 dark:text-gray-100">
                          {item.name}
                        </Text>
                        {typeof item.reputation === 'number' ? (
                          <Badge label={`${item.reputation} rep`} tone="warning" />
                        ) : null}
                      </View>
                      {item.bio ? (
                        <Text
                          numberOfLines={2}
                          className="mt-0.5 font-sans text-xs leading-snug text-gray-500 dark:text-gray-400">
                          {item.bio}
                        </Text>
                      ) : null}
                      {(item.skills?.length ?? 0) > 0 ? (
                        <Text
                          numberOfLines={1}
                          className="mt-1 font-sans text-[11px] text-primary-600 dark:text-primary-400">
                          {item.skills?.slice(0, 4).join(' Â· ')}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                </Pressable>
                <Button
                  title={
                    sendRequest.isPending && requestTarget?._id === item._id
                      ? 'Sendingâ€¦'
                      : 'Request Mentorship'
                  }
                  variant="soft"
                  className="mt-3 h-9"
                  onPress={() => setRequestTarget(item)}
                />
              </Card>
            )}
          />
        </>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => item._id}
          contentContainerClassName="px-4 pb-6 pt-1"
          ItemSeparatorComponent={() => <View className="h-2" />}
          refreshControl={
            <RefreshControl
              refreshing={requestsQuery.isRefetching}
              onRefresh={() => void requestsQuery.refetch()}
              tintColor="#4f46e5"
              colors={['#4f46e5']}
            />
          }
          ListEmptyComponent={
            requestsQuery.isLoading ? (
              <View className="items-center py-16">
                <ActivityIndicator size="large" color="#6366f1" />
              </View>
            ) : requestsQuery.isError ? (
              <ErrorState
                title="Couldn't load your requests"
                onRetry={() => void requestsQuery.refetch()}
                retrying={requestsQuery.isFetching}
              />
            ) : (
              <EmptyState
                icon={Sparkles}
                title="No requests yet"
                message="Request a mentor from the directory and track it here."
              />
            )
          }
          renderItem={({ item }) => {
            const mentor = resolveUser(item.recipient);
            return (
              <Card>
                <View className="flex-row items-center gap-3">
                  <Avatar
                    name={mentor?.name ?? '?'}
                    uri={mentor?.avatar?.url ?? null}
                    size={40}
                  />
                  <View className="flex-1">
                    <Text className="font-sans-semibold text-sm text-gray-900 dark:text-gray-100">
                      {mentor?.name ?? 'Mentor'}
                    </Text>
                    <Text className="font-sans text-[11px] text-gray-400 dark:text-gray-500">
                      Requested {timeAgo(item.createdAt)}
                    </Text>
                  </View>
                  <Badge
                    label={titleCase(item.status)}
                    tone={requestStatusTone[item.status]}
                  />
                </View>
                {item.message ? (
                  <Text
                    numberOfLines={2}
                    className="mt-2 font-sans text-xs leading-snug text-gray-500 dark:text-gray-400">
                    {item.message}
                  </Text>
                ) : null}
                {item.status === 'accepted' ? (
                  <Button
                    title={
                      openingChatId ===
                      (typeof item.recipient === 'string'
                        ? item.recipient
                        : item.recipient._id)
                        ? 'Openingâ€¦'
                        : 'Open Chat'
                    }
                    variant="soft"
                    className="mt-3 h-9 self-stretch"
                    onPress={() =>
                      void openAcceptedChat(
                        typeof item.recipient === 'string'
                          ? item.recipient
                          : (item.recipient._id ?? '')
                      )
                    }
                  />
                ) : null}
              </Card>
            );
          }}
        />
      )}

      <PromptModal
        visible={requestTarget !== null}
        title={`Ask ${requestTarget?.name ?? 'mentor'} for mentorship`}
        placeholder="What would you like guidance on?"
        multiline
        submitLabel="Send request"
        loading={sendRequest.isPending}
        onClose={() => setRequestTarget(null)}
        onSubmit={(value) => void submitRequest(value)}
      />
    </View>
  );
}
