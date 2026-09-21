import { useState, useEffect, useRef, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { PiClock, PiWarning } from 'react-icons/pi';

import { Card } from '@/components/data-display/Card';
import { Button } from '@/components/primitives/Button';
import PaymentMethodIcon from '@/components/PaymentMethodIcon';
import { CheckIcon, CopyIcon, ExternalLinkIcon, RefreshIcon, TrashIcon } from '@/components/icons';
import { usePlatform } from '@/platform';
import { useToast } from '@/components/Toast';
import { useCurrency } from '@/hooks/useCurrency';
import { openPaymentUrl } from '@/utils/openPaymentUrl';
import { getSafeExternalUrl } from '@/utils/safeExternalUrl';
import { copyToClipboard } from '@/utils/clipboard';
import { balanceApi } from '@/api/balance';
import type { PendingPayment } from '@/types';
import { cn } from '@/lib/utils';
import { isFailedStatus, isPaidStatus } from '@/utils/paymentStatus';

export interface ActiveInvoiceCardProps {
  invoice?: PendingPayment;
  onCancelled?: () => void;
  onPaid?: () => void;
  className?: string;
  showTitle?: boolean;
}

const CANCELLED_STATUSES = new Set([
  'canceled',
  'cancelled',
  'fail',
  'failed',
  'declined',
  'expired',
]);

function isInvoiceActiveRecord(p: PendingPayment): boolean {
  if (p.is_paid || isPaidStatus(p.status)) return false;
  const statusLower = (p.status || '').toLowerCase().trim();
  if (CANCELLED_STATUSES.has(statusLower) || isFailedStatus(statusLower)) return false;

  // Check 30-minute expiry
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

export function ActiveInvoiceCard({
  invoice: propInvoice,
  onCancelled,
  onPaid,
  className,
  showTitle = true,
}: ActiveInvoiceCardProps) {
  const { t } = useTranslation();
  const { platform, openLink } = usePlatform();
  const { showToast } = useToast();
  const { formatAmount, currencySymbol } = useCurrency();
  const queryClient = useQueryClient();

  // If no explicit invoice is passed (or placeholder with id 0), fetch pending payments
  const { data: pendingData, isLoading } = useQuery({
    queryKey: ['pendingPayments'],
    queryFn: () => balanceApi.getPendingPayments({ per_page: 5 }),
    enabled: !propInvoice || propInvoice.id === 0,
    refetchInterval: 10_000,
  });

  const activeInvoice = useMemo(() => {
    if (propInvoice && propInvoice.id !== 0) {
      return isInvoiceActiveRecord(propInvoice) ? propInvoice : null;
    }
    const items = pendingData?.items ?? [];
    const serverMatch = items.find(isInvoiceActiveRecord);
    if (serverMatch) return serverMatch;
    if (propInvoice) {
      return isInvoiceActiveRecord(propInvoice) ? propInvoice : null;
    }
    return null;
  }, [propInvoice, pendingData]);

  // Expiry countdown timer
  const [secondsRemaining, setSecondsRemaining] = useState<number>(() => {
    if (!activeInvoice) return 0;
    const now = Date.now();
    const expiry = activeInvoice.expires_at
      ? new Date(activeInvoice.expires_at).getTime()
      : new Date(activeInvoice.created_at).getTime() + 30 * 60 * 1000;
    return Math.max(0, Math.floor((expiry - now) / 1000));
  });

  useEffect(() => {
    if (!activeInvoice) {
      setSecondsRemaining(0);
      return;
    }

    const calculateRemaining = () => {
      const now = Date.now();
      const expiry = activeInvoice.expires_at
        ? new Date(activeInvoice.expires_at).getTime()
        : new Date(activeInvoice.created_at).getTime() + 30 * 60 * 1000;
      return Math.max(0, Math.floor((expiry - now) / 1000));
    };

    setSecondsRemaining(calculateRemaining());

    const interval = setInterval(() => {
      const remaining = calculateRemaining();
      setSecondsRemaining(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        queryClient.invalidateQueries({ queryKey: ['pendingPayments'] });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeInvoice, queryClient]);

  // UI action states
  const [copied, setCopied] = useState(false);
  const [checking, setChecking] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [popupBlocked, setPopupBlocked] = useState(false);
  const cancelTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (cancelTimerRef.current) clearTimeout(cancelTimerRef.current);
    };
  }, []);

  if (!propInvoice && isLoading) {
    return null;
  }

  if (!activeInvoice || secondsRemaining <= 0) {
    return null;
  }

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const timeFormatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  const safePaymentUrl = getSafeExternalUrl(activeInvoice.payment_url);

  const handleOpen = () => {
    if (!safePaymentUrl) return;
    setPopupBlocked(false);
    const opened = openPaymentUrl(safePaymentUrl, platform, openLink);
    if (!opened) {
      setPopupBlocked(true);
    }
  };

  const handleCopy = async () => {
    if (!safePaymentUrl) return;
    try {
      await copyToClipboard(safePaymentUrl);
      setCopied(true);
      showToast({
        type: 'success',
        message: t('balance.pendingPayments.copied', 'Ссылка скопирована'),
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleCheck = async () => {
    if (checking || !activeInvoice) return;
    setChecking(true);
    try {
      const res = await balanceApi.checkPaymentStatus(activeInvoice.method, activeInvoice.id);
      if (
        res.payment?.is_paid ||
        (res.status_changed && res.new_status === 'succeeded') ||
        isPaidStatus(res.payment?.status || '')
      ) {
        showToast({
          type: 'success',
          message: t(
            'balance.pendingPayments.checkSuccess',
            'Платёж подтверждён! Баланс пополнен.',
          ),
        });
        queryClient.invalidateQueries({ queryKey: ['balance'] });
        queryClient.invalidateQueries({ queryKey: ['pendingPayments'] });
        queryClient.invalidateQueries({ queryKey: ['transactions'] });
        onPaid?.();
      } else {
        showToast({
          type: 'info',
          message: t(
            'balance.pendingPayments.checkStillPending',
            'Платёж ещё не поступил. Попробуйте через пару секунд.',
          ),
        });
        queryClient.invalidateQueries({ queryKey: ['pendingPayments'] });
      }
    } catch {
      showToast({
        type: 'error',
        message: t('common.error', 'Ошибка проверки статуса'),
      });
    } finally {
      setChecking(false);
    }
  };

  const handleCancel = async () => {
    if (!confirmCancel) {
      setConfirmCancel(true);
      if (cancelTimerRef.current) clearTimeout(cancelTimerRef.current);
      cancelTimerRef.current = setTimeout(() => {
        setConfirmCancel(false);
      }, 5000);
      return;
    }

    if (cancelTimerRef.current) clearTimeout(cancelTimerRef.current);
    setConfirmCancel(false);
    setCancelling(true);

    try {
      await balanceApi.cancelPendingPayment(activeInvoice.method, activeInvoice.id);
      showToast({
        type: 'info',
        message: t('balance.pendingPayments.cancelled', 'Счёт отменён'),
      });
      queryClient.invalidateQueries({ queryKey: ['pendingPayments'] });
      onCancelled?.();
    } catch {
      showToast({
        type: 'error',
        message: t('common.error', 'Не удалось отменить счёт'),
      });
    } finally {
      setCancelling(false);
    }
  };

  const amountRubles = activeInvoice.amount_rubles ?? activeInvoice.amount_kopeks / 100;
  const purposeText =
    activeInvoice.purpose ||
    (activeInvoice.purpose_code === 'tariff'
      ? t('balance.payTariffDirect', 'Оплата тарифа')
      : t('balance.top_up', 'Пополнение баланса'));

  return (
    <Card
      id="active-invoice-card"
      className={cn(
        'glass-surface relative overflow-hidden border-accent-500/40 p-4 sm:p-6 shadow-lg shadow-accent-500/5',
        className,
      )}
    >
      {/* Header with Title and Countdown */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 border-b border-dark-700/60 pb-3">
        <div className="flex items-center justify-between sm:justify-start gap-2">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-accent-500" />
            </span>
            {showTitle && (
              <h3 className="text-sm font-semibold text-dark-100 truncate">
                {t('balance.pendingPayments.activeTitle', 'Активный счёт')}
              </h3>
            )}
          </div>
          {activeInvoice.id ? (
            <span className="text-xs text-dark-400 font-mono sm:ml-1">#{activeInvoice.id}</span>
          ) : null}
        </div>

        {/* Countdown Badge */}
        <div
          className="self-start sm:self-auto inline-flex items-center gap-1.5 rounded-full bg-accent-500/10 px-2.5 py-1 text-xs font-medium text-accent-400 border border-accent-500/20 whitespace-nowrap"
          title={t('balance.pendingPayments.expiresIn', { time: timeFormatted })}
        >
          <PiClock className="h-3.5 w-3.5 animate-pulse shrink-0" />
          <span>{t('balance.pendingPayments.expiresIn', { time: timeFormatted })}</span>
        </div>
      </div>

      {/* Main Details */}
      <div className="my-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-dark-800 border border-dark-700">
            <PaymentMethodIcon method={activeInvoice.method} className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-dark-100">
              {activeInvoice.method_display || activeInvoice.method}
            </p>
            <p className="truncate text-xs text-dark-400">{purposeText}</p>
          </div>
        </div>

        <div className="sm:text-right">
          <div className="text-2xl font-bold tracking-tight text-accent-400">
            {formatAmount(amountRubles)}{' '}
            <span className="text-lg font-semibold text-dark-300">{currencySymbol}</span>
          </div>
        </div>
      </div>

      {/* Popup Blocked Warning */}
      {popupBlocked && safePaymentUrl && (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-linear border border-warning-500/40 bg-warning-500/10 p-3 text-xs text-warning-400">
          <div className="flex items-center gap-2">
            <PiWarning className="h-4 w-4 shrink-0 text-warning-400" />
            <span>{t('balance.pendingPayments.openBlocked')}</span>
          </div>
          <a
            href={safePaymentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 rounded-lg bg-warning-500/20 px-3 py-1 font-semibold text-warning-300 hover:bg-warning-500/30"
          >
            {t('balance.pendingPayments.pay')} →
          </a>
        </div>
      )}

      {/* Actions Row */}
      <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:justify-end">
        {/* Pay / Open */}
        {safePaymentUrl && (
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpen}
            className="col-span-2 sm:col-auto gap-1.5 min-h-[44px] sm:min-h-9"
          >
            <ExternalLinkIcon className="h-4 w-4" />
            <span>{t('balance.pendingPayments.pay', 'Оплатить')}</span>
          </Button>
        )}

        {/* Copy Link */}
        {safePaymentUrl && (
          <Button
            variant="secondary"
            size="sm"
            onClick={handleCopy}
            disabled={copied}
            className="gap-1.5 min-h-[44px] sm:min-h-9"
            title={t('balance.pendingPayments.copy', 'Скопировать ссылку')}
          >
            {copied ? (
              <CheckIcon className="h-4 w-4 text-success-400" />
            ) : (
              <CopyIcon className="h-4 w-4" />
            )}
            <span className="truncate">
              {copied
                ? t('balance.pendingPayments.copied', 'Скопировано')
                : t('balance.pendingPayments.copy', 'Ссылка')}
            </span>
          </Button>
        )}

        {/* Check Status */}
        <Button
          variant="secondary"
          size="sm"
          onClick={handleCheck}
          disabled={checking}
          className="gap-1.5 min-h-[44px] sm:min-h-9"
          title={t('balance.pendingPayments.checkStatus', 'Проверить статус')}
        >
          <RefreshIcon spinning={checking} className="h-4 w-4" />
          <span className="truncate">
            {checking
              ? t('balance.pendingPayments.checking', 'Проверка...')
              : t('balance.pendingPayments.checkStatus', 'Проверить')}
          </span>
        </Button>

        {/* Cancel Invoice (2-click confirm) */}
        <Button
          variant={confirmCancel ? 'destructive' : 'ghost'}
          size="sm"
          onClick={handleCancel}
          disabled={cancelling}
          className={cn(
            'col-span-2 sm:col-auto gap-1.5 text-xs transition-all duration-150 min-h-[44px] sm:min-h-9',
            confirmCancel
              ? 'bg-danger-500/20 text-danger-300 border border-danger-500/40 hover:bg-danger-500/30'
              : 'text-dark-400 hover:text-danger-400 hover:bg-danger-500/10',
          )}
          title={
            confirmCancel
              ? t('balance.pendingPayments.confirmCancel')
              : t('balance.pendingPayments.cancel')
          }
        >
          <TrashIcon className="h-3.5 w-3.5" />
          <span className="truncate">
            {cancelling
              ? t('balance.pendingPayments.cancelling', 'Отмена...')
              : confirmCancel
                ? t('balance.pendingPayments.confirmCancel', 'Точно?')
                : t('balance.pendingPayments.cancel', 'Отменить')}
          </span>
        </Button>
      </div>
    </Card>
  );
}
