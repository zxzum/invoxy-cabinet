import { useTranslation } from 'react-i18next';

export function SubscriptionCard({
  onManage,
  trial = false,
  name,
  timeLeft = '—',
  endDate = '—',
  hasLte = false,
  progress = 0,
  trialTrafficGb,
  devicesCount,
  isExpired = false,
}: {
  onManage: () => void;
  trial?: boolean;
  name?: string;
  timeLeft?: string;
  endDate?: string;
  hasLte?: boolean;
  progress?: number;
  trialTrafficGb?: number | null;
  devicesCount?: number;
  isExpired?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <div
      className={`glass-panel motion-card relative flex w-full flex-col gap-3.5 overflow-hidden rounded-[32px] p-[22px] lg:h-[clamp(250px,16.5vw,330px)] lg:justify-center lg:gap-[clamp(16px,1.2vw,24px)] lg:rounded-[clamp(24px,1.2vw,30px)] lg:p-[clamp(24px,1.6vw,32px)] ${
        isExpired ? 'border-rose-500/20 shadow-[0_0_30px_rgba(244,63,94,0.06)]' : ''
      }`}
    >
      <div
        className="pointer-events-none absolute inset-0 hidden bg-cover bg-center lg:block"
        style={{ backgroundImage: 'url(/images/subscription-bg-desktop.webp)' }}
      />
      <div className="pointer-events-none absolute inset-0 hidden bg-gradient-to-t from-bg/70 via-bg/10 to-transparent lg:block" />

      <img
        src={trial ? '/images/trial-ribbon.png' : '/images/subscription-orb.webp'}
        alt=""
        className={`pointer-events-none absolute -right-4 top-4 w-[150px] opacity-70 lg:hidden ${trial ? 'mix-blend-screen' : ''}`}
        style={{ top: '80px', scale: trial ? '1.35' : '1.5' }}
      />

      <div className="relative z-10 flex w-full items-center justify-between">
        <p className="text-xs font-normal tracking-wide text-muted lg:text-[clamp(12px,0.8vw,16px)]">
          {trial ? t('invoxy.subCard.trialEyebrow') : t('invoxy.subCard.eyebrow')}
        </p>
        <button
          onClick={onManage}
          className={`cursor-pointer text-xs font-bold active:opacity-70 lg:text-[clamp(12px,0.8vw,16px)] ${
            isExpired ? 'text-rose-400 hover:text-rose-300' : 'text-mint'
          }`}
        >
          {isExpired ? t('invoxy.subCard.renew') : t('invoxy.subCard.manage')}
        </button>
      </div>

      <div className="relative z-10 flex flex-wrap gap-2 lg:hidden">
        {isExpired ? (
          <span className="flex items-center gap-1.5 rounded-full border border-rose-500/40 bg-rose-500/15 px-2.5 py-[7px] text-[11px] font-bold text-rose-300">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
            {t('invoxy.subCard.expired')}
          </span>
        ) : devicesCount === 0 ? (
          <span className="flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-400/15 px-2.5 py-[7px] text-[11px] font-bold text-amber-300">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-ping" />
            {t('invoxy.subCard.awaiting')}
          </span>
        ) : (
          <span className="rounded-full bg-mint px-2.5 py-[7px] text-[11px] font-bold text-bg">
            {t('invoxy.subCard.active')}
          </span>
        )}
        <span className="glass-control rounded-full px-2.5 py-[7px] text-[11px] font-bold text-muted">
          {trial ? t('invoxy.subCard.trial') : (name ?? t('invoxy.dashboard.subscription'))}
        </span>
        {(trial || hasLte) && (
          <span className="glass-control rounded-full px-2.5 py-[7px] text-[11px] font-bold text-muted">
            {trial ? t('invoxy.tariffs.traffic', { count: trialTrafficGb ?? 0 }) : '🌐 LTE'}
          </span>
        )}
      </div>
      <div className="relative z-10 hidden items-center gap-2 lg:flex">
        {isExpired ? (
          <span className="flex items-center gap-2 text-[13px] font-bold text-rose-400">
            <span className="h-2 w-2 rounded-full bg-rose-500" />
            {t('invoxy.subCard.expiredLong')}
          </span>
        ) : devicesCount === 0 ? (
          <span className="flex items-center gap-2 text-[13px] font-bold text-amber-300">
            <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
            {t('invoxy.subCard.awaitingLong')}
          </span>
        ) : (
          <p className="text-[13px] font-bold text-mint lg:text-[clamp(13px,0.9vw,18px)]">
            ● {t('invoxy.subCard.activeLong')}
          </p>
        )}
      </div>

      <div className="relative z-10 flex items-baseline gap-2">
        <span
          className={`text-[clamp(48px,4.2vw,64px)] font-normal leading-none tracking-[-2px] lg:text-[clamp(64px,4.2vw,84px)] lg:tracking-[clamp(-2px,-0.1vw,-1.5px)] ${
            isExpired ? 'text-rose-300/80' : 'text-ink'
          }`}
        >
          {isExpired ? '0' : timeLeft}
        </span>
      </div>
      <div className="relative z-10 flex max-w-[58%] flex-col gap-0.5 text-sm text-muted sm:max-w-none sm:flex-row sm:items-center lg:text-[clamp(14px,0.9vw,18px)]">
        <span>{t('invoxy.subCard.timeLeft')}</span>
        <span className="hidden sm:inline">&nbsp;·&nbsp;</span>
        <span>
          {isExpired
            ? t('invoxy.subCard.expiredOn', { date: endDate })
            : t('invoxy.subCard.activeUntil', { date: endDate })}
        </span>
      </div>

      <div className="relative z-10 hidden h-2 w-full overflow-hidden rounded-full bg-surface-2 lg:block lg:h-[clamp(8px,0.5vw,10px)]">
        <div
          className={`h-full rounded-full transition-[width] duration-700 ease-out ${
            isExpired ? 'bg-rose-500/50' : 'bg-mint'
          }`}
          style={{ width: `${isExpired ? 100 : Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
    </div>
  );
}
