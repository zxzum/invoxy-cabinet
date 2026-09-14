import type { ReactNode } from 'react';
import { ArrowRightIcon, ChatIcon } from '@/components/icons';
import { SurfaceAction } from './SurfaceAction';
import type { WelcomeAction } from './types';

export interface SupportStripProps {
  title: ReactNode;
  description: ReactNode;
  action: WelcomeAction;
  loading?: boolean;
  disabled?: boolean;
  error?: ReactNode;
  className?: string;
}

export function SupportStrip({
  title,
  description,
  action,
  loading = false,
  disabled = false,
  error,
  className = '',
}: SupportStripProps) {
  return (
    <section
      className={`rounded-[var(--bento-radius)] border border-dark-700/50 bg-dark-900/60 p-4 sm:p-5 ${className}`}
      aria-busy={loading || undefined}
      aria-label={typeof title === 'string' ? title : undefined}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-dark-800 text-accent-300">
            <ChatIcon className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-dark-50">{title}</h2>
            <p className="mt-1 text-sm leading-6 text-dark-400">{description}</p>
          </div>
        </div>
        <SurfaceAction
          {...action}
          loading={loading}
          disabled={disabled}
          className="w-full shrink-0 border border-dark-700/60 bg-dark-800/60 text-dark-100 hover:bg-dark-700/70 sm:w-auto"
        />
      </div>
      {error && (
        <div
          className="mt-3 flex items-start gap-2 rounded-xl border border-error-500/30 bg-error-500/10 p-3 text-sm text-error-300"
          role="alert"
        >
          <ArrowRightIcon className="mt-0.5 h-4 w-4 shrink-0 rotate-180" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}
    </section>
  );
}

export default SupportStrip;
