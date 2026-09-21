import { useEffect, useCallback, useContext, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { WebSocketContext } from '@/providers/WebSocketContext';
import type { WSMessage } from '@/providers/WebSocketContext';
import { useToast } from '@/invoxystart/components/layout/ToastProvider';
import { useAuth } from '@/invoxystart/auth';
import { clearResponseCache } from '@/invoxystart/api/client';

/**
 * Global Real-Time synchronization component for InvoxyStart.
 *
 * Listens to WebSocket events from the backend (balance topup/change, subscription
 * activation/renewal, payment confirmation, ticket updates) and provides:
 * 1. Immediate React Query cache invalidation (balance, subscriptions, invoices)
 * 2. Auth store user refresh (so AnimatedBalance updates smoothly)
 * 3. User-facing Toast notifications
 * 4. Automatic refetch on window focus / visibility change (e.g. after returning from bank app)
 */
export function InvoxyStartWsListener() {
  const ws = useContext(WebSocketContext);
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { refreshUser } = useAuth();
  const lastResumeAtRef = useRef(0);

  const invalidateData = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['invoxy-balance'] });
    queryClient.invalidateQueries({ queryKey: ['balance'] });
    queryClient.invalidateQueries({ queryKey: ['invoxy-subscriptions'] });
    queryClient.invalidateQueries({ queryKey: ['invoxy-subscription-details'] });
    queryClient.invalidateQueries({ queryKey: ['active-invoice'] });
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
    queryClient.invalidateQueries({ queryKey: ['partner-status'] });
  }, [queryClient]);

  const handleMessage = useCallback(
    (message: WSMessage) => {
      const type = message.type;

      if (type === 'balance.topup') {
        const rubles =
          message.amount_rubles ??
          (typeof message.amount_kopeks === 'number' ? message.amount_kopeks / 100 : 0);
        showToast(`🎉 Баланс пополнен на +${rubles.toLocaleString('ru-RU')} ₽!`);
        void refreshUser();
        invalidateData();
        return;
      }

      if (type === 'balance.change') {
        const rubles =
          message.amount_rubles ??
          (typeof message.amount_kopeks === 'number' ? message.amount_kopeks / 100 : 0);
        const isPositive = rubles >= 0;
        const prefix = isPositive ? '+' : '';
        const desc = message.description || (isPositive ? 'Баланс пополнен' : 'Списание с баланса');
        showToast(`${desc}: ${prefix}${rubles.toLocaleString('ru-RU')} ₽`);
        void refreshUser();
        invalidateData();
        return;
      }

      if (type === 'subscription.activated') {
        const tariffName = message.tariff_name ? ` «${message.tariff_name}»` : '';
        showToast(`✨ Подписка${tariffName} успешно активирована!`);
        void refreshUser();
        invalidateData();
        return;
      }

      if (type === 'subscription.renewed') {
        showToast('⚡ Подписка успешно продлена!');
        void refreshUser();
        invalidateData();
        return;
      }

      if (type === 'subscription.devices_purchased') {
        showToast(`📱 Устройства успешно добавлены (+${message.devices_added ?? 1})`);
        void refreshUser();
        invalidateData();
        return;
      }

      if (type === 'subscription.traffic_purchased') {
        showToast(`🌐 Трафик успешно добавлен (+${message.traffic_gb_added ?? 0} ГБ)`);
        void refreshUser();
        invalidateData();
        return;
      }

      if (type === 'payment.received' || type === 'autopay.success') {
        showToast('✅ Оплата успешно подтверждена!');
        void refreshUser();
        invalidateData();
        return;
      }

      if (type === 'ticket.admin_reply') {
        // TicketNotificationBell owns the toast and unread counter. Keep the
        // list fresh here without showing the same event twice.
        queryClient.invalidateQueries({ queryKey: ['tickets'] });
      }
    },
    [showToast, refreshUser, invalidateData, queryClient],
  );

  useEffect(() => {
    if (!ws?.subscribe) return;
    const unsubscribe = ws.subscribe(handleMessage);
    return unsubscribe;
  }, [ws, handleMessage]);

  // Window focus / visibility change fallback:
  // When user returns from external browser (after paying in SBP / bank app).
  // Chrome emits both events for one resume; coalesce them so two concurrent
  // refetches cannot race a partially updated dashboard.
  useEffect(() => {
    const onResume = () => {
      if (document.visibilityState === 'hidden') return;
      const now = Date.now();
      if (now - lastResumeAtRef.current < 500) return;
      lastResumeAtRef.current = now;

      clearResponseCache();
      void refreshUser();
      invalidateData();
    };

    document.addEventListener('visibilitychange', onResume);
    window.addEventListener('focus', onResume);

    return () => {
      document.removeEventListener('visibilitychange', onResume);
      window.removeEventListener('focus', onResume);
    };
  }, [refreshUser, invalidateData]);

  return null;
}
