import { Link, useLocation } from 'react-router';
import { useTranslation } from 'react-i18next';
import { PiKey } from 'react-icons/pi';

import { cn } from '@/lib/utils';
import { usePlatform } from '@/platform';
import { HomeIcon, SubscriptionIcon, UserIcon } from './icons';

interface MobileBottomNavProps {
  isKeyboardOpen: boolean;
  referralEnabled?: boolean;
  wheelEnabled?: boolean;
}

export function MobileBottomNav({ isKeyboardOpen }: MobileBottomNavProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const { haptic } = usePlatform();

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  const items = [
    { path: '/', label: t('nav.dashboard', 'Главная'), icon: HomeIcon },
    { path: '/subscription/purchase', label: 'Тарифы', icon: SubscriptionIcon, match: '/subscription' },
    { path: '/connection', label: 'Ключи', icon: KeyNavIcon },
    { path: '/profile', label: t('nav.profile', 'Профиль'), icon: UserIcon },
  ];

  return (
    <nav
      className={cn(
        'fixed z-50 transition-all duration-200 lg:hidden',
        'ix-island border border-white/10',
        isKeyboardOpen ? 'pointer-events-none opacity-0' : 'opacity-100',
      )}
      style={{
        bottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
        left: '16px',
        right: '16px',
        borderRadius: '24px',
        padding: '8px 4px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.45)',
      }}
    >
      <div className="flex justify-around">
        {items.map((item) => {
          const active = item.match
            ? location.pathname.startsWith(item.match)
            : isActive(item.path);
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => haptic.impact('light')}
              className={cn(
                'flex min-w-[64px] flex-col items-center gap-1 rounded-2xl px-3 py-2 text-[11px] font-medium',
                active ? 'bg-accent-500/20 text-white' : 'text-white/45',
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function KeyNavIcon({ className }: { className?: string }) {
  return <PiKey className={className} />;
}
