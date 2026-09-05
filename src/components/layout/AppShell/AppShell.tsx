import { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { PiKey, PiChatCircle } from 'react-icons/pi';

import { useAuthStore } from '@/store/auth';
import { useHaptic } from '@/platform';
import { useTelegramSDK } from '@/hooks/useTelegramSDK';
import { useHeaderHeight } from '@/hooks/useHeaderHeight';
import { useTheme } from '@/hooks/useTheme';
import { useBranding } from '@/hooks/useBranding';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { useScrollRestoration } from '@/hooks/useScrollRestoration';
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
import { LOCAL_LOGO_URL } from '@/api/branding';
import { AnimatedNumber, pillSpring, pressSpring } from '@/components/motion';

import { MobileBottomNav } from './MobileBottomNav';
import { AppHeader } from './AppHeader';
import { useBackgroundConsumer } from '@/components/backgrounds/BackgroundHost';

interface AppShellProps {
  children: React.ReactNode;
}

const MotionFabLink = motion.create(Link);

export function AppShell({ children }: AppShellProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const reducedMotion = useReducedMotion();
  const [desktop, setDesktop] = useState(() => window.matchMedia('(min-width: 1024px)').matches);
  const [previousPath, setPreviousPath] = useState(location.pathname);
  const [direction, setDirection] = useState(1);
  const tabs = ['/', '/subscription/purchase', '/connection', '/profile'];
  if (previousPath !== location.pathname) {
    const previousIndex = tabs.indexOf(previousPath);
    const nextIndex = tabs.indexOf(location.pathname);
    setDirection(previousIndex >= 0 && nextIndex >= 0 && nextIndex < previousIndex ? -1 : 1);
    setPreviousPath(location.pathname);
  }
  useEffect(() => {
    const media = window.matchMedia('(min-width: 1024px)');
    const update = () => setDesktop(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  const isAdmin = useAuthStore((state) => state.isAdmin);
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const { isFullscreen, safeAreaInset, contentSafeAreaInset, platform, isMobile } =
    useTelegramSDK();
  const { mobile: headerHeight } = useHeaderHeight();
  const haptic = useHaptic();
  const { theme, toggleTheme, canToggle } = useTheme();

  const { appName, logoLetter, logoUrl } = useBranding();
  const { referralEnabled, wheelEnabled, hasContests, hasPolls, giftEnabled } = useFeatureFlags();
  useScrollRestoration();
  useBackgroundConsumer();

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
      return location.pathname === path;
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
        className={cn('ix-side-link relative', active && 'ix-side-link-active')}
      >
        {/* Пилл активного пункта: layoutId ровно один в дереве — только у активного.
            Центрирование через top: calc(...), а не -translate-y-1/2: framer-motion
            пишет transform inline (layout-анимация пилла) и перебивает translate
            из класса — пилл уезжал на полвысоты ниже центра. */}
        {active && (
          <motion.span
            layoutId="ix-side-pill"
            aria-hidden="true"
            className="absolute left-0 top-[calc(50%-12px)] h-6 w-1 rounded-full"
            style={{
              background: 'rgb(var(--color-accent-400))',
              boxShadow: '0 0 12px var(--ix-glow)',
            }}
          />
        )}
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
            <div className="truncate text-sm font-semibold text-dark-100">{name}</div>
            <div className="truncate text-[11px] text-dark-500">
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
            <div className="text-[11px] uppercase tracking-wide text-dark-500">Баланс</div>
            {/* Счётчик вместо строки: при пополнении баланс «докручивается» до
                нового значения. Формат — тот же ru-RU с двумя знаками. */}
            <AnimatedNumber
              className="mt-1 block text-xl font-semibold text-dark-100"
              value={balanceRubles}
              format={(v) =>
                `${v.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₽`
              }
            />
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
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={appName || 'Invoxy VPN'}
                  className="h-full w-full object-contain"
                />
              ) : (
                <img
                  src={LOCAL_LOGO_URL}
                  alt={appName || 'Invoxy VPN'}
                  className="h-full w-full object-contain"
                />
              )}
            </div>
            <span className="text-lg font-semibold text-dark-100">{appName || 'Invoxy VPN'}</span>
          </Link>
          <TicketNotificationBell isAdmin={location.pathname.startsWith('/admin')} />
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
        </div>

        <div className="lg:hidden" style={{ height: headerHeight }} />

        <main className="ix-main" style={{ position: 'relative', overflowX: 'clip' }}>
          <AnimatePresence mode={desktop ? 'wait' : 'popLayout'} custom={direction} initial={false}>
            <motion.div
              key={location.pathname}
              custom={direction}
              variants={{
                enter: (value: number) =>
                  reducedMotion
                    ? { opacity: 1, x: 0, y: 0 }
                    : desktop
                      ? { opacity: 0, y: 14, x: 0 }
                      : { opacity: 1, x: `${value * 100}%`, y: 0 },
                visible: { opacity: 1, x: 0, y: 0 },
                leave: (value: number) =>
                  reducedMotion
                    ? { opacity: 1, x: 0, y: 0 }
                    : desktop
                      ? { opacity: 0, y: -8, x: 0 }
                      : { opacity: 1, x: `${value * -100}%`, y: 0 },
              }}
              initial="enter"
              animate="visible"
              exit="leave"
              transition={{ duration: reducedMotion ? 0 : 0.24, ease: [0.22, 1, 0.36, 1] }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <MobileBottomNav isKeyboardOpen={isKeyboardOpen} />

      {location.pathname !== '/support' && (
        <MotionFabLink
          key="support-fab"
          to="/support"
          className="ix-fab"
          aria-label="Поддержка"
          onClick={handleNavClick}
          initial={{ opacity: 0, scale: 0.6, y: 16 }}
          animate={
            isKeyboardOpen
              ? { opacity: 0, scale: 0.8, y: 16, transition: pillSpring }
              : { opacity: 1, scale: 1, y: 0, transition: pillSpring }
          }
          whileTap={{ scale: 0.92, transition: pressSpring }}
        >
          <PiChatCircle className="h-6 w-6" />
        </MotionFabLink>
      )}
    </div>
  );
}

function KeyIcon({ className }: { className?: string }) {
  return <PiKey className={className} />;
}
