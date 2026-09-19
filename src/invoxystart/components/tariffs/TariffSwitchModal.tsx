import { useState } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { AxiosError } from 'axios';
import {
  ArrowRight,
  Check,
  CreditCard,
  type ShieldCheck,
  Sparkles,
} from '@/invoxystart/components/ui/RuneIcon';
import { AdaptiveDialog } from '@/invoxystart/components/ui/AdaptiveDialog';
import { subscriptionApi } from '@/invoxystart/api';
import { useToast } from '@/invoxystart/components/layout/ToastProvider';
import { usePayment } from '@/invoxystart/components/payments/PaymentFlow';

interface PlanPeriod {
  days: number;
  months: number;
  price: number;
  discount: number;
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  mainTraffic: number;
  lteTraffic: number | null;
  devices: number;
  devicePrice: number;
  icon: typeof ShieldCheck;
  recommended?: boolean;
  periods: PlanPeriod[];
}

interface TariffSwitchModalProps {
  open: boolean;
  plan: Plan;
  currentPlan?: Plan;
  subscriptionId?: number;
  onClose: () => void;
  onFallbackToPurchase: () => void;
  onTopUp: () => void;
}

function shouldUsePurchaseFlow(error: unknown): boolean {
  if (!(error instanceof AxiosError)) return false;
  const detail = error.response?.data?.detail as
    | { code?: string; error_code?: string; use_purchase_flow?: boolean }
    | undefined;
  if (!detail || typeof detail !== 'object') return false;
  const code = detail.code ?? detail.error_code;
  return (
    (code === 'subscription_expired' ||
      code === 'trial_cannot_switch' ||
      code === 'free_tariff_cannot_switch') &&
    detail.use_purchase_flow === true
  );
}

