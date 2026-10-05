import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  Bell,
  ChevronRight,
  Headphones,
  Sparkles,
  Users,
} from '@/invoxystart/components/ui/RuneIcon';

/** Clear destinations remain visible without expanding a catch-all panel. */
export function MoreSection({ showReferral = true }: { showReferral?: boolean }) {
  const { t } = useTranslation();
  const links = [
    ...(showReferral
      ? [{ to: '/referrals', icon: Users, title: 'referralTitle', description: 'referralSubtitle' }]
      : []),
    { to: '/partner', icon: Sparkles, title: 'partnerTitle', description: 'partnerSubtitle' },
    { to: '/news', icon: Bell, title: 'newsTitle', description: 'newsSubtitle' },
    { to: '/support', icon: Headphones, title: 'supportTitle', description: 'supportSubtitle' },
  ];

  return (
    <section className="w-full">
      <h2 className="mb-3 text-base font-bold text-ink">{t('invoxy.dashboard.opportunities')}</h2>
      <div className="grid w-full max-w-xl gap-2">
        {links.map(({ to, icon: Icon, title, description }) => (
          <Link
            key={to}
            to={to}
            className="glass-panel flex min-h-[76px] items-center gap-3 rounded-2xl px-4 py-3 transition-colors hover:border-mint/30"
          >
            <Icon size={19} className="shrink-0 text-mint" />
            <span className="min-w-0 flex-1">
              <strong className="block text-sm text-ink">{t('invoxy.dashboard.' + title)}</strong>
              <span className="mt-0.5 block text-xs leading-relaxed text-muted">
                {t('invoxy.dashboard.' + description)}
              </span>
            </span>
            <ChevronRight size={16} className="shrink-0 text-muted" />
          </Link>
        ))}
      </div>
    </section>
  );
}
