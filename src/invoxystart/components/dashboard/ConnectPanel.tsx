import { useTranslation } from 'react-i18next';
import { LivelyCopyButton } from '@/invoxystart/components/ui/LivelyCopyButton';
import { Smartphone } from '@/invoxystart/components/ui/RuneIcon';
import { openDeepLink } from '@/utils/openDeepLink';

/**
 * Единый блок подключения на дашборде: приложения в один клик, инструкции для
 * всех устройств и ключ доступа компактной строкой. Заменяет связку
 * AccessKeyCard + QuickConnect + «нулевой» баннер.
 */
export function ConnectPanel({
  accessLink,
  happLink,
  incyLink,
  firstConnection,
  onOpenGuide,
}: {
  accessLink: string | null;
  happLink: string | null;
  incyLink: string | null;
  /** Ни одного устройства ещё не подключено — блок становится главным действием. */
  firstConnection: boolean;
  onOpenGuide: () => void;
}) {
  const { t } = useTranslation();
  const apps = [
    { id: 'happ', label: t('invoxy.connect.happ'), icon: '/images/apps/happ.png', href: happLink },
    { id: 'incy', label: t('invoxy.connect.incy'), icon: '/images/apps/incy.png', href: incyLink },
  ];

  return (
    <section
      className={`glass-panel motion-card flex w-full flex-col gap-3.5 rounded-[28px] p-4 sm:p-5 ${
        firstConnection ? 'border-mint/35 shadow-[0_0_34px_rgba(165,232,196,.08)]' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-[17px] font-bold text-ink">
            {firstConnection ? t('invoxy.connect.firstTitle') : t('invoxy.connect.title')}
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            {firstConnection ? t('invoxy.connect.firstSubtitle') : t('invoxy.connect.subtitle')}
          </p>
        </div>
        {firstConnection && (
          <span className="relative mt-1 flex h-2.5 w-2.5 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-mint opacity-60" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-mint" />
          </span>
        )}
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {apps.map((app, index) => (
          <button
            key={app.id}
            type="button"
            disabled={!app.href}
            onClick={() => app.href && openDeepLink(app.href)}
            className={`flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-2xl px-3 text-[13px] font-bold transition-colors active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 ${
              index === 0
                ? 'bg-mint text-bg hover:bg-mint/90'
                : 'glass-control text-ink hover:border-mint/30'
            }`}
          >
            <img src={app.icon} alt="" className="h-4 w-auto max-w-12 object-contain" />
            {app.label}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={onOpenGuide}
        className="flex min-h-11 cursor-pointer items-center justify-center gap-1.5 rounded-2xl text-xs font-bold text-mint transition-colors hover:bg-white/[.04]"
      >
        <Smartphone size={14} /> {t('invoxy.connect.allDevices')}
      </button>

      <div className="flex items-center gap-2 border-t border-white/8 pt-3">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[.12em] text-muted">
            {t('invoxy.connect.accessKey')}
          </p>
          <p className="mt-0.5 truncate text-xs text-muted/80">
            {accessLink || t('invoxy.connect.keyUnavailable')}
          </p>
        </div>
        <LivelyCopyButton
          variant="glass"
          text={accessLink || ''}
          label={t('invoxy.connect.copy')}
          copiedLabel={t('invoxy.connect.copied')}
          disabled={!accessLink}
          className="!w-auto shrink-0 px-4"
        />
      </div>
    </section>
  );
}
