import type { ReactNode } from 'react';
import { Link } from 'react-router';
import type { WelcomeAction } from './types';

interface SurfaceActionProps extends WelcomeAction {
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}

export function SurfaceAction({
  label,
  loadingLabel,
  to,
  onClick,
  loading = false,
  disabled = false,
  className = '',
}: SurfaceActionProps) {
  const inactive = loading || disabled;
  const content: ReactNode = loading ? (loadingLabel ?? label) : label;
  const classes = [
    'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-colors',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-2 focus-visible:ring-offset-dark-950',
    inactive ? 'cursor-not-allowed opacity-50' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  if (to !== undefined) {
    return (
      <Link
        to={to}
        className={classes}
        aria-busy={loading || undefined}
        aria-disabled={inactive || undefined}
        tabIndex={inactive ? -1 : undefined}
        onClick={
          inactive
            ? (event) => {
                event.preventDefault();
              }
            : undefined
        }
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={classes}
      onClick={onClick}
      disabled={inactive}
      aria-busy={loading || undefined}
    >
      {content}
    </button>
  );
}
