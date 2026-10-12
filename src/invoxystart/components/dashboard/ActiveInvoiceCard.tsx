import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowUpRight, CreditCard } from '@/invoxystart/components/ui/RuneIcon';
import { PiArrowClockwise, PiClock } from 'react-icons/pi';
import { Button } from '@/invoxystart/components/ui/button';
import { usePlatform } from '@/platform';
import { useToast } from '@/invoxystart/components/layout/ToastProvider';
import { balanceApi, type PendingPayment } from '@/invoxystart/api';
import { useAuth } from '@/invoxystart/auth';
import { clearResponseCache } from '@/invoxystart/api/client';
import { getApiErrorMessage } from '@/utils/api-error';
import { useTranslation } from 'react-i18next';
import { schedulePaymentRefresh } from '@/utils/paymentResolution';

const CANCELLED_STATUSES = new Set([
  'canceled',
  'cancelled',
  'fail',
  'failed',
  'declined',
  'expired',
]);

const TERMINAL_SUCCESS_STATUSES = new Set(['paid', 'success', 'succeeded', 'completed']);

function isInvoiceActive(p: PendingPayment): boolean {
  if (p.is_paid) return false;
  const statusLower = (p.status || '').toLowerCase().trim();
  if (CANCELLED_STATUSES.has(statusLower)) return false;
  if (TERMINAL_SUCCESS_STATUSES.has(statusLower)) return false;

  const now = Date.now();
  let expiryTime: number;
  if (p.expires_at) {
    expiryTime = new Date(p.expires_at).getTime();
  } else if (p.created_at) {
    expiryTime = new Date(p.created_at).getTime() + 30 * 60 * 1000;
  } else {
    expiryTime = now + 30 * 60 * 1000;
  }
  return expiryTime > now;
}

