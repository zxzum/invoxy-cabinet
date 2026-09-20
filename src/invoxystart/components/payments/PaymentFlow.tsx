import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { usePlatform } from '@/platform';
import { openPaymentUrl } from '@/utils/openPaymentUrl';
import {
  Bot,
  CreditCard,
  Globe2,
  Landmark,
  Send,
  Sparkles,
  Wallet,
  Zap,
} from '@/invoxystart/components/ui/RuneIcon';
import { AdaptiveDialog } from '@/invoxystart/components/ui/AdaptiveDialog';
import { useToast } from '@/invoxystart/components/layout/ToastProvider';
import {
  ApiError,
  balanceApi,
  subscriptionApi,
  type Balance,
  type PaymentMethod,
} from '@/invoxystart/api';
import { ActiveInvoiceCard } from '@/invoxystart/components/dashboard/ActiveInvoiceCard';

export interface PaymentRequest {
  amount: number;
  purpose: string;
  allowBalance?: boolean;
  topUp?: boolean;
  tariffId?: number;
  periodDays?: number;
  subscriptionId?: number;
  trafficGb?: number;
  addonType?: 'devices' | 'traffic' | 'lte' | 'lte_reset';
  addonValue?: number;
  onComplete?: () => void;
}

type PayHandler = (methodId: string, paymentOption?: string) => void;

const PaymentContext = createContext<{
  openPayment: (request: PaymentRequest) => void;
  pay: (method: string, payment?: PaymentRequest, paymentOption?: string) => void;
  topUp: () => void;
} | null>(null);

export function PaymentProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { platform, openLink } = usePlatform();
  const queryClient = useQueryClient();
  const [request, setRequest] = useState<PaymentRequest | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  function openPayment(nextRequest: PaymentRequest) {
    setRequest(nextRequest);
    setOpen(true);
  }

  async function pay(method: string, payment = request ?? undefined, paymentOption?: string) {
    if (!payment || busy) return;
    setBusy(true);
    try {
      if (method === 'balance') {
        if (payment.addonType === 'devices') {
          await subscriptionApi.purchaseDevices(payment.addonValue ?? 1, payment.subscriptionId);
        } else if (payment.addonType === 'traffic' || payment.addonType === 'lte') {
          await subscriptionApi.purchaseTraffic(
            payment.addonValue ?? 0,
            payment.subscriptionId,
            payment.addonType === 'lte' ? 'whitelist' : 'regular',
          );
        } else if (payment.addonType === 'lte_reset') {
          await subscriptionApi.resetTraffic(payment.subscriptionId);
        } else if (payment.tariffId && payment.periodDays) {
          await subscriptionApi.purchaseTariff(
            payment.tariffId,
            payment.periodDays,
            payment.trafficGb,
            payment.subscriptionId,
          );
        } else if (payment.periodDays) {
          await subscriptionApi.renewSubscription(payment.periodDays, payment.subscriptionId);
        } else {
          throw new Error('Недостаточно данных для оплаты с баланса');
        }
        showToast('Оплачено с баланса');
        payment.onComplete?.();
        setOpen(false);
        return;
      }

      const result = payment.topUp
        ? await balanceApi.createTopUp(Math.round(payment.amount * 100), method, paymentOption)
        : payment.tariffId && payment.periodDays
          ? await subscriptionApi.createTariffInvoice({
              tariff_id: payment.tariffId,
              period_days: payment.periodDays,
              traffic_gb: payment.trafficGb,
              subscription_id: payment.subscriptionId,
              payment_method: method,
              payment_option: paymentOption,
            })
          : await createBalanceBackedPayment(payment, method, paymentOption);

      if (!result) {
        showToast('Оплачено с баланса');
        payment.onComplete?.();
        setOpen(false);
        return;
      }

      if (!result || !isExternalUrl(result.payment_url))
        throw new Error('Платёжная ссылка недоступна');
      const opened = openPaymentUrl(result.payment_url, platform, openLink);
      if (!opened) {
        window.location.assign(result.payment_url);
      }
      queryClient.invalidateQueries({ queryKey: ['active-invoice'] });
      queryClient.invalidateQueries({ queryKey: ['invoxy-balance'] });
      showToast('Перенаправляем на страницу оплаты…');
      setOpen(false);
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        showToast('У вас уже есть активный счёт. Оплатите или отмените его.');
      } else {
        showToast('Не удалось создать платёж');
      }
    } finally {
      setBusy(false);
    }
  }

  function topUp() {
    setOpen(false);
    navigate('/profile#top-up');
  }

  return (
    <PaymentContext.Provider value={{ openPayment, pay, topUp }}>
      {children}
      <PaymentDialog
        busy={busy}
        open={open}
        request={request}
        onClose={() => setOpen(false)}
        onPay={(method, option) => void pay(method, request ?? undefined, option)}
        onTopUp={topUp}
      />
    </PaymentContext.Provider>
  );
}

