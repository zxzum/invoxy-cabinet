import { useCallback, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/invoxystart/components/layout/ToastProvider';
import { useAuth } from '@/invoxystart/auth';
import { clearResponseCache } from '@/invoxystart/api/client';

/** REST fallback for account changes and returning from an external payment app. */
export function InvoxyStartRestSync() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { refreshUser, isAdmin, user } = useAuth();
  const lastResumeAtRef = useRef(0);
  const lastBalanceRef = useRef<number | null>(user?.balance_rubles ?? null);

  const invalidateData = useCallback(
    (includeSubscription = false) => {
      for (const queryKey of [
        ['invoxy-balance'],
        ['balance'],
        ['active-invoice'],
        ['pendingPayments'],
        ['paymentMethods'],
        ['transactions'],
        ...(includeSubscription
          ? [
              ['invoxy-subscriptions'],
              ['invoxy-subscription-details'],
              ['invoxy-subscription-status'],
            ]
          : []),
      ]) {
        void queryClient.invalidateQueries({ queryKey });
      }
    },
    [queryClient],
  );

  const syncAccount = useCallback(async () => {
    const previousBalance = user?.balance_rubles ?? lastBalanceRef.current;
    const updatedUser = await refreshUser().catch(() => null);
    const balance = updatedUser?.balance_rubles;
    if (typeof balance === 'number') {
      if (previousBalance !== null && balance > previousBalance) {
        showToast(`Баланс пополнен на +${(balance - previousBalance).toLocaleString('ru-RU')} ₽`);
      }
      lastBalanceRef.current = balance;
    }
    invalidateData();
  }, [invalidateData, refreshUser, showToast, user?.balance_rubles]);

  useEffect(() => {
    if (isAdmin) return;
    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') void syncAccount();
    }, 60_000);
    return () => window.clearInterval(interval);
  }, [isAdmin, syncAccount]);

  // Revalidate after the tab returns from a bank app; coalesce focus and
  // visibility events emitted together by browsers.
  useEffect(() => {
    const onResume = () => {
      if (document.visibilityState === 'hidden') return;
      const now = Date.now();
      if (now - lastResumeAtRef.current < 500) return;
      lastResumeAtRef.current = now;

      clearResponseCache();
      invalidateData(true);
      void syncAccount();
    };

    document.addEventListener('visibilitychange', onResume);
    window.addEventListener('focus', onResume);
    return () => {
      document.removeEventListener('visibilitychange', onResume);
      window.removeEventListener('focus', onResume);
    };
  }, [invalidateData, syncAccount]);

  return null;
}
