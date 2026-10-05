import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

import { balanceApi } from '../api/balance';
import { useAuthStore } from '../store/auth';
import { useCurrency } from '../hooks/useCurrency';
import { useHaptic } from '@/platform';
import { Spinner } from '@/components/ui/Spinner';
import { AnimatedCheckmark } from '@/components/ui/AnimatedCheckmark';
import { AnimatedCrossmark } from '@/components/ui/AnimatedCrossmark';
import { loadTopUpPendingInfo, clearTopUpPendingInfo } from '../utils/topUpStorage';
import { isFailedStatus } from '../utils/paymentStatus';
import { resolvePaymentView } from '../utils/paymentResolution';
import {
  PAYMENT_MAX_POLL_MS,
  PAYMENT_POLL_INTERVAL_MS,
  usePaymentStatus,
  useRefreshOnPaymentChange,
} from '../hooks/usePaymentStatus';

// ── Sub-components ───────────────────────────────────────────

function AmountDisplay({ amountKopeks, label }: { amountKopeks: number; label: string }) {
  const { formatAmount, currencySymbol } = useCurrency();
  const amountRubles = amountKopeks / 100;

  return (
    <div className="card-inset mt-4 px-6 py-4">
      <p className="text-xs text-dark-400">{label}</p>
      <p className="mt-1 text-2xl font-bold text-dark-50">
        {formatAmount(amountRubles)} <span className="text-lg text-dark-400">{currencySymbol}</span>
      </p>
    </div>
  );
}

function PendingState({ amountKopeks }: { amountKopeks: number | null }) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center gap-6 text-center"
    >
      <Spinner className="h-16 w-16 border-[3px]" />
      <div>
        <h1 className="text-xl font-bold text-dark-50">
          {t('balance.topUpResult.awaitingPayment')}
        </h1>
        <p className="mt-2 text-sm text-dark-400">{t('balance.topUpResult.awaitingPaymentDesc')}</p>
      </div>
      {amountKopeks != null && amountKopeks > 0 && (
        <AmountDisplay amountKopeks={amountKopeks} label={t('balance.topUpResult.topUpAmount')} />
      )}
      <button
        type="button"
        onClick={() => navigate('/profile#top-up')}
        className="text-xs text-dark-400 underline hover:text-dark-200 transition-colors"
      >
        {t('balance.pendingPayments.viewInProfile', 'К счёту в профиле')}
      </button>
    </motion.div>
  );
}

function SuccessState({ amountKopeks }: { amountKopeks: number | null }) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleGoToBalance = useCallback(() => {
    navigate('/balance', { replace: true });
  }, [navigate]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center gap-6 text-center"
    >
      <AnimatedCheckmark />

      <div>
        <h1 className="text-xl font-bold text-dark-50">{t('balance.topUpResult.success')}</h1>
        <p className="mt-2 text-sm text-dark-400">{t('balance.topUpResult.successDesc')}</p>
      </div>

      {amountKopeks != null && amountKopeks > 0 && (
        <AmountDisplay amountKopeks={amountKopeks} label={t('balance.topUpResult.topUpAmount')} />
      )}

      <button
        type="button"
        onClick={handleGoToBalance}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent-500 px-6 py-3 text-sm font-medium text-on-accent transition-colors hover:bg-accent-400"
      >
        {t('balance.topUpResult.goToBalance')}
      </button>
    </motion.div>
  );
}

function FailedState({ amountKopeks }: { amountKopeks: number | null }) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleTryAgain = useCallback(() => {
    navigate('/balance', { replace: true });
  }, [navigate]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center gap-6 text-center"
    >
      <AnimatedCrossmark />

      <div>
        <h1 className="text-xl font-bold text-dark-50">{t('balance.topUpResult.failed')}</h1>
        <p className="mt-2 text-sm text-dark-400">{t('balance.topUpResult.failedDesc')}</p>
      </div>

      {amountKopeks != null && amountKopeks > 0 && (
        <AmountDisplay amountKopeks={amountKopeks} label={t('balance.topUpResult.topUpAmount')} />
      )}

      <button
        type="button"
        onClick={handleTryAgain}
        className="card-interactive flex w-full items-center justify-center gap-2 px-6 py-3 text-sm font-medium text-dark-200"
      >
        {t('balance.topUpResult.tryAgain')}
      </button>
    </motion.div>
  );
}

