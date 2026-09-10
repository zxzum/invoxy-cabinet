import { Link, useLocation } from 'react-router';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

import { cn } from '@/lib/utils';
import { usePlatform } from '@/platform';
import { navSpring } from '@/components/motion';
import { HomeIcon, LinkIcon, SubscriptionIcon, UserIcon } from './icons';

interface MobileBottomNavProps {
  isKeyboardOpen: boolean;
}

const MotionLink = motion.create(Link);

export function MobileBottomNav({ isKeyboardOpen }: MobileBottomNavProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const { haptic } = usePlatform();

  const items = [
    {
      path: '/',
      label: t('nav.dashboard', 'Главная'),
      icon: HomeIcon,
    },
    {
      path: '/subscription/purchase',
      label: t('nav.tariffs', 'Тарифы'),
      icon: SubscriptionIcon,
    },
    {
      path: '/connection',
      label: t('nav.connection', 'Подключение'),
      icon: LinkIcon,
    },
    {
      path: '/profile',
      label: t('nav.profile', 'Профиль'),
      icon: UserIcon,
    },
  ];

  return (
    <nav
      aria-hidden={isKeyboardOpen || undefined}
      inert={isKeyboardOpen || undefined}
      className={cn(
        'fixed inset-x-3 z-50 mx-auto max-w-lg rounded-[26px] border border-white/10 transition-opacity duration-200 lg:hidden',
        'ix-island',
        isKeyboardOpen ? 'pointer-events-none opacity-0' : 'opacity-100',
      )}
      style={{
        bottom: 'var(--mobile-nav-offset)',
        boxShadow: '0 18px 50px -14px rgba(0, 0, 0, 0.55), 0 0 40px -18px var(--ix-glow)',
      }}
    >
      <div
        className="relative grid"
        style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
      >
        {items.map((item) => {
          const active =
            item.path === '/'
              ? location.pathname === '/'
              : location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
          const Icon = item.icon;
          return (
            <MotionLink
              key={item.path}
              to={item.path}
              aria-current={active ? 'page' : undefined}
              onClick={() => haptic.impact('light')}
              whileTap={{ scale: 0.94 }}
              className={cn(
                'relative z-10 flex min-w-0 min-h-16 flex-col items-center justify-center gap-1 rounded-2xl px-1 py-2.5 text-[10px] font-medium leading-tight transition-colors sm:text-[11px]',
                active ? 'text-dark-50' : 'text-dark-500',
              )}
            >
              {active && (
                <motion.span
                  layoutId="mobile-nav-plate"
                  data-nav-plate
                  aria-hidden="true"
                  className="absolute inset-1 z-0 rounded-2xl"
                  transition={navSpring}
                  style={{
                    background:
                      'linear-gradient(135deg, rgba(var(--ix-accent-rgb), 0.24), rgba(var(--ix-accent-rgb), 0.08))',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08), 0 0 24px -6px var(--ix-glow)',
                  }}
                />
              )}
              <Icon
                className={cn(
                  'relative z-10 h-6 w-6 transition-transform',
                  active && 'drop-shadow-[0_0_10px_var(--ix-glow)]',
                )}
              />
              <span className="relative z-10 max-w-full truncate whitespace-nowrap">
                {item.label}
              </span>
            </MotionLink>
          );
        })}
      </div>
    </nav>
  );
}
