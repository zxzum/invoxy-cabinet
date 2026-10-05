import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, m } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  ChevronRight,
  Globe2,
  Minus,
  Plus,
  ShieldCheck,
  Smartphone,
  Sparkles,
} from '@/invoxystart/components/ui/RuneIcon';
import { PageHeader } from '@/invoxystart/components/layout/PageHeader';
import { AdaptiveDialog } from '@/invoxystart/components/ui/AdaptiveDialog';
import { PaymentMethods, usePayment } from '@/invoxystart/components/payments/PaymentFlow';
import type { LoyaltyTiersResponse, TrialInfo } from '@/invoxystart/api';
import { AddonsCard } from '@/invoxystart/components/dashboard/AddonsCard';
import { useNavigate, useSearchParams } from 'react-router';
import { promoApi, subscriptionApi } from '@/invoxystart/api';
import { TariffSwitchModal } from '@/invoxystart/components/tariffs/TariffSwitchModal';
import { useToast } from '@/invoxystart/components/layout/ToastProvider';
import { adaptPlan, configuratorTotal, orderPlans, type Plan } from '@/invoxystart/lib/tariffPlans';
import { usePurchaseIntent } from '@/invoxystart/lib/usePurchaseIntent';

const formatRubles = (value: number) => `${value.toLocaleString('ru-RU')} ₽`;
const planIcon = (plan: Plan) => (plan.lteTraffic ? Globe2 : ShieldCheck);

