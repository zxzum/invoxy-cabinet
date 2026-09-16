import { useEffect, useState } from 'react';
import { AnimatePresence, m } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ChevronRight,
  Globe2,
  Minus,
  Plus,
  ShieldCheck,
  Smartphone,
  WifiOff,
} from '@/invoxystart/components/ui/RuneIcon';
import { PageHeader } from '@/invoxystart/components/layout/PageHeader';
import { AdaptiveDialog } from '@/invoxystart/components/ui/AdaptiveDialog';
import { PaymentMethods, usePayment } from '@/invoxystart/components/payments/PaymentFlow';
import type { LoyaltyTiersResponse } from '@/invoxystart/api';
import { AddonsCard } from '@/invoxystart/components/dashboard/AddonsCard';
import { useSearchParams } from 'react-router';
import { promoApi, subscriptionApi } from '@/invoxystart/api';

type PlanPeriod = { days: number; months: number; price: number; discount: number };
type Plan = {
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
};

function adaptPlan(value: Record<string, unknown>): Plan {
  const periods = Array.isArray(value.periods)
    ? (value.periods as Array<Record<string, unknown>>)
    : [];
  const adaptedPeriods = periods.map((period) => {
    const days = Number(period.days ?? 30);
    const months = Number(period.months ?? Math.max(1, Math.round(days / 30)));
    const priceKopeks = Number(period.price_kopeks ?? 0);
    const monthlyKopeks = Number(
      period.price_per_month_kopeks ?? priceKopeks / Math.max(months, 1),
    );
    return {
      days,
      months,
      price: priceKopeks / 100,
      discount:
        Number(period.discount_percent ?? 0) ||
        Math.max(0, Math.round((1 - priceKopeks / Math.max(monthlyKopeks * months, 1)) * 100)),
    };
  });
  const month = adaptedPeriods.find((period) => period.days === 30) ??
    adaptedPeriods[0] ?? { days: 30, months: 1, price: 0, discount: 0 };
  const lteTraffic = Number(value.whitelist_traffic_limit_gb ?? 0) || null;
  const rawName = String(value.name ?? 'Тариф').trim();
  return {
    id: String(value.id),
    name: lteTraffic && !/\blte\b/i.test(rawName) ? `${rawName} LTE` : rawName,
    price: month.price,
    mainTraffic: Number(value.traffic_limit_gb ?? 0),
    lteTraffic,
    devices: Number(value.device_limit ?? 0),
    devicePrice: Number(value.device_price_kopeks ?? 0) / 100,
    icon: Number(value.whitelist_traffic_limit_gb ?? 0) > 0 ? Globe2 : ShieldCheck,
    recommended: Boolean(value.is_highlighted),
    periods: adaptedPeriods,
  };
}

const formatRubles = (value: number) => `${value.toLocaleString('ru-RU')} ₽`;

