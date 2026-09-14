import { Skeleton } from '@/components/ui/skeleton';

interface LunaSurfaceStateProps {
  message: string;
  className?: string;
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