export default function TariffsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();
  const [intent, clearIntent] = usePurchaseIntent();
  const addingSubscription = searchParams.get('mode') === 'add';
  const { pay, topUp } = usePayment();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [tariffStep, setTariffStep] = useState<'options' | 'payment'>('options');
  const [months, setMonths] = useState(1);
  const [devices, setDevices] = useState(5);
  const [switchPlan, setSwitchPlan] = useState<Plan | null>(null);
  const [switchModalOpen, setSwitchModalOpen] = useState(false);
  const [activatingTrial, setActivatingTrial] = useState(false);

  const { data: tariffsData, isLoading: tariffsLoading } = useQuery({
    queryKey: ['invoxy-tariffs-page-data'],
    queryFn: async () => {
      const [optionsResult, subscriptionsResult, loyaltyResult] = await Promise.allSettled([
        subscriptionApi.getPurchaseOptions(),
        subscriptionApi.getSubscriptions(),
        promoApi.getLoyaltyTiers(),
      ]);
      const optionsVal =
        optionsResult.status === 'fulfilled'
          ? (optionsResult.value as {
              tariffs?: Array<Record<string, unknown>>;
              current_tariff_id?: number | null;
            })
          : null;
      const nextPlans = (optionsVal?.tariffs || [])
        .map(adaptPlan)
        .filter((plan) => plan.periods.length);
      const subscriptions =
        subscriptionsResult.status === 'fulfilled' ? subscriptionsResult.value.subscriptions : [];
      const currentTariffId = optionsVal?.current_tariff_id ?? subscriptions[0]?.tariff_id ?? null;
      const activeSubscription =
        subscriptions.find(
          (subscription) => subscription.id && subscription.tariff_id === currentTariffId,
        ) ?? subscriptions[0];
      const loyalty = loyaltyResult.status === 'fulfilled' ? loyaltyResult.value : null;

      return {
        plans: nextPlans,
        activeId: currentTariffId == null ? null : String(currentTariffId),
        activeSubscriptionId: activeSubscription?.id ?? null,
        activeSubscription: activeSubscription ?? null,
        hasSubscriptions: subscriptions.length > 0,
        loyalty,
      };
    },
    staleTime: 60_000,
  });

  const hasSubscriptions = tariffsData?.hasSubscriptions ?? true;
  const { data: trialInfo } = useQuery<TrialInfo | null>({
    queryKey: ['invoxy-trial-info'],
    queryFn: () => subscriptionApi.getTrialInfo().catch(() => null),
    enabled: Boolean(tariffsData) && !hasSubscriptions,
    staleTime: 60_000,
  });

  const activeId = tariffsData?.activeId ?? null;
  const plans = orderPlans(tariffsData?.plans ?? [], activeId);
  const activeSubscriptionId = tariffsData?.activeSubscriptionId ?? null;
  const activeSubscription = tariffsData?.activeSubscription ?? null;
  const activePlan = plans.find((plan) => plan.id === activeId);
  const loading = tariffsLoading && !tariffsData;

  const selected = plans.find((plan) => plan.id === selectedId);
  const selectedPeriod =
    selected?.periods.find((period) => period.months === months) ?? selected?.periods[0];
  const totals =
    selected && selectedPeriod ? configuratorTotal(selected, selectedPeriod, devices) : null;

  function selectPlan(id: string, periodDays?: number | null) {
    if (selectedId === id && dialogOpen) {
      setDialogOpen(false);
      return;
    }
    const targetPlan = plans.find((plan) => plan.id === id);
    if (!targetPlan) return;
    // Для текущего тарифа предлагаем сохранить нынешний лимит устройств, но не
    // выше максимума тарифа: devices — итоговый лимит после оплаты.
    const currentDevices =
      targetPlan.id === activeId ? targetPlan.devices + targetPlan.extraDevicesCount : 0;
    const initialDevices = Math.max(
      targetPlan.devices,
      Math.min(targetPlan.maxDevices, currentDevices),
    );
    const initialPeriod =
      targetPlan.periods.find((period) => period.days === periodDays) ??
      targetPlan.periods.find((period) => period.days === 30) ??
      targetPlan.periods[0];
    setSelectedId(id);
    setDevices(initialDevices);
    setMonths(initialPeriod?.months ?? 1);
    setTariffStep('options');
    setDialogOpen(true);
  }

  function openPlan(plan: Plan, periodDays?: number | null) {
    if (activeId && !addingSubscription && plan.id !== activeId) {
      setSwitchPlan(plan);
      setSwitchModalOpen(true);
    } else {
      selectPlan(plan.id, periodDays);
    }
  }

  // Переход с предвыбранным тарифом (?plan=…&period=…) открывает его настройку.
  const intentHandled = useRef(false);
  useEffect(() => {
    if (!intent || intentHandled.current || plans.length === 0) return;
    const target =
      intent.plan === 'recommended'
        ? (plans.find((plan) => plan.recommended) ?? plans[0])
        : plans.find((plan) => plan.id === intent.plan);
    intentHandled.current = true;
    if (target) openPlan(target, intent.periodDays);
  });
  // URL чистим только после закрытия: смена search перемонтирует страницу
  // (ключ маршрута в AppShell), и открытая настройка пропала бы.
  const closeAndClearIntent = () => {
    if (intent) clearIntent();
  };

  async function activateTrial() {
    setActivatingTrial(true);
    try {
      await subscriptionApi.activateTrial();
      showToast(t('invoxy.start.trialActivated'), 'success');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['invoxy-subscriptions'] }),
        queryClient.invalidateQueries({ queryKey: ['invoxy-trial-info'] }),
      ]);
      navigate('/dashboard');
    } catch {
      showToast(t('invoxy.start.trialFailed'), 'error');
    } finally {
      setActivatingTrial(false);
    }
  }

  return (
    <div className="flex flex-col gap-5 pb-28 lg:gap-6 lg:pb-0">
      <PageHeader title={t('invoxy.tariffs.title')} subtitle={t('invoxy.tariffs.subtitle')} />
      {addingSubscription && (
        <section className="glass-panel rounded-[22px] border border-mint/25 bg-mint/[.06] px-5 py-4">
          <p className="text-sm font-bold text-mint">{t('invoxy.tariffs.addTitle')}</p>
          <p className="mt-1 text-xs text-muted">{t('invoxy.tariffs.addSubtitle')}</p>
        </section>
      )}

      {trialInfo?.is_available && !hasSubscriptions && (
        <section className="glass-panel flex flex-col gap-3 rounded-[22px] border border-mint/30 bg-mint/[.06] p-4 sm:flex-row sm:items-center">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-mint/15 text-mint">
            <Sparkles size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-ink">
              {t('invoxy.start.tryFree', { count: trialInfo.duration_days })}
            </p>
            <p className="mt-0.5 text-xs text-muted">{t('invoxy.tariffs.trialHint')}</p>
          </div>
          <button
            type="button"
            disabled={activatingTrial}
            onClick={() => void activateTrial()}
            className="button-lift h-11 shrink-0 rounded-full border border-mint/50 px-5 text-sm font-bold text-mint disabled:opacity-60"
          >
            {activatingTrial ? t('invoxy.start.activating') : t('invoxy.tariffs.activateTrial')}
          </button>
        </section>
      )}

      {loading && (
        <div
          className="glass-panel h-32 animate-pulse rounded-[28px]"
          aria-label={t('invoxy.tariffs.loading')}
        />
      )}

      <div className="motion-grid grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {plans.map((plan) => {
          const Icon = planIcon(plan);
          const active = plan.id === activeId;
          const expanded = plan.id === selectedId && dialogOpen;
          // Одна primary-кнопка на экране: «Продлить» у текущего тарифа, а без
          // подписки — «Выбрать» у рекомендованного.
          const primary = active || (!activeId && plan.recommended);
          return (
            <article
              key={plan.id}
              className={`glass-panel motion-card relative overflow-hidden rounded-[24px] p-4 sm:p-5 ${
                active
                  ? 'border-mint/60 shadow-[0_0_34px_rgba(165,232,196,.1)]'
                  : plan.recommended
                    ? 'border-mint/35'
                    : ''
              } ${expanded ? 'ring-1 ring-mint/70' : ''}`}
            >
              <div className="flex items-start gap-3">
                <div className="glass-control flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-mint">
                  <Icon size={20} strokeWidth={1.6} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <h2 className="text-lg font-medium leading-tight tracking-[-0.03em]">
                      {plan.name}
                    </h2>
                    {active ? (
                      <span className="rounded-full bg-mint px-2 py-0.5 text-[10px] font-bold text-bg">
                        {t('invoxy.tariffs.yourPlan')}
                      </span>
                    ) : plan.recommended ? (
                      <span className="rounded-full border border-mint/45 px-2 py-0.5 text-[10px] font-bold text-mint">
                        {t('invoxy.tariffs.recommended')}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-2xl font-light tracking-[-0.04em]">
                    {formatRubles(plan.price)}
                    <span className="ml-1 text-xs text-muted">{t('invoxy.tariffs.perMonth')}</span>
                  </p>
                </div>
              </div>

              <ul className="mt-3 flex flex-wrap gap-1.5 text-xs">
                <li className="rounded-full bg-white/[.06] px-2.5 py-1.5 text-ink">
                  {t('invoxy.tariffs.traffic', { count: plan.mainTraffic })}
                </li>
                <li
                  className={`rounded-full px-2.5 py-1.5 ${plan.lteTraffic ? 'bg-mint/12 text-mint' : 'bg-white/[.04] text-muted'}`}
                >
                  {plan.lteTraffic
                    ? t('invoxy.tariffs.lte', { count: plan.lteTraffic })
                    : t('invoxy.tariffs.noLte')}
                </li>
                <li className="flex items-center gap-1 rounded-full bg-white/[.06] px-2.5 py-1.5 text-ink">
                  <Smartphone size={12} className="text-mint" />
                  {t('invoxy.tariffs.devices', { count: plan.devices })}
                </li>
              </ul>

              {active && plan.extraDevicesCount > 0 && (
                <p className="mt-2.5 text-xs text-amber-200">
                  {t('invoxy.tariffs.extraDevicesNote', {
                    count: plan.extraDevicesCount,
                    cost: formatRubles(plan.extraDevicesCount * plan.devicePrice),
                  })}
                </p>
              )}

              <button
                type="button"
                aria-expanded={expanded}
                onClick={() => openPlan(plan)}
                className={`button-lift mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-full text-sm font-bold active:scale-[.98] ${
                  primary ? 'bg-mint text-bg' : 'glass-control text-ink'
                }`}
              >
                {active
                  ? t('invoxy.tariffs.renew')
                  : activeId && !addingSubscription
                    ? t('invoxy.tariffs.switch')
                    : t('invoxy.tariffs.choose')}
                <ChevronRight size={16} />
              </button>
            </article>
          );
        })}
      </div>

      {activeId && (
        <section>
          <AddonsCard
            subscriptionId={activeSubscriptionId}
            subscription={
              activeSubscription
                ? {
                    ...activeSubscription,
                    whitelist_traffic_limit_gb:
                      activeSubscription.whitelist_traffic_limit_gb ??
                      activePlan?.lteTraffic ??
                      null,
                    tariff_name: activeSubscription.tariff_name ?? activePlan?.name ?? null,
                  }
                : activePlan
                  ? {
                      tariff_name: activePlan.name,
                      whitelist_traffic_limit_gb: activePlan.lteTraffic,
                      traffic_limit_gb: activePlan.mainTraffic,
                      is_trial: false,
                    }
                  : null
            }
          />
        </section>
      )}

      {!loading && <PromoGroup loyalty={tariffsData?.loyalty} />}

      {selected && selectedPeriod && totals && (
        <TariffConfiguratorDialog
          open={dialogOpen}
          plan={selected}
          active={selected.id === activeId}
          subscriptionId={activeSubscriptionId ?? undefined}
          months={months}
          devices={devices}
          totals={totals}
          discount={selectedPeriod.discount}
          tariffStep={tariffStep}
          onBack={() => setTariffStep('options')}
          onClose={() => {
            setDialogOpen(false);
            closeAndClearIntent();
          }}
          setMonths={setMonths}
          setDevices={setDevices}
          activate={() => setTariffStep('payment')}
          onPay={(method, request) => pay(method, request)}
          onTopUp={topUp}
          onComplete={() => {
            void queryClient.invalidateQueries({ queryKey: ['invoxy-tariffs-page-data'] });
            void queryClient.invalidateQueries({ queryKey: ['invoxy-subscriptions'] });
          }}
        />
      )}

      {switchPlan && (
        <TariffSwitchModal
          open={switchModalOpen}
          plan={{ ...switchPlan, icon: planIcon(switchPlan) }}
          currentPlan={activePlan ? { ...activePlan, icon: planIcon(activePlan) } : undefined}
          subscriptionId={activeSubscriptionId ? Number(activeSubscriptionId) : undefined}
          onClose={() => {
            setSwitchModalOpen(false);
            closeAndClearIntent();
          }}
          onFallbackToPurchase={() => {
            const planToBuy = switchPlan;
            setSwitchModalOpen(false);
            if (planToBuy) {
              selectPlan(planToBuy.id);
            }
          }}
          onTopUp={topUp}
        />
      )}
    </div>
  );
}

