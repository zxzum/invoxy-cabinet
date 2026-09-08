import { Link, useLocation } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { PiKey } from 'react-icons/pi';

import { useAuthStore } from '@/store/auth';
import { displayName } from '@/utils/displayName';
import { useShallow } from 'zustand/shallow';
import { usePlatform } from '@/platform';
import {
  brandingApi,
  getCachedBranding,
  setCachedBranding,
  preloadLogo,
  LOCAL_LOGO_URL,
} from '@/api/branding';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/useTheme';
import { useUserAvatar } from '@/hooks/useUserAvatar';

import LanguageSwitcher from '@/components/LanguageSwitcher';
import TicketNotificationBell from '@/components/TicketNotificationBell';

// Icons
import {
  HomeIcon,
  SubscriptionIcon,
  WalletIcon,
  UsersIcon,
  ChatIcon,
  UserIcon,
  LogoutIcon,
  GamepadIcon,
  ClipboardIcon,
  InfoIcon,
  CogIcon,
  WheelIcon,
  GiftIcon,
  MenuIcon,
  CloseIcon,
  SearchIcon,
  SunIcon,
  MoonIcon,
} from './icons';

const FALLBACK_NAME = import.meta.env.VITE_APP_NAME || 'Invoxy VPN';

import type { TelegramPlatform } from '@/hooks/useTelegramSDK';

interface AppHeaderProps {
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  onCommandPaletteOpen: () => void;
  headerHeight: number | string;
  isFullscreen: boolean;
  safeAreaInset: { top: number; bottom: number; left: number; right: number };
  contentSafeAreaInset: { top: number; bottom: number; left: number; right: number };
  telegramPlatform?: TelegramPlatform;
  wheelEnabled?: boolean;
  referralEnabled?: boolean;
  hasContests?: boolean;
  hasPolls?: boolean;
  giftEnabled?: boolean;
}