export default function TariffsPage() {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const addingSubscription = searchParams.get('mode') === 'add';
  const { pay, topUp } = usePayment();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [tariffStep, setTariffStep] = useState<'options' | 'payment'>('options');
  const [months, setMonths] = useState(1);
  const [devices, setDevices] = useState(5);

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
        loyalty,
      };
    },
    staleTime: 60_000,
  });

  const plans = tariffsData?.plans ?? [];
  const activeId = tariffsData?.activeId ?? null;
  const activeSubscriptionId = tariffsData?.activeSubscriptionId ?? null;
  const loading = tariffsLoading && !tariffsData;

  const selected = plans.find((plan) => plan.id === selectedId);
  const selectedPeriod =
    selected?.periods.find((period) => period.months === months) ?? selected?.periods[0];
  const subtotal =
    selected && selectedPeriod
      ? selectedPeriod.price +
        Math.max(0, devices - selected.devices) * selected.devicePrice * selectedPeriod.months
      : 0;
  const total = Math.round(subtotal);

  function selectPlan(id: string, baseDevices: number) {
    if (selectedId === id && dialogOpen) {
      setDialogOpen(false);
      return;
    }
    setSelectedId(id);
    setDevices(baseDevices);
    setMonths(plans.find((plan) => plan.id === id)?.periods[0]?.months ?? 1);
    setTariffStep('options');
    setDialogOpen(true);
  }

  function activate() {
    if (!selected) return;
    setTariffStep('payment');
  }

  return (
    <div className="flex flex-col gap-5 pb-28 lg:gap-6 lg:pb-0">
      <PageHeader title="Тарифы" subtitle="Выберите подходящий план" />
      {addingSubscription && (
        <section className="glass-panel rounded-[24px] border border-mint/25 bg-mint/[.06] px-5 py-4">
          <p className="text-sm font-bold text-mint">Подключение дополнительной подписки</p>
          <p className="mt-1 text-xs text-muted">
            Новая подписка будет отдельной: со своим ключом, трафиком, устройствами и сроком.
          </p>
        </section>
      )}
      {loading ? (
        <div
          className="glass-panel h-32 animate-pulse rounded-[30px]"
          aria-label="Загрузка тарифов"
        />
      ) : (
        <PromoGroup />
      )}

      <div className="motion-grid grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {plans.map((plan) => {
          const Icon = plan.icon;
          const active = plan.id === activeId;
          const expanded = plan.id === selectedId && dialogOpen;
          return (
            <article
              key={plan.id}
              className={`glass-panel motion-card relative overflow-hidden rounded-[30px] p-5 ${plan.recommended ? 'border-mint/45 shadow-[0_0_34px_rgba(165,232,196,.08)]' : ''} ${expanded ? 'ring-1 ring-mint/70' : ''}`}
            >
              <div className="tariff-card-head flex items-center gap-3">
                <div className="glass-control flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-mint">
                  <Icon size={21} strokeWidth={1.6} />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-xl font-medium tracking-[-0.04em]">{plan.name}</h2>
                  <p className="mt-0.5 text-[28px] font-light tracking-[-0.05em]">
                    ₽{plan.price}
                    <span className="ml-1 text-xs text-muted">/мес</span>
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  {active && (
                    <span className="rounded-full bg-mint px-2 py-1 text-[8px] font-bold text-bg">
                      ВАШ ТАРИФ
                    </span>
                  )}
                  <span
                    className={`flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[9px] font-bold ${plan.lteTraffic ? 'bg-mint text-bg' : 'bg-white/7 text-muted'}`}
                  >
                    {plan.lteTraffic ? <Globe2 size={11} /> : <WifiOff size={11} />}
                    {plan.lteTraffic ? 'LTE ВКЛЮЧЁН' : 'БЕЗ LTE'}
                  </span>
                </div>
              </div>
              {plan.recommended && !active && (
                <span className="absolute right-5 top-5 rounded-full border border-mint/45 bg-bg/70 px-2.5 py-1.5 text-[8px] font-bold text-mint shadow-[0_0_18px_rgba(165,232,196,.12)]">
                  РЕКОМЕНДУЕМ
                </span>
              )}
              <div className="mt-5 grid grid-cols-2 gap-2">
                <div className="rounded-[20px] bg-white/[.055] p-3.5">
                  <p className="text-[9px] font-bold tracking-[.11em] text-muted">
                    ОСНОВНОЙ ТРАФИК
                  </p>
                  <strong className="mt-2 block text-2xl font-medium">
                    {plan.mainTraffic}
                    <span className="ml-1 text-xs text-muted">ГБ</span>
                  </strong>
                </div>
                <div
                  className={`rounded-[20px] p-3.5 ${plan.lteTraffic ? 'bg-mint/10 ring-1 ring-mint/25' : 'bg-white/[.025]'}`}
                >
                  <p
                    className={`text-[9px] font-bold tracking-[.11em] ${plan.lteTraffic ? 'text-mint' : 'text-muted'}`}
                  >
                    LTE-ТРАФИК
                  </p>
                  <strong
                    className={`mt-2 block text-2xl font-medium ${plan.lteTraffic ? 'text-mint' : 'text-muted'}`}
                  >
                    {plan.lteTraffic ?? '—'}
                    {plan.lteTraffic && <span className="ml-1 text-xs">ГБ</span>}
                  </strong>
                </div>
              </div>
              <p className="mt-3 flex items-center gap-2 text-xs text-muted">
                <Smartphone size={14} className="text-mint" /> До {plan.devices} устройств
              </p>
              <button
                type="button"
                aria-expanded={expanded}
                onClick={() => selectPlan(plan.id, plan.devices)}
                className={`button-lift mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-full text-sm font-bold active:scale-[.98] ${expanded || active ? 'glass-control text-ink' : 'bg-ink text-bg'}`}
              >
                {active ? 'Продлить' : 'Выбрать'}
                <ChevronRight size={16} />
              </button>
            </article>
          );
        })}
      </div>

      {activeId && (
        <section>
          <h2 className="sr-only">Дополнительные опции к активной подписке</h2>
          <AddonsCard subscriptionId={activeSubscriptionId} />
        </section>
      )}

      {selected && (
        <TariffConfiguratorDialog
          open={dialogOpen}
          plan={selected}
          active={selected.id === activeId}
          subscriptionId={activeSubscriptionId ?? undefined}
          months={months}
          devices={devices}
          subtotal={subtotal}
          total={total}
          tariffStep={tariffStep}
          onBack={() => setTariffStep('options')}
          onClose={() => setDialogOpen(false)}
          setMonths={setMonths}
          setDevices={setDevices}
          activate={activate}
          onPay={(method, request) => pay(method, request)}
          onTopUp={topUp}
          onComplete={() => {
            void queryClient.invalidateQueries({ queryKey: ['invoxy-tariffs-page-data'] });
            void queryClient.invalidateQueries({ queryKey: ['invoxy-subscriptions'] });
          }}
        />
      )}
    </div>
  );
}

