import { NavLink, useLocation } from 'react-router';
import { useTranslation } from 'react-i18next';
import { House, Layers, Users, UserRound } from '@/invoxystart/components/ui/RuneIcon';
import { usePlatform } from '@/platform';
import type { AccountState } from '@/invoxystart/lib/accountState';
import { useAccountState } from '@/invoxystart/lib/useAccountState';

const navItems = [
  { to: '/dashboard', labelKey: 'nav.dashboard', icon: House, end: true },
  { to: '/tariffs', labelKey: 'nav.tariffs', icon: Layers, end: false, accent: true },
  { to: '/referrals', labelKey: 'nav.referral', icon: Users, end: false },
  { to: '/profile', labelKey: 'nav.profile', icon: UserRound, end: false },
] as const;

/** Подсказка на вкладке «Тарифы» в зависимости от состояния аккаунта. */
export function tariffsNudge(state: AccountState | null): 'pulse' | 'renew' | null {
  if (state === 'none' || state === 'trial_available') return 'pulse';
  if (
    state === 'trial_expired' ||
    state === 'paid_expired' ||
    state === 'paid_expiring' ||
    state === 'disabled'
  ) {
    return 'renew';
  }
  return null;
}

/** Док скрыт в админке: там свои sticky-панели сохранения и навигация «назад». */
export function isMobileNavHidden(pathname: string): boolean {
  return pathname === '/admin' || pathname.startsWith('/admin/');
}

/**
 * Нижний док: у каждой вкладки всегда видна подпись, «Тарифы» выделены mint-цветом,
 * пульсируют без подписки и показывают бейдж «Продлить», когда доступ кончается.
 */
export function MobileNav() {
  const { haptic } = usePlatform();
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const { state } = useAccountState();
  const nudge = tariffsNudge(state);

  if (isMobileNavHidden(pathname)) return null;

  return (
    <>
      <div
        aria-hidden="true"
        className="mobile-nav-scrim pointer-events-none fixed inset-x-0 bottom-0 z-30 lg:hidden"
      />
      <nav
        aria-label={t('nav.navigation')}
        className="glass-panel mobile-nav-safe fixed left-1/2 z-40 grid w-[min(calc(100%-24px),420px)] -translate-x-1/2 grid-cols-4 gap-1 rounded-[28px] p-1.5 lg:hidden"
      >
        {navItems.map((item) => {
          const accent = 'accent' in item && item.accent;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => haptic.selection()}
              className="min-w-0"
            >
              {({ isActive }) => (
                <div
                  className={`nav-button relative flex min-h-[56px] flex-col items-center justify-center gap-1 rounded-[22px] px-1 py-1.5 active:scale-[0.96] ${
                    isActive
                      ? 'bg-ink text-bg shadow-[0_6px_18px_rgba(255,255,255,0.16)]'
                      : accent
                        ? 'bg-mint/15 text-mint ring-1 ring-inset ring-mint/40'
                        : 'text-muted hover:text-ink'
                  }`}
                >
                  <item.icon
                    size={22}
                    aria-hidden="true"
                    variant={
                      isActive && item.to !== '/dashboard' && item.to !== '/profile'
                        ? 'fill'
                        : 'normal'
                    }
                    className="shrink-0"
                  />
                  <span className="max-w-full truncate text-[11px] font-semibold leading-none">
                    {t(item.labelKey)}
                  </span>
                  {accent && nudge === 'pulse' && !isActive && (
                    <span
                      aria-hidden="true"
                      className="absolute right-3 top-2 h-2 w-2 animate-pulse rounded-full bg-mint shadow-[0_0_8px_rgba(165,232,196,0.9)]"
                    />
                  )}
                  {accent && nudge === 'renew' && (
                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-mint px-1.5 py-0.5 text-[9px] font-bold uppercase leading-none text-bg">
                      {t('invoxy.nav.renewBadge')}
                    </span>
                  )}
                </div>
              )}
            </NavLink>
          );
        })}
      </nav>
    </>
  );
}
