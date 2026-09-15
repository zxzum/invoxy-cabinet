import { Link, useLocation } from 'react-router';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

import { cn } from '@/lib/utils';
import { usePlatform } from '@/platform';
import { HomeIcon, SubscriptionIcon, UserIcon } from './icons';
import { UsersIcon } from '@/components/icons';

interface MobileBottomNavProps {
  isKeyboardOpen: boolean;
  safeAreaInset?: Insets;
  contentSafeAreaInset?: Insets;
}

interface Insets {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

const MotionLink = motion.create(Link);

export function MobileBottomNav({
  isKeyboardOpen,
  safeAreaInset,
  contentSafeAreaInset,
}: MobileBottomNavProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const { haptic } = usePlatform();

  const items = [
    {
      path: '/dashboard',
      label: t('nav.dashboard', 'Кабинет'),
      icon: HomeIcon,
      activeWidth: 'w-[117px]',
    },
    {
      path: '/tariffs',
      label: t('nav.tariffs', 'Тарифы'),
      icon: SubscriptionIcon,
      activeWidth: 'w-[115px]',
    },
    {
      path: '/referrals',
      label: t('nav.referral', 'Рефералы'),
      icon: UsersIcon,
      activeWidth: 'w-[124px]',
    },
    {
      path: '/profile',
      label: t('nav.profile', 'Профиль'),
      icon: UserIcon,
      activeWidth: 'w-[122px]',
    },
  ];

  const safeBottom = Math.max(safeAreaInset?.bottom ?? 0, contentSafeAreaInset?.bottom ?? 0);
  const safeLeft = Math.max(safeAreaInset?.left ?? 0, contentSafeAreaInset?.left ?? 0);
  const safeRight = Math.max(safeAreaInset?.right ?? 0, contentSafeAreaInset?.right ?? 0);
  // Browser-only fallback remains: style={{ bottom: 'var(--mobile-nav-offset)' }}.

  return (
    <nav
      aria-hidden={isKeyboardOpen || undefined}
      inert={isKeyboardOpen || undefined}
      className={cn(
        'fixed left-1/2 z-50 flex w-max max-w-[calc(100vw-24px)] -translate-x-1/2 items-center rounded-[34px] p-1.5 transition-opacity duration-200 lg:hidden',
        'ix-island glass-surface-elevated',
        isKeyboardOpen ? 'pointer-events-none opacity-0' : 'opacity-100',
      )}
      style={{
        bottom: `max(var(--mobile-nav-offset), ${safeBottom}px)`,
        left: `calc(50% + (${safeLeft}px - ${safeRight}px) / 2)`,
      }}
    >
      <div className="relative flex items-center gap-1">
        {items.map((item) => {
          const active =
            item.path === '/dashboard'
              ? location.pathname === '/dashboard'
              : item.path === '/tariffs'
                ? location.pathname === '/tariffs' || location.pathname === '/subscription/purchase'
                : item.path === '/referrals'
                  ? location.pathname === '/referrals' || location.pathname.startsWith('/referral')
                  : location.pathname === item.path ||
                    location.pathname.startsWith(`${item.path}/`);
          const Icon = item.icon;
          return (
            <MotionLink
              key={item.path}
              to={item.path}
              aria-label={item.label}
              aria-current={active ? 'page' : undefined}
              onClick={() => haptic.impact('light')}
              whileTap={{ scale: 0.94 }}
              className={cn(
                'relative z-10 flex h-14 items-center overflow-hidden rounded-full border text-xs font-bold transition-[width,padding,background-color,color] duration-300',
                active
                  ? `${item.activeWidth} justify-start border-transparent bg-dark-50 pl-4 text-dark-950`
                  : 'w-14 justify-center border-white/10 bg-white/[.04] text-dark-400',
              )}
            >
              <Icon
                className={cn('relative z-10 h-[22px] w-[22px] shrink-0 transition-transform')}
              />
              {active && <span className="ml-2 whitespace-nowrap">{item.label}</span>}
            </MotionLink>
          );
        })}
      </div>
    </nav>
  );
}
