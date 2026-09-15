import { useLayoutEffect, useRef, type ReactNode } from 'react';
import { AnimatePresence, m, useReducedMotion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router';
import { Sidebar } from '@/invoxystart/components/layout/Sidebar';
import { MobileNav } from '@/invoxystart/components/layout/MobileNav';
import { BackgroundShapes } from '@/invoxystart/components/layout/BackgroundShapes';
import { PaymentProvider } from '@/invoxystart/components/payments/PaymentFlow';

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

  useLayoutEffect(() => {
    if (reducedMotion || !routeKey) return;
    stageRef.current
      ?.querySelectorAll<HTMLElement>('.motion-reveal, .motion-card')
      .forEach((element, index) => {
        element.style.setProperty('--motion-delay', `${60 + Math.min(index, 9) * 70}ms`);
      });
  }, [routeKey, reducedMotion]);

  return (
    <div className="invoxystart-shell relative isolate min-h-screen w-full text-ink">
      <BackgroundShapes />

      <div className="relative z-10 mx-auto grid w-full max-w-[2000px] grid-cols-1 gap-5 px-4 py-6 lg:mx-0 lg:max-w-none lg:grid-cols-[clamp(240px,14.5vw,290px)_minmax(0,1fr)] lg:gap-[1.4vw] lg:pr-[4vw] lg:pl-0 lg:py-0">
        <Sidebar onTopUp={() => navigate('/profile#top-up')} onHelp={() => navigate('/support')} />

        <main className="flex min-w-0 w-full max-w-[560px] flex-1 flex-col lg:max-w-none lg:pt-[1.1vw] lg:pb-[1.1vw]">
          {reducedMotion ? (
            children
          ) : (
            <AnimatePresence mode="wait">
              <m.div
                ref={stageRef}
                key={routeKey}
                initial={{ opacity: 0, y: 16, filter: 'blur(6px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
                transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                className="route-stage is-entering min-h-full"
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
