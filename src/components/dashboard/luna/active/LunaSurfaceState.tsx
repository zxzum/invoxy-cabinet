import { Skeleton } from '@/components/ui/skeleton';

interface LunaSurfaceStateProps {
  message: string;
  className?: string;
}

interface LunaErrorStateProps extends LunaSurfaceStateProps {
  onRetry?: () => void;
  retryLabel?: string;
}

export function LunaLoadingState({ message, className = '' }: LunaSurfaceStateProps) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label={message}
      className={`glass-surface rounded-3xl p-6 ${className}`}
    >
      <Skeleton className="block h-5 w-2/3" />
      <Skeleton className="mt-4 block h-3 w-full" />
      <Skeleton className="mt-2 block h-3 w-4/5" />
    </div>
  );
}

export function LunaEmptyState({ message, className = '' }: LunaSurfaceStateProps) {
  return (
    <div
      role="status"
      aria-label={message}
      className={`glass-surface rounded-3xl p-6 text-center text-sm text-dark-400 ${className}`}
    >
      {message}
    </div>
  );
}

export function LunaErrorState({
  message,
  onRetry,
  retryLabel = 'Retry',
  className = '',
}: LunaErrorStateProps) {
  return (
    <div
      role="alert"
      className={`rounded-xl border border-error-500/30 bg-error-500/10 p-3 text-sm text-error-300 ${className}`}
    >
      <p>{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 min-h-9 rounded-full border border-error-500/30 px-3 text-xs font-semibold text-error-300 transition-colors hover:bg-error-500/10"
        >
          {retryLabel}
        </button>
      )}
    </div>
  );
}
