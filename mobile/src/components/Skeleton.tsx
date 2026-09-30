import { useEffect, useState } from 'react';
import { Animated, View } from 'react-native';

interface SkeletonProps {
  className?: string;
}

/**
 * A single shimmering placeholder block.
 *
 * Deliberately hand-rolled on Animated rather than pulling in a skeleton
 * library: this is one opacity loop, and a dependency for it would cost more
 * than it saves.
 */
export function Skeleton({ className = '' }: SkeletonProps) {
  // useState with a lazy initialiser, not useRef: useRef's argument is
  // re-evaluated on every render (the previous value is just discarded), and
  // reading a ref during render trips the React Compiler lint rule. This runs
  // the constructor exactly once.
  const [pulse] = useState(() => new Animated.Value(0.55));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.55,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    // Stop on unmount: these lists mount and unmount constantly as tabs change,
    // and a leaked loop keeps the animation driver awake.
    return () => loop.stop();
  }, [pulse]);

  return (
    <Animated.View
      style={{ opacity: pulse }}
      className={`rounded-lg bg-gray-200 dark:bg-gray-700 ${className}`}
    />
  );
}

interface ListSkeletonProps {
  /** How many placeholder rows to draw. */
  rows?: number;
}

/**
 * Placeholder rows for a list that is still loading.
 *
 * The shape deliberately matches the real cards (leading circle plus two text
 * lines) so the list does not reflow when the data lands -- which is the
 * actual reason a spinner reads as jank: the screen is a blank void and then
 * everything jumps at once.
 */
export function ListSkeleton({ rows = 6 }: ListSkeletonProps) {
  return (
    <View className="gap-3 px-4 py-4" accessibilityLabel="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <View
          key={i}
          className="flex-row items-center gap-3 rounded-xl border border-gray-100 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
          <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
          <View className="flex-1 gap-2">
            {/* Vary the widths so it reads as text, not as bars. */}
            <Skeleton className={`h-3.5 ${i % 3 === 0 ? 'w-3/4' : 'w-2/3'}`} />
            <Skeleton className="h-3 w-1/2" />
          </View>
        </View>
      ))}
    </View>
  );
}