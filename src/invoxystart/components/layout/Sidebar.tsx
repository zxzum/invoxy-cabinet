import { NavLink } from 'react-router';
import { m } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  House,
  Layers,
  Users,
  UserRound,
  Info,
  Bell,
  ShieldCheck,
} from '@/invoxystart/components/ui/RuneIcon';
import { BrandLogo } from './BrandLogo';
import { useAuth } from '@/invoxystart/auth';
import { AnimatedBalance } from '@/invoxystart/components/ui/AnimatedBalance';
import { useAccountState } from '@/invoxystart/lib/useAccountState';
import { tariffsNudge } from './MobileNav';

export function Sidebar({ onTopUp, onHelp }: { onTopUp: () => void; onHelp: () => void }) {
  const { t } = useTranslation();
  const { user, isAdmin } = useAuth();
  const { state } = useAccountState();
  const nudge = tariffsNudge(state);
  const balance = user?.balance_rubles ?? 0;
  const navItems = [
    { to: '/dashboard', label: t('nav.dashboard'), icon: House },
    { to: '/tariffs', label: t('nav.tariffs'), icon: Layers, accent: true },
    { to: '/referrals', label: t('nav.referral'), icon: Users },
    { to: '/info', label: t('nav.info'), icon: Info },
    { to: '/news', label: t('invoxy.nav.news'), icon: Bell },
    ...(isAdmin ? [{ to: '/admin', label: t('invoxy.nav.admin'), icon: ShieldCheck }] : []),
  ];

  return (
    <aside className="glass-panel sticky top-4 self-start hidden h-[calc(100vh-32px)] w-full shrink-0 flex-col gap-4 rounded-[24px] p-6 lg:top-0 lg:h-screen lg:gap-[clamp(16px,1.2vw,24px)] lg:rounded-l-none lg:rounded-r-[clamp(24px,1.2vw,28px)] lg:border-l-0 lg:p-[clamp(20px,1.2vw,24px)] lg:flex">
      <div className="flex items-center gap-2.5 lg:gap-[clamp(10px,0.65vw,13px)]">
        <BrandLogo
          iconClassName="h-[38px] w-[38px] rounded-xl object-cover lg:h-[clamp(38px,2.4vw,48px)] lg:w-[clamp(38px,2.4vw,48px)] lg:rounded-[clamp(12px,0.8vw,16px)]"
          textClassName="text-lg font-bold text-ink lg:text-[clamp(18px,1.2vw,24px)]"
        />
      </div>

      <nav className="flex flex-col gap-2 lg:gap-[clamp(8px,0.55vw,11px)]">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/dashboard'}
            className={({ isActive }) =>
              `relative flex h-11 items-center gap-3 rounded-xl px-3.5 text-sm transition-colors lg:h-[clamp(44px,2.9vw,58px)] lg:gap-[clamp(12px,0.8vw,16px)] lg:rounded-[clamp(12px,0.8vw,16px)] lg:px-[clamp(14px,0.9vw,18px)] lg:text-[clamp(14px,0.8vw,16px)] ${
                isActive
                  ? 'text-bg font-bold'
                  : item.accent
                    ? 'bg-mint/10 font-semibold text-mint ring-1 ring-inset ring-mint/30 hover:bg-mint/15'
                    : 'text-muted font-normal hover:text-ink'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  // Единая пилюля на все пункты: при смене раздела плавно
                  // «переползает» на активную строку (layoutId требует domMax).
                  <m.div
                    layoutId="sidebar-nav-pill"
                    transition={{ type: 'spring', bounce: 0.18, duration: 0.45 }}
                    className="absolute inset-0 rounded-xl bg-ink lg:rounded-[clamp(12px,0.8vw,16px)]"
                  />
                )}
                <item.icon
                  size={18}
                  variant={isActive && item.to !== '/dashboard' ? 'fill' : 'normal'}
                  className={`relative z-10 ${isActive ? 'text-bg' : ''}`}
                />
                <span className="relative z-10">{item.label}</span>
                {item.accent && nudge === 'renew' && (
                  <span className="relative z-10 ml-auto rounded-full bg-mint px-2 py-0.5 text-[10px] font-bold uppercase text-bg">
                    {t('invoxy.nav.renewBadge')}
                  </span>
                )}
                {item.accent && nudge === 'pulse' && !isActive && (
                  <span
                    aria-hidden="true"
                    className="relative z-10 ml-auto h-2 w-2 animate-pulse rounded-full bg-mint shadow-[0_0_8px_rgba(165,232,196,0.9)]"
                  />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="flex-1" />

      <button
        type="button"
        aria-label={t('invoxy.nav.openSupport')}
        onClick={onHelp}
        className="help-button glass-control group flex flex-col gap-2 rounded-2xl p-3.5 text-left lg:gap-[clamp(8px,0.5vw,10px)] lg:rounded-[clamp(16px,1vw,20px)] lg:p-[clamp(14px,1.2vw,24px)]"
      >
        <Info
          size={18}
          className="text-mint transition-transform duration-500 group-hover:rotate-6 group-hover:scale-110"
        />
        <p className="text-xs font-bold text-ink lg:text-[clamp(12px,0.8vw,16px)]">
          {t('invoxy.nav.helpTitle')}
        </p>
        <p className="text-[11px] text-muted lg:text-[clamp(11px,0.7vw,14px)]">
          {t('invoxy.nav.helpSubtitle')}
        </p>
      </button>

      <div className="glass-control flex flex-col gap-2 rounded-2xl p-4 lg:gap-[clamp(8px,0.5vw,10px)] lg:rounded-[clamp(16px,1vw,20px)] lg:p-[clamp(16px,1.2vw,24px)]">
        <p className="text-[11px] font-bold tracking-[0.6px] text-muted lg:text-[clamp(11px,0.7vw,14px)]">
          {t('invoxy.nav.balance')}
        </p>
        <div className="text-[25px] font-bold text-ink lg:text-[clamp(25px,1.6vw,32px)]">
          <AnimatedBalance value={balance} />
        </div>
        <button
          onClick={onTopUp}
          className="flex h-[34px] cursor-pointer items-center justify-center rounded-[10px] border border-mint text-[11px] font-bold text-mint transition-colors hover:bg-mint/10 active:scale-[0.97] lg:h-[clamp(34px,2.3vw,46px)] lg:rounded-[clamp(10px,0.65vw,13px)] lg:text-[clamp(11px,0.7vw,14px)]"
        >
          {t('invoxy.nav.topUp')}
        </button>
      </div>

      <NavLink
        to="/profile"
        className={({ isActive }) =>
          `relative flex h-11 items-center gap-3 rounded-xl px-3.5 text-sm transition-colors lg:h-[clamp(44px,2.9vw,58px)] lg:gap-[clamp(12px,0.8vw,16px)] lg:rounded-[clamp(12px,0.8vw,16px)] lg:px-[clamp(14px,0.9vw,18px)] lg:text-[clamp(14px,0.8vw,16px)] ${
            isActive ? 'text-bg font-bold' : 'text-muted font-normal hover:text-ink'
          }`
        }
      >
        {({ isActive }) => (
          <>
            {isActive && (
              <div className="absolute inset-0 rounded-xl bg-ink lg:rounded-[clamp(12px,0.8vw,16px)]" />
            )}
            <UserRound
              size={18}
              variant="normal"
              className={`relative z-10 ${isActive ? 'text-bg' : ''}`}
            />
            <span className="relative z-10">{t('nav.profile')}</span>
          </>
        )}
      </NavLink>
    </aside>
  );
}
