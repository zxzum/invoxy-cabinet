import { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'framer-motion';
import { PiKey, PiChatCircle } from 'react-icons/pi';

import { useAuthStore } from '@/store/auth';
import { useHaptic } from '@/platform';
import { useTelegramSDK } from '@/hooks/useTelegramSDK';
import { useHeaderHeight } from '@/hooks/useHeaderHeight';
import { useTheme } from '@/hooks/useTheme';
import { useBranding } from '@/hooks/useBranding';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { useScrollRestoration } from '@/hooks/useScrollRestoration';
import { themeColorsApi } from '@/api/themeColors';
import { balanceApi } from '@/api/balance';
import { displayName } from '@/utils/displayName';
import { cn } from '@/lib/utils';
import { API } from '@/config/constants';

import WebSocketNotifications from '@/components/WebSocketNotifications';
import CampaignBonusNotifier from '@/components/CampaignBonusNotifier';
import SuccessNotificationModal from '@/components/SuccessNotificationModal';
import { PromptDialogHost } from '@/components/PromptDialogHost';
import TicketNotificationBell from '@/components/TicketNotificationBell';
import {
  SubscriptionIcon,
  HomeIcon,
  UserIcon,
  ShieldIcon,
  LogoutIcon,
  SunIcon,
  MoonIcon,
} from '@/components/icons';

import { MobileBottomNav } from './MobileBottomNav';
import { AppHeader } from './AppHeader';
import { PaletteSwitcher } from '@/components/PaletteSwitcher';
import { useBackgroundConsumer } from '@/components/backgrounds/BackgroundHost';
import { usePalette } from '@/hooks/usePalette';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const isAdmin = useAuthStore((state) => state.isAdmin);
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const { isFullscreen, safeAreaInset, contentSafeAreaInset, platform, isMobile } =
    useTelegramSDK();
  const { mobile: headerHeight } = useHeaderHeight();
  const haptic = useHaptic();
  const { toggleTheme, isDark } = useTheme();
  usePalette();

  const { appName, logoLetter, hasCustomLogo, logoUrl } = useBranding();
  const { referralEnabled, wheelEnabled, hasContests, hasPolls, giftEnabled } = useFeatureFlags();
  useScrollRestoration();
  useBackgroundConsumer();

  const { data: enabledThemes } = useQuery({
    queryKey: ['enabled-themes'],
    queryFn: themeColorsApi.getEnabledThemes,
    staleTime: 1000 * 60 * 5,
  });
  const canToggleTheme = enabledThemes?.dark && enabledThemes?.light;

  const { data: balanceData } = useQuery({
    queryKey: ['balance'],
    queryFn: balanceApi.getBalance,
    staleTime: API.BALANCE_STALE_TIME_MS,
  });

  const isMobileFullscreen = isFullscreen && isMobile;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  useEffect(() => {
    setIsKeyboardOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        setIsKeyboardOpen(true);
      }
    };
    const handleFocusOut = (e: FocusEvent) => {
      const relatedTarget = e.relatedTarget as HTMLElement | null;
      if (
        !relatedTarget ||
        (relatedTarget.tagName !== 'INPUT' &&
          relatedTarget.tagName !== 'TEXTAREA' &&
          !relatedTarget.isContentEditable)
      ) {
        setIsKeyboardOpen(false);
      }
    };
    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);
    return () => {
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
    };
  }, []);

  const sidebarNav = [
    { path: '/', label: 'Кабинет', icon: HomeIcon },
    { path: '/connection', label: 'Мои ключи', icon: KeyIcon },
    { path: '/subscription/purchase', label: 'Тарифы', icon: SubscriptionIcon },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    if (path === '/subscription/purchase') {
      return (
        location.pathname.startsWith('/subscription') ||
        location.pathname.startsWith('/subscriptions')
      );
    }
    return location.pathname.startsWith(path);
  };

  const handleNavClick = () => {
    haptic.impact('light');
  };

  const name = displayName(user) || 'Invoxy';
  const initials = name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const balanceRubles = balanceData?.balance_rubles ?? (balanceData?.balance_kopeks ?? 0) / 100;
  const balanceLabel = balanceRubles.toLocaleString('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const renderSideLink = (
    path: string,
    label: string,
    Icon: React.ComponentType<{ className?: string }>,
    admin = false,
  ) => {
    const active = admin ? location.pathname.startsWith('/admin') : isActive(path);
    return (
      <Link
        key={path}
        to={path}
        onClick={handleNavClick}
        className={cn('ix-side-link', active && 'ix-side-link-active')}
      >
        <Icon className="h-5 w-5 shrink-0" />
        <span>{label}</span>
      </Link>
    );
  };

  return (
    <div className="ix-app min-h-viewport">
      <WebSocketNotifications />
      <CampaignBonusNotifier />
      <SuccessNotificationModal />
      <PromptDialogHost />

      <aside className="ix-sidebar hidden lg:flex">
        <div className="ix-sidebar-user">
          <div className="ix-avatar">{initials || logoLetter}</div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-white">{name}</div>
            <div className="truncate text-[11px] text-white/40">
              ID: {user?.telegram_id ?? user?.id ?? '—'}
            </div>
          </div>
        </div>

        <nav className="ix-sidebar-nav">
          {sidebarNav.map((item) => renderSideLink(item.path, item.label, item.icon))}
          {isAdmin && renderSideLink('/admin', t('admin.nav.title', 'Админка'), ShieldIcon, true)}
        </nav>

        <div className="mt-auto space-y-3">
          <div className="ix-balance-card">
            <div className="text-[11px] uppercase tracking-wide text-white/40">Баланс</div>
            <div className="mt-1 text-xl font-semibold text-white">{balanceLabel} ₽</div>
            <Link to="/balance" onClick={handleNavClick} className="ix-balance-topup">
              Пополнить
            </Link>
          </div>

          {renderSideLink('/profile', 'Профиль', UserIcon)}

          <button
            type="button"
            onClick={() => {
              haptic.impact('light');
              logout();
            }}
            className="ix-side-link w-full text-left"
          >
            <LogoutIcon className="h-5 w-5 shrink-0" />
            <span>Выйти</span>
          </button>
        </div>
      </aside>

      <div className="ix-content">
        <AppHeader
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
          onCommandPaletteOpen={() => {}}
          headerHeight={headerHeight}
          isFullscreen={isMobileFullscreen}
          safeAreaInset={safeAreaInset}
          contentSafeAreaInset={contentSafeAreaInset}
          telegramPlatform={platform}
          wheelEnabled={wheelEnabled}
          referralEnabled={referralEnabled}
          hasContests={hasContests}
          hasPolls={hasPolls}
          giftEnabled={giftEnabled}
        />

        <div className="hidden lg:flex lg:items-center lg:justify-end lg:gap-2 lg:px-8 lg:pt-5">
          <Link to="/" className="mr-auto flex items-center gap-2.5" onClick={handleNavClick}>
            <div className="relative h-8 w-8 overflow-hidden rounded-xl bg-accent-500/20">
              {hasCustomLogo && logoUrl ? (
                <img
                  src={logoUrl}
                  alt={appName || 'Invoxy'}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-xs font-bold text-accent-300">
                  {logoLetter}
                </span>
              )}
            </div>
            <span className="text-lg font-semibold text-white">{appName || 'Invoxy VPN'}</span>
          </Link>
          <TicketNotificationBell isAdmin={location.pathname.startsWith('/admin')} />
          <PaletteSwitcher />
          <button
            onClick={() => {
              haptic.impact('light');
              toggleTheme();
            }}
            className={cn('ix-icon-btn', !canToggleTheme && 'hidden')}
            aria-label={isDark ? 'Светлая тема' : 'Тёмная тема'}
          >
            {isDark ? <MoonIcon className="h-5 w-5" /> : <SunIcon className="h-5 w-5" />}
          </button>
        </div>

        <div className="lg:hidden" style={{ height: headerHeight }} />

        <main className="ix-main">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <MobileBottomNav
        isKeyboardOpen={isKeyboardOpen}
        referralEnabled={referralEnabled}
        wheelEnabled={wheelEnabled}
      />

      <Link to="/support" className="ix-fab" aria-label="Поддержка" onClick={handleNavClick}>
        <PiChatCircle className="h-6 w-6" />
      </Link>
    </div>
  );
}

function KeyIcon({ className }: { className?: string }) {
  return <PiKey className={className} />;
}
