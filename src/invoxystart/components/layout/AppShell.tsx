import type { ReactNode } from 'react';
import { useNavigate } from 'react-router';
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
  const navigate = useNavigate();

  return (
    <div className="invoxystart-shell relative isolate min-h-screen w-full text-ink">
      <BackgroundShapes />

      <div className="relative z-10 mx-auto grid w-full max-w-[2000px] grid-cols-1 gap-5 px-4 py-6 lg:mx-0 lg:max-w-none lg:grid-cols-[clamp(240px,14.5vw,290px)_minmax(0,1fr)] lg:gap-[1.4vw] lg:pr-[4vw] lg:pl-0 lg:py-0">
        <Sidebar onTopUp={() => navigate('/profile#top-up')} onHelp={() => navigate('/support')} />

        <main className="flex min-w-0 w-full max-w-[560px] flex-1 flex-col lg:max-w-none lg:pt-[1.1vw] lg:pb-[1.1vw]">
          {children}
        </main>
      </div>

      <MobileNav />
    </div>
  );
}
