import { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Share,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import {
  Bookmark,
  ChevronDown,
  ChevronUp,
  Heart,
  MessageCircle,
  Send,
  Share2,
  Sparkles,
  Star,
  Trash2,
  X,
} from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { isAxiosError } from 'axios';

import { Avatar } from '@/components/Avatar';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Chip } from '@/components/Chip';
import { EmptyState } from '@/components/EmptyState';
import { Input } from '@/components/Input';
import {
  useAddComment,
  useAddMentorReview,
  useDeleteComment,
  useDeleteIdea,
  useIdea,
  useIdeaComments,
  useLikeComment,
  useToggleBookmark,
  useToggleLike,
} from '@/hooks/queries/useIdeas';
import { useCurrentUser } from '@/hooks/useAuth';
import type { ApiError, IdeaAuthor, IdeaComment, MentorReview } from '@/types/models';
import { timeAgo, titleCase } from '@/utils/format';

function Stars({
  value,
  size = 14,
}: {
  value: number;
  size?: number;
}) {
  return (
    <View className="flex-row gap-0.5">
      {[1, 2, 3, 4, 5].map((step) => (
        <Star
          key={step}
          size={size}
          color={step <= Math.round(value) ? '#f59e0b' : '#d1d5db'}
          fill={step <= Math.round(value) ? '#f59e0b' : 'transparent'}
          strokeWidth={1.5}
        />
      ))}
    </View>
  );
}

