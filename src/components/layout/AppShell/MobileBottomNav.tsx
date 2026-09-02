import { Link, useLocation } from 'react-router';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { PiKey } from 'react-icons/pi';

import { cn } from '@/lib/utils';
import { usePlatform } from '@/platform';
import { navSpring } from '@/components/motion';
import { HomeIcon, SubscriptionIcon, UserIcon } from './icons';

interface MobileBottomNavProps {
  isKeyboardOpen: boolean;
}

const MotionLink = motion.create(Link);

function KeyNavIcon({ className }: { className?: string }) {
  return <PiKey className={className} />;
}

export function MobileBottomNav({ isKeyboardOpen }: MobileBottomNavProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const { haptic } = usePlatform();

  const items = [
    {
      path: '/',
      label: t('nav.dashboard', 'Главная'),
      icon: HomeIcon,
      match: undefined as string | undefined,
    },
    {
      path: '/subscription/purchase',
      label: t('nav.tariffs', 'Тарифы'),
      icon: SubscriptionIcon,
      match: '/subscription',
    },
    {
      path: '/connection',
      label: t('nav.keys', 'Ключи'),
      icon: KeyNavIcon,
      match: undefined as string | undefined,
    },
    {
      path: '/profile',
      label: t('nav.profile', 'Профиль'),
      icon: UserIcon,
      match: undefined as string | undefined,
    },
  ];

  const activeIndex = items.findIndex((item) => {
    const target = item.match ?? item.path;
    return target === '/' ? location.pathname === '/' : location.pathname.startsWith(target);
  });

  return (
    <nav
      aria-hidden={isKeyboardOpen || undefined}
      inert={isKeyboardOpen || undefined}
      className={cn(
        'fixed inset-x-3 bottom-3 z-50 mx-auto max-w-md rounded-[28px] border border-white/10 transition-opacity duration-200 lg:hidden',
        'ix-island',
        isKeyboardOpen ? 'pointer-events-none opacity-0' : 'opacity-100',
      )}
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        boxShadow: '0 18px 50px -14px rgba(0, 0, 0, 0.55), 0 0 40px -18px var(--ix-glow)',
      }}
    >
      <div className="relative grid grid-cols-4">
        {/* Скользящая плашка активного таба: один элемент в дереве, x = index*100% */}
        {activeIndex >= 0 && (
          <motion.div
            data-nav-plate
            aria-hidden="true"
            className="absolute inset-y-1 left-1 w-[calc(25%-8px)] rounded-2xl"
            initial={false}
            animate={{ x: `calc(${activeIndex} * (100% + 8px))` }}
            transition={navSpring}
            style={{
              background:
                'linear-gradient(135deg, rgba(var(--ix-accent-rgb), 0.24), rgba(var(--ix-accent-rgb), 0.08))',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08), 0 0 24px -6px var(--ix-glow)',
            }}
          />
        )}
        {items.map((item) => {
          const target = item.match ?? item.path;
          const active =
            target === '/' ? location.pathname === '/' : location.pathname.startsWith(target);
          const Icon = item.icon;
          return (
            <MotionLink
              key={item.path}
              to={item.path}
              aria-current={active ? 'page' : undefined}
              onClick={() => haptic.impact('light')}
              whileTap={{ scale: 0.94 }}
              className={cn(
                'relative z-10 flex flex-col items-center gap-1 rounded-2xl px-2 py-2.5 text-[11px] font-medium transition-colors',
                active ? 'text-white' : 'text-white/45',
              )}
            >
              <Icon
                className={cn(
                  'h-5 w-5 transition-transform',
                  active && 'drop-shadow-[0_0_10px_var(--ix-glow)]',
                )}
              />
              {item.label}
            </MotionLink>
          );
        })}
      </div>
    </nav>
  );
}
