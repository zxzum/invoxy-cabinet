import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, m } from 'framer-motion';
import { Gauge, Globe2, Minus, Plus, Users } from '@/invoxystart/components/ui/RuneIcon';
import { AdaptiveDialog } from '@/invoxystart/components/ui/AdaptiveDialog';
import { PaymentMethods, usePayment } from '@/invoxystart/components/payments/PaymentFlow';
import { subscriptionApi, type TrafficResetStatus } from '@/invoxystart/api';

type Package = { gb: number; price: number; is_available?: boolean; reason?: string | null };

type AddonOption = {
  id: 'devices' | 'traffic' | 'lte_reset';
  icon: typeof Users;
  title: string;
  desc: string;
  price: string;
};

export function AddonsCard({
  subscriptionId,
  subscription,
}: {
  subscriptionId?: number | null;
  subscription?: {
    tariff_name?: string | null;
    whitelist_traffic_limit_gb?: number | null;
    whitelist_traffic_used_gb?: number | null;
    traffic_limit_gb?: number | null;
    traffic_used_gb?: number | null;
    is_trial?: boolean | null;
  } | null;
}) {
  const { pay, topUp } = usePayment();
  const [selected, setSelected] = useState<'devices' | 'traffic' | 'lte_reset' | null>(null);
  const [step, setStep] = useState<'options' | 'payment'>('options');
  const [deviceCount, setDeviceCount] = useState(1);
  const [mainIndex, setMainIndex] = useState(0);
  const [mainPackages, setMainPackages] = useState<Package[]>([]);
  const [devicePrice, setDevicePrice] = useState(0);
  const [trafficReset, setTrafficReset] = useState<TrafficResetStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');

  const hasLte = Boolean(
    (subscription?.whitelist_traffic_limit_gb && subscription.whitelist_traffic_limit_gb > 0) ||
      subscription?.tariff_name?.toLowerCase().includes('lte'),
  );

  const availableCards = useMemo(() => {
    const list: AddonOption[] = [
      {
        id: 'devices',
        icon: Users,
        title: 'Ещё устройства',
        desc: 'До 10 дополнительных',
        price: 'от 30 ₽ / мес',
      },
    ];

    if (hasLte) {
      list.push({
        id: 'lte_reset' as const,
        icon: Globe2,
        title: 'Сброс LTE',
        desc: 'Сброс 50 ГБ расхода Белого интернета',
        price: '150 ₽',
      });
    } else if (subscription && !subscription?.is_trial) {
      list.push({
        id: 'traffic' as const,
        icon: Gauge,
        title: 'Основной трафик',
        desc: 'Пакет 100 ГБ',
        price: '50 ₽',
      });
    }

    return list;
  }, [hasLte, subscription]);

  const amount =
    selected === 'devices'
      ? devicePrice
      : selected === 'traffic'
        ? (mainPackages[mainIndex]?.price ?? 50)
        : 150;

  const purpose =
    selected === 'devices'
      ? `Доп. устройства · ${deviceCount} шт.`
      : selected === 'traffic'
        ? `Основной трафик · ${mainPackages[mainIndex]?.gb ?? 100} ГБ`
        : 'Сброс расхода LTE · 50 ГБ';

  function openAddon(id: 'devices' | 'traffic' | 'lte_reset') {
    setStep('options');
    setSelected(id);
    setLoading(Boolean(subscriptionId));
    setLoadError('');
    if (id === 'devices') setDevicePrice(0);
    if (id === 'traffic') {
      setMainPackages([]);
      setMainIndex(0);
    }
    if (id === 'lte_reset') {
      setTrafficReset(null);
    }
  }

  useEffect(() => {
    if (!selected || !subscriptionId) return;
    let mounted = true;
    setLoading(true);
    setLoadError('');

    const run = async () => {
      try {
        if (selected === 'devices') {
          const result = await subscriptionApi.getDevicePrice(deviceCount, subscriptionId);
          if (!mounted) return;
          if (!result.available || result.total_price_kopeks == null) {
            setDevicePrice(0);
            setLoadError(result.reason || 'Докупка устройств недоступна');
            return;
          }
          setDevicePrice(result.total_price_kopeks / 100);
        } else if (selected === 'traffic') {
          const packages = await subscriptionApi.getTrafficPackages(subscriptionId, 'regular');
          if (!mounted) return;
          const next = packages.map((item) => ({
            gb: item.gb,
            price: item.price_rubles ?? item.price_kopeks / 100,
            is_available: item.is_available,
            reason: item.unavailable_reason,
          }));
          setMainPackages(next);
          if (!next.length) {
            setLoadError('Докупка трафика на этом тарифе недоступна');
          }
        } else if (selected === 'lte_reset') {
          const resetStatus = await subscriptionApi.getTrafficReset(subscriptionId);
          if (!mounted) return;
          setTrafficReset(resetStatus);
        }
      } catch {
        if (!mounted) return;
        setLoadError('Не удалось загрузить параметры опции');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void run();
    return () => {
      mounted = false;
    };
  }, [deviceCount, selected, subscriptionId]);

  const canProceed = useMemo(() => {
    if (loading || !subscriptionId) return false;
    if (selected === 'devices') return devicePrice > 0;
    if (selected === 'traffic') {
      const pkg = mainPackages[mainIndex];
      return Boolean(pkg && pkg.is_available !== false);
    }
    if (selected === 'lte_reset') {
      if (!trafficReset) return false;
      if (!trafficReset.enabled) return false;
      if (trafficReset.used_gb < trafficReset.min_used_gb) return false;
      if (trafficReset.remaining_this_month <= 0) return false;
      return true;
    }
    return false;
  }, [devicePrice, loading, mainIndex, mainPackages, selected, subscriptionId, trafficReset]);

  return (
    <div className="flex w-full flex-col gap-3">
      <h3 className="motion-reveal text-[17px] font-bold text-ink lg:text-[clamp(17px,1.1vw,22px)]">
        Дополнительные опции
      </h3>
      <div className="grid gap-3 lg:flex lg:flex-col lg:gap-[clamp(10px,0.65vw,14px)]">
        {availableCards.map((addon) => (
          <div
            key={addon.id}
            className="glass-panel motion-card flex items-center gap-3 rounded-3xl p-4 lg:rounded-[clamp(14px,0.8vw,18px)] lg:p-[clamp(12px,0.8vw,16px)]"
          >
            <addon.icon size={20} className="shrink-0 text-mint" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-ink">{addon.title}</p>
              <p className="mt-0.5 text-[11px] text-muted">{addon.desc}</p>
              <p className="mt-1 text-xs font-bold text-mint">{addon.price}</p>
            </div>
            <button
              type="button"
              onClick={() => openAddon(addon.id)}
              className="button-lift h-9 shrink-0 rounded-full bg-mint px-4 text-[11px] font-bold text-bg"
            >
              Добавить
            </button>
          </div>
        ))}
      </div>

      <AdaptiveDialog
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        titleId="addon-title"
        maxWidth="max-w-lg"
      >
        <p className="text-[10px] font-bold tracking-[.15em] text-mint">ДОПОЛНИТЕЛЬНАЯ ОПЦИЯ</p>
        <h2 id="addon-title" className="mt-2 pr-12 text-2xl font-medium">
          {availableCards.find((item) => item.id === selected)?.title}
        </h2>

        <AnimatePresence mode="wait" initial={false}>
          {step === 'payment' ? (
            <m.div
              key="payment"
              initial={{ opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 18 }}
              transition={{ duration: 0.2 }}
              className="mt-5"
            >
              <button
                type="button"
                onClick={() => setStep('options')}
                className="mb-3 text-xs font-bold text-mint"
              >
                ← Вернуться к выбору опции
              </button>
              <div className="rounded-2xl bg-white/5 p-4 text-center">
                <p className="text-[10px] font-bold uppercase tracking-[.12em] text-muted">
                  Назначение
                </p>
                <p className="mt-1 text-sm font-medium">{purpose}</p>
                <strong className="mt-2 block text-2xl font-medium">
                  {amount.toLocaleString('ru-RU')} ₽
                </strong>
              </div>
              <PaymentMethods
                request={{
                  amount,
                  purpose,
                  subscriptionId: subscriptionId ?? undefined,
                  addonType:
                    selected === 'devices'
                      ? 'devices'
                      : selected === 'lte_reset'
                        ? 'lte_reset'
                        : 'traffic',
                  addonValue:
                    selected === 'devices'
                      ? deviceCount
                      : selected === 'traffic'
                        ? (mainPackages[mainIndex]?.gb ?? 100)
                        : 50,
                  onComplete: () => setSelected(null),
                }}
                onPay={(method) =>
                  pay(method, {
                    amount,
                    purpose,
                    subscriptionId: subscriptionId ?? undefined,
                    addonType:
                      selected === 'devices'
                        ? 'devices'
                        : selected === 'lte_reset'
                          ? 'lte_reset'
                          : 'traffic',
                    addonValue:
                      selected === 'devices'
                        ? deviceCount
                        : selected === 'traffic'
                          ? (mainPackages[mainIndex]?.gb ?? 100)
                          : 50,
                    onComplete: () => setSelected(null),
                  })
                }
                onTopUp={topUp}
              />
            </m.div>
          ) : (
            <m.div
              key="options"
              initial={{ opacity: 0, x: -18 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -18 }}
              transition={{ duration: 0.2 }}
              className="mt-6"
            >
              {loading ? (
                <div className="rounded-2xl bg-white/[.035] p-5 text-center text-xs text-muted">
                  Загрузка параметров…
                </div>
              ) : loadError ? (
                <p
                  role="alert"
                  className="rounded-2xl border border-red-300/20 bg-red-300/8 p-4 text-center text-xs text-red-200"
                >
                  {loadError}
                </p>
              ) : null}

              {!loading && !loadError && selected === 'devices' && (
                <div className="glass-control flex items-center justify-between rounded-2xl p-4">
                  <div>
                    <p className="text-sm font-medium">Количество устройств</p>
                    <p className="mt-1 text-xs text-muted">
                      Стоимость рассчитывается для выбранного количества
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      aria-label="Уменьшить количество"
                      disabled={deviceCount === 1}
                      onClick={() => setDeviceCount((value) => Math.max(1, value - 1))}
                      className="grid h-9 w-9 place-items-center rounded-full bg-white/8 disabled:opacity-30"
                    >
                      <Minus size={14} />
                    </button>
                    <strong className="w-5 text-center">{deviceCount}</strong>
                    <button
                      type="button"
                      aria-label="Увеличить количество"
                      disabled={deviceCount === 10}
                      onClick={() => setDeviceCount((value) => Math.min(10, value + 1))}
                      className="grid h-9 w-9 place-items-center rounded-full bg-mint text-bg disabled:opacity-30"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              )}

              {!loading && !loadError && selected === 'traffic' && (
                <div>
                  <div className="grid grid-cols-1 gap-3">
                    {mainPackages.map((item, index) => (
                      <button
                        type="button"
                        key={item.gb}
                        aria-pressed={mainIndex === index}
                        disabled={item.is_available === false}
                        onClick={() => setMainIndex(index)}
                        className={`rounded-2xl border p-4 text-left transition-all ${
                          mainIndex === index
                            ? 'border-mint bg-mint/[.12]'
                            : 'glass-control disabled:opacity-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <strong className="block text-xl">{item.gb} ГБ</strong>
                          <span className="text-sm font-bold text-mint">{item.price} ₽</span>
                        </div>
                        {item.reason && (
                          <p className="mt-1 text-xs text-red-200/90">{item.reason}</p>
                        )}
                      </button>
                    ))}
                  </div>
                  <p className="mt-3 text-xs text-muted">
                    Доступно до 2 раз в календарный месяц. Трафик добавляется к текущему лимиту.
                  </p>
                </div>
              )}

              {!loading && !loadError && selected === 'lte_reset' && trafficReset && (
                <div className="flex flex-col gap-4">
                  <div className="rounded-2xl bg-white/[0.04] p-4 text-xs leading-relaxed text-muted">
                    <p className="font-semibold text-ink">Как работает сброс LTE:</p>
                    <p className="mt-1">
                      Лимит тарифа не увеличивается. Вы обнуляете уже потраченные гигабайты Белого
                      интернета — максимум 50 ГБ за одну оплату (150 ₽). Неизрасходованные гигабайты
                      не копятся.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="rounded-2xl bg-white/5 p-3">
                      <span className="text-[11px] text-muted">Потрачено LTE</span>
                      <p className="mt-0.5 text-base font-bold text-ink">
                        {trafficReset.used_gb} / {trafficReset.limit_gb} ГБ
                      </p>
                    </div>
                    <div className="rounded-2xl bg-white/5 p-3">
                      <span className="text-[11px] text-muted">Будет списано</span>
                      <p className="mt-0.5 text-base font-bold text-mint">
                        −{trafficReset.will_clear_gb} ГБ
                      </p>
                    </div>
                    <div className="rounded-2xl bg-white/5 p-3">
                      <span className="text-[11px] text-muted">Расход после сброса</span>
                      <p className="mt-0.5 text-base font-bold text-ink">
                        {trafficReset.used_after_gb} / {trafficReset.limit_gb} ГБ
                      </p>
                    </div>
                    <div className="rounded-2xl bg-white/5 p-3">
                      <span className="text-[11px] text-muted">Сбросов в этом месяце</span>
                      <p className="mt-0.5 text-base font-bold text-ink">
                        {trafficReset.remaining_this_month} из {trafficReset.max_per_month}
                      </p>
                    </div>
                  </div>

                  {trafficReset.used_gb < trafficReset.min_used_gb ? (
                    <p
                      role="alert"
                      className="rounded-2xl border border-amber-300/25 bg-amber-300/10 p-3 text-center text-xs text-amber-200"
                    >
                      Сброс доступен после 10 ГБ расхода на LTE (сейчас потрачено{' '}
                      {trafficReset.used_gb} ГБ).
                    </p>
                  ) : trafficReset.remaining_this_month <= 0 ? (
                    <p
                      role="alert"
                      className="rounded-2xl border border-red-300/25 bg-red-300/10 p-3 text-center text-xs text-red-200"
                    >
                      Лимит сбросов на этот месяц исчерпан ({trafficReset.max_per_month} из{' '}
                      {trafficReset.max_per_month}).
                    </p>
                  ) : null}
                </div>
              )}

              <button
                type="button"
                disabled={!canProceed}
                onClick={() => setStep('payment')}
                className="button-lift mt-5 h-12 w-full rounded-full bg-ink text-sm font-bold text-bg disabled:cursor-not-allowed disabled:opacity-40"
              >
                {subscriptionId
                  ? `Выбрать способ оплаты · ${amount.toLocaleString('ru-RU')} ₽`
                  : 'Нужна активная подписка'}
              </button>
            </m.div>
          )}
        </AnimatePresence>
      </AdaptiveDialog>
    </div>
  );
}
