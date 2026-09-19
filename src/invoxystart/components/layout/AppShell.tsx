import { useEffect, useLayoutEffect, useMemo, useRef, type ReactNode } from 'react';
import { AnimatePresence, m, useReducedMotion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router';
import { Sidebar } from '@/invoxystart/components/layout/Sidebar';
import { MobileNav } from '@/invoxystart/components/layout/MobileNav';
import { BackgroundShapes } from '@/invoxystart/components/layout/BackgroundShapes';
import { PaymentProvider } from '@/invoxystart/components/payments/PaymentFlow';
import { useTelegramSDK } from '@/hooks/useTelegramSDK';

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <PaymentProvider>
      <ShellLayout>{children}</ShellLayout>
    </PaymentProvider>
  );
}

function ShellLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const reducedMotion = useReducedMotion();
  const stageRef = useRef<HTMLDivElement>(null);
  const routeKey = `${location.pathname}${location.search}`;

  const { isTelegramWebApp, isFullscreen, platform, safeAreaInset, contentSafeAreaInset } =
    useTelegramSDK();

  const tgWebApp = typeof window !== 'undefined' ? (window.Telegram?.WebApp as any) : undefined;

  const isTg = isTelegramWebApp || Boolean(tgWebApp?.initData) || Boolean(tgWebApp?.platform);

  const isTgMobile =
    platform === 'ios' ||
    platform === 'android' ||
    tgWebApp?.platform === 'ios' ||
    tgWebApp?.platform === 'android' ||
    (typeof navigator !== 'undefined' && /iphone|ipad|ipod|android/i.test(navigator.userAgent));

  // If opened in Telegram as non-fullscreen, the native Telegram header bar sits
  // entirely outside the webview — no top clearance overlay is needed.
  const isTgFullscreen = Boolean(isFullscreen || tgWebApp?.isFullscreen);

  const topPadding = useMemo(() => {
    // Normal web or standard (non-fullscreen) sheet in Telegram doesn't have Telegram's top close overlay
    if (!isTg || !isTgMobile || !isTgFullscreen) {
      return '1.5rem';
    }

    const contentTop =
      contentSafeAreaInset?.top ||
      (typeof window !== 'undefined' ? window.Telegram?.WebApp?.contentSafeAreaInset?.top : 0) ||
      0;
    const safeTop =
      safeAreaInset?.top ||
      (typeof window !== 'undefined' ? window.Telegram?.WebApp?.safeAreaInset?.top : 0) ||
      0;

    const isIos =
      platform === 'ios' ||
      (typeof window !== 'undefined' && /iphone|ipad|ipod/i.test(navigator.userAgent));

    // Telegram's native '✕ Закрыть' capsule sits at ~60-95px from the top edge in fullscreen
    const minClearance = isIos ? 114 : 96;

    let computedPx = minClearance;
    if (contentTop > 0) {
      computedPx = Math.max(contentTop + 16, minClearance);
    } else if (safeTop > 0) {
      computedPx = Math.max(safeTop + (isIos ? 58 : 50), minClearance);
    }

    return `max(${computedPx}px, calc(env(safe-area-inset-top, 0px) + ${isIos ? 58 : 50}px), calc(var(--tg-content-safe-area-inset-top, 0px) + 16px))`;
  }, [isTg, isTgMobile, isTgFullscreen, contentSafeAreaInset?.top, safeAreaInset?.top, platform]);

  useLayoutEffect(() => {
    if (reducedMotion || !routeKey) return;
    stageRef.current
      ?.querySelectorAll<HTMLElement>('.motion-reveal, .motion-card')
      .forEach((element, index) => {
        element.style.setProperty('--motion-delay', `${30 + Math.min(index, 8) * 35}ms`);
      });
  }, [routeKey, reducedMotion]);

  // Disable automatic browser scroll restoration so pages don't preserve old scroll positions
  useEffect(() => {
    if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  // Reset scroll position to top when navigating between pages
  useLayoutEffect(() => {
    if (typeof window === 'undefined') return;

    // Safely check for anchor hash (Telegram passes #tgWebAppData=... in hash which is not a DOM ID)
    if (location.hash && !location.hash.includes('tgWebAppData')) {
      try {
        const id = location.hash.replace(/^#/, '');
        const target = document.getElementById(id);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth' });
          return;
        }
      } catch {}
    }

    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    const shell = document.querySelector('.invoxystart-shell');
    if (shell) shell.scrollTop = 0;
  }, [location.pathname, location.hash]);

  return (
    <div className="invoxystart-shell relative isolate min-h-screen w-full overflow-x-clip text-ink">
      <BackgroundShapes />

      <div
        className="relative z-10 mx-auto grid w-full max-w-[2000px] grid-cols-1 gap-5 px-4 pt-[var(--app-shell-pt,1.5rem)] pb-6 lg:mx-0 lg:max-w-none lg:grid-cols-[clamp(240px,14.5vw,290px)_minmax(0,1fr)] lg:gap-[1.4vw] lg:pr-[4vw] lg:pl-0 lg:py-0"
        style={{ '--app-shell-pt': topPadding } as React.CSSProperties}
      >
        <Sidebar onTopUp={() => navigate('/profile#top-up')} onHelp={() => navigate('/support')} />

        <main className="mx-auto flex min-w-0 w-full max-w-[560px] flex-1 flex-col pb-20 lg:pb-[1.1vw] lg:mx-0 lg:max-w-none lg:pt-[1.1vw]">
          {reducedMotion ? (
            children
          ) : (
            <AnimatePresence mode="wait" initial={false}>
              <m.div
                ref={stageRef}
                key={routeKey}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                className="route-stage is-entering min-h-full w-full min-w-0"
              >
                {children}
              </m.div>
            </AnimatePresence>
          )}
        </main>
      </div>

      <MobileNav />
    </div>
  );
}
