import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Sparkles } from '@/invoxystart/components/ui/RuneIcon';
import { tariffsUrl } from '@/invoxystart/lib/usePurchaseIntent';

/** Заметный переход с пробного периода на платный тариф. */
export function TrialUpgradeCard({ daysLeft }: { daysLeft: number }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  return (
    <section className="glass-panel motion-card flex w-full flex-col gap-3 rounded-[28px] border border-mint/30 bg-mint/[.05] p-5">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-mint/15 text-mint">
          <Sparkles size={18} />
        </span>
        <div className="min-w-0">
          <h3 className="text-[17px] font-bold text-ink">{t('invoxy.trial.upgradeTitle')}</h3>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            {t('invoxy.trial.upgradeSubtitle', { count: Math.max(0, daysLeft) })}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => navigate(tariffsUrl('recommended'))}
        className="button-lift flex h-12 w-full items-center justify-center gap-2 rounded-full bg-mint text-sm font-bold text-bg"
      >
        {t('invoxy.trial.upgradeCta')} <ArrowRight size={16} />
      </button>
    </section>
  );
}