async function createBalanceBackedPayment(
  request: PaymentRequest,
  method: string,
  paymentOption?: string,
): Promise<{ payment_url: string } | null> {
  try {
    if (request.addonType === 'devices') {
      await subscriptionApi.purchaseDevices(request.addonValue ?? 1, request.subscriptionId);
    } else if (request.addonType === 'traffic' || request.addonType === 'lte') {
      await subscriptionApi.purchaseTraffic(
        request.addonValue ?? 0,
        request.subscriptionId,
        request.addonType === 'lte' ? 'whitelist' : 'regular',
      );
    } else if (request.addonType === 'lte_reset') {
      await subscriptionApi.resetTraffic(request.subscriptionId);
    } else if (request.periodDays) {
      await subscriptionApi.renewSubscription(request.periodDays, request.subscriptionId);
    } else {
      throw new Error('Недостаточно данных для оплаты');
    }
    return null;
  } catch (error) {
    const missingAmount = getMissingAmount(error);
    if (missingAmount == null) throw error;
    const result = await balanceApi.createTopUp(missingAmount, method, paymentOption);
    return { payment_url: result.payment_url };
  }
}

function getMissingAmount(error: unknown): number | null {
  if (
    !(error instanceof ApiError) ||
    error.status !== 402 ||
    !error.data ||
    typeof error.data !== 'object'
  )
    return null;
  const body = error.data as { detail?: unknown };
  const detail = body.detail;
  if (!detail || typeof detail !== 'object') return null;
  const values = detail as Record<string, unknown>;
  const amount = values.missing_amount ?? values.missing_kopeks;
  return typeof amount === 'number' && Number.isFinite(amount) && amount > 0
    ? Math.ceil(amount)
    : null;
}

export function usePayment() {
  const context = useContext(PaymentContext);
  if (!context) throw new Error('usePayment must be used inside PaymentProvider');
  return context;
}