/** Уровень лояльности — компактной полосой под тарифами, а не первым экраном. */
function PromoGroup({ loyalty: initialLoyalty }: { loyalty?: LoyaltyTiersResponse | null }) {
  const { t } = useTranslation();
  const [loyalty, setLoyalty] = useState<LoyaltyTiersResponse | null>(initialLoyalty ?? null);
  useEffect(() => {
    if (initialLoyalty) {
      setLoyalty(initialLoyalty);
      return;
    }
    void promoApi
      .getLoyaltyTiers()
      .then(setLoyalty)
      .catch(() => undefined);
  }, [initialLoyalty]);
  const tiers = loyalty?.tiers ?? [];
  if (tiers.length === 0) return null;
  const current = tiers.find((tier) => tier.is_current);
  const next = tiers.find(
    (tier) => !tier.is_achieved && tier.threshold_rubles > (loyalty?.current_spent_rubles ?? 0),
  );
  const currentDiscount =
    current?.period_discounts?.['30'] ?? current?.traffic_discount_percent ?? 0;
  const progressPercent = Math.min(
    100,
    Math.max(0, Math.round((loyalty?.progress_percent ?? 0) * 10) / 10),
  );

  return (
    <section id="loyalty" className="glass-panel rounded-[22px] p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm font-bold text-ink">
          {t('invoxy.tariffs.loyaltyLevel', {
            name: current?.name ?? 'Base',
            discount: currentDiscount,
          })}
        </p>
        <p className="text-xs text-muted">
          {next
            ? t('invoxy.tariffs.loyaltyNext', {
                name: next.name,
                amount: formatRubles(
                  Math.max(0, next.threshold_rubles - (loyalty?.current_spent_rubles ?? 0)),
                ),
              })
            : t('invoxy.tariffs.loyaltyMax')}
        </p>
      </div>
      <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-mint transition-[width] duration-500"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </section>
  );
}

