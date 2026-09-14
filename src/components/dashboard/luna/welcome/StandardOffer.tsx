import type { ReactNode } from 'react';
import { CheckCircleIcon, ShieldIcon } from '@/components/icons';
import { SurfaceAction } from './SurfaceAction';
import type { WelcomeAction } from './types';

export interface StandardOfferProps {
  title: ReactNode;
  description: ReactNode;
  price: ReactNode;
  priceLabel?: ReactNode;
  features?: readonly ReactNode[];
  action: WelcomeAction;
  loading?: boolean;
  disabled?: boolean;
  error?: ReactNode;
  className?: string;
}

export function StandardOffer({
  title,
  description,
  price,
  priceLabel,
  features = [],
  action,
  loading = false,
  disabled = false,
  error,
  className = '',
}: StandardOfferProps) {
  return (
    <article
      className={`flex h-full flex-col rounded-[var(--bento-radius)] border border-dark-700/50 bg-dark-900/75 p-5 shadow-lg sm:p-6 ${className}`}
      aria-busy={loading || undefined}
      aria-label={typeof title === 'string' ? title : undefined}
    >
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-accent-400/10 text-accent-300">
          <ShieldIcon className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-dark-50 sm:text-xl">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-dark-400">{description}</p>
        </div>
      </div>

      <div className="mt-6 flex items-end gap-2">
        <span className="text-3xl font-bold tracking-tight text-dark-50">{price}</span>
        {priceLabel && <span className="pb-1 text-sm text-dark-400">{priceLabel}</span>}
      </div>

      {features.length > 0 && (
        <ul className="mt-5 space-y-2 text-sm text-dark-300">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-2">
              <CheckCircleIcon
                className="mt-0.5 h-4 w-4 shrink-0 text-success-400"
                aria-hidden="true"
              />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-auto pt-6">
        {error && (
          <div
            className="mb-3 rounded-xl border border-error-500/30 bg-error-500/10 p-3 text-sm text-error-300"
            role="alert"
          >
            {error}
          </div>
        )}
        <SurfaceAction
          {...action}
          loading={loading}
          disabled={disabled}
          className="w-full border border-accent-400/25 bg-accent-400/10 text-accent-200 hover:bg-accent-400/20"
        />
      </div>
    </article>
  );
}

export default StandardOffer;
