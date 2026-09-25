import type { ReactNode } from 'react';
import { domMax, LazyMotion, MotionConfig } from 'framer-motion';
import { AuthProvider } from '@/invoxystart/auth';
import { AppShell } from '@/invoxystart/components/layout/AppShell';
import { ToastProvider } from '@/invoxystart/components/layout/ToastProvider';
import { InvoxyStartRestSync } from '@/invoxystart/components/layout/InvoxyStartRestSync';

export function InvoxyStartShell({ children }: { children: ReactNode }) {
  return (
    // domMax, не domAnimation: layout-анимации (скользящие пилюли, layout-списки)
    // без них молча не работают — m.* рендерит конечное состояние без движения.
    <LazyMotion features={domMax} strict>
      <MotionConfig reducedMotion="user">
        <AuthProvider>
          <ToastProvider>
            <InvoxyStartRestSync />
            <AppShell>{children}</AppShell>
          </ToastProvider>
        </AuthProvider>
      </MotionConfig>
    </LazyMotion>
  );
}
