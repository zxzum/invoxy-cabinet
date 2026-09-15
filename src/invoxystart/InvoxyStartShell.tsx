import type { ReactNode } from 'react';
import { domAnimation, LazyMotion, MotionConfig } from 'framer-motion';
import { AuthProvider } from '@/invoxystart/auth';
import { AppShell } from '@/invoxystart/components/layout/AppShell';
import { ToastProvider } from '@/invoxystart/components/layout/ToastProvider';

export function InvoxyStartShell({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">
        <AuthProvider>
          <ToastProvider>
            <AppShell>{children}</AppShell>
          </ToastProvider>
        </AuthProvider>
      </MotionConfig>
    </LazyMotion>
  );
}
