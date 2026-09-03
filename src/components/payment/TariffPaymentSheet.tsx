import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { AxiosError } from 'axios';
import { balanceApi } from '@/api/balance';
import { subscriptionApi } from '@/api/subscription';
import type { PaymentMethod } from '@/types';
import { ResponsiveSheet } from '@/components/ui/ResponsiveSheet';
import { usePlatform } from '@/platform';
import { openPaymentUrl } from '@/utils/openPaymentUrl';
import { getErrorMessage } from '@/utils/subscriptionHelpers';
import { AnimatedNumber, staggerEntrance, SuccessBurst } from '@/components/motion';
import { useCurrency } from '@/hooks/useCurrency';

// ──────────────────────────────────────────────────────────────────
// TariffPaymentSheet
//
// Прямая оплата тарифа без редиректа на пополнение баланса: бэк
// (purchase-tariff/invoice) вычитает баланс из цены и выставляет
// платёж только на разницу. Состояния:
//   methods  — выбор способа оплаты (только доступные)
//   creating — создание invoice
//   waiting  — ссылка открыта, поллим getLatestPayment + getBalance
//   success  — SuccessBurst, затем onPaid (родитель уходит на подписку)
// ──────────────────────────────────────────────────────────────────

interface TariffPaymentSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tariffId: number;
  tariffName: string;
  periodDays: number;
  trafficGb?: number;
  subscriptionId?: number;
  /** Полная цена тарифа (kopeks) — цель корзины. */
  priceKopeks: number;
  /** Баланс на момент открытия (kopeks). */
  balanceKopeks: number;
  /** Вызывается после успеха: родитель инвалидирует кэш и уходит на подписку. */
  onPaid: () => void;
}

type Stage = 'methods' | 'creating' | 'waiting' | 'success';

interface CreatedInvoice {
  method: string;
  paymentUrl: string;
  priceKopeks: number;
}

const POLL_INTERVAL_MS = 3000;

// Бэк (purchase-tariff/invoice) на 400 кладёт в detail структурированный dict:
// { code: 'balance_sufficient', message, price_kopeks, balance_kopeks } —
// значит баланс уже дотянулся до цены и платить карточкой не нужно.
const isBalanceSufficientError = (error: unknown): boolean =>
  error instanceof AxiosError &&
  (error.response?.data as { detail?: { code?: string } } | undefined)?.detail?.code ===
    'balance_sufficient';