export function ActiveInvoiceCard({ className }: { className?: string }) {
  const { openLink } = usePlatform();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const { refreshUser } = useAuth();
  const { t } = useTranslation();
  const previousInvoiceKeysRef = useRef<string[]>([]);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const { data: pendingData } = useQuery({
    queryKey: ['pendingPayments', 'active'],
    queryFn: () => balanceApi.getActivePayments(),
    refetchInterval: 6_000,
  });

  const invoices = useMemo(() => (pendingData?.items ?? []).filter(isInvoiceActive), [pendingData]);
  const selectedIndex = Math.max(
    0,
    invoices.findIndex((invoice) => `${invoice.method}:${invoice.id}` === selectedKey),
  );
  const activeInvoice = invoices[selectedIndex] ?? null;

  function selectInvoice(index: number) {
    const invoice = invoices[index];
    if (invoice) setSelectedKey(`${invoice.method}:${invoice.id}`);
  }

  const refreshPurchasedData = useCallback(() => {
    clearResponseCache();
    void refreshUser();
    for (const queryKey of [
      ['balance'],
      ['transactions'],
      ['invoxy-subscriptions'],
      ['invoxy-subscription-details'],
      ['invoxy-subscription-status'],
    ]) {
      void queryClient.invalidateQueries({ queryKey });
    }
  }, [queryClient, refreshUser]);

  useEffect(() => {
    const nextKeys = invoices.map((invoice) => `${invoice.method}:${invoice.id}`);
    const disappeared = previousInvoiceKeysRef.current.some((key) => !nextKeys.includes(key));
    previousInvoiceKeysRef.current = nextKeys;
    if (disappeared) return schedulePaymentRefresh(refreshPurchasedData);
  }, [invoices, refreshPurchasedData]);

  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);
  const [checking, setChecking] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!activeInvoice) {
      setSecondsRemaining(0);
      return;
    }

    const calculate = () => {
      const now = Date.now();
      const expiry = activeInvoice.expires_at
        ? new Date(activeInvoice.expires_at).getTime()
        : new Date(activeInvoice.created_at).getTime() + 30 * 60 * 1000;
      return Math.max(0, Math.floor((expiry - now) / 1000));
    };

    setSecondsRemaining(calculate());
    const interval = setInterval(() => {
      const remaining = calculate();
      setSecondsRemaining(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        void queryClient.invalidateQueries({ queryKey: ['pendingPayments'] });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeInvoice, queryClient]);

  if (!activeInvoice || secondsRemaining <= 0) {
    return null;
  }

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const timeFormatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const amountRubles =
    activeInvoice.amount_rubles ??
    (activeInvoice.amount_kopeks ? activeInvoice.amount_kopeks / 100 : 0);
  const purposeText = activeInvoice.purpose || 'Пополнение баланса';

  function handleOpen() {
    if (!activeInvoice?.payment_url) return;
    openLink(activeInvoice.payment_url);
  }

  async function handleCheck() {
    if (checking || !activeInvoice) return;
    setChecking(true);
    try {
      const res = await balanceApi.checkPaymentStatus(activeInvoice.method, activeInvoice.id);
      const isPaid = Boolean(
        res.is_paid ||
          res.settled ||
          res.payment?.is_paid ||
          (res.payment?.status === 'paid' && res.payment?.is_paid) ||
          (res.new_status === 'paid' && res.is_paid !== false) ||
          (res.new_status === 'succeeded' && res.is_paid !== false),
      );
      if (isPaid) {
        showToast('Платёж подтверждён.');
        schedulePaymentRefresh(refreshPurchasedData);
        void queryClient.invalidateQueries({ queryKey: ['pendingPayments'] });
      } else {
        showToast('Платёж ещё не поступил. Попробуйте через пару секунд.');
        void queryClient.invalidateQueries({ queryKey: ['pendingPayments'] });
      }
    } catch (err: unknown) {
      const msg = getApiErrorMessage(err, 'Ошибка проверки статуса платежа');
      showToast(msg);
    } finally {
      setChecking(false);
    }
  }

  async function handleCancel() {
    if (cancelling || !activeInvoice) return;
    setCancelling(true);
    try {
      const result = await balanceApi.cancelPendingPayment(activeInvoice.method, activeInvoice.id);
      if (result.is_paid) {
        showToast('Платёж уже подтверждён. Баланс пополнен.');
        schedulePaymentRefresh(refreshPurchasedData);
      } else {
        showToast(t('invoxy.payment.cancelled'));
      }
      void queryClient.invalidateQueries({ queryKey: ['pendingPayments'] });
    } catch (err: unknown) {
      const msg = getApiErrorMessage(err, 'Не удалось отменить счёт');
      showToast(msg);
    } finally {
      setCancelling(false);
    }
  }

  return (
    <div
      className={`glass-panel motion-card relative overflow-hidden rounded-[28px] border border-mint/20 p-5 sm:p-6 ${className ?? ''}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="h-2 w-2 shrink-0 rounded-full bg-mint" aria-hidden="true" />
          <span className="text-xs font-semibold text-mint">Счёт ожидает оплаты</span>
        </div>

        <div className="inline-flex shrink-0 items-center gap-1.5 text-xs text-muted">
          <PiClock className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="tabular-nums">Осталось {timeFormatted}</span>
        </div>
      </div>

      {invoices.length > 1 && (
        <nav
          aria-label="Неоплаченные счета"
          className="mt-4 flex items-center justify-between gap-2"
        >
          <Button
            type="button"
            variant="secondary"
            disabled={selectedIndex === 0 || checking || cancelling}
            onClick={() => selectInvoice(selectedIndex - 1)}
            aria-label="Предыдущий счёт"
            className="h-11 px-3"
          >
            <span aria-hidden="true">←</span>
            <span className="hidden sm:inline">Предыдущий</span>
          </Button>
          <span role="status" className="text-xs text-muted tabular-nums">
            Счёт {selectedIndex + 1} из {invoices.length}
          </span>
          <Button
            type="button"
            variant="secondary"
            disabled={selectedIndex === invoices.length - 1 || checking || cancelling}
            onClick={() => selectInvoice(selectedIndex + 1)}
            aria-label="Следующий счёт"
            className="h-11 px-3"
          >
            <span className="hidden sm:inline">Следующий</span>
            <span aria-hidden="true">→</span>
          </Button>
        </nav>
      )}
      <div className="mt-5 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white/[.05] text-muted">
            <CreditCard size={20} />
          </div>
          <div className="min-w-0">
            <p className="break-words text-sm font-semibold text-ink sm:text-base">
              {activeInvoice.method_display || activeInvoice.method}
            </p>
          </div>
        </div>

        <div className="shrink-0 text-right">
          <p className="whitespace-nowrap text-xl font-semibold tracking-tight text-ink sm:text-2xl">
            {amountRubles.toLocaleString('ru-RU')} ₽
          </p>
        </div>
      </div>
      <p className="mt-2 break-words text-sm leading-relaxed text-muted">{purposeText}</p>
      <p className="mt-2 text-xs leading-relaxed text-muted">
        Чтобы создать новый счёт, оплатите или отмените неоплаченные. Возврат в меню не отменяет
        счёт.
      </p>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center">
        {activeInvoice.payment_url && (
          <Button type="button" onClick={handleOpen} className="w-full sm:w-auto sm:flex-1">
            <ArrowUpRight size={16} />
            <span>Оплатить счёт</span>
          </Button>
        )}

        <div className="grid w-full grid-cols-[minmax(0,1fr)_auto] gap-2 sm:w-auto">
          <Button
            type="button"
            variant="secondary"
            disabled={checking || cancelling}
            onClick={handleCheck}
            className="h-11 min-w-0 gap-1.5 px-3 text-xs font-medium sm:h-12"
          >
            <PiArrowClockwise className={`h-4 w-4 ${checking ? 'animate-spin' : ''}`} />
            <span>{checking ? 'Проверка…' : 'Проверить оплату'}</span>
          </Button>

          <Button
            type="button"
            variant="ghost"
            disabled={checking || cancelling}
            onClick={handleCancel}
            className="h-11 px-3 text-xs font-medium text-muted hover:text-red-300 sm:h-12"
          >
            <span>{cancelling ? 'Отмена…' : 'Отменить'}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