function PromoGroup() {
  const [loyalty, setLoyalty] = useState<LoyaltyTiersResponse | null>(null);
  useEffect(() => {
    void promoApi
      .getLoyaltyTiers()
      .then(setLoyalty)
      .catch(() => undefined);
  }, []);
  const apiTiers = loyalty?.tiers ?? [];
  const baseTier = {
    id: 0,
    name: 'Invoxy Base',
    threshold_rubles: 0,
    server_discount_percent: 0,
    traffic_discount_percent: 0,
    device_discount_percent: 0,
    period_discounts: { '30': 0 },
    is_current: !apiTiers.some((tier) => tier.is_current),
    is_achieved: true,
  };
  const tiers = [baseTier, ...apiTiers];
  const current = tiers.find((tier) => tier.is_current) ?? baseTier;
  const next = tiers.find(
    (tier) => !tier.is_achieved && tier.threshold_rubles > (loyalty?.current_spent_rubles ?? 0),
  );
  const currentDiscount =
    current?.period_discounts?.['30'] ?? current?.traffic_discount_percent ?? 0;
  const currentLabel = `${current?.name || 'Base'} · скидка ${currentDiscount}%`;
  const nextText = next
    ? `До ${next.name} осталось ${formatRubles(Math.max(0, next.threshold_rubles - (loyalty?.current_spent_rubles ?? 0)))}`
    : 'Максимальный уровень уже достигнут';

  return (
    <section className="glass-panel motion-card relative overflow-hidden rounded-[30px] p-4 lg:p-8">
      <img
        src="/images/promo-group-bg.webp"
        alt=""
        className="absolute inset-0 h-full w-full object-cover opacity-80"
        loading="eager"
        decoding="sync"
        // @ts-expect-error React 18 fetchPriority support
        fetchpriority="high"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-bg/65 via-bg/45 to-bg/20 lg:from-bg/90 lg:via-bg/75 lg:to-bg/60" />
      <div className="relative z-10 grid gap-4 lg:grid-cols-[minmax(0,.85fr)_minmax(360px,1.15fr)] lg:items-center lg:gap-12">
        <div>
          <p className="text-[11px] font-bold tracking-[0.16em] text-mint">ПРОМО-ГРУППА</p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-medium tracking-[-0.035em]">{currentLabel}</h2>
            <span className="rounded-full bg-mint px-3 py-1 text-[10px] font-bold text-bg">
              АКТИВЕН
            </span>
          </div>
          <p className="mt-2 text-sm text-muted">
            Потрачено {formatRubles(loyalty?.current_spent_rubles ?? 0)} · {nextText}
          </p>
        </div>
        <div>
          <div className="flex items-center justify-between text-xs text-muted">
            <span>Прогресс до VIP</span>
            <strong className="text-mint">{loyalty?.progress_percent ?? 0}%</strong>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-mint transition-[width] duration-500"
              style={{ width: `${loyalty?.progress_percent ?? 0}%` }}
            />
          </div>
          <div className="mt-3 grid grid-cols-3 gap-1 lg:mt-4 lg:gap-2">
            {tiers.slice(0, 3).map((tier) => (
              <div
                key={tier.id}
                className={`min-w-0 rounded-xl border p-2 lg:rounded-2xl lg:p-3 ${tier.is_achieved || tier.is_current ? 'border-mint/25 bg-mint/10' : 'border-white/8 bg-white/5'}`}
              >
                <p
                  className={`truncate text-[10px] font-bold lg:text-xs ${tier.is_achieved || tier.is_current ? 'text-mint' : 'text-muted'}`}
                >
                  {tier.name} · {tier.period_discounts?.['30'] ?? tier.traffic_discount_percent}%
                </p>
                <p className="mt-1 truncate text-[9px] text-muted lg:text-[10px]">
                  от {formatRubles(tier.threshold_rubles)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function TariffConfiguratorDialog({
  open,
  plan,
  active,
  subscriptionId,
  months,
  devices,
  subtotal,
  total,
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
  subtotal: number;
  total: number;
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
    },
  ) => void;
  onTopUp: () => void;
  onComplete: () => void;
}) {
  const purpose = `Тариф ${plan.name} · ${months} мес.`;
  const periodDays = plan.periods.find((period) => period.months === months)?.days ?? months * 30;
  return (
    <AdaptiveDialog
      open={open}
      onClose={onClose}
      titleId="tariff-dialog-title"
      maxWidth="max-w-2xl"
    >
      <AnimatePresence mode="wait" initial={false}>
        {tariffStep === 'payment' ? (
          <m.div
            key="payment"
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 18 }}
            transition={{ duration: 0.2 }}
          >
            <div className="pr-12">
              <p className="text-[10px] font-bold tracking-[.14em] text-mint">ОПЛАТА ТАРИФА</p>
              <h2 id="tariff-dialog-title" className="mt-2 text-3xl font-medium">
                {plan.name}
              </h2>
            </div>
            <button type="button" onClick={onBack} className="mt-4 text-xs font-bold text-mint">
              ← Вернуться к настройке тарифа
            </button>
            <div className="mt-4 rounded-2xl bg-white/5 p-4 text-center">
              <p className="text-sm text-muted">{purpose}</p>
              <strong className="mt-2 block text-3xl font-medium">{formatRubles(total)}</strong>
            </div>
            <PaymentMethods
              request={{
                amount: total,
                purpose,
                onComplete,
                tariffId: Number(plan.id),
                periodDays,
                subscriptionId,
              }}
              onPay={(method) =>
                onPay(method, {
                  amount: total,
                  purpose,
                  onComplete,
                  tariffId: Number(plan.id),
                  periodDays,
                  subscriptionId,
                })
              }
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
              subtotal={subtotal}
              total={total}
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
  subtotal,
  total,
  setMonths,
  setDevices,
  activate,
}: {
  plan: Plan;
  active: boolean;
  months: number;
  devices: number;
  subtotal: number;
  total: number;
  setMonths: (value: number) => void;
  setDevices: React.Dispatch<React.SetStateAction<number>>;
  activate: () => void;
}) {
  const extraDevicePrice = Math.max(0, devices - plan.devices) * plan.devicePrice;
  const saving = subtotal - total;

  return (
    <div className="mx-auto w-full max-w-xl">
      <div className="pr-12">
        <p className="text-[10px] font-bold tracking-[.14em] text-mint">НАСТРОЙКА ТАРИФА</p>
        <h2 id="tariff-dialog-title" className="mt-2 text-3xl font-medium">
          {plan.name}
        </h2>
        <p className="mt-1 text-sm text-muted">Выберите срок и количество устройств</p>
      </div>
      <div className="mt-7">
        <p className="text-xs font-semibold text-muted">Срок подписки</p>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {plan.periods.map((period) => {
            const price = Math.round(period.price + extraDevicePrice * period.months);
            const label = period.days === 30 ? `${period.months} мес` : `${period.days} дней`;
            return (
              <button
                type="button"
                key={period.days}
                aria-pressed={months === period.months}
                onClick={() => setMonths(period.months)}
                className={`button-lift flex min-h-[66px] min-w-0 flex-col items-center justify-center rounded-2xl px-2 text-xs ${months === period.months ? 'bg-mint font-bold text-bg' : 'glass-control text-muted'}`}
              >
                <span>
                  {label}{' '}
                  {period.discount > 0 && (
                    <span className={months === period.months ? 'text-bg/70' : 'text-mint'}>
                      · −{period.discount}%
                    </span>
                  )}
                </span>
                <strong className="mt-1 text-sm">{formatRubles(price)}</strong>
              </button>
            );
          })}
        </div>
      </div>
      <div className="mt-5 flex items-center justify-between gap-4 rounded-2xl bg-white/[.035] p-4">
        <div>
          <p className="text-xs font-semibold text-muted">Устройства</p>
          <p className="mt-1 text-[11px] text-muted">
            Минимум {plan.devices} · +{formatRubles(plan.devicePrice)} за дополнительное
          </p>
        </div>
        <div className="glass-control flex items-center rounded-full p-1">
          <button
            type="button"
            aria-label="Уменьшить"
            disabled={devices <= plan.devices}
            onClick={() => setDevices((value) => Math.max(plan.devices, value - 1))}
            className="button-lift grid h-9 w-9 place-items-center rounded-full disabled:cursor-not-allowed disabled:opacity-30"
          >
            <Minus size={15} />
          </button>
          <span className="w-7 text-center text-sm font-bold">{devices}</span>
          <button
            type="button"
            aria-label="Увеличить"
            onClick={() => setDevices((value) => Math.min(20, value + 1))}
            className="button-lift grid h-9 w-9 place-items-center rounded-full"
          >
            <Plus size={15} />
          </button>
        </div>
      </div>
      <div className="mt-5 rounded-2xl border border-mint/15 bg-mint/[.06] p-4 text-center">
        <span className="block text-lg font-medium text-muted">Итого</span>
        {saving > 0 && (
          <span className="mt-1 block text-sm text-muted line-through">
            {formatRubles(subtotal)}
          </span>
        )}
        <strong className="block text-4xl font-medium">{formatRubles(total)}</strong>
        {saving > 0 && (
          <span className="mt-1 block text-xs font-medium text-mint">
            Выгода {formatRubles(saving)} к помесячной оплате
          </span>
        )}
        <button
          type="button"
          onClick={activate}
          className="button-lift mt-4 h-12 w-full rounded-full bg-mint px-6 text-sm font-bold text-bg"
        >
          {active ? 'Продлить тариф' : 'Подключить тариф'}
        </button>
      </div>
    </div>
  );
}
