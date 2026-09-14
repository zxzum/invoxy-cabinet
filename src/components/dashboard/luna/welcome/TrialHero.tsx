import type { ReactNode } from 'react';
import { BoltIcon, SparklesIcon } from '@/components/icons';
import { SurfaceAction } from './SurfaceAction';
import type { WelcomeAction, WelcomeStat } from './types';

export interface TrialHeroProps {
  eyebrow: ReactNode;
  title: ReactNode;
  description: ReactNode;
  stats: readonly WelcomeStat[];
  action: WelcomeAction;
  price?: ReactNode;
  priceLabel?: ReactNode;
  balance?: ReactNode;
  balanceLabel?: ReactNode;
  loading?: boolean;
  disabled?: boolean;
  error?: ReactNode;
  className?: string;
}

export function TrialHero({
  eyebrow,
  title,
  description,
  stats,
  action,
  price,
  priceLabel,
  balance,
  balanceLabel,
  loading = false,
  disabled = false,
  error,
  className = '',
}: TrialHeroProps) {
  return (
    <article
      className={`relative isolate overflow-hidden rounded-[var(--bento-radius)] border border-accent-500/25 bg-dark-950/85 p-5 shadow-xl sm:p-7 ${className}`}
      style={{
        backgroundImage:
          "linear-gradient(115deg, rgba(10, 20, 34, 0.94), rgba(8, 14, 28, 0.64)), url('/images/trial-card-bg.png')",
        backgroundPosition: 'center',
        backgroundSize: 'cover',
      }}
      aria-busy={loading || undefined}
      aria-label={typeof title === 'string' ? title : undefined}
    >
      <img
        src="/images/trial-ribbon.png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute right-0 top-0 w-28 max-w-[28%] opacity-90 sm:w-40"
      />

      <div className="relative z-10 max-w-2xl">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent-400/25 bg-accent-400/10 px-3 py-1 text-xs font-semibold text-accent-300">
          <SparklesIcon className="h-4 w-4" aria-hidden="true" />
          <span>{eyebrow}</span>
        </div>
        <div className="flex items-start gap-3">
          <BoltIcon className="mt-1 h-6 w-6 shrink-0 text-accent-300" aria-hidden="true" />
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-dark-50 sm:text-3xl">{title}</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-dark-300 sm:text-base">
              {description}
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="rounded-2xl border border-white/10 bg-dark-950/35 p-3 text-center sm:p-4"
            >
              <div className="text-xl font-bold tracking-tight text-dark-50 sm:text-2xl">
                {stat.value}
              </div>
              <div className="mt-1 text-xs text-dark-400">{stat.label}</div>
            </div>
          ))}
        </div>

        {(price !== undefined || balance !== undefined) && (
          <dl className="mt-4 grid gap-2 rounded-2xl border border-white/10 bg-dark-950/35 p-3 sm:grid-cols-2 sm:p-4">
            {price !== undefined && (
              <div>
                <dt className="text-xs text-dark-400">{priceLabel}</dt>
                <dd className="mt-1 text-lg font-bold text-accent-300">{price}</dd>
              </div>
            )}
            {balance !== undefined && (
              <div>
                <dt className="text-xs text-dark-400">{balanceLabel}</dt>
                <dd className="mt-1 text-lg font-bold text-dark-50">{balance}</dd>
              </div>
            )}
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
          className="mt-5 w-full bg-accent-400 text-dark-950 hover:bg-accent-300 sm:w-auto"
        />
      </div>
    </article>
  );
}

export default TrialHero;