function VerifyingState({ amountKopeks }: { amountKopeks: number | null }) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center gap-6 text-center"
    >
      <Spinner className="h-16 w-16 border-[3px]" />
      <div>
        <h1 className="text-xl font-bold text-dark-50">{t('invoxy.payment.verifying')}</h1>
        <p className="mt-2 text-sm text-dark-400">{t('invoxy.payment.verifyingDesc')}</p>
      </div>
      {amountKopeks != null && amountKopeks > 0 && (
        <AmountDisplay amountKopeks={amountKopeks} label={t('balance.topUpResult.topUpAmount')} />
      )}
      <button
        type="button"
        onClick={() => navigate('/dashboard', { replace: true })}
        className="text-xs text-dark-400 underline hover:text-dark-200 transition-colors"
      >
        {t('invoxy.payment.toDashboard')}
      </button>
    </motion.div>
  );
}

function TimeoutState({ onRetry, onGoBack }: { onRetry: () => void; onGoBack: () => void }) {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center gap-6 text-center"
    >
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-dark-800/50">
        <svg
          className="h-10 w-10 text-dark-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <div>
        <h1 className="text-xl font-bold text-dark-50">{t('balance.topUpResult.timeout')}</h1>
        <p className="mt-2 text-sm text-dark-400">{t('balance.topUpResult.timeoutDesc')}</p>
      </div>
      <div className="flex w-full flex-col gap-3">
        <button
          type="button"
          onClick={onRetry}
          className="w-full rounded-xl bg-accent-500 px-6 py-3 text-sm font-medium text-on-accent transition-colors hover:bg-accent-400"
        >
          {t('common.retry')}
        </button>
        <button
          type="button"
          onClick={onGoBack}
          className="card-interactive w-full px-6 py-3 text-sm font-medium text-dark-200"
        >
          {t('balance.topUpResult.goToBalance')}
        </button>
      </div>
    </motion.div>
  );
}

// ── Main Component ───────────────────────────────────────────

