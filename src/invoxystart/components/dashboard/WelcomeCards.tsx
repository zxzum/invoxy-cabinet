import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import {
  ArrowRight,
  CalendarDays,
  Check,
  ChevronRight,
  Headphones,
  Minus,
  Plus,
  Sparkles,
  Users,
} from '@/invoxystart/components/ui/RuneIcon';
import type { TrialInfo } from '@/invoxystart/api';
import { subscriptionApi } from '@/invoxystart/api';

const formatRubles = (value: number) => `${value.toLocaleString('ru-RU')} ₽`;

export function TrialCard({
  activated,
  onActivate,
  trialInfo,
}: {
  activated: boolean;
  onActivate: () => void;
  trialInfo?: Pick<
    TrialInfo,
    'is_available' | 'duration_days' | 'traffic_limit_gb' | 'device_limit' | 'reason_unavailable'
  > | null;
}) {
  const stats = trialInfo
    ? [
        [String(trialInfo.duration_days), 'дня'],
        [String(trialInfo.traffic_limit_gb), 'ГБ'],
        [String(trialInfo.device_limit), 'устройства'],
      ]
    : [];
  const unavailable = trialInfo && !trialInfo.is_available;
  return (
    <section className="glass-panel motion-card relative min-h-[292px] w-full overflow-hidden rounded-[30px] border border-mint/25 p-5 shadow-[0_0_38px_rgba(165,232,196,.06)] sm:p-6 lg:min-h-[300px] lg:rounded-[clamp(24px,1.2vw,30px)] lg:p-[clamp(22px,1.45vw,30px)]">
      <img
        src="/images/trial-card-bg.png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 hidden h-full w-full object-cover opacity-80 lg:block"
        decoding="async"
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_76%_36%,rgba(165,232,196,.2),transparent_34%),linear-gradient(120deg,rgba(15,18,20,.95),rgba(15,18,20,.58))] lg:bg-gradient-to-r lg:from-bg/90 lg:via-bg/45 lg:to-bg/10" />
      <img
        src="/images/trial-ribbon.png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute -right-14 top-5 w-[190px] opacity-95 mix-blend-screen drop-shadow-[0_0_20px_rgba(243,241,236,.16)] sm:-right-8 sm:top-4 sm:w-[285px] lg:hidden"
      />
      <div className="relative z-10 max-w-[64%] sm:max-w-[68%] lg:max-w-[460px]">
        <p className="text-[10px] font-bold tracking-[.18em] text-mint sm:text-[11px]">
          ВАШ ПОДАРОК
        </p>
        <h2 className="mt-2 text-[22px] font-medium leading-tight tracking-[-.05em] sm:text-4xl">
          Подарок для старта
        </h2>
        <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-muted sm:text-sm">
          Попробуйте защищённое соединение бесплатно и подключите свои устройства.
        </p>
        <div className="mt-4 grid max-w-[540px] grid-cols-3 gap-1.5 sm:gap-2">
          {stats.map(([value, label]) => (
            <div
              key={label}
              className="rounded-xl border border-mint/20 bg-mint/[.08] px-2 py-1.5 sm:rounded-2xl sm:px-3 sm:py-2"
            >
              <strong className="block text-base leading-tight text-mint sm:text-lg">
                {value}
              </strong>
              <span className="mt-0.5 block whitespace-nowrap text-[8px] leading-tight tracking-[-.04em] text-muted sm:truncate sm:text-[10px]">
                {label}
              </span>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={onActivate}
          disabled={activated || !trialInfo?.is_available}
          className="button-lift mt-4 flex h-11 w-full max-w-[540px] items-center justify-center gap-1 whitespace-nowrap rounded-full bg-mint px-2 text-[11px] font-bold text-bg transition-transform hover:-translate-y-0.5 disabled:cursor-default disabled:opacity-75 sm:h-12 sm:gap-2 sm:px-3 sm:text-sm"
        >
          {activated ? (
            <>
              <Check size={16} /> Пробный период активирован
            </>
          ) : unavailable ? (
            trialInfo.reason_unavailable || 'Пробный период недоступен'
          ) : trialInfo ? (
            <>
              Активировать подарок <ArrowRight size={16} />
            </>
          ) : (
            'Загрузка…'
          )}
        </button>
      </div>
    </section>
  );
}

export function StandardOfferCard({
  onPay,
}: {
  onPay: (amount: number, purpose: string, tariffId?: number, periodDays?: number) => void;
}) {
  const [months, setMonths] = useState(1);
  const [devices, setDevices] = useState(1);
  const [tariff, setTariff] = useState<{
    id: number;
    name: string;
    traffic: number;
    lte: number;
    devices: number;
    devicePrice: number;
    periods: { days: number; months: number; price: number; discount: number }[];
  } | null>(null);

  useEffect(() => {
    void subscriptionApi
      .getPurchaseOptions()
      .then((result) => {
        const values = Array.isArray(result.tariffs)
          ? (result.tariffs as Array<Record<string, unknown>>)
          : [];
        const value =
          values.find((item) => Boolean(item.is_highlighted)) ??
          values.find((item) => String(item.name || '').includes('Стандарт')) ??
          values[0];
        if (!value) return;
        const periods = (Array.isArray(value.periods) ? value.periods : [])
          .map((period) => {
            const row = period as Record<string, unknown>;
            const days = Number(row.days ?? 30);
            const periodMonths = Number(row.months ?? Math.max(1, Math.round(days / 30)));
            return {
              days,
              months: periodMonths,
              price: Number(row.price_kopeks ?? 0) / 100,
              discount: Number(row.discount_percent ?? 0),
            };
          })
          .filter((period) => period.price > 0);
        setTariff({
          id: Number(value.id),
          name: String(value.name || 'Тариф'),
          traffic: Number(value.traffic_limit_gb || 0),
          lte: Number(value.whitelist_traffic_limit_gb || 0),
          devices: Number(value.device_limit || 1),
          devicePrice: Number(value.device_price_kopeks || 0) / 100,
          periods,
        });
        setDevices(Number(value.device_limit || 1));
        setMonths(periods.find((period) => period.days === 30)?.months ?? periods[0]?.months ?? 1);
      })
      .catch(() => undefined);
  }, []);

  const selected = tariff?.periods.find((term) => term.months === months) ?? tariff?.periods[0];
  const extraDevices = Math.max(0, devices - (tariff?.devices ?? 1));
  const amount = selected
    ? selected.price + extraDevices * (tariff?.devicePrice ?? 0) * selected.months
    : 0;
  const saving = selected
    ? Math.max(
        0,
        (tariff?.periods.find((term) => term.months === 1)?.price ?? selected.price) *
          selected.months -
          selected.price,
      )
    : 0;

  return (
    <section className="glass-panel motion-card relative w-full rounded-[30px] border border-mint/25 p-5 shadow-[0_0_34px_rgba(165,232,196,.05)] sm:p-7 lg:rounded-[clamp(24px,1.2vw,30px)] lg:p-[clamp(24px,1.7vw,34px)]">
      <div className="flex items-start justify-between gap-4 pr-28 sm:pr-36">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-[10px] font-bold tracking-[.17em] text-mint sm:text-[11px]">
            <CalendarDays size={14} /> БЫСТРОЕ ОФОРМЛЕНИЕ
          </p>
          <h2 className="mt-3 text-2xl font-medium tracking-[-.045em] sm:text-3xl">
            {tariff?.name ?? 'Стандарт'}
          </h2>
          <p className="mt-1 text-xs text-muted sm:text-sm">
            Оптимальный тариф для ежедневного доступа
          </p>
          <Link
            to="/tariffs"
            className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-mint transition-colors hover:text-ink"
          >
            Все тарифы <ArrowRight size={13} />
          </Link>
        </div>
        <span className="recommended-badge absolute -right-px -top-px z-20 rounded-bl-2xl bg-mint px-3 py-2 text-[9px] font-bold text-bg shadow-[0_0_18px_rgba(165,232,196,.16)] sm:px-4 sm:py-2.5 sm:text-[10px]">
          РЕКОМЕНДУЕМ
        </span>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-1.5 sm:gap-2">
        {[
          [String(tariff?.traffic ?? 0), 'ГБ трафика'],
          [String(tariff?.lte ?? 0), 'ГБ LTE'],
          [String(tariff?.devices ?? 0), 'устройств'],
        ].map(([value, label]) => (
          <div key={label} className="rounded-2xl bg-white/[.045] px-2.5 py-2 sm:px-3 sm:py-2.5">
            <strong className="block text-lg font-medium leading-tight sm:text-xl">{value}</strong>
            <span className="mt-0.5 block truncate text-[9px] leading-tight text-muted sm:text-[10px]">
              {label}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between gap-3">
        <p className="text-xs font-semibold text-muted">Срок подписки</p>
        <p className="text-xs text-muted">
          от {formatRubles(tariff?.periods[0]?.price ?? 0)} / мес
        </p>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {(tariff?.periods ?? []).map((term) => (
          <button
            type="button"
            key={term.days}
            aria-pressed={months === term.months}
            onClick={() => setMonths(term.months)}
            className={`button-lift flex min-h-[56px] min-w-0 flex-col items-center justify-center rounded-2xl px-2 text-xs ${months === term.months ? 'bg-mint font-bold text-bg' : 'glass-control text-muted'}`}
          >
            <span>
              {term.days === 30 ? `${term.months} мес` : `${term.days} дней`}{' '}
              {term.discount > 0 && (
                <span className={months === term.months ? 'text-bg/70' : 'text-mint'}>
                  · −{term.discount}%
                </span>
              )}
            </span>
            <strong className="mt-1 text-sm">{formatRubles(term.price)}</strong>
          </button>
        ))}
      </div>
      <p className="mt-2 text-right text-[10px] font-semibold text-mint">
        {saving > 0
          ? `Выгода ${formatRubles(saving)} к помесячной оплате`
          : 'Без переплаты за один месяц'}
      </p>

      <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-white/[.035] px-3.5 py-3">
        <div>
          <p className="text-xs font-semibold">Устройства</p>
          <p className="mt-1 text-[10px] text-muted">
            +{formatRubles(tariff?.devicePrice ?? 0)} за дополнительное
          </p>
        </div>
        <div className="glass-control flex items-center rounded-full p-1">
          <button
            type="button"
            aria-label="Уменьшить количество устройств"
            disabled={devices <= (tariff?.devices ?? 1)}
            onClick={() => setDevices((value) => Math.max(tariff?.devices ?? 1, value - 1))}
            className="grid h-8 w-8 place-items-center rounded-full disabled:opacity-30"
          >
            <Minus size={14} />
          </button>
          <span className="w-7 text-center text-sm font-bold">{devices}</span>
          <button
            type="button"
            aria-label="Увеличить количество устройств"
            disabled={devices >= 10}
            onClick={() => setDevices((value) => Math.min(10, value + 1))}
            className="grid h-8 w-8 place-items-center rounded-full bg-mint text-bg disabled:opacity-30"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>
      <button
        type="button"
        disabled={!tariff || !selected}
        onClick={() =>
          selected &&
          onPay(
            amount,
            `Тариф ${tariff?.name || ''} · ${selected.months} мес.`,
            tariff?.id,
            selected.days,
          )
        }
        className="button-lift mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-ink text-sm font-bold text-bg transition-transform hover:-translate-y-0.5 active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {tariff ? `Выбрать способ оплаты · ${formatRubles(amount)}` : 'Загрузка тарифа…'}{' '}
        <ArrowRight size={16} />
      </button>
    </section>
  );
}

export function ReferralPromoCard() {
  return (
    <section className="glass-panel motion-card relative overflow-hidden rounded-[30px] border border-white/12 p-5 sm:p-7 lg:rounded-[clamp(24px,1.2vw,30px)] lg:p-[clamp(24px,1.7vw,34px)]">
      <img
        src="/images/referral-network-bg.png"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover opacity-80"
        decoding="async"
      />
      <div className="absolute inset-0 bg-[linear-gradient(110deg,rgba(11,12,14,.94),rgba(11,12,14,.32)),radial-gradient(circle_at_90%_10%,rgba(165,232,196,.2),transparent_38%)]" />
      <div className="relative z-10 flex items-end justify-between gap-5">
        <div className="min-w-0 max-w-xl">
          <p className="flex items-center gap-2 text-[10px] font-bold tracking-[.17em] text-mint sm:text-[11px]">
            <Sparkles size={14} /> РЕФЕРАЛЬНАЯ СИСТЕМА
          </p>
          <h2 className="mt-3 text-2xl font-medium tracking-[-.04em] sm:text-3xl">
            Пригласите друга
            <br />
            <span className="text-mint">получите бонус</span>
          </h2>
          <p className="mt-3 max-w-md text-xs leading-relaxed text-muted sm:text-sm">
            +50 ₽ за первую оплату друга и до 25% бонусами с его пополнений.
          </p>
          <Link
            to="/referrals"
            className="button-lift mt-5 inline-flex h-11 items-center gap-2 rounded-full bg-mint px-5 text-xs font-bold text-bg transition-transform hover:-translate-y-0.5 sm:h-12 sm:text-sm"
          >
            Открыть рефералы <ArrowRight size={16} />
          </Link>
        </div>
        <div className="hidden h-20 w-20 shrink-0 place-items-center rounded-full border border-mint/25 bg-mint/10 text-mint sm:grid">
          <Users size={30} />
        </div>
      </div>
    </section>
  );
}

export function SupportStrip() {
  return (
    <Link
      to="/support"
      className="glass-panel motion-card group flex items-center gap-3 rounded-[24px] p-4 transition-colors hover:border-mint/30 sm:p-5"
    >
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-mint/10 text-mint transition-transform duration-500 group-hover:scale-105">
        <Headphones size={20} />
      </span>
      <span className="min-w-0 flex-1">
        <strong className="block text-sm">Нужна помощь с подключением?</strong>
        <span className="mt-1 block text-xs text-muted">Поддержка в Telegram отвечает 24/7</span>
      </span>
      <ChevronRight
        size={18}
        className="shrink-0 text-muted transition-transform duration-300 group-hover:translate-x-1 group-hover:text-mint"
      />
    </Link>
  );
}
