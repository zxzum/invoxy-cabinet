import { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { PiChatCircle } from 'react-icons/pi';

import { useAuthStore } from '@/store/auth';
import { useHaptic } from '@/platform';
import { useTelegramSDK } from '@/hooks/useTelegramSDK';
import { useHeaderHeight } from '@/hooks/useHeaderHeight';
import { useBranding } from '@/hooks/useBranding';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { useCurrency } from '@/hooks/useCurrency';
import { useScrollRestoration } from '@/hooks/useScrollRestoration';
import { resetVirtualKeyboard, useVirtualKeyboard } from '@/hooks/useVirtualKeyboard';
import { balanceApi } from '@/api/balance';
import { displayName } from '@/utils/displayName';
import { cn } from '@/lib/utils';
import { API } from '@/config/constants';

import WebSocketNotifications from '@/components/WebSocketNotifications';
import CampaignBonusNotifier from '@/components/CampaignBonusNotifier';
import SuccessNotificationModal from '@/components/SuccessNotificationModal';
import { PromptDialogHost } from '@/components/PromptDialogHost';
import {
  SubscriptionIcon,
  HomeIcon,
  UserIcon,
  ShieldIcon,
  UsersIcon,
  InfoIcon,
} from '@/components/icons';
import { LOCAL_LOGO_URL } from '@/api/branding';
import { AnimatedNumber } from '@/components/motion';

import { MobileBottomNav } from './MobileBottomNav';
import { AppHeader } from './AppHeader';
import { useBackgroundConsumer } from '@/components/backgrounds/BackgroundHost';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const reducedMotion = useReducedMotion();
  const {
    isFullscreen,
    safeAreaInset,
    contentSafeAreaInset,
    platform,
    isMobile,
    isTelegramWebApp,
  } = useTelegramSDK();
  const [desktop, setDesktop] = useState(() => window.matchMedia('(min-width: 1024px)').matches);
  const [previousPath, setPreviousPath] = useState(location.pathname);
  const [direction, setDirection] = useState(1);
  const tabs = ['/dashboard', '/tariffs', '/referrals', '/profile'];
  const isModernCustomerRoute =
    tabs.includes(location.pathname) ||
    location.pathname === '/subscription/purchase' ||
    location.pathname === '/referral' ||
    location.pathname === '/subscriptions' ||
    location.pathname.startsWith('/subscriptions/') ||
    location.pathname === '/news' ||
    location.pathname.startsWith('/news/') ||
    location.pathname === '/info' ||
    location.pathname.startsWith('/info/');
  const animatePage = !isTelegramWebApp && !reducedMotion;
  if (animatePage && previousPath !== location.pathname) {
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
  const user = useAuthStore((state) => state.user);
  const { mobile, mobileCss } = useHeaderHeight();
  const headerHeight = mobileCss ?? `${mobile}px`;
  const haptic = useHaptic();
  const { formatWithCurrency } = useCurrency();

  const { appName, logoUrl } = useBranding();
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
  const isKeyboardOpen = useVirtualKeyboard();
  useEffect(() => {
    resetVirtualKeyboard();
  }, [location.pathname]);
  useEffect(() => {
    const root = document.documentElement;
    if (isModernCustomerRoute) {
      root.dataset.customerPalette = 'mint';
    } else if (root.dataset.customerPalette === 'mint') {
      delete root.dataset.customerPalette;
    }

    return () => {
      if (root.dataset.customerPalette === 'mint') delete root.dataset.customerPalette;
    };
  }, [isModernCustomerRoute]);
  const showMobileNav = !location.pathname.startsWith('/admin');

  const sidebarNav = [
    { path: '/dashboard', label: t('nav.dashboard', 'Кабинет'), icon: HomeIcon },
    { path: '/tariffs', label: t('nav.tariffs', 'Тарифы'), icon: SubscriptionIcon },
    ...(referralEnabled
      ? [{ path: '/referrals', label: t('nav.referral', 'Рефералы'), icon: UsersIcon }]
      : []),
    { path: '/info', label: t('nav.info', 'Информация'), icon: InfoIcon },
  ];

  const isActive = (path: string) => {
    if (path === '/dashboard') return location.pathname === '/dashboard';
    if (path === '/tariffs')
      return location.pathname === path || location.pathname === '/subscription/purchase';
    if (path === '/referrals')
      return location.pathname === path || location.pathname.startsWith('/referral');
    return location.pathname.startsWith(path);
  };

  const handleNavClick = () => {
    haptic.impact('light');
  };

  const userName = displayName(user);
  const balanceRubles = balanceData?.balance_rubles ?? (balanceData?.balance_kopeks ?? 0) / 100;
  const balanceLabel = formatWithCurrency(balanceRubles);
  const greeting = userName
    ? t('dashboard.welcome', { name: userName })
    : t('dashboard.welcomeNoName', 'Welcome!');

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
    <div
      className="ix-app min-h-viewport"
      data-mobile-nav={showMobileNav ? 'on' : 'off'}
      data-customer-ui={isModernCustomerRoute ? 'modern' : 'legacy'}
    >
      <WebSocketNotifications />
      <CampaignBonusNotifier />
      <SuccessNotificationModal />
      <PromptDialogHost />

      <aside className="ix-sidebar ix-sidebar-island glass-surface-elevated hidden lg:flex">
        <div className="flex items-center gap-3 px-2 py-1">
          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-accent-500/10">
            <img
              src={isModernCustomerRoute ? '/images/brand-mark.png' : logoUrl || LOCAL_LOGO_URL}
              alt={isModernCustomerRoute ? 'InvoxyVPN' : appName || 'Invoxy VPN'}
              className="h-full w-full object-contain"
            />
          </div>
          <div className="truncate text-xl font-bold text-dark-50">
            {isModernCustomerRoute ? (
              <>
                Invoxy<span className="text-accent-400">VPN</span>
              </>
            ) : (
              appName || 'Invoxy VPN'
            )}
          </div>
        </div>

        <nav className="ix-sidebar-nav">
          {sidebarNav.map((item) => renderSideLink(item.path, item.label, item.icon))}
          {isAdmin && renderSideLink('/admin', t('admin.nav.title', 'Админка'), ShieldIcon, true)}
        </nav>

        <div className="mt-auto space-y-3">
          <Link to="/support" className="ix-help-card glass-surface" onClick={handleNavClick}>
            <InfoIcon className="h-5 w-5 text-accent-300" />
            <strong>{t('support.needHelp', 'Нужна помощь?')}</strong>
            <span>{t('support.available247', 'Мы на связи 24/7')}</span>
          </Link>

          <div className="ix-balance-card glass-surface">
            <div className="text-[11px] uppercase tracking-wide text-dark-500">Баланс</div>
            {/* Счётчик вместо строки: при пополнении баланс «докручивается» до
                нового значения. Копеек нет — показываем целые рубли. */}
            <AnimatedNumber
              className="mt-1 block text-xl font-semibold text-dark-100"
              value={balanceRubles}
              format={formatWithCurrency}
              testId="sidebar-balance"
            />
            <Link to="/profile#top-up" onClick={handleNavClick} className="ix-balance-topup">
              Пополнить
            </Link>
          </div>

          {renderSideLink('/profile', 'Профиль', UserIcon)}
        </div>
      </aside>

      <div className="ix-content isolate">
        {location.pathname.startsWith('/admin') && (
          <>
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
              greeting={greeting}
              balanceLabel={balanceLabel}
            />
            <div className="lg:hidden" style={{ height: `calc(${headerHeight} + 0.75rem)` }} />
          </>
        )}

        <main className="ix-main" style={{ position: 'relative', overflowX: 'clip' }}>
          {animatePage ? (
            <AnimatePresence
              mode={desktop ? 'wait' : 'popLayout'}
              custom={direction}
              initial={false}
            >
              <motion.div
                key={location.pathname}
                custom={direction}
                className="ix-page-transition"
                variants={{
                  enter: (value: number) =>
                    desktop
                      ? { opacity: 0, y: 14, x: 0 }
                      : { opacity: 1, x: `${value * 100}%`, y: 0 },
                  visible: { opacity: 1, x: 0, y: 0 },
                  leave: (value: number) =>
                    desktop
                      ? { opacity: 0, y: -8, x: 0 }
                      : { opacity: 1, x: `${value * -100}%`, y: 0 },
                }}
                initial="enter"
                animate="visible"
                exit="leave"
                transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          ) : (
            children
          )}
        </main>
      </div>

      {showMobileNav && (
        <MobileBottomNav
          isKeyboardOpen={isKeyboardOpen}
          safeAreaInset={safeAreaInset}
          contentSafeAreaInset={contentSafeAreaInset}
        />
      )}

      {!isModernCustomerRoute && location.pathname !== '/support' && (
        <Link to="/support" className="ix-fab" aria-label="Поддержка" onClick={handleNavClick}>
          <PiChatCircle className="h-6 w-6" />
        </Link>
      )}
    </div>
  );
}