export function AppHeader({
  mobileMenuOpen,
  setMobileMenuOpen,
  onCommandPaletteOpen,
  headerHeight,
  isFullscreen,
  safeAreaInset,
  contentSafeAreaInset,
  telegramPlatform,
  wheelEnabled,
  referralEnabled,
  hasContests,
  hasPolls,
  giftEnabled,
}: AppHeaderProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const { user, logout, isAdmin } = useAuthStore(
    useShallow((state) => ({ user: state.user, logout: state.logout, isAdmin: state.isAdmin })),
  );
  const { haptic, platform } = usePlatform();
  const { theme, toggleTheme, canToggle } = useTheme();
  const avatar = useUserAvatar(user);

  // Branding
  const { data: branding } = useQuery({
    queryKey: ['branding'],
    queryFn: async () => {
      const data = await brandingApi.getBranding();
      setCachedBranding(data);
      await preloadLogo(data);
      return data;
    },
    initialData: getCachedBranding() ?? undefined,
    initialDataUpdatedAt: 0,
    staleTime: 60000,
    refetchOnWindowFocus: true,
    retry: 1,
  });

  const appName = branding ? branding.name : FALLBACK_NAME;

  // Lock scroll when menu is open (works in iframe/Telegram Mini App)
  useEffect(() => {
    if (!mobileMenuOpen) return;

    const preventDefault = (e: TouchEvent) => {
      // Allow scrolling inside menu content
      const target = e.target as HTMLElement;
      if (target.closest('.mobile-menu-content')) return;
      e.preventDefault();
    };

    document.addEventListener('touchmove', preventDefault, { passive: false });
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('touchmove', preventDefault);
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    if (path === '/subscriptions' || path === '/subscription/purchase') {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };
  const isAdminActive = () => location.pathname.startsWith('/admin');

  const navItems = [
    { path: '/', label: t('nav.dashboard'), icon: HomeIcon },
    { path: '/subscription/purchase', label: t('nav.tariffs'), icon: SubscriptionIcon },
    { path: '/connection', label: t('nav.keys'), icon: PiKey },
    { path: '/profile', label: t('nav.profile'), icon: UserIcon },
    { path: '/subscriptions', label: t('nav.subscription'), icon: SubscriptionIcon },
    { path: '/balance', label: t('nav.balance'), icon: WalletIcon },
    ...(referralEnabled ? [{ path: '/referral', label: t('nav.referral'), icon: UsersIcon }] : []),
    { path: '/support', label: t('nav.support'), icon: ChatIcon },
    ...(hasContests ? [{ path: '/contests', label: t('nav.contests'), icon: GamepadIcon }] : []),
    ...(hasPolls ? [{ path: '/polls', label: t('nav.polls'), icon: ClipboardIcon }] : []),
    ...(wheelEnabled ? [{ path: '/wheel', label: t('nav.wheel'), icon: WheelIcon }] : []),
    ...(giftEnabled ? [{ path: '/gift', label: t('nav.gift'), icon: GiftIcon }] : []),
    { path: '/info', label: t('nav.info'), icon: InfoIcon },
  ];

  return (
    <>
      {/* Header - only on mobile */}
      <header
        className="glass fixed left-0 right-0 top-0 z-50 shadow-lg shadow-black/10 lg:hidden"
        style={{
          paddingTop: isFullscreen
            ? `${Math.max(safeAreaInset.top, contentSafeAreaInset.top) + (telegramPlatform === 'android' ? 48 : 45)}px`
            : undefined,
        }}
      >
        <div
          className="mx-auto w-full px-4"
          onClick={() => mobileMenuOpen && setMobileMenuOpen(false)}
        >
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className={cn('flex flex-shrink-0 items-center gap-2.5', !appName && 'mr-4')}
            >
              <div className="relative flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-linear-lg border border-dark-700/50 bg-dark-800/80 shadow-md">
                <img
                  src={LOCAL_LOGO_URL}
                  alt={appName || 'Invoxy VPN'}
                  className="h-full w-full object-contain"
                />
              </div>
              {appName && (
                <span className="whitespace-nowrap text-base font-semibold text-dark-100">
                  {appName}
                </span>
              )}
            </Link>

            {/* Right side */}
            <div className="flex items-center gap-1.5">
              {/* Command palette trigger (web only) */}
              {platform !== 'telegram' && (
                <button
                  onClick={() => {
                    haptic.impact('light');
                    onCommandPaletteOpen();
                  }}
                  className="btn-icon hidden sm:flex"
                  title="Search (⌘K)"
                >
                  <SearchIcon className="h-5 w-5" />
                </button>
              )}

              {canToggle && (
                <button
                  type="button"
                  onClick={() => {
                    haptic.impact('light');
                    toggleTheme();
                  }}
                  className="btn-icon"
                  aria-label={
                    theme === 'dark'
                      ? t('theme.switchToLight', 'Светлая тема')
                      : t('theme.switchToDark', 'Тёмная тема')
                  }
                  title={
                    theme === 'dark'
                      ? t('theme.switchToLight', 'Светлая тема')
                      : t('theme.switchToDark', 'Тёмная тема')
                  }
                >
                  {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
                </button>
              )}

              <div onClick={() => setMobileMenuOpen(false)}>
                <TicketNotificationBell isAdmin={isAdminActive()} />
              </div>
              <div onClick={() => setMobileMenuOpen(false)}>
                <LanguageSwitcher />
              </div>

              {/* Mobile menu button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  haptic.impact('light');
                  setMobileMenuOpen(!mobileMenuOpen);
                }}
                className={`rounded-xl p-2.5 transition-all duration-200 ${
                  mobileMenuOpen
                    ? 'bg-dark-700 text-dark-100'
                    : 'text-dark-400 hover:bg-dark-800 hover:text-dark-100'
                }`}
                aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? (
                  <CloseIcon className="h-6 w-6" />
                ) : (
                  <MenuIcon className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile menu overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            key="mobile-menu"
            className="fixed inset-x-0 bottom-0 z-40 lg:hidden"
            style={{ top: headerHeight }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0 bg-dark-950/60"
              onClick={() => setMobileMenuOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            {/* Menu content */}
            <motion.div
              className="mobile-menu-content absolute inset-x-0 bottom-0 max-h-full overflow-y-auto overscroll-contain rounded-t-[28px] border-t border-dark-800/50 bg-dark-900/95 pb-[calc(5rem+env(safe-area-inset-bottom,0px))] shadow-2xl"
              style={{ WebkitOverflowScrolling: 'touch' }}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 360, damping: 34 }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mx-auto max-w-6xl px-4 pb-4 pt-5">
                {/* User info */}
                <div className="mb-4 flex items-center justify-between border-b border-dark-800/50 pb-4">
                  <div className="flex items-center gap-3">
                    {avatar.src ? (
                      <img
                        src={avatar.src}
                        alt="Avatar"
                        className="h-10 w-10 rounded-full object-cover"
                        onError={avatar.onError}
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-dark-700">
                        <UserIcon className="h-5 w-5" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-dark-100">
                        {displayName(user)}
                      </div>
                      <div className="truncate text-xs text-dark-500">
                        @{user?.username || `ID: ${user?.telegram_id}`}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Nav items */}
                <nav className="space-y-2">
                  {navItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={isActive(item.path) ? 'nav-item-active' : 'nav-item'}
                    >
                      <item.icon className="h-5 w-5" />
                      {item.label}
                    </Link>
                  ))}

                  {isAdmin && (
                    <>
                      <div className="divider my-3" />
                      <div className="px-4 py-1 text-xs font-medium uppercase tracking-wider text-dark-500">
                        {t('admin.nav.title')}
                      </div>
                      <Link
                        to="/admin"
                        onClick={() => setMobileMenuOpen(false)}
                        className={cn(
                          'nav-item',
                          isAdminActive()
                            ? 'bg-warning-500/10 text-warning-400'
                            : 'text-warning-500/70',
                        )}
                      >
                        <CogIcon className="h-5 w-5" />
                        {t('admin.nav.title')}
                      </Link>
                    </>
                  )}

                  <div className="divider my-3" />

                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      logout();
                    }}
                    className="nav-item w-full text-error-400"
                  >
                    <LogoutIcon className="h-5 w-5" />
                    {t('nav.logout')}
                  </button>
                </nav>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
