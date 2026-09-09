import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useCurrency } from '../hooks/useCurrency';
import { InfoIcon, WalletIcon, PlusIcon } from '@/components/icons';

interface InsufficientBalancePromptProps {
  /** Amount missing in kopeks */
  missingAmountKopeks: number;
  /** Full tariff price in kopeks — charged in one payment, not a balance top-up */
  totalPriceKopeks?: number;
  /** Optional custom message */
  message?: string;
  /** Compact mode for inline use */
  compact?: boolean;
  /** Additional className */
  className?: string;
  /** Callback to execute before opening top-up modal (e.g., save cart) */
  onBeforeTopUp?: () => Promise<void>;
  /** Колбэк «Оплатить» — открывает платёжный шит на месте. Без него — легаси-редирект на пополнение. */
  onPay?: () => void;
  /** Show only the warning when the parent already renders the payment CTA. */
  hideActions?: boolean;
}

export default function InsufficientBalancePrompt({
  missingAmountKopeks,
  totalPriceKopeks,
  message,
  compact = false,
  className = '',
  onBeforeTopUp,
  onPay,
  hideActions = false,
}: InsufficientBalancePromptProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { formatAmount, currencySymbol } = useCurrency();
  const [isPreparingTopUp, setIsPreparingTopUp] = useState(false);

  const chargeKopeks =
    totalPriceKopeks && totalPriceKopeks > 0 ? totalPriceKopeks : missingAmountKopeks;
  const chargeRubles = chargeKopeks / 100;
  const displayAmount = formatAmount(chargeRubles);

  const goToPayment = async (amountRubles: number) => {
    if (onBeforeTopUp) {
      setIsPreparingTopUp(true);
      try {
        await onBeforeTopUp();
      } catch {
        // Still navigate — cart may already be saved by the 402 handler.
      } finally {
        setIsPreparingTopUp(false);
      }
    }
    const params = new URLSearchParams();
    params.set('amount', String(Math.ceil(amountRubles)));
    params.set('returnTo', location.pathname);
    params.set('direct', '1');
    navigate(`/balance/top-up?${params.toString()}`);
  };

  // onPay — прямой платёж шитом на месте; без него — легаси-редирект на пополнение.
  const handlePay = () => {
    if (onPay) {
      onPay();
      return;
    }
    void goToPayment(chargeRubles);
  };

  if (compact) {
    return (
      <div className={`alert-error flex items-center justify-between gap-3 ${className}`}>
        <div className="flex items-center gap-2 text-sm text-error-400">
          <InfoIcon className="h-4 w-4 flex-shrink-0" />
          <span>
            {message || t('balance.insufficientFunds')}:{' '}
            <span className="font-semibold">
              {displayAmount} {currencySymbol}
            </span>
          </span>
        </div>
        {!hideActions && (
          <button
            onClick={handlePay}
            disabled={isPreparingTopUp}
            className="btn-primary whitespace-nowrap px-3 py-1.5 text-xs"
          >
            {isPreparingTopUp ? (
              <span className="h-3 w-3 animate-spin rounded-full border border-white/30 border-t-white" />
            ) : (
              t('balance.payTariffDirect')
            )}
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className={`alert-error bg-gradient-to-br from-error-500/10 to-warning-500/5 p-4 ${className}`}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-error-500/20">
          <WalletIcon className="h-5 w-5 text-error-400" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1 font-medium text-error-400">{t('balance.insufficientFunds')}</div>
          <div className="text-sm text-dark-300">{message || t('balance.directPayHint')}</div>
          <div className="mt-3 flex items-center gap-3">
            <div className="text-lg font-bold text-dark-100">
              {t('balance.missing')}:{' '}
              <span className="text-error-400">
                {displayAmount} {currencySymbol}
              </span>
            </div>
          </div>
        </div>
      </div>
      {!hideActions && (
        <>
          <button
            onClick={handlePay}
            disabled={isPreparingTopUp}
            className="btn-primary mt-4 flex w-full items-center justify-center gap-2 py-2.5"
          >
            {isPreparingTopUp ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <>
                <PlusIcon className="h-5 w-5" />
                {t('balance.payNow', { amount: `${displayAmount} ${currencySymbol}` })}
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => navigate('/balance')}
            className="mt-2 w-full py-2 text-center text-sm text-dark-400 transition-colors hover:text-dark-200"
          >
            {t('balance.topUpLater')}
          </button>
        </>
      )}
    </div>
  );
}
