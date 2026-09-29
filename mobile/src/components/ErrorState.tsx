import { CloudOff } from 'lucide-react-native';
import { Button } from './Button';
import { EmptyState } from './EmptyState';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retrying?: boolean;
  className?: string;
}

/**
 * Shown when a list query fails. Without this, a failed query leaves `data`
 * undefined, the list renders empty, and ListEmptyComponent falls through to
 * the "nothing here yet" copy -- so a dropped connection reads as an empty
 * account. Distinct from EmptyState on purpose: that one is a real answer,
 * this one is a question the user can retry.
 */
export function ErrorState({
  title = "Couldn't load this",
  message = 'Check your connection and try again.',
  onRetry,
  retrying = false,
  className = 'mx-6',
}: ErrorStateProps) {
  return (
    <>
      <EmptyState icon={CloudOff} title={title} message={message} />
      {onRetry ? (
        <Button
          title="Try again"
          variant="outline"
          className={className}
          loading={retrying}
          onPress={onRetry}
        />
      ) : null}
    </>
  );
}
