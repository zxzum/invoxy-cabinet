import { useTranslation } from 'react-i18next';
import TrafficProgressBar from '../dashboard/TrafficProgressBar';
import type { TrafficResetStatus } from '../../types';

export interface WhiteInternetUsageProps {
  subscription: { whitelist_traffic_limit_gb?: number; whitelist_traffic_used_gb?: number };
  compact?: boolean;
  onResetClick?: () => void;
  trafficReset?: TrafficResetStatus | null;
}

export function WhiteInternetUsage({
  subscription,
  compact = false,
  onResetClick,
  trafficReset,
}: WhiteInternetUsageProps) {
  const { t } = useTranslation();
  const limit = subscription.whitelist_traffic_limit_gb ?? 0;
  if (limit <= 0) return null;
  const used = Math.max(0, subscription.whitelist_traffic_used_gb ?? 0);
  const percent = Math.min(100, (used / limit) * 100);
  const label = t('subscription.whiteInternetServers', 'LTE сервера');

  const renderResetControls = () => {
    if (!trafficReset?.enabled) return null;

    if (trafficReset.unavailable_reason === 'below_min_used') {
      return (
        <div className="mt-1.5 text-xs text-dark-400">
          {t('subscription.trafficReset.belowMinUsed', {
            min: trafficReset.min_used_gb,
            defaultValue: `Сброс доступен после ${trafficReset.min_used_gb} ГБ расхода`,
          })}
        </div>
      );
    }

    if (trafficReset.unavailable_reason === 'monthly_limit') {
      const nextDate = trafficReset.next_available_at
        ? new Date(trafficReset.next_available_at)
        : null;
      const monthName = nextDate ? nextDate.toLocaleString('default', { month: 'long' }) : '';
      return (
        <div className="mt-1.5 text-xs text-dark-400">
          {t('subscription.trafficReset.monthlyLimitReached', {
            month: monthName,
            defaultValue: `Лимит сбросов на этот месяц исчерпан. Следующий сброс с 1 ${monthName}`,
          })}
        </div>
      );
    }

    if (
      onResetClick &&
      trafficReset.used_gb >= trafficReset.min_used_gb &&
      trafficReset.remaining_this_month > 0
    ) {
      return (
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="text-xs text-dark-400">
            {t('subscription.trafficReset.resetsLeft', {
              left: trafficReset.remaining_this_month,
              max: trafficReset.max_per_month,
              defaultValue: `Осталось сбросов: ${trafficReset.remaining_this_month} из ${trafficReset.max_per_month}`,
            })}
          </span>
          <button
            type="button"
            onClick={onResetClick}
            className="btn-secondary px-2.5 py-1 text-xs"
          >
            {t('subscription.trafficReset.resetButton', 'Сбросить расход')}
          </button>
        </div>
      );
    }

    return null;
  };

  if (compact) {
    return (
      <div className="border-t border-accent-400/20 pt-3">
        <TrafficProgressBar
          usedGb={used}
          limitGb={limit}
          percent={percent}
          isUnlimited={false}
          compact
          label={label}
        />
        {renderResetControls()}
      </div>
    );
  }
  return (
    <div
      className={
        compact
          ? 'border-t border-accent-400/20 pt-3'
          : 'my-3 rounded-xl border border-accent-400/40 bg-accent-400/10 p-3'
      }
    >
      <div
        className={`mb-2 flex flex-wrap justify-between gap-2 font-semibold text-accent-400 ${compact ? 'text-xs' : 'text-sm'}`}
      >
        <span>{label}</span>
        <span>
          {used.toFixed(1)} / {limit} {t('common.units.gb', 'ГБ')}
        </span>
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(percent)}
        className={`${compact ? 'h-1.5' : 'h-2'} overflow-hidden rounded-full bg-accent-400/20`}
      >
        <div className="h-full rounded-full bg-accent-400" style={{ width: `${percent}%` }} />
      </div>
      {renderResetControls()}
    </div>
  );
}
