import { CalendarIcon, ChevronRightIcon } from '@/components/icons';
import type { RenewalOption } from '@/types';
import { LunaEmptyState, LunaErrorState, LunaLoadingState } from './LunaSurfaceState';

export interface LunaRenewalCardProps {
  options: RenewalOption[];
  selectedPeriodDays: number | null;
  isLoading?: boolean;
  isSubmitting?: boolean;
  errorMessage?: string;
  onRetry?: () => void;
  retryLabel?: string;
  onSelect?: (option: RenewalOption) => void;
  onSubmit?: (option: RenewalOption) => void;
  onOpenRenewalOptions?: () => void;
  formatPrice?: (option: RenewalOption) => string;
  formatPeriod?: (periodDays: number) => string;
  title?: string;
  allOptionsLabel?: string;
  submitLabel?: string;
  emptyMessage?: string;
  loadingMessage?: string;
}

export default function LunaRenewalCard({
  options,
  selectedPeriodDays,
  isLoading = false,
  isSubmitting = false,
  errorMessage,
  onRetry,
  retryLabel,
  onSelect,
  onSubmit,
  onOpenRenewalOptions,
  formatPrice = (option) => String(option.price_rubles),
  formatPeriod = (periodDays) => `${String(periodDays)} days`,
  title = 'Quick renewal',
  allOptionsLabel = 'All renewal options',
  submitLabel = 'Renew subscription',
  emptyMessage = 'No renewal options',
  loadingMessage = 'Loading renewal options',
}: LunaRenewalCardProps) {
  if (isLoading) return <LunaLoadingState message={loadingMessage} />;
  if (!errorMessage && options.length === 0) return <LunaEmptyState message={emptyMessage} />;

  const selectedOption = options.find((option) => option.period_days === selectedPeriodDays);

  return (
    <section className="glass-surface rounded-[28px] p-4 sm:p-5" aria-label={title}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-400/10 text-accent-300">
            <CalendarIcon className="h-5 w-5" />
          </span>
          <h2 className="truncate text-lg font-semibold text-dark-50">{title}</h2>
        </div>
        {onOpenRenewalOptions && (
          <button
            type="button"
            onClick={onOpenRenewalOptions}
            className="inline-flex min-h-10 shrink-0 items-center gap-1 rounded-full px-2 text-xs font-semibold text-accent-300 hover:text-accent-200"
          >
            {allOptionsLabel}
            <ChevronRightIcon className="h-4 w-4" />
          </button>
        )}
      </div>

      {errorMessage && (
        <LunaErrorState
          message={errorMessage}
          onRetry={onRetry}
          retryLabel={retryLabel}
          className="mt-4"
        />
      )}

      {options.length === 0 ? (
        <LunaEmptyState message={emptyMessage} className="mt-4 p-4" />
      ) : (
        <>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {options.map((option) => {
              const isSelected = option.period_days === selectedPeriodDays;

              return (
                <button
                  key={option.period_days}
                  type="button"
                  onClick={() => onSelect?.(option)}
                  aria-pressed={isSelected}
                  className={
                    isSelected
                      ? 'min-h-14 rounded-2xl border border-accent-400 bg-accent-400/15 px-4 py-3 text-left text-dark-50 transition-colors'
                      : 'min-h-14 rounded-2xl border border-dark-700/70 bg-dark-800/40 px-4 py-3 text-left text-dark-200 transition-colors hover:border-accent-400/30'
                  }
                >
                  <span className="block text-sm font-semibold">
                    {formatPeriod(option.period_days)}
                  </span>
                  <span className="mt-1 block text-xs text-accent-300">{formatPrice(option)}</span>
                  {option.discount_percent > 0 && (
                    <span className="mt-1 block text-[10px] text-success-400">
                      -{option.discount_percent}%
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => {
              if (!selectedOption) return;
              if (onSubmit) {
                onSubmit(selectedOption);
              } else {
                onOpenRenewalOptions?.();
              }
            }}
            disabled={!selectedOption || (!onSubmit && !onOpenRenewalOptions) || isSubmitting}
            className="mt-4 flex min-h-12 w-full items-center justify-center rounded-full bg-accent-400 px-4 text-sm font-bold text-on-accent transition-colors hover:bg-accent-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitLabel}
          </button>
        </>
      )}
    </section>
  );
}
