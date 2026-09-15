import { useEffect, useState } from 'react';
import { AnimatePresence, m } from 'framer-motion';
import { Gauge, Globe2, Minus, Plus, Users } from '@/invoxystart/components/ui/RuneIcon';
import { AdaptiveDialog } from '@/invoxystart/components/ui/AdaptiveDialog';
import { PaymentMethods, usePayment } from '@/invoxystart/components/payments/PaymentFlow';
import { subscriptionApi } from '@/invoxystart/api';

const addonCards = [
  {
    id: 'devices',
    icon: Users,
    title: 'Ещё устройства',
    desc: 'До 10 дополнительных',
    price: 'от 30 ₽ / мес',
  },
  {
    id: 'traffic',
    icon: Gauge,
    title: 'Основной трафик',
    desc: 'Пакеты 100 или 300 ГБ',
    price: 'от 50 ₽',
  },
  {
    id: 'lte',
    icon: Globe2,
    title: 'Доп. LTE-трафик',
    desc: 'Пакеты 50 или 100 ГБ',
    price: 'от 150 ₽',
  },
] as const;

type Package = { gb: number; price: number };

export function AddonsCard({ subscriptionId }: { subscriptionId?: number | null }) {
  const { pay, topUp } = usePayment();
  const [selected, setSelected] = useState<(typeof addonCards)[number]['id'] | null>(null);
  const [step, setStep] = useState<'options' | 'payment'>('options');
  const [deviceCount, setDeviceCount] = useState(1);
  const [mainIndex, setMainIndex] = useState(0);
  const [lteIndex, setLteIndex] = useState(0);
  const [mainPackages, setMainPackages] = useState<Package[]>([]);
  const [ltePackages, setLtePackages] = useState<Package[]>([]);
  const [devicePrice, setDevicePrice] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const amount =
    selected === 'devices'
      ? devicePrice
      : selected === 'traffic'
        ? (mainPackages[mainIndex]?.price ?? 0)
        : (ltePackages[lteIndex]?.price ?? 0);
  const selectedPackage =
    selected === 'traffic'
      ? mainPackages[mainIndex]
      : selected === 'lte'
        ? ltePackages[lteIndex]
        : undefined;
  const purpose =
    selected === 'devices'
      ? `Доп. устройства · ${deviceCount} шт.`
      : selectedPackage
        ? `${selected === 'traffic' ? 'Основной трафик' : 'LTE-трафик'} · ${selectedPackage.gb} ГБ`
        : 'Дополнительная опция';

  function openAddon(id: (typeof addonCards)[number]['id']) {
    setStep('options');
    setSelected(id);
    setLoading(Boolean(subscriptionId));
    setLoadError('');
    if (id === 'devices') setDevicePrice(0);
    if (id === 'traffic') {
      setMainPackages([]);
      setMainIndex(0);
    }
    if (id === 'lte') {
      setLtePackages([]);
      setLteIndex(0);
    }
  }

  useEffect(() => {
    if (!selected || !subscriptionId) return;
    let mounted = true;
    setLoading(true);
    setLoadError('');

    const load =
      selected === 'devices'
        ? subscriptionApi.getDevicePrice(deviceCount, subscriptionId).then((result) => {
            if (!mounted) return;
            if (!result.available || result.total_price_kopeks == null) {
              setDevicePrice(0);
              setLoadError(result.reason || 'Докупка устройств недоступна');
              return;
            }
            setDevicePrice(result.total_price_kopeks / 100);
          })
        : subscriptionApi
            .getTrafficPackages(subscriptionId, selected === 'lte' ? 'whitelist' : 'regular')
            .then((packages) => {
              if (!mounted) return;
              const next = packages
                .filter((item) => item.is_available !== false)
                .map((item) => ({
                  gb: item.gb,
                  price: item.price_rubles ?? item.price_kopeks / 100,
                }));
              if (selected === 'lte') setLtePackages(next);
              else setMainPackages(next);
              if (!next.length) setLoadError('Доступные пакеты не найдены');
            });

    void load
      .catch(() => {
        if (mounted) setLoadError('Не удалось загрузить варианты оплаты');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [deviceCount, selected, subscriptionId]);

  return (
    <div className="flex w-full flex-col gap-3">
      <h3 className="motion-reveal text-[17px] font-bold text-ink lg:text-[clamp(17px,1.1vw,22px)]">
        Дополнительные опции
      </h3>
      <div className="grid gap-3 lg:flex lg:flex-col lg:gap-[clamp(10px,0.65vw,14px)]">
        {addonCards.map((addon) => (
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
          {addonCards.find((item) => item.id === selected)?.title}
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
                    selected === 'devices' ? 'devices' : selected === 'lte' ? 'lte' : 'traffic',
                  addonValue:
                    selected === 'devices'
                      ? deviceCount
                      : selected === 'lte'
                        ? ltePackages[lteIndex]?.gb
                        : mainPackages[mainIndex]?.gb,
                }}
                onPay={(method) =>
                  pay(method, {
                    amount,
                    purpose,
                    subscriptionId: subscriptionId ?? undefined,
                    addonType:
                      selected === 'devices' ? 'devices' : selected === 'lte' ? 'lte' : 'traffic',
                    addonValue:
                      selected === 'devices'
                        ? deviceCount
                        : selected === 'lte'
                          ? ltePackages[lteIndex]?.gb
                          : mainPackages[mainIndex]?.gb,
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
                  Загрузка вариантов…
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
                <PackagePicker
                  packages={mainPackages}
                  selected={mainIndex}
                  onSelect={setMainIndex}
                />
              )}
              {!loading && !loadError && selected === 'lte' && (
                <PackagePicker packages={ltePackages} selected={lteIndex} onSelect={setLteIndex} />
              )}
              <button
                type="button"
                disabled={loading || !amount || !subscriptionId}
                onClick={() => setStep('payment')}
                className="button-lift mt-5 h-12 w-full rounded-full bg-ink text-sm font-bold text-bg disabled:cursor-not-allowed disabled:opacity-50"
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

function PackagePicker({
  packages,
  selected,
  onSelect,
}: {
  packages: readonly { gb: number; price: number }[];
  selected: number;
  onSelect: (index: number) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {packages.map((item, index) => (
        <button
          type="button"
          key={item.gb}
          aria-pressed={selected === index}
          onClick={() => onSelect(index)}
          className={`rounded-2xl border p-4 text-left ${selected === index ? 'border-mint bg-mint/[.12]' : 'glass-control'}`}
        >
          <strong className="block text-xl">{item.gb} ГБ</strong>
          <span className="mt-2 block text-sm font-bold text-mint">{item.price} ₽</span>
        </button>
      ))}
    </div>
  );
}
