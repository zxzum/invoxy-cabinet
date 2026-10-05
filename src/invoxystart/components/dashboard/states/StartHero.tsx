import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { ArrowRight } from '@/invoxystart/components/ui/RuneIcon';
import type { TrialInfo } from '@/invoxystart/api';

/**
 * Первый экран без подписки: одно главное действие. Если пробный период
 * доступен — «Попробовать бесплатно», иначе — «Выбрать тариф».
 */
export function StartHero({
  trialInfo,
  activating,
  onActivateTrial,
}: {
  trialInfo?: Pick<
    TrialInfo,
    'is_available' | 'duration_days' | 'traffic_limit_gb' | 'device_limit'
  > | null;
  activating: boolean;
  onActivateTrial: () => void;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const trialAvailable = Boolean(trialInfo?.is_available);
  const facts =
    trialAvailable && trialInfo
      ? [
          t('invoxy.start.factDays', { count: trialInfo.duration_days }),
          t('invoxy.start.factTraffic', { count: trialInfo.traffic_limit_gb }),
          t('invoxy.start.factDevices', { count: trialInfo.device_limit }),
        ]
      : [
          t('invoxy.start.factNoLogs'),
          t('invoxy.start.factAllDevices'),
          t('invoxy.start.factSupport'),
        ];

  return (
    <section className="glass-panel motion-card relative w-full overflow-hidden rounded-[28px] border border-mint/25 p-5 shadow-[0_0_38px_rgba(165,232,196,.06)] sm:p-7">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(165,232,196,.16),transparent_45%)]" />
      <img
        src="/images/trial-ribbon.png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute -right-14 -top-6 w-[150px] opacity-40 mix-blend-screen sm:-right-6 sm:w-[220px] sm:opacity-60"
      />
      <div className="relative z-10 max-w-[560px]">
        <p className="text-[11px] font-bold tracking-[.16em] text-mint">
          {trialAvailable ? t('invoxy.start.trialEyebrow') : t('invoxy.start.eyebrow')}
        </p>
        <h2 className="mt-2 max-w-[80%] text-[26px] font-medium leading-tight tracking-[-.04em] sm:text-4xl">
          {trialAvailable ? t('invoxy.start.trialTitle') : t('invoxy.start.title')}
        </h2>
        <p className="mt-2 max-w-[88%] text-sm leading-relaxed text-muted">
          {trialAvailable ? t('invoxy.start.trialSubtitle') : t('invoxy.start.subtitle')}
        </p>
        <ul className="mt-4 flex flex-wrap gap-1.5">
          {facts.map((fact) => (
            <li
              key={fact}
              className="rounded-full border border-mint/20 bg-mint/[.08] px-3 py-1.5 text-xs font-semibold text-mint"
            >
              {fact}
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={trialAvailable ? onActivateTrial : () => navigate('/tariffs')}
          disabled={activating}
          className="button-lift mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-mint px-4 text-sm font-bold text-bg disabled:opacity-70"
        >
          {trialAvailable
            ? activating
              ? t('invoxy.start.activating')
              : t('invoxy.start.tryFree', { count: trialInfo?.duration_days ?? 0 })
            : t('invoxy.start.chooseTariff')}
          <ArrowRight size={16} />
        </button>
        {trialAvailable && (
          <button
            type="button"
            onClick={() => navigate('/tariffs')}
            className="mt-2 flex min-h-11 w-full items-center justify-center text-sm font-semibold text-muted transition-colors hover:text-ink"
          >
            {t('invoxy.start.orChooseTariff')}
          </button>
        )}
      </div>
    </section>
  );
}