export default function TopUpResult() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const refreshUser = useAuthStore((state) => state.refreshUser);
  const haptic = useHaptic();
  const hapticFiredRef = useRef(false);
  const cleanedUpRef = useRef(false);

  // Load saved payment info from sessionStorage (once on mount)
  const [pendingInfo] = useState(() => loadTopUpPendingInfo());

  // Fallback: read method for external-browser redirects where sessionStorage is unavailable.
  // Providers that reject query strings (Lava) return to /balance/top-up/result/<method>, so
  // accept the method from the path param too, not just ?method=.
  const { method: methodFromPath } = useParams<{ method?: string }>();
  const methodFromUrl = searchParams.get('method') || methodFromPath || null;

  // INVOXY: ?status=success is only a hint from the provider and arrives before the
  // webhook; the backend payment status stays the source of truth (polling continues).
  const redirectStatus =
    searchParams.get('status') ||
    searchParams.get('payment') ||
    (searchParams.get('success') === 'true' ? 'success' : null);
  const isRedirectFailed = redirectStatus ? isFailedStatus(redirectStatus) : false;

  const parsedPaymentId = pendingInfo?.payment_id ? parseInt(pendingInfo.payment_id, 10) : NaN;
  const hasStoredPayment = !!(pendingInfo?.method_id && !Number.isNaN(parsedPaymentId));
  const pollMethod = hasStoredPayment ? pendingInfo?.method_id : methodFromUrl;

  // Poll the stored payment by id, or the latest payment of the method from the URL.
  const tracked = usePaymentStatus({
    method: pollMethod,
    paymentId: hasStoredPayment ? parsedPaymentId : null,
    enabled: !isRedirectFailed,
    redirectStatus,
  });

  // No stored payment and no method: watch the user's pending payments list instead of
  // trusting the redirect (no split-brain between sessionStorage and the URL).
  const canPollActiveFromApi = !pollMethod && !isRedirectFailed;
  const [listTimedOut, setListTimedOut] = useState(false);
  useEffect(() => {
    if (!canPollActiveFromApi) return;
    const timer = window.setTimeout(() => setListTimedOut(true), PAYMENT_MAX_POLL_MS);
    return () => window.clearTimeout(timer);
  }, [canPollActiveFromApi]);
  const isActivePending = (p: { is_active?: boolean; is_paid?: boolean; status?: string }) =>
    Boolean(
      p.is_active ||
        (!p.is_paid &&
          !['canceled', 'cancelled', 'fail', 'failed', 'declined', 'expired'].includes(
            (p.status || '').toLowerCase(),
          )),
    );
  const { data: activePendingData, isLoading: isActivePendingLoading } = useQuery({
    queryKey: ['pendingPayments'],
    queryFn: () => balanceApi.getPendingPayments({ per_page: 5 }),
    enabled: canPollActiveFromApi && !listTimedOut,
    refetchInterval: (query) =>
      (query.state.data?.items ?? []).some(isActivePending) || redirectStatus
        ? PAYMENT_POLL_INTERVAL_MS
        : false,
    retry: 2,
  });
  const activePaymentFromApi = activePendingData?.items?.find(isActivePending);

  const effectivePayment = tracked.payment ?? activePaymentFromApi ?? null;
  const view = pollMethod
    ? tracked.view
    : resolvePaymentView({ payment: effectivePayment, redirectStatus, timedOut: listTimedOut });

  const handleRetryPoll = useCallback(() => {
    setListTimedOut(false);
    tracked.retry();
  }, [tracked]);

  const handleGoBack = useCallback(() => {
    clearTopUpPendingInfo();
    navigate('/balance', { replace: true });
  }, [navigate]);

  // Redirect to balance only if absolutely no data source available AND active pending query finished with nothing
  useEffect(() => {
    if (
      !pendingInfo &&
      !redirectStatus &&
      !methodFromUrl &&
      !isActivePendingLoading &&
      !activePaymentFromApi
    ) {
      navigate('/balance', { replace: true });
    }
  }, [
    pendingInfo,
    redirectStatus,
    methodFromUrl,
    isActivePendingLoading,
    activePaymentFromApi,
    navigate,
  ]);

  const amountKopeks = effectivePayment?.amount_kopeks ?? pendingInfo?.amount_kopeks ?? null;
  const resolvedPaid = view === 'paid';
  const resolvedFailed = view === 'failed';

  // Balance, transactions and subscriptions are refreshed on every status change and
  // again after 3 s and 10 s: crediting and the cart auto-purchase finish after the webhook.
  useRefreshOnPaymentChange(view, () => {
    queryClient.invalidateQueries({ queryKey: ['balance'] });
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
    queryClient.invalidateQueries({
      predicate: (query) =>
        Array.isArray(query.queryKey) &&
        typeof query.queryKey[0] === 'string' &&
        (query.queryKey[0] === 'subscription' || query.queryKey[0].startsWith('invoxy-')),
    });
    queryClient.invalidateQueries({ queryKey: ['subscriptions-list'] });
    queryClient.invalidateQueries({ queryKey: ['purchase-options'] });
    if (view === 'paid') void refreshUser();
  });

  // Clean up sessionStorage when payment resolves
  useEffect(() => {
    if (cleanedUpRef.current) return;
    if (resolvedPaid || resolvedFailed) {
      cleanedUpRef.current = true;
      clearTopUpPendingInfo();
    }
  }, [resolvedPaid, resolvedFailed]);

  // Haptic feedback on status resolution (fire once)
  useEffect(() => {
    if (hapticFiredRef.current) return;
    if (resolvedPaid) {
      hapticFiredRef.current = true;
      haptic.notification('success');
    } else if (resolvedFailed) {
      hapticFiredRef.current = true;
      haptic.notification('error');
    }
  }, [resolvedPaid, resolvedFailed, haptic]);

  return (
    <div className="flex min-h-dvh items-center justify-center px-4">
      <div
        className="glass-surface-elevated w-full max-w-md p-6 sm:p-8"
        aria-live="polite"
        aria-atomic="true"
      >
        {resolvedPaid ? (
          <SuccessState amountKopeks={amountKopeks} />
        ) : resolvedFailed ? (
          <FailedState amountKopeks={amountKopeks} />
        ) : view === 'timeout' ? (
          <TimeoutState onRetry={handleRetryPoll} onGoBack={handleGoBack} />
        ) : view === 'verifying' ? (
          <VerifyingState amountKopeks={amountKopeks} />
        ) : (
          <PendingState amountKopeks={amountKopeks} />
        )}
      </div>
    </div>
  );
}
