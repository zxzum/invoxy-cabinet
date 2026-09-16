export function SubscriptionCard({
  onManage,
  trial = false,
  name = 'Подписка',
  days = 0,
  endDate = '—',
  hasLte = false,
  progress = 0,
  trialTrafficGb,
  devicesCount,
}: {
  onManage: () => void;
  trial?: boolean;
  name?: string;
  days?: number;
  endDate?: string;
  hasLte?: boolean;
  progress?: number;
  trialTrafficGb?: number | null;
  devicesCount?: number;
}) {
  return (
    <div className="glass-panel motion-card relative flex w-full flex-col gap-3.5 overflow-hidden rounded-[32px] p-[22px] lg:h-[clamp(250px,16.5vw,330px)] lg:justify-center lg:gap-[clamp(16px,1.2vw,24px)] lg:rounded-[clamp(24px,1.2vw,30px)] lg:p-[clamp(24px,1.6vw,32px)]">
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
          {trial ? 'ПРОБНЫЙ ПЕРИОД' : 'ВАША ПОДПИСКА'}
        </p>
        <button
          onClick={onManage}
          className="cursor-pointer text-xs font-bold text-mint active:opacity-70 lg:text-[clamp(12px,0.8vw,16px)]"
        >
          Управление →
        </button>
      </div>

      <div className="relative z-10 flex flex-wrap gap-2 lg:hidden">
        {devicesCount === 0 ? (
          <span className="flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-400/15 px-2.5 py-[7px] text-[11px] font-bold text-amber-300">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-ping" />
            Ожидает подключения
          </span>
        ) : (
          <span className="rounded-full bg-mint px-2.5 py-[7px] text-[11px] font-bold text-bg">
            {trial ? 'Активен' : 'Активна'}
          </span>
        )}
        <span className="glass-control rounded-full px-2.5 py-[7px] text-[11px] font-bold text-muted">
          {trial ? 'Пробный период' : name}
        </span>
        {(trial || hasLte) && (
          <span className="glass-control rounded-full px-2.5 py-[7px] text-[11px] font-bold text-muted">
            {trial ? `${trialTrafficGb ?? '—'} ГБ` : '🌐 LTE'}
          </span>
        )}
      </div>
      <div className="relative z-10 hidden items-center gap-2 lg:flex">
        {devicesCount === 0 ? (
          <span className="flex items-center gap-2 text-[13px] font-bold text-amber-300">
            <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
            Подписка активна · Ожидает первого подключения
          </span>
        ) : (
          <p className="text-[13px] font-bold text-mint lg:text-[clamp(13px,0.9vw,18px)]">
            ● Подписка активна
          </p>
        )}
      </div>

      <div className="relative z-10 flex items-baseline gap-2">
        <span className="text-[64px] font-normal leading-none tracking-[-3px] text-ink lg:text-[clamp(64px,4.2vw,84px)] lg:tracking-[clamp(-2px,-0.1vw,-1.5px)]">
          {days}
        </span>
      </div>
      <p className="relative z-10 text-sm text-muted lg:text-[clamp(14px,0.9vw,18px)]">
        {trial ? 'дня' : 'дней'} &nbsp;·&nbsp;{' '}
        {trial ? `Активен до: ${endDate}` : `Активна до: ${endDate}`}
      </p>

      <div className="relative z-10 hidden h-2 w-full overflow-hidden rounded-full bg-surface-2 lg:block lg:h-[clamp(8px,0.5vw,10px)]">
        <div
          className="h-full rounded-full bg-mint"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
    </div>
  );
}
