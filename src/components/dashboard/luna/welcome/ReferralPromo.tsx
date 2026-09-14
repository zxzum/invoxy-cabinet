import type { ReactNode } from 'react';
import { ArrowRightIcon, UsersIcon } from '@/components/icons';
import { SurfaceAction } from './SurfaceAction';
import type { WelcomeAction, WelcomeStat } from './types';

export interface ReferralPromoProps {
  title: ReactNode;
  description: ReactNode;
  stats: readonly WelcomeStat[];
  action: WelcomeAction;
  loading?: boolean;
  disabled?: boolean;
  error?: ReactNode;
  className?: string;
}

export function ReferralPromo({
  title,
  description,
  stats,
  action,
  loading = false,
  disabled = false,
  error,
  className = '',
}: ReferralPromoProps) {
  return (
    <article
      className={`relative isolate overflow-hidden rounded-[var(--bento-radius)] border border-accent-500/20 bg-dark-900/80 p-5 sm:p-6 ${className}`}
      style={{
        backgroundImage:
          "linear-gradient(110deg, rgba(10, 16, 28, 0.96), rgba(10, 18, 30, 0.68)), url('/images/referral-network-bg.png')",
        backgroundPosition: 'center',
        backgroundSize: 'cover',
      }}
      aria-busy={loading || undefined}
      aria-label={typeof title === 'string' ? title : undefined}
    >
      <div className="relative z-10">
        <div className="flex items-start justify-between gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-accent-400/10 text-accent-300">
            <UsersIcon className="h-5 w-5" aria-hidden="true" />
          </span>
          <ArrowRightIcon className="mt-1 h-5 w-5 text-dark-500" aria-hidden="true" />
        </div>
        <h2 className="mt-5 text-xl font-semibold text-dark-50">{title}</h2>
        <p className="mt-2 max-w-md text-sm leading-6 text-dark-300">{description}</p>

        {stats.length > 0 && (
          <dl className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {stats.map((stat, index) => (
              <div key={index} className="rounded-2xl border border-white/10 bg-dark-950/35 p-3">
                <dd className="text-lg font-bold text-dark-50">{stat.value}</dd>
                <dt className="mt-1 text-xs text-dark-400">{stat.label}</dt>
              </div>
            ))}
          </dl>
        )}

        {error && (
          <div
            className="mt-4 rounded-xl border border-error-500/30 bg-error-500/10 p-3 text-sm text-error-300"
            role="alert"
          >
            {error}
          </div>
        )}

        <SurfaceAction
          {...action}
          loading={loading}
          disabled={disabled}
          className="mt-5 bg-accent-400 text-dark-950 hover:bg-accent-300"
        />
      </div>
    </article>
  );
}

export default ReferralPromo;
