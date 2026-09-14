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
      <span className="block h-5 w-2/3 animate-pulse rounded bg-dark-500/40" />
      <span className="mt-4 block h-3 w-full animate-pulse rounded bg-dark-500/30" />
      <span className="mt-2 block h-3 w-4/5 animate-pulse rounded bg-dark-500/30" />
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