type Totals = ReturnType<typeof configuratorTotal>;

function TariffConfiguratorDialog({
  open,
  plan,
  active,
  subscriptionId,
  months,
  devices,
  totals,
  discount,
  tariffStep,
  onBack,
  onClose,
  setMonths,
  setDevices,
  activate,
  onPay,
  onTopUp,
  onComplete,
}: {
  open: boolean;
  plan: Plan;
  active: boolean;
  subscriptionId?: number;
  months: number;
  devices: number;
  totals: Totals;
  discount: number;
  tariffStep: 'options' | 'payment';
  onBack: () => void;
  onClose: () => void;
  setMonths: (value: number) => void;
  setDevices: React.Dispatch<React.SetStateAction<number>>;
  activate: () => void;
  onPay: (
    method: string,
    request: {
      amount: number;
      purpose: string;
      onComplete: () => void;
      tariffId?: number;
      periodDays?: number;
      subscriptionId?: number;
      devices?: number;
    },
  ) => void;
  onTopUp: () => void;
  onComplete: () => void;
}) {
  const { t } = useTranslation();
  const purpose = t('invoxy.tariffs.purpose', { name: plan.name, months });
  const periodDays = plan.periods.find((period) => period.months === months)?.days ?? months * 30;
  const request = {
    amount: totals.total,
    purpose,
    onComplete,
    tariffId: Number(plan.id),
    periodDays,
    subscriptionId,
    devices,
  };
  return (
    <AdaptiveDialog
      open={open}
      onClose={onClose}
      titleId="tariff-dialog-title"
      maxWidth="max-w-2xl"
    >
      {/* popLayout: шаг оплаты монтируется сразу, не дожидаясь exit предыдущего
          шага (в задушенном вебвью wait оставляет диалог на старом шаге). */}
      <AnimatePresence mode="popLayout" initial={false}>
        {tariffStep === 'payment' ? (
          <m.div
            key="payment"
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 18 }}
            transition={{ duration: 0.2 }}
          >
            <div className="pr-12">
              <p className="text-[10px] font-bold tracking-[.14em] text-mint">
                {t('invoxy.tariffs.paymentEyebrow')}
              </p>
              <h2 id="tariff-dialog-title" className="mt-2 text-3xl font-medium">
                {plan.name}
              </h2>
            </div>
            <button
              type="button"
              onClick={onBack}
              className="mt-2 min-h-11 text-xs font-bold text-mint"
            >
              {t('invoxy.tariffs.backToOptions')}
            </button>
            <div className="mt-2 rounded-2xl bg-white/5 p-4 text-center">
              <p className="text-sm text-muted">{purpose}</p>
              <strong className="mt-2 block text-3xl font-medium">
                {formatRubles(totals.total)}
              </strong>
            </div>
            <PaymentMethods
              request={request}
              onPay={(method) => onPay(method, request)}
              onTopUp={onTopUp}
            />
          </m.div>
        ) : (
          <m.div
            key="options"
            initial={{ opacity: 0, x: -18 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -18 }}
            transition={{ duration: 0.2 }}
          >
            <TariffConfigurator
              plan={plan}
              active={active}
              months={months}
              devices={devices}
              totals={totals}
              discount={discount}
              setMonths={setMonths}
              setDevices={setDevices}
              activate={activate}
            />
          </m.div>
        )}
      </AnimatePresence>
    </AdaptiveDialog>
  );
}

