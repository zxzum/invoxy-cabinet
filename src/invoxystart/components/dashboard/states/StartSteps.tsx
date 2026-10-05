import { useTranslation } from 'react-i18next';
import { CheckCircle2, ShieldCheck, Smartphone } from '@/invoxystart/components/ui/RuneIcon';

export function StartSteps({ trialAvailable }: { trialAvailable: boolean }) {
  const { t } = useTranslation();
  const steps = [
    {
      icon: ShieldCheck,
      title: t('invoxy.start.stepAccess'),
      description: t(
        trialAvailable ? 'invoxy.start.stepAccessTrial' : 'invoxy.start.stepAccessTariff',
      ),
    },
    {
      icon: Smartphone,
      title: t('invoxy.start.stepInstall'),
      description: t('invoxy.start.stepInstallText'),
    },
    {
      icon: CheckCircle2,
      title: t('invoxy.start.stepConnect'),
      description: t('invoxy.start.stepConnectText'),
    },
  ];

  return (
    <section className="glass-panel rounded-[24px] p-5 sm:p-6" aria-labelledby="start-steps-title">
      <h2 id="start-steps-title" className="text-xl font-semibold tracking-tight text-ink">
        {t('invoxy.start.guideTitle')}
      </h2>
      <p className="mt-1 text-sm leading-relaxed text-muted">{t('invoxy.start.guideSubtitle')}</p>

      <ol className="mt-5 grid gap-3 md:grid-cols-3">
        {steps.map(({ icon: Icon, title, description }, index) => (
          <li
            key={title}
            className="min-w-0 rounded-2xl border border-white/10 bg-white/[.03] px-4 py-4"
          >
            <div className="mb-4 flex items-center justify-between">
              <span
                className={`grid h-9 w-9 place-items-center rounded-full text-xs font-bold ${index === 0 ? 'bg-mint text-bg' : 'bg-white/10 text-muted'}`}
              >
                {index + 1}
              </span>
              <Icon size={20} className="text-mint" />
            </div>
            <h3 className="text-sm font-semibold text-ink">{title}</h3>
            <p className="mt-1 text-xs leading-relaxed text-muted">{description}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