function isExternalUrl(value: string | null | undefined): value is string {
  if (!value) return false;
  try {
    const url = new URL(value, window.location.origin);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

function PaymentDialog({
  open,
  request,
  busy,
  onClose,
  onPay,
  onTopUp,
}: {
  open: boolean;
  request: PaymentRequest | null;
  busy: boolean;
  onClose: () => void;
  onPay: PayHandler;
  onTopUp: () => void;
}) {
  return (
    <AdaptiveDialog open={open} onClose={onClose} titleId="payment-title" maxWidth="max-w-2xl">
      <div className="payment-dialog-heading lg:pr-12">
        <p className="text-[10px] font-bold tracking-[.15em] text-mint">ОПЛАТА</p>
        <h2 id="payment-title" className="mt-2 text-2xl font-medium">
          Выберите способ оплаты
        </h2>
      </div>
      <div className="form-step-enter mt-6">
        <ActiveInvoiceCard className="mb-4" />
        <div className="payment-dialog-item max-w-full overflow-hidden rounded-2xl bg-white/5 p-4 text-center">
          <p className="text-[10px] font-bold uppercase tracking-[.12em] text-muted">Назначение</p>
          <p className="mt-1 break-words text-sm font-medium">{request?.purpose}</p>
          <strong className="mt-3 block text-3xl font-medium">
            {request?.amount.toLocaleString('ru-RU')} ₽
          </strong>
        </div>
        {request && (
          <PaymentMethods busy={busy} request={request} onPay={onPay} onTopUp={onTopUp} />
        )}
      </div>
    </AdaptiveDialog>
  );
}

export function PaymentMethods({
  request,
  busy = false,
  onPay,
  onTopUp,
}: {
  request: PaymentRequest;
  busy?: boolean;
  onPay: PayHandler;
  onTopUp: () => void;
}) {
  const [balance, setBalance] = useState<Balance | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    void Promise.allSettled([balanceApi.getBalance(), balanceApi.getPaymentMethods()]).then(
      ([balanceResult, methodsResult]) => {
        if (!mounted) return;
        if (balanceResult.status === 'fulfilled') setBalance(balanceResult.value);
        if (methodsResult.status === 'fulfilled')
          setPaymentMethods(methodsResult.value.filter((method) => method.is_available));
        setLoading(false);
      },
    );
    return () => {
      mounted = false;
    };
  }, []);

  const canUseBalance = (balance?.balance_kopeks ?? 0) >= Math.round(request.amount * 100);
  const showBalance = request.allowBalance !== false && !request.topUp;

  return (
    <div className="payment-methods-stagger mt-4 grid min-w-0 gap-2">
      {showBalance && (
        <div
          className={`payment-method-item rounded-2xl border p-4 ${canUseBalance ? 'border-mint/60 bg-mint/[.12] shadow-[0_0_28px_rgba(165,232,196,.08)]' : 'border-amber-200/20 bg-amber-200/[.05]'}`}
        >
          <button
            type="button"
            disabled={!canUseBalance || busy}
            onClick={() => onPay('balance')}
            className="flex w-full items-center gap-3 text-left disabled:cursor-default"
          >
            <span
              className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${canUseBalance ? 'bg-mint text-bg' : 'glass-control text-muted'}`}
            >
              <Wallet size={18} />
            </span>
            <span className="min-w-0 flex-1">
              <strong className="text-sm">С баланса</strong>
              <span
                className={`mt-1 block text-xs ${canUseBalance ? 'text-mint' : 'text-amber-100/70'}`}
              >
                {canUseBalance ? 'Средств достаточно' : 'Нужно пополнить баланс'}
              </span>
            </span>
            <strong className="shrink-0 text-sm">
              {balance ? `${balance.balance_rubles.toLocaleString('ru-RU')} ₽` : '—'}
            </strong>
          </button>
          {!canUseBalance && (
            <button
              type="button"
              onClick={onTopUp}
              className="mt-3 h-10 w-full rounded-full bg-ink text-xs font-bold text-bg"
            >
              Пополнить баланс
            </button>
          )}
        </div>
      )}
      {loading ? (
        <p className="payment-method-item rounded-2xl bg-white/[.035] p-4 text-center text-xs text-muted">
          Загрузка способов оплаты…
        </p>
      ) : (
        paymentMethods.map((method) => {
          const isRollyPay = method.id.toLowerCase() === 'rollypay';
          const options =
            method.options && method.options.length > 0
              ? method.options
              : isRollyPay
                ? [
                    {
                      id: 'sbp',
                      name: 'СБП',
                      description: 'Система быстрых платежей (0% комиссии)',
                    },
                    { id: 'card', name: 'Карты РФ', description: 'МИР, Visa, Mastercard' },
                  ]
                : [];
          if (options.length > 0) {
            return (
              <div
                key={method.id}
                className="payment-method-item rounded-2xl border border-white/8 bg-white/[.035] p-3.5"
              >
                <div className="flex items-center gap-3 px-1">
                  <span className="glass-control grid h-10 w-10 place-items-center rounded-xl text-mint">
                    <Landmark size={18} />
                  </span>
                  <span>
                    <strong className="text-sm">{method.name}</strong>
                    <span className="mt-0.5 block text-[11px] text-muted">
                      {method.description || 'Банковские платежи и переводы'}
                    </span>
                  </span>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {options.map((option) => {
                    const isSbp =
                      option.id.toLowerCase().includes('sbp') ||
                      option.name.toLowerCase().includes('сбп');
                    const isCard =
                      option.id.toLowerCase().includes('card') ||
                      option.name.toLowerCase().includes('карт') ||
                      option.name.toLowerCase().includes('рф');

                    return (
                      <button
                        type="button"
                        disabled={busy}
                        key={option.id}
                        onClick={() => onPay(method.id, option.id)}
                        className={`button-lift flex min-w-0 items-center gap-2.5 rounded-xl p-3 text-left transition-all disabled:opacity-50 ${
                          isSbp
                            ? 'border border-mint/45 bg-mint/[.09] shadow-[0_0_20px_rgba(165,232,196,.08)] hover:border-mint hover:bg-mint/[.16]'
                            : isCard
                              ? 'border border-sky-400/40 bg-sky-500/[.08] shadow-[0_0_20px_rgba(56,189,248,.08)] hover:border-sky-400 hover:bg-sky-500/[.15]'
                              : 'glass-control hover:border-mint/35'
                        }`}
                      >
                        <span
                          className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${
                            isSbp
                              ? 'bg-mint/20 text-mint'
                              : isCard
                                ? 'bg-sky-400/20 text-sky-300'
                                : 'bg-white/5 text-mint'
                          }`}
                        >
                          {isSbp ? <Zap size={16} /> : <CreditCard size={16} />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-1.5">
                            <strong className="block truncate text-xs">{option.name}</strong>
                            {isSbp && (
                              <span className="rounded bg-mint/25 px-1.5 py-0.5 text-[9px] font-bold text-mint">
                                0%
                              </span>
                            )}
                            {isCard && (
                              <span className="rounded bg-sky-400/25 px-1.5 py-0.5 text-[9px] font-bold text-sky-300">
                                РФ
                              </span>
                            )}
                          </span>
                          <span className="mt-0.5 block text-[10px] text-muted">
                            {option.description || `Оплата через ${method.name}`}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          }

          return <PaymentMethodButton key={method.id} method={method} busy={busy} onPay={onPay} />;
        })
      )}
      {!loading && paymentMethods.length === 0 && (
        <p className="payment-method-item rounded-2xl bg-white/[.035] p-4 text-center text-xs text-muted">
          Способы оплаты недоступны
        </p>
      )}
    </div>
  );
}