function TariffConfigurator({
  plan,
  active,
  months,
  devices,
  totals,
  discount,
  setMonths,
  setDevices,
  activate,
}: {
  plan: Plan;
  active: boolean;
  months: number;
  devices: number;
  totals: Totals;
  discount: number;
  setMonths: (value: number) => void;
  setDevices: React.Dispatch<React.SetStateAction<number>>;
  activate: () => void;
}) {
  const { t } = useTranslation();
  const prevDevicesRef = useRef(devices);
  const counterDirection = devices >= prevDevicesRef.current ? 1 : -1;
  const extraDevices = Math.max(0, devices - plan.devices);
  const currentLimit = active ? plan.devices + plan.extraDevicesCount : null;

  return (
    <div className="mx-auto w-full max-w-xl">
      <div className="pr-12">
        <p className="text-[10px] font-bold tracking-[.14em] text-mint">
          {t('invoxy.tariffs.configEyebrow')}
        </p>
        <h2 id="tariff-dialog-title" className="mt-2 text-3xl font-medium">
          {plan.name}
        </h2>
      </div>
      <div className="mt-5">
        <p className="text-xs font-semibold text-muted">{t('invoxy.tariffs.term')}</p>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {plan.periods.map((period) => {
            const price = configuratorTotal(plan, period, devices).total;
            const isSelected = months === period.months;
            return (
              <button
                type="button"
                key={period.days}
                aria-pressed={isSelected}
                onClick={() => setMonths(period.months)}
                className={`relative button-lift flex min-h-[60px] min-w-0 flex-col items-center justify-center rounded-2xl px-2 text-xs transition-colors cursor-pointer ${
                  isSelected ? 'text-bg font-bold' : 'glass-control text-muted hover:text-ink'
                }`}
              >
                {isSelected && (
                  <m.div
                    layoutId="tariffPeriodPill"
                    className="absolute inset-0 rounded-2xl bg-mint shadow-sm"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.35 }}
                  />
                )}
                <span className="relative z-10">
                  {t('invoxy.dashboard.periodDays', { count: period.days })}
                  {period.discount > 0 && (
                    <span
                      className={
                        isSelected
                          ? 'ml-1 text-bg/75 font-semibold'
                          : 'ml-1 text-mint font-semibold'
                      }
                    >
                      −{period.discount}%
                    </span>
                  )}
                </span>
                <strong className="relative z-10 mt-1 text-sm">{formatRubles(price)}</strong>
              </button>
            );
          })}
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between gap-4 rounded-2xl bg-white/[.035] p-4">
        <div>
          <p className="text-xs font-semibold text-muted">{t('invoxy.tariffs.devicesLabel')}</p>
          <p className="mt-1 text-[11px] text-muted">
            {plan.maxDevices > plan.devices
              ? t('invoxy.tariffs.devicesRange', {
                  min: plan.devices,
                  max: plan.maxDevices,
                  price: formatRubles(plan.devicePrice),
                })
              : t('invoxy.tariffs.devicesFixed', { count: plan.devices })}
          </p>
        </div>
        <div className="glass-control flex items-center rounded-full p-1">
          <button
            type="button"
            aria-label={t('invoxy.tariffs.decrease')}
            disabled={devices <= plan.devices}
            onClick={() => {
              prevDevicesRef.current = devices;
              setDevices((value) => Math.max(plan.devices, value - 1));
            }}
            className="button-lift grid h-11 w-11 place-items-center rounded-full disabled:cursor-not-allowed disabled:opacity-30"
          >
            <Minus size={15} />
          </button>
          <div className="relative flex h-8 w-8 items-center justify-center overflow-hidden">
            <AnimatePresence mode="popLayout" initial={false} custom={counterDirection}>
              <m.strong
                key={devices}
                custom={counterDirection}
                initial={{ opacity: 0, y: counterDirection > 0 ? 12 : -12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: counterDirection > 0 ? -12 : 12 }}
                transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                className="absolute text-sm font-bold text-ink"
              >
                {devices}
              </m.strong>
            </AnimatePresence>
          </div>
          <button
            type="button"
            aria-label={t('invoxy.tariffs.increase')}
            disabled={devices >= plan.maxDevices}
            onClick={() => {
              prevDevicesRef.current = devices;
              setDevices((value) => Math.min(plan.maxDevices, value + 1));
            }}
            className="button-lift grid h-11 w-11 place-items-center rounded-full disabled:cursor-not-allowed disabled:opacity-30"
          >
            <Plus size={15} />
          </button>
        </div>
      </div>
      {currentLimit !== null && currentLimit !== devices && (
        <p className="mt-2 rounded-2xl border border-amber-300/25 bg-amber-300/[.07] p-3 text-xs text-amber-100">
          {t('invoxy.tariffs.limitChangeNote', { current: currentLimit, next: devices })}
        </p>
      )}
      <div className="mt-4 overflow-hidden rounded-2xl border border-mint/15 bg-mint/[.06] p-4">
        <div className="flex flex-col gap-1.5 text-xs text-muted">
          <div className="flex justify-between gap-3">
            <span>{t('invoxy.renewal.tariffLine')}</span>
            <span className="tabular-nums text-ink">{formatRubles(totals.tariffBase)}</span>
          </div>
          {extraDevices > 0 && (
            <div className="flex justify-between gap-3">
              <span>
                {t('invoxy.renewal.extraLine', {
                  count: extraDevices,
                  price: formatRubles(plan.devicePrice),
                })}
              </span>
              <span className="tabular-nums text-ink">{formatRubles(totals.extra)}</span>
            </div>
          )}
          {totals.saving > 0 && (
            <div className="flex justify-between gap-3 text-mint">
              <span>{t('invoxy.tariffs.tariffDiscount', { percent: discount })}</span>
              <span className="tabular-nums">−{formatRubles(totals.saving)}</span>
            </div>
          )}
        </div>
        <div className="mt-3 flex items-baseline justify-between gap-3 border-t border-white/10 pt-3">
          <span className="text-sm text-muted">{t('invoxy.tariffs.total')}</span>
          <AnimatePresence mode="popLayout" initial={false}>
            <m.strong
              key={`${months}-${devices}-${totals.total}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="text-3xl font-medium"
            >
              {formatRubles(totals.total)}
            </m.strong>
          </AnimatePresence>
        </div>
        <button
          type="button"
          onClick={activate}
          className="button-lift mt-4 h-12 w-full cursor-pointer rounded-full bg-mint px-6 text-sm font-bold text-bg transition-transform active:scale-[0.99]"
        >
          {active ? t('invoxy.tariffs.renewPlan') : t('invoxy.tariffs.connectPlan')}
        </button>
      </div>
    </div>
  );
}