export function TariffSwitchModal({
  open,
  plan,
  currentPlan,
  subscriptionId,
  onClose,
  onFallbackToPurchase,
  onTopUp,
}: TariffSwitchModalProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { openPayment } = usePayment();

  const [switchMode, setSwitchMode] = useState<'convert_days' | 'prorate_cost'>('convert_days');
  const [switchResult, setSwitchResult] = useState<{
    new_tariff_name: string;
    balance_label: string;
    charged_kopeks: number;
    switch_mode?: string;
    converted_days?: number | null;
  } | null>(null);

  const tariffId = Number(plan.id);

  // Fetch switch preview calculation (смета)
  const {
    data: preview,
    isLoading: previewLoading,
    error: previewError,
    refetch,
  } = useQuery({
    queryKey: ['invoxy-tariff-switch-preview', tariffId, subscriptionId],
    queryFn: () => subscriptionApi.previewTariffSwitch(tariffId, subscriptionId),
    enabled: open && !isNaN(tariffId),
    staleTime: 10_000,
  });

  // Switch mutation
  const switchMutation = useMutation({
    mutationFn: (mode: 'prorate_cost' | 'convert_days') =>
      subscriptionApi.switchTariff(tariffId, subscriptionId, mode),
    onSuccess: (data) => {
      setSwitchResult({
        new_tariff_name: data.new_tariff_name || plan.name,
        balance_label: data.balance_label,
        charged_kopeks: data.charged_kopeks,
        switch_mode: data.switch_mode,
        converted_days: data.converted_days,
      });

      // Invalidate relevant queries
      void queryClient.invalidateQueries({ queryKey: ['invoxy-tariffs-page-data'] });
      void queryClient.invalidateQueries({ queryKey: ['invoxy-subscriptions'] });
      void queryClient.invalidateQueries({ queryKey: ['invoxy-subscription-details'] });
      void queryClient.invalidateQueries({ queryKey: ['invoxy-active-subscription'] });
      void queryClient.invalidateQueries({ queryKey: ['balance'] });
      void queryClient.invalidateQueries({ queryKey: ['user'] });

      showToast(`Тариф успешно изменён на ${data.new_tariff_name || plan.name}`, 'success');
    },
    onError: (err: unknown) => {
      if (shouldUsePurchaseFlow(err)) {
        onClose();
        onFallbackToPurchase();
        return;
      }
      const message =
        err instanceof AxiosError && typeof err.response?.data?.detail === 'string'
          ? err.response.data.detail
          : 'Не удалось сменить тариф. Проверьте баланс или обратитесь в поддержку.';
      showToast(message, 'error');
    },
  });

  const handleClose = () => {
    setSwitchResult(null);
    onClose();
  };

  const handleFinish = () => {
    setSwitchResult(null);
    onClose();
    navigate('/dashboard');
  };

  return (
    <AdaptiveDialog
      open={open}
      onClose={handleClose}
      titleId="tariff-switch-dialog-title"
      maxWidth="max-w-lg"
    >
      <AnimatePresence mode="wait" initial={false}>
        {/* SUCCESS STATE */}
        {switchResult ? (
          <m.div
            key="success"
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 24, stiffness: 350 }}
            className="flex flex-col items-center text-center pt-2 pb-1"
          >
            {/* Animated Celebration Icon */}
            <div className="relative mb-5 grid h-20 w-20 place-items-center rounded-full bg-mint/15 text-mint shadow-[0_0_36px_rgba(165,232,196,0.3)] ring-4 ring-mint/20">
              <m.div
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', damping: 14, stiffness: 300, delay: 0.1 }}
              >
                <Check size={36} strokeWidth={2.5} />
              </m.div>
              <div className="absolute -top-1 -right-1 text-mint">
                <Sparkles size={20} />
              </div>
            </div>

            <p className="text-[11px] font-bold uppercase tracking-[.14em] text-mint">
              СМЕНА ТАРИФА ВЫПОЛНЕНА
            </p>
            <h2
              id="tariff-switch-dialog-title"
              className="mt-1 text-2xl font-bold tracking-tight text-ink sm:text-3xl"
            >
              Тариф успешно изменён!
            </h2>
            <p className="mt-2 text-sm text-muted max-w-sm">
              Ваша подписка переведена на{' '}
              <strong className="text-ink font-semibold">{switchResult.new_tariff_name}</strong>.
            </p>

            {/* Summary details card */}
            <div className="mt-6 w-full rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-left space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted">Новый тариф</span>
                <span className="font-semibold text-mint">{switchResult.new_tariff_name}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted">Срок действия</span>
                <span className="font-medium text-ink">
                  {switchResult.switch_mode === 'convert_days'
                    ? `${switchResult.converted_days ?? preview?.converted_days ?? 0} дн. (пересчитан с комиссией 10%)`
                    : `${preview?.remaining_days ?? '—'} дн. (сохранён)`}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted">Списано</span>
                <span className="font-medium text-ink">
                  {switchResult.switch_mode === 'convert_days'
                    ? '0 ₽ (Бесплатно)'
                    : preview
                      ? preview.upgrade_cost_label
                      : `${switchResult.charged_kopeks / 100} ₽`}
                </span>
              </div>
              {switchResult.switch_mode !== 'convert_days' && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted">Остаток на балансе</span>
                  <span className="font-semibold text-ink">{switchResult.balance_label}</span>
                </div>
              )}
              <div className="border-t border-white/10 pt-3 flex items-center justify-between text-xs">
                <span className="text-muted">Лимиты тарифа</span>
                <span className="font-medium text-ink">
                  {plan.mainTraffic} ГБ {plan.lteTraffic ? `+ ${plan.lteTraffic} ГБ LTE` : ''} · до{' '}
                  {plan.devices} устр.
                </span>
              </div>
            </div>

            {/* Invariant badge */}
            <div className="mt-4 rounded-xl border border-mint/20 bg-mint/[0.06] p-3 text-left flex items-start gap-2.5">
              <Sparkles size={16} className="text-mint shrink-0 mt-0.5" />
              <p className="text-xs text-mint/90 leading-relaxed">
                Новые квоты трафика и устройств уже действуют. Повторная настройка ключа не
                требуется — подключение продолжит работать автоматически.
              </p>
            </div>

            <button
              type="button"
              onClick={handleFinish}
              className="mt-6 flex h-12 w-full items-center justify-center rounded-full bg-mint font-bold text-sm text-bg shadow-[0_4px_20px_rgba(165,232,196,0.3)] transition-all hover:brightness-105 active:scale-[0.98]"
            >
              Перейти в кабинет
            </button>
          </m.div>
        ) : (
          /* ESTIMATE / PREVIEW FLOW */
          <m.div
            key="estimate"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col"
          >
            <div className="pr-8">
              <p className="text-[10px] font-bold uppercase tracking-[.14em] text-mint">
                СМЕНА ТАРИФА
              </p>
              <h2
                id="tariff-switch-dialog-title"
                className="mt-1 text-xl font-bold tracking-tight text-ink sm:text-2xl"
              >
                Переход на {plan.name}
              </h2>
              <p className="mt-1 text-xs text-muted">
                Неиспользованные дни вашей подписки сохраняются и переносятся с перерасчётом
              </p>
            </div>

            {/* Loading state */}
            {previewLoading && (
              <div className="mt-6 space-y-4">
                <div className="h-28 animate-pulse rounded-2xl bg-white/[0.05]" />
                <div className="h-40 animate-pulse rounded-2xl bg-white/[0.05]" />
                <div className="h-12 animate-pulse rounded-full bg-white/[0.08]" />
              </div>
            )}

            {/* Fallback error if trial or expired */}
            {!previewLoading && previewError && (
              <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-center">
                {shouldUsePurchaseFlow(previewError) ? (
                  <>
                    <p className="text-sm font-semibold text-ink">
                      Для этой подписки требуется оформление тарифа
                    </p>
                    <p className="mt-1.5 text-xs text-muted leading-relaxed">
                      Триал-периоды и завершённые подписки не поддерживают частичный перерасчёт. Вы
                      можете оформить тариф как новую подписку.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onFallbackToPurchase();
                      }}
                      className="mt-5 flex h-11 w-full items-center justify-center rounded-full bg-mint text-xs font-bold text-bg active:scale-[0.98]"
                    >
                      Оформить тариф
                    </button>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-semibold text-rose-300">
                      Не удалось рассчитать смету перехода
                    </p>
                    <p className="mt-1.5 text-xs text-muted">
                      {previewError instanceof AxiosError &&
                      typeof previewError.response?.data?.detail === 'string'
                        ? previewError.response.data.detail
                        : 'Произошла ошибка при обращении к серверу.'}
                    </p>
                    <button
                      type="button"
                      onClick={() => void refetch()}
                      className="mt-4 inline-flex h-10 items-center justify-center rounded-xl bg-white/10 px-5 text-xs font-semibold text-ink hover:bg-white/15"
                    >
                      Попробовать снова
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Main Estimate Content */}
            {!previewLoading && preview && (
              <div className="mt-5 flex flex-col gap-4">
                {/* Visual Transition Card */}
                <div className="grid grid-cols-[1fr,auto,1fr] items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-3.5 sm:p-4">
                  {/* Current plan */}
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted">
                      Текущий
                    </span>
                    <span className="mt-0.5 truncate text-sm font-bold text-ink">
                      {preview.current_tariff_name || currentPlan?.name || 'Текущий план'}
                    </span>
                    <span className="mt-1 text-[11px] text-muted">
                      {currentPlan ? `${currentPlan.mainTraffic} ГБ` : '—'}
                      {currentPlan?.lteTraffic ? ` + ${currentPlan.lteTraffic} ГБ LTE` : ''}
                    </span>
                  </div>

                  {/* Transition arrow */}
                  <div className="grid h-8 w-8 place-items-center rounded-full bg-mint/15 text-mint">
                    <ArrowRight size={16} />
                  </div>

                  {/* New plan */}
                  <div className="flex flex-col text-right">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-mint">
                      Новый
                    </span>
                    <span className="mt-0.5 truncate text-sm font-bold text-ink">
                      {preview.new_tariff_name || plan.name}
                    </span>
                    <span className="mt-1 text-[11px] font-medium text-mint/90">
                      {plan.mainTraffic} ГБ {plan.lteTraffic ? `+ ${plan.lteTraffic} ГБ LTE` : ''}
                    </span>
                  </div>
                </div>

                {/* Switch Mode Selector (if can convert days and upgrade cost > 0) */}
                {preview.can_convert_days && preview.upgrade_cost_kopeks > 0 && (
                  <div className="grid grid-cols-2 gap-1.5 rounded-2xl bg-white/[0.05] p-1 border border-white/10">
                    <button
                      type="button"
                      onClick={() => setSwitchMode('convert_days')}
                      className={`flex flex-col items-center justify-center rounded-xl py-2 px-3 text-xs font-semibold transition-all cursor-pointer ${
                        switchMode === 'convert_days'
                          ? 'bg-mint text-bg shadow-sm'
                          : 'text-muted hover:text-ink'
                      }`}
                    >
                      <span>Конвертация дней</span>
                      <span
                        className={`text-[10px] ${
                          switchMode === 'convert_days' ? 'text-bg/85 font-bold' : 'text-mint'
                        }`}
                      >
                        Бесплатно · {preview.converted_days} дн.
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSwitchMode('prorate_cost')}
                      className={`flex flex-col items-center justify-center rounded-xl py-2 px-3 text-xs font-semibold transition-all cursor-pointer ${
                        switchMode === 'prorate_cost'
                          ? 'bg-mint text-bg shadow-sm'
                          : 'text-muted hover:text-ink'
                      }`}
                    >
                      <span>Доплата разницы</span>
                      <span
                        className={`text-[10px] ${
                          switchMode === 'prorate_cost' ? 'text-bg/85 font-bold' : 'text-muted'
                        }`}
                      >
                        {preview.upgrade_cost_label} · {preview.remaining_days} дн.
                      </span>
                    </button>
                  </div>
                )}

                {/* Estimate Breakdown (Смета) */}
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 divide-y divide-white/[0.07]">
                  <p className="pb-3 text-[11px] font-bold uppercase tracking-[.12em] text-muted">
                    {switchMode === 'convert_days' &&
                    preview.can_convert_days &&
                    preview.upgrade_cost_kopeks > 0
                      ? 'Смета конвертации дней'
                      : 'Смета расчёта перехода'}
                  </p>

                  {switchMode === 'convert_days' &&
                  preview.can_convert_days &&
                  preview.upgrade_cost_kopeks > 0 ? (
                    <>
                      <div className="py-2.5 flex items-center justify-between text-xs">
                        <span className="text-muted">Текущий остаток срока</span>
                        <span className="font-semibold text-ink">{preview.remaining_days} дн.</span>
                      </div>

                      <div className="py-2.5 flex items-center justify-between text-xs">
                        <span className="text-muted">Комиссия за конвертацию</span>
                        <span className="font-semibold text-rose-300">
                          -{preview.conversion_fee_percent ?? 10}%
                        </span>
                      </div>

                      <div className="py-2.5 flex items-center justify-between text-xs">
                        <span className="text-muted">Новый срок подписки</span>
                        <span className="font-bold text-mint text-sm">
                          {preview.converted_days} дн.
                        </span>
                      </div>

                      <div className="py-2.5 flex items-center justify-between text-xs">
                        <span className="text-muted">К оплате</span>
                        <span className="font-bold text-mint text-sm">0 ₽ (Бесплатно)</span>
                      </div>

                      <div className="pt-2 text-[11px] text-muted leading-relaxed">
                        Оставшиеся дни пересчитываются пропорционально стоимости тарифов с комиссией
                        10%. С баланса ничего не списывается.
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="py-2.5 flex items-center justify-between text-xs">
                        <span className="text-muted">Остаток срока подписки</span>
                        <span className="font-semibold text-ink">
                          {preview.remaining_days} дн.{' '}
                          <span className="font-normal text-muted">(переносится)</span>
                        </span>
                      </div>

                      <div className="py-2.5 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="text-muted">Стоимость перехода</span>
                          {preview.discount_percent && preview.discount_percent > 0 ? (
                            <span className="rounded-full bg-mint/20 px-1.5 py-0.5 text-[9px] font-bold text-mint">
                              -{preview.discount_percent}%
                            </span>
                          ) : null}
                        </div>
                        <div className="flex items-center gap-2">
                          {preview.discount_percent &&
                          preview.discount_percent > 0 &&
                          preview.base_upgrade_cost_kopeks &&
                          preview.base_upgrade_cost_kopeks > 0 ? (
                            <span className="text-[11px] text-muted line-through">
                              {(preview.base_upgrade_cost_kopeks / 100).toLocaleString('ru-RU')} ₽
                            </span>
                          ) : null}
                          <span
                            className={`font-bold ${
                              preview.upgrade_cost_kopeks === 0 ? 'text-mint' : 'text-ink text-sm'
                            }`}
                          >
                            {preview.upgrade_cost_kopeks === 0
                              ? 'Бесплатно'
                              : preview.upgrade_cost_label}
                          </span>
                        </div>
                      </div>

                      <div className="py-2.5 flex items-center justify-between text-xs">
                        <span className="text-muted">Ваш текущий баланс</span>
                        <span className="font-medium text-ink">{preview.balance_label}</span>
                      </div>

                      {/* Insufficient balance notice */}
                      {!preview.has_enough_balance && preview.upgrade_cost_kopeks > 0 && (
                        <div className="pt-3">
                          <div className="rounded-xl border border-rose-500/25 bg-rose-500/10 p-3 text-left">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-medium text-rose-200">
                                Не хватает для смены:
                              </span>
                              <span className="font-bold text-rose-300">
                                {preview.missing_amount_label}
                              </span>
                            </div>
                            <p className="mt-1 text-[11px] text-rose-300/80">
                              Пополните баланс на недостающую сумму или выберите бесплатную
                              конвертацию дней выше.
                            </p>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Action buttons */}
                {switchMode === 'convert_days' &&
                preview.can_convert_days &&
                preview.upgrade_cost_kopeks > 0 ? (
                  <button
                    type="button"
                    disabled={switchMutation.isPending}
                    onClick={() => switchMutation.mutate('convert_days')}
                    className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-mint text-sm font-bold text-bg shadow-[0_4px_20px_rgba(165,232,196,0.25)] transition-all hover:brightness-105 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                  >
                    {switchMutation.isPending ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-bg/30 border-t-bg" />
                        Смена тарифа...
                      </span>
                    ) : (
                      <>
                        <Sparkles size={16} />
                        Сменить бесплатно ({preview.converted_days} дн.)
                      </>
                    )}
                  </button>
                ) : !preview.has_enough_balance && preview.upgrade_cost_kopeks > 0 ? (
                  <div className="mt-2 flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const missingRub = Math.max(
                          10,
                          Math.ceil(preview.missing_amount_kopeks / 100),
                        );
                        openPayment({
                          amount: missingRub,
                          purpose: `Доплата за смену тарифа на ${preview.new_tariff_name || plan.name}`,
                          topUp: true,
                          onComplete: () => {
                            void refetch();
                          },
                        });
                      }}
                      className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-mint text-sm font-bold text-bg shadow-[0_4px_20px_rgba(165,232,196,0.25)] transition-all hover:brightness-105 active:scale-[0.98] cursor-pointer"
                    >
                      <CreditCard size={16} />
                      Оплатить {preview.missing_amount_label} через СБП / Карту
                    </button>

                    {preview.can_convert_days ? (
                      <button
                        type="button"
                        onClick={() => setSwitchMode('convert_days')}
                        className="flex items-center justify-center py-2 text-xs font-semibold text-mint hover:underline transition-colors cursor-pointer"
                      >
                        Или смените бесплатно через конвертацию дней ({preview.converted_days} дн.)
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onTopUp();
                        }}
                        className="flex items-center justify-center py-2 text-xs font-medium text-muted hover:text-ink transition-colors cursor-pointer"
                      >
                        Пополнить баланс в профиле
                      </button>
                    )}
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={switchMutation.isPending}
                    onClick={() => switchMutation.mutate('prorate_cost')}
                    className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-mint text-sm font-bold text-bg shadow-[0_4px_20px_rgba(165,232,196,0.25)] transition-all hover:brightness-105 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                  >
                    {switchMutation.isPending ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-bg/30 border-t-bg" />
                        Смена тарифа...
                      </span>
                    ) : (
                      <>
                        <Sparkles size={16} />
                        {preview.upgrade_cost_kopeks === 0
                          ? 'Сменить тариф бесплатно'
                          : `Сменить тариф за ${preview.upgrade_cost_label}`}
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
          </m.div>
        )}
      </AnimatePresence>
    </AdaptiveDialog>
  );
}
