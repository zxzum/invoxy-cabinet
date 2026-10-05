import { useTranslation } from 'react-i18next';
import { LivelyCopyButton } from '@/invoxystart/components/ui/LivelyCopyButton';
import { Smartphone } from '@/invoxystart/components/ui/RuneIcon';

/**
 * One entry point to the guided setup. App deep links only make sense after
 * the user has chosen a platform and installed a client.
 */
export function ConnectPanel({
  accessLink,
  firstConnection,
  onOpenGuide,
}: {
  accessLink: string | null;
  /** Ни одного устройства ещё не подключено — блок становится главным действием. */
  firstConnection: boolean;
  onOpenGuide: () => void;
}) {
  const { t } = useTranslation();
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
      </div>

      <button
        type="button"
        onClick={onOpenGuide}
        className="flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-mint px-4 text-sm font-bold text-bg transition-colors hover:bg-mint/90"
      >
        <Smartphone size={18} />
        {firstConnection ? t('invoxy.connect.setupFirst') : t('invoxy.connect.setupAnother')}
      </button>

      {accessLink && !firstConnection && (
        <details className="border-t border-white/8 pt-2">
          <summary className="min-h-11 cursor-pointer py-3 text-sm font-semibold text-muted">
            {t('invoxy.connect.manualKey')}
          </summary>
          <div className="flex items-center gap-2">
            <p className="min-w-0 flex-1 truncate text-xs text-muted">{accessLink}</p>
            <LivelyCopyButton
              variant="glass"
              text={accessLink}
              label={t('invoxy.connect.copy')}
              copiedLabel={t('invoxy.connect.copied')}
              className="!w-auto shrink-0 px-4"
            />
          </div>
        </details>
      )}
    </section>
  );
}