function ActionPill({
  icon,
  label,
  onPress,
  active = false,
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  active?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center gap-1.5 rounded-full border px-3 py-2 ${
        active
          ? 'border-primary-200 bg-primary-50 dark:border-primary-500/40 dark:bg-primary-500/10'
          : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900'
      }`}>
      {icon}
      <Text className="font-sans-medium text-xs text-gray-600 dark:text-gray-300">
        {label}
      </Text>
    </Pressable>
  );
}

function resolveAuthor(author: IdeaAuthor | string | undefined): IdeaAuthor | null {
  return typeof author === 'string' ? null : (author ?? null);
}

function isTempComment(id: string): boolean {
  return id.startsWith('temp-');
}

function CommentItem({
  comment,
  currentUserId,
  isAdmin,
  onReply,
  onDelete,
  onLike,
}: {
  comment: IdeaComment;
  currentUserId: string;
  isAdmin: boolean;
  onReply: (comment: IdeaComment) => void;
  onDelete: (commentId: string) => void;
  onLike: (commentId: string) => void;
}) {
  const liked = comment.likes.includes(currentUserId);
  const own = comment.author._id === currentUserId;

  return (
    <View className={isTempComment(comment._id) ? 'opacity-60' : ''}>
      <View className="flex-row gap-2.5">
        <Avatar name={comment.author.name} uri={comment.author.avatar?.url ?? null} size={32} />
        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            <Text className="font-sans-semibold text-sm text-gray-900 dark:text-gray-100">
              {comment.author.name}
            </Text>
            <Text className="font-sans text-[11px] text-gray-400 dark:text-gray-500">
              {timeAgo(comment.createdAt)}
              {comment.isEdited ? ' · edited' : ''}
            </Text>
          </View>
          <Text className="mt-1 font-sans text-sm leading-snug text-gray-700 dark:text-gray-300">
            {comment.content}
          </Text>
          <View className="mt-1.5 flex-row items-center gap-4">
            <Pressable onPress={() => onLike(comment._id)} className="flex-row items-center gap-1">
              <Heart
                size={14}
                color={liked ? '#ef4444' : '#9ca3af'}
                fill={liked ? '#ef4444' : 'transparent'}
                strokeWidth={2}
              />
              {comment.likes.length > 0 ? (
                <Text className="font-sans-medium text-[11px] text-gray-400">{comment.likes.length}</Text>
              ) : null}
            </Pressable>
            <Pressable onPress={() => onReply(comment)}>
              <Text className="font-sans-medium text-[11px] text-primary-600 dark:text-primary-400">
                Reply
              </Text>
            </Pressable>
            {own || isAdmin ? (
              <Pressable onPress={() => onDelete(comment._id)}>
                <Trash2 size={14} color="#9ca3af" strokeWidth={2} />
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>

      {(comment.replies ?? []).filter(
        (reply): reply is IdeaComment => typeof reply !== 'string'
      ).length > 0 ? (
        <View className="ml-10 mt-3 gap-3 border-l border-gray-100 pl-3 dark:border-gray-800">
          {(comment.replies ?? [])
            .filter((reply): reply is IdeaComment => typeof reply !== 'string')
            .map((reply) => (
              <CommentItem
                key={reply._id}
                comment={reply}
                currentUserId={currentUserId}
                isAdmin={isAdmin}
                onReply={onReply}
                onDelete={onDelete}
                onLike={onLike}
              />
            ))}
        </View>
      ) : null}
    </View>
  );
}

function MentorReviewForm({
  ideaId,
  existing,
  onDone,
}: {
  ideaId: string;
  existing?: MentorReview;
  onDone: () => void;
}) {
  const [rating, setRating] = useState(existing?.rating ?? 0);
  const [reviewText, setReviewText] = useState(existing?.review ?? '');

  const mutation = useAddMentorReview(ideaId);

  const submit = async () => {
    if (rating === 0) {
      Toast.show({ type: 'error', text1: 'Select a star rating first' });
      return;
    }
    try {
      await mutation.mutateAsync({ review: reviewText.trim(), rating });
      Toast.show({
        type: 'success',
        text1: existing ? 'Review updated' : 'Review published',
      });
      onDone();
    } catch (error) {
      let message = 'Failed to save review.';
      if (isAxiosError(error)) {
        const apiMessage = (error.response?.data as ApiError | undefined)?.message;
        if (apiMessage) message = apiMessage;
      }
      Toast.show({ type: 'error', text1: message });
    }
  };

  return (
    <Card className="mt-3">
      <Text className="font-sans-semibold text-sm text-gray-900 dark:text-gray-100">
        {existing ? 'Update your review' : 'Write a mentor review'}
      </Text>
      <View className="mt-2 flex-row gap-1">
        {[1, 2, 3, 4, 5].map((step) => (
          <Pressable key={step} onPress={() => setRating(step)}>
            <Star
              size={26}
              color={step <= rating ? '#f59e0b' : '#d1d5db'}
              fill={step <= rating ? '#f59e0b' : 'transparent'}
              strokeWidth={1.5}
            />
          </Pressable>
        ))}
      </View>
      <Input
        value={reviewText}
        onChangeText={setReviewText}
        placeholder="Share your expert feedback (min 10 characters)"
        multiline
        containerClassName="mt-3"
      />
      <View className="mt-3 flex-row gap-2">
        <Button
          title={existing ? 'Save changes' : 'Publish review'}
          onPress={() => void submit()}
          loading={mutation.isPending}
          className="flex-1"
        />
        <Button title="Cancel" variant="outline" onPress={onDone} />
      </View>
    </Card>
  );
}

export default function IdeaDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const currentUser = useCurrentUser();
  const userId = currentUser?._id || currentUser?.id || '';

  const ideaQuery = useIdea(id);
  const commentsQuery = useIdeaComments(id);
  const toggleLike = useToggleLike();
  const toggleBookmark = useToggleBookmark();
  const addComment = useAddComment(id);
  const deleteComment = useDeleteComment(id);
  const likeComment = useLikeComment(id);
  const deleteIdea = useDeleteIdea();

  const [showAiInsights, setShowAiInsights] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [draftComment, setDraftComment] = useState('');
  const [replyTo, setReplyTo] = useState<IdeaComment | null>(null);
  const [commentsTopY, setCommentsTopY] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const scrollToComments = useCallback(() => {
    if (commentsTopY > 0) {
      scrollRef.current?.scrollTo({ y: commentsTopY - 8, animated: true });
    }
  }, [commentsTopY]);

  const idea = ideaQuery.data?.data;

  const author = useMemo(() => resolveAuthor(idea?.author), [idea]);
  const isOwner =
    !!author && !!userId && (author._id || author.id) === userId;

  const canReview =
    !!idea &&
    !isOwner &&
    currentUser?.role === 'mentor' &&
    currentUser.isMentorApproved !== false;

  const myReview = useMemo(
    () =>
      idea?.mentorReviews?.find(
        (review) =>
          typeof review.mentor !== 'string' &&
          (review.mentor._id || review.mentor.id) === userId
      ),
    [idea, userId]
  );

  const avgRating = useMemo(() => {
    const reviews = idea?.mentorReviews ?? [];
    if (reviews.length === 0) return 0;
    return (
      reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    );
  }, [idea]);

  const isLiked = !!idea && !!userId && idea.likes.includes(userId);
  const isBookmarked = !!idea && !!userId && idea.bookmarks.includes(userId);

  const handleShare = useCallback(async () => {
    if (!idea) return;
    await Share.share({
      message: `${idea.title}\n\nShared from IdeaConnect\nideaconnect://ideas/${idea._id}`,
    });
  }, [idea]);

  const handleSubmitComment = async () => {
    const content = draftComment.trim();
    if (!content) return;
    try {
      await addComment.mutateAsync({
        content,
        parentId: replyTo?._id,
      });
      setDraftComment('');
      setReplyTo(null);
    } catch (error) {
      let message = 'Failed to post comment.';
      if (isAxiosError(error)) {
        const apiMessage = (error.response?.data as ApiError | undefined)?.message;
        if (apiMessage) message = apiMessage;
      }
      Toast.show({ type: 'error', text1: message });
    }
  };

  const confirmDeleteComment = (commentId: string) => {
    if (commentId.startsWith('temp-')) return;
    Alert.alert('Delete comment', 'Replies will also be removed.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteComment.mutate(commentId),
      },
    ]);
  };

  const confirmDeleteIdea = () => {
    Alert.alert('Delete idea', 'This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          deleteIdea.mutate(id, {
            onSuccess: () => {
              Toast.show({ type: 'success', text1: 'Idea deleted' });
              router.back();
            },
          }),
      },
    ]);
  };

  if (ideaQuery.isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 dark:bg-[#0b0f19]">
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  if (ideaQuery.isError || !idea) {
    return (
      <View className="flex-1 justify-center bg-gray-50 dark:bg-[#0b0f19]">
        <Stack.Screen options={{ title: 'Not found' }} />
        <EmptyState
          title="Idea unavailable"
          message="It may have been deleted, or you don't have access to it."
        />
        <Button
          title="Go back"
          variant="outline"
          className="mx-6"
          onPress={() => router.back()}
        />
      </View>
    );
  }

  const aiAnalysis = idea.aiAnalysis;
  const hasAiInsights =
    !!aiAnalysis &&
    ((aiAnalysis.suggestions?.length ?? 0) > 0 ||
      (aiAnalysis.challenges?.length ?? 0) > 0 ||
      (aiAnalysis.recommendedTechnologies?.length ?? 0) > 0);

  const comments = commentsQuery.data?.data ?? [];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-gray-50 dark:bg-[#0b0f19]">
      <Stack.Screen options={{ title: 'Idea' }} />

      <ScrollView ref={scrollRef} contentContainerClassName="px-4 pb-8 pt-3">
        <View className="mb-2 flex-row flex-wrap items-center gap-2">
          <Badge label={titleCase(idea.category)} />
          <Badge label={titleCase(idea.status)} tone={idea.status === 'open' ? 'success' : 'warning'} />
          {idea.visibility !== 'public' ? (
            <Badge label={titleCase(idea.visibility)} tone="neutral" />
          ) : null}
        </View>

        <Text className="font-sans-bold text-xl leading-tight text-gray-900 dark:text-gray-100">
          {idea.title}
        </Text>

        {author ? (
          <View className="mt-3 flex-row items-center gap-2.5">
            <Avatar name={author.name} uri={author.avatar?.url ?? null} size={36} />
            <View className="flex-1">
              <Text className="font-sans-semibold text-sm text-gray-900 dark:text-gray-100">
                {author.name}
              </Text>
              <Text className="font-sans text-xs text-gray-400 dark:text-gray-500">
                Posted {timeAgo(idea.createdAt)} · {idea.views} views
              </Text>
            </View>
          </View>
        ) : null}

        <View className="mt-3 flex-row flex-wrap gap-2">
          <ActionPill
            onPress={() => toggleLike.mutate(idea._id)}
            active={isLiked}
            icon={
              <Heart
                size={15}
                color={isLiked ? '#4f46e5' : '#9ca3af'}
                fill={isLiked ? '#4f46e5' : 'transparent'}
                strokeWidth={2.2}
              />
            }
            label={`${idea.likes.length}`}
          />
          <ActionPill
            onPress={() => toggleBookmark.mutate(idea._id)}
            active={isBookmarked}
            icon={
              <Bookmark
                size={15}
                color={isBookmarked ? '#4f46e5' : '#9ca3af'}
                fill={isBookmarked ? '#4f46e5' : 'transparent'}
                strokeWidth={2.2}
              />
            }
            label={isBookmarked ? 'Saved' : 'Save'}
          />
          <ActionPill
            onPress={() => void handleShare()}
            icon={<Share2 size={15} color="#9ca3af" strokeWidth={2.2} />}
            label="Share"
          />
          <ActionPill
            onPress={scrollToComments}
            icon={<MessageCircle size={15} color="#9ca3af" strokeWidth={2.2} />}
            label={`${idea.commentsCount}`}
          />
        </View>

        <Text className="mt-4 font-sans text-[15px] leading-relaxed text-gray-700 dark:text-gray-300">
          {idea.description}
        </Text>

        {idea.tags.length > 0 ? (
          <View className="mt-4 flex-row flex-wrap gap-2">
            {idea.tags.map((tag, index) => (
              <Chip key={`${tag}-${index}`} label={`#${tag}`} />
            ))}
          </View>
        ) : null}

        {idea.requiredSkills.length > 0 ? (
          <View className="mt-3">
            <Text className="mb-2 font-sans-medium text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500">
              Skills needed
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {idea.requiredSkills.map((skill, index) => (
                <Chip key={`${skill}-${index}`} label={skill} />
              ))}
            </View>
          </View>
        ) : null}

        {hasAiInsights ? (
          <Card className="mt-4">
            <Pressable
              onPress={() => setShowAiInsights((prev) => !prev)}
              className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <Sparkles size={18} color="#8b5cf6" strokeWidth={2} />
                <Text className="font-sans-semibold text-sm text-gray-900 dark:text-gray-100">
                  AI Insights
                </Text>
              </View>
              {showAiInsights ? (
                <ChevronUp size={18} color="#9ca3af" strokeWidth={2} />
              ) : (
                <ChevronDown size={18} color="#9ca3af" strokeWidth={2} />
              )}
            </Pressable>

            {showAiInsights ? (
              <View className="mt-3 gap-3">
                {(aiAnalysis?.suggestions?.length ?? 0) > 0 ? (
                  <View>
                    <Text className="font-sans-medium text-xs uppercase tracking-wide text-violet-500">
                      Suggestions
                    </Text>
                    {aiAnalysis?.suggestions?.map((item, index) => (
                      <Text key={index} className="mt-1 font-sans text-sm text-gray-600 dark:text-gray-300">
                        • {item}
                      </Text>
                    ))}
                  </View>
                ) : null}
                {(aiAnalysis?.challenges?.length ?? 0) > 0 ? (
                  <View>
                    <Text className="font-sans-medium text-xs uppercase tracking-wide text-amber-500">
                      Challenges
                    </Text>
                    {aiAnalysis?.challenges?.map((item, index) => (
                      <Text key={index} className="mt-1 font-sans text-sm text-gray-600 dark:text-gray-300">
                        • {item}
                      </Text>
                    ))}
                  </View>
                ) : null}
                {(aiAnalysis?.recommendedTechnologies?.length ?? 0) > 0 ? (
                  <View>
                    <Text className="font-sans-medium text-xs uppercase tracking-wide text-sky-500">
                      Recommended technologies
                    </Text>
                    <View className="mt-1.5 flex-row flex-wrap gap-2">
                      {aiAnalysis?.recommendedTechnologies?.map((item, index) => (
                        <Chip key={`${item}-${index}`} label={item} />
                      ))}
                    </View>
                  </View>
                ) : null}
              </View>
            ) : null}
          </Card>
        ) : null}

        <View className="mt-5">
          <View className="flex-row items-center justify-between">
            <Text className="font-sans-bold text-base text-gray-900 dark:text-gray-100">
              Mentor Reviews
            </Text>
            {(idea.mentorReviews?.length ?? 0) > 0 ? (
              <View className="flex-row items-center gap-1.5">
                <Stars value={avgRating} />
                <Text className="font-sans-medium text-xs text-gray-500 dark:text-gray-400">
                  {avgRating.toFixed(1)} ({idea.mentorReviews?.length})
                </Text>
              </View>
            ) : null}
          </View>

          {canReview && !showReviewForm ? (
            <Button
              title={myReview ? 'Update your review' : 'Write a review'}
              variant="soft"
              className="mt-3"
              onPress={() => setShowReviewForm(true)}
            />
          ) : null}

          {canReview && showReviewForm ? (
            <MentorReviewForm
              ideaId={idea._id}
              existing={myReview}
              onDone={() => setShowReviewForm(false)}
            />
          ) : null}

          {(idea.mentorReviews?.length ?? 0) === 0 && !canReview ? (
            <Text className="mt-2 font-sans text-sm text-gray-500 dark:text-gray-400">
              No mentor reviews yet.
            </Text>
          ) : null}

          {(idea.mentorReviews ?? [])
            .filter((review) => typeof review.mentor !== 'string')
            .map((review, index) => {
              const reviewer = review.mentor as IdeaAuthor;
              return (
                <Card key={`${reviewer._id}-${index}`} className="mt-3">
                  <View className="flex-row items-center gap-2.5">
                    <Avatar name={reviewer.name} uri={reviewer.avatar?.url ?? null} size={32} />
                    <View className="flex-1">
                      <Text className="font-sans-semibold text-sm text-gray-900 dark:text-gray-100">
                        {reviewer.name}
                      </Text>
                      {review.createdAt ? (
                        <Text className="font-sans text-[11px] text-gray-400 dark:text-gray-500">
                          {timeAgo(review.createdAt)}
                        </Text>
                      ) : null}
                    </View>
                    <Stars value={review.rating} />
                  </View>
                  <Text className="mt-2 font-sans text-sm leading-snug text-gray-600 dark:text-gray-300">
                    {review.review}
                  </Text>
                </Card>
              );
            })}
        </View>

        {isOwner ? (
          <View className="mt-5 flex-row gap-2">
            <Button
              title="Edit idea"
              variant="outline"
              className="flex-1"
              onPress={() =>
                router.push({ pathname: '/ideas/create', params: { id: idea._id } })
              }
            />
            <Button
              title="Delete"
              variant="outline"
              className="flex-1 border-red-200 dark:border-red-500/30"
              onPress={confirmDeleteIdea}
              disabled={deleteIdea.isPending}
            />
          </View>
        ) : null}

        <View
          className="mt-6 mb-3"
          onLayout={(event) => setCommentsTopY(event.nativeEvent.layout.y)}>
          <Text className="font-sans-bold text-base text-gray-900 dark:text-gray-100">
            Comments ({idea.commentsCount})
          </Text>
        </View>

        {commentsQuery.isLoading ? (
          <ActivityIndicator size="small" color="#6366f1" />
        ) : comments.length === 0 ? (
          <Text className="font-sans text-sm text-gray-500 dark:text-gray-400">
            Be the first to comment.
          </Text>
        ) : (
          <View className="gap-4 pb-2">
            {comments.map((comment) => (
              <CommentItem
                key={comment._id}
                comment={comment}
                currentUserId={userId}
                isAdmin={currentUser?.role === 'admin'}
                onReply={(target) => setReplyTo(target)}
                onDelete={confirmDeleteComment}
                onLike={(commentId) => likeComment.mutate(commentId)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {replyTo ? (
        <View className="mx-4 mb-1 flex-row items-center justify-between rounded-lg bg-primary-50 px-3 py-2 dark:bg-primary-500/10">
          <Text className="flex-1 font-sans text-xs text-primary-700 dark:text-primary-300" numberOfLines={1}>
            Replying to {replyTo.author.name}
          </Text>
          <Pressable onPress={() => setReplyTo(null)}>
            <X size={16} color="#4f46e5" strokeWidth={2.2} />
          </Pressable>
        </View>
      ) : null}

      <View className="flex-row items-end gap-2 border-t border-gray-100 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900">
        <Input
          value={draftComment}
          onChangeText={setDraftComment}
          placeholder="Write a comment…"
          multiline
          containerClassName="flex-1"
        />
        <Pressable
          onPress={() => void handleSubmitComment()}
          disabled={!draftComment.trim() || addComment.isPending}
          className={`h-11 w-11 items-center justify-center rounded-full ${
            draftComment.trim()
              ? 'bg-primary-600 active:bg-primary-700 dark:bg-primary-500'
              : 'bg-gray-200 dark:bg-gray-800'
          }`}>
          {addComment.isPending ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Send
              size={18}
              color={draftComment.trim() ? '#ffffff' : '#9ca3af'}
              strokeWidth={2.2}
            />
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
