import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowUpRight, CreditCard } from '@/invoxystart/components/ui/RuneIcon';
import { PiArrowClockwise, PiClock, PiTrash } from 'react-icons/pi';
import { usePlatform } from '@/platform';
import { useToast } from '@/invoxystart/components/layout/ToastProvider';
import { balanceApi, type PendingPayment } from '@/invoxystart/api';

const CANCELLED_STATUSES = new Set([
  'canceled',
  'cancelled',
  'fail',
  'failed',
  'declined',
  'expired',
]);

function isInvoiceActive(p: PendingPayment): boolean {
  if (p.is_paid) return false;
  const statusLower = (p.status || '').toLowerCase().trim();
  if (CANCELLED_STATUSES.has(statusLower)) return false;

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

  const { data: pendingData } = useQuery({
    queryKey: ['pendingPayments'],
    queryFn: () => balanceApi.getPendingPayments({ per_page: 5 }),
    refetchInterval: 6_000,
  });

  const activeInvoice = useMemo(() => {
    const items = pendingData?.items ?? [];
    return items.find(isInvoiceActive) ?? null;
  }, [pendingData]);

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
      if (
        res.payment?.is_paid ||
        res.new_status === 'succeeded' ||
        res.new_status === 'paid' ||
        res.payment?.status === 'paid'
      ) {
        showToast('Платёж подтверждён! Баланс пополнен.');
        void queryClient.invalidateQueries({ queryKey: ['balance'] });
        void queryClient.invalidateQueries({ queryKey: ['pendingPayments'] });
        void queryClient.invalidateQueries({ queryKey: ['invoxy-subscription-details'] });
      } else {
        showToast('Платёж ещё не поступил. Попробуйте через пару секунд.');
        void queryClient.invalidateQueries({ queryKey: ['pendingPayments'] });
      }
    } catch {
      showToast('Ошибка проверки статуса платежа');
    } finally {
      setChecking(false);
    }
  }

  async function handleCancel() {
    if (cancelling || !activeInvoice) return;
    setCancelling(true);
    try {
      await balanceApi.cancelPendingPayment(activeInvoice.method, activeInvoice.id);
      showToast('Счёт отменён');
      void queryClient.invalidateQueries({ queryKey: ['pendingPayments'] });
    } catch {
      showToast('Не удалось отменить счёт');
    } finally {
      setCancelling(false);
    }
  }

  return (
    <div
      className={`glass-panel motion-card relative overflow-hidden rounded-[28px] border border-mint/35 bg-gradient-to-r from-mint/[0.07] via-surface to-surface p-5 lg:p-6 shadow-[0_4px_30px_rgba(165,232,196,0.08)] ${className ?? ''}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] pb-3">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-mint opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-mint" />
          </span>
          <span className="text-xs font-bold uppercase tracking-[0.14em] text-mint">
            Счёт ожидает оплаты
          </span>
        </div>

        <div className="inline-flex items-center gap-1.5 rounded-full bg-mint/10 px-3 py-1 text-xs font-bold text-mint border border-mint/20">
          <PiClock className="h-3.5 w-3.5 animate-pulse" />
          <span className="font-mono">Осталось {timeFormatted}</span>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-mint/10 text-mint">
            <CreditCard size={20} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-base font-bold text-ink">
              {activeInvoice.method_display || activeInvoice.method}
            </p>
            <p className="truncate text-xs text-muted">{purposeText}</p>
          </div>
        </div>

        <div className="text-left sm:text-right">
          <p className="text-2xl font-bold tracking-tight text-mint">
            {amountRubles.toLocaleString('ru-RU')} ₽
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2.5">
        {activeInvoice.payment_url && (
          <button
            type="button"
            onClick={handleOpen}
            className="button-lift flex h-11 flex-1 sm:flex-none items-center justify-center gap-2 rounded-full bg-mint px-5 text-xs font-bold text-bg shadow-sm"
          >
            <ArrowUpRight size={15} />
            <span>Оплатить счёт</span>
          </button>
        )}

        <button
          type="button"
          disabled={checking}
          onClick={handleCheck}
          className="button-lift glass-control flex h-11 items-center justify-center gap-2 rounded-full px-4 text-xs font-medium text-ink disabled:opacity-50"
        >
          <PiArrowClockwise className={`h-4 w-4 ${checking ? 'animate-spin' : ''}`} />
          <span>{checking ? 'Проверка…' : 'Проверить оплату'}</span>
        </button>

        <button
          type="button"
          disabled={cancelling}
          onClick={handleCancel}
          className="button-lift ml-auto flex h-11 items-center justify-center gap-1.5 rounded-full px-3 text-xs text-red-300/70 hover:text-red-300 disabled:opacity-50"
        >
          <PiTrash className="h-4 w-4" />
          <span>{cancelling ? 'Отмена…' : 'Отменить'}</span>
        </button>
      </div>
    </div>
  );
}