export function TariffPaymentSheet({
  open,
  onOpenChange,
  tariffId,
  tariffName,
  periodDays,
  trafficGb,
  subscriptionId,
  priceKopeks,
  balanceKopeks,
  onPaid,
}: TariffPaymentSheetProps) {
  const { t } = useTranslation();
  const { formatAmount, currencySymbol } = useCurrency();
  const { platform, openLink } = usePlatform();
  const queryClient = useQueryClient();

  const [methods, setMethods] = useState<PaymentMethod[] | null>(null);
  const [stage, setStage] = useState<Stage>('methods');
  const [invoice, setInvoice] = useState<CreatedInvoice | null>(null);
  const [error, setError] = useState<string | null>(null);
  const paidRef = useRef(false);
  // «Жив» ли шит: синхронно гасится в обёртке onClose, чтобы асинхронные
  // колбэки (await invoice) не продолжали работу после закрытия/размонтирования.
  const aliveRef = useRef(open);

  const formatPrice = (kopeks: number) => `${formatAmount(kopeks / 100)} ${currencySymbol}`;
  const missing = Math.max(0, priceKopeks - balanceKopeks);

  // При каждом открытии — сброс состояния и свежий список методов.
  useEffect(() => {
    if (!open) return;
    aliveRef.current = true;
    setStage('methods');
    setInvoice(null);
    setError(null);
    paidRef.current = false;
    let cancelled = false;
    balanceApi
      .getPaymentMethods()
      .then((list) => {
        if (!cancelled) setMethods(list.filter((m) => m.is_available));
      })
      .catch(() => {
        if (!cancelled) setError(t('payment.tariffSheet.methodsError'));
      });
    return () => {
      cancelled = true;
    };
  }, [open, t]);

  // Поллинг: провайдер отметил оплату ИЛИ баланс дотянулся до цены
  // (вебхук зачислил — корзина активирует тариф на бэке независимо от UI).
  // Шит закрыт — поллинг не стартует: иначе запросы молотили бы бесконечно,
  // а поздний onPaid увёл бы юзера со страницы без предупреждения.
  useEffect(() => {
    if (stage !== 'waiting' || !invoice || !open) return;
    let cancelled = false;
    const tick = async () => {
      try {
        const [latest, balance] = await Promise.all([
          balanceApi.getLatestPayment(invoice.method).catch(() => null),
          balanceApi.getBalance().catch(() => null),
        ]);
        if (cancelled || !aliveRef.current || paidRef.current) return;
        const paidByProvider = latest?.is_paid === true;
        const paidByBalance = balance ? balance.balance_kopeks >= invoice.priceKopeks : false;
        if (paidByProvider || paidByBalance) {
          paidRef.current = true;
          setStage('success');
          queryClient.invalidateQueries({ queryKey: ['subscription'] });
          queryClient.invalidateQueries({ queryKey: ['subscriptions-list'] });
          queryClient.invalidateQueries({ queryKey: ['balance'] });
          queryClient.invalidateQueries({ queryKey: ['purchase-options'] });
        }
      } catch {
        // следующий тик повторит
      }
    };
    const timer = window.setInterval(tick, POLL_INTERVAL_MS);
    tick();
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [stage, invoice, open, queryClient]);

  // Успех: короткая пауза на анимацию галки — и уходим к подписке.
  useEffect(() => {
    if (stage !== 'success') return;
    const timer = window.setTimeout(onPaid, 1600);
    return () => window.clearTimeout(timer);
  }, [stage, onPaid]);

  const payWithMethod = async (method: PaymentMethod) => {
    setError(null);
    setStage('creating');
    try {
      const result = await subscriptionApi.createTariffInvoice({
        tariff_id: tariffId,
        period_days: periodDays,
        traffic_gb: trafficGb,
        subscription_id: subscriptionId,
        payment_method: method.id,
      });
      // Шит могли закрыть, пока invoice создавался: инвойс на бэке уже есть
      // (юзер оплатит из корзины/истории), но редирект без его ведома — нельзя.
      if (!aliveRef.current) return;
      setInvoice({
        method: method.id,
        paymentUrl: result.payment_url,
        // Авторитетная цена корзины с бэка — по ней сверяем баланс в поллинге.
        priceKopeks: result.price_kopeks,
      });
      setStage('waiting');
      openPaymentUrl(result.payment_url, platform, openLink);
    } catch (error) {
      // Бэк присылает машинно-читаемые ошибки (dict в detail: balance_sufficient,
      // min amount, «only available through the bot») — показываем их текст юзеру,
      // глухой fallback только если хелпер ничего не извлёк.
      if (isBalanceSufficientError(error)) {
        // Баланс уже покрывает цену: обновляем кэш, stage остаётся methods —
        // после обновления balanceKopeks кнопка сама станет «Купить».
        queryClient.invalidateQueries({ queryKey: ['balance'] });
        queryClient.invalidateQueries({ queryKey: ['purchase-options'] });
        setError(t('payment.tariffSheet.balanceSufficient'));
      } else {
        setError(getErrorMessage(error) || t('payment.tariffSheet.invoiceError'));
      }
      setStage('methods');
    }
  };

  const title =
    stage === 'success'
      ? t('payment.tariffSheet.successTitle')
      : t('payment.tariffSheet.title', { tariff: tariffName });

  return (
    <ResponsiveSheet
      isOpen={open}
      onClose={() => {
        aliveRef.current = false;
        onOpenChange(false);
      }}
      title={title}
    >
      {stage === 'success' ? (
        <div className="flex flex-col items-center gap-4 px-4 pb-10 pt-2">
          <SuccessBurst size={72} />
          <p className="text-sm text-dark-300">{t('payment.tariffSheet.successText')}</p>
        </div>
      ) : (
        <div className="px-1 pb-4">
          {/* Сводка: что спишется с баланса и что доплачиваем */}
          <div className="mb-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <div className="flex items-center justify-between text-sm text-dark-300">
              <span>{t('payment.tariffSheet.fromBalance')}</span>
              <AnimatedNumber
                value={Math.min(balanceKopeks, priceKopeks) / 100}
                format={(v) => `${v.toFixed(2)} ${currencySymbol}`}
              />
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-sm text-dark-300">{t('payment.tariffSheet.dueNow')}</span>
              <span className="text-lg font-bold text-accent-400">
                <AnimatedNumber
                  value={missing / 100}
                  format={(v) => `${v.toFixed(2)} ${currencySymbol}`}
                />
              </span>
            </div>
          </div>

          {stage === 'waiting' && invoice ? (
            <div className="flex flex-col items-center gap-3 py-6">
              <span className="h-8 w-8 animate-spin rounded-full border-2 border-accent-500/30 border-t-accent-400" />
              <p className="text-sm text-dark-200">{t('payment.tariffSheet.waiting')}</p>
              <button
                type="button"
                onClick={() => openPaymentUrl(invoice.paymentUrl, platform, openLink)}
                className="btn-secondary px-4 py-2 text-sm"
              >
                {t('payment.tariffSheet.reopen')}
              </button>
            </div>
          ) : (
            <>
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-white/40">
                {t('payment.tariffSheet.chooseMethod')}
              </div>
              <div className="flex flex-col gap-1.5">
                {(methods ?? []).map((method, index) => (
                  <motion.button
                    key={method.id}
                    type="button"
                    disabled={stage === 'creating'}
                    onClick={() => payWithMethod(method)}
                    whileTap={{ scale: 0.98 }}
                    {...staggerEntrance(index, 0.02, 0.04)}
                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3.5 text-sm text-dark-100 transition-colors hover:border-accent-500/40 hover:bg-accent-500/10 disabled:opacity-50"
                  >
                    <span>{method.name}</span>
                    <span className="text-xs text-dark-500">{formatPrice(missing)}</span>
                  </motion.button>
                ))}
                {methods === null && !error && (
                  <div className="flex justify-center py-6">
                    <span className="h-6 w-6 animate-spin rounded-full border-2 border-accent-500/30 border-t-accent-400" />
                  </div>
                )}
                {methods !== null && methods.length === 0 && (
                  <p className="py-6 text-center text-sm text-dark-400">
                    {t('payment.tariffSheet.methodsEmpty')}
                  </p>
                )}
              </div>
            </>
          )}

          {error && <p className="mt-3 text-center text-sm text-error-400">{error}</p>}
        </div>
      )}
    </ResponsiveSheet>
  );
}