function PaymentMethodButton({
  method,
  busy,
  onPay,
}: {
  method: PaymentMethod;
  busy: boolean;
  onPay: PayHandler;
}) {
  const icon = method.id.toLowerCase().includes('crypto')
    ? Bot
    : method.id.toLowerCase().includes('star')
      ? Sparkles
      : method.id.toLowerCase().includes('card')
        ? CreditCard
        : method.id.toLowerCase().includes('bank') || method.id.toLowerCase().includes('sbp')
          ? Landmark
          : method.id.toLowerCase().includes('international')
            ? Globe2
            : Send;
  const Icon = icon;
  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => onPay(method.id, method.options?.[0]?.id)}
      className="payment-method-item button-lift group flex min-w-0 items-center gap-3 rounded-2xl border border-white/8 bg-white/[.035] p-4 text-left transition-colors hover:border-mint/40 hover:bg-mint/[.08] disabled:opacity-50"
    >
      <span className="glass-control grid h-11 w-11 shrink-0 place-items-center rounded-full text-mint">
        <Icon size={18} />
      </span>
      <span className="min-w-0 flex-1">
        <strong className="block truncate text-sm">{method.name}</strong>
        <span className="mt-1 block truncate text-xs text-muted">
          {method.description || 'Онлайн-оплата'}
        </span>
      </span>
    </button>
  );
}
