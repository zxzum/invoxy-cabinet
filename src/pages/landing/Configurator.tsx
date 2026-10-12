import { useMemo, useState, type ReactNode } from 'react';
import { LayoutGroup, m, useReducedMotion } from 'framer-motion';
import type { CatalogTariff, PublicCatalog } from '@/api/publicCatalog';
import {
  configuredPrice,
  catalogSavings,
  defaultPeriodDays,
  extraDeviceCap,
  featuredTariff,
  formatKopeks,
  formatRubles,
  periodFor,
  ruCount,
  trafficFact,
  whitelistFact,
} from './catalogView';
import {
  BotLink,
  BuyLink,
  CabinetLink,
  Check,
  focusRing,
  primaryButton,
  quietButton,
  useEasedNumber,
} from './ui';
import type { LandingAuth } from './useLandingAuth';

interface Props {
  catalog: PublicCatalog | undefined;
  loading: boolean;
  failed: boolean;
  onRetry: () => void;
  botUrl: string | null;
  auth: LandingAuth;
}

export function Configurator({ catalog, loading, failed, onRetry, botUrl, auth }: Props) {
  const tariffs = useMemo(() => catalog?.tariffs ?? [], [catalog]);
  const [tariffId, setTariffId] = useState<number | null>(null);
  const [days, setDays] = useState<number | null>(null);
  const [extra, setExtra] = useState(0);

  const tariff: CatalogTariff | null =
    tariffs.find((item) => item.id === tariffId) ?? featuredTariff(tariffs);
  const wantedDays = days ?? defaultPeriodDays(tariff ? [tariff] : []);
  const period = tariff
    ? ((wantedDays ? periodFor(tariff, wantedDays) : undefined) ?? tariff.periods[0])
    : undefined;
  const cap = tariff ? extraDeviceCap(tariff) : 0;
  const price = tariff && period ? configuredPrice(tariff, period, Math.min(extra, cap)) : null;
  const savings = tariff && period ? catalogSavings(tariff, period) : null;

  const perMonth = useEasedNumber(price?.perMonthKopeks ?? 0);

  return (
    <div
      id="configurator"
      data-tilt
      className="relative rounded-3xl border border-white/10 bg-surface/70 p-5 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9)] backdrop-blur-xl sm:p-7"
    >
      <div className="pointer-events-none absolute inset-x-8 -top-px h-px bg-gradient-to-r from-transparent via-mint/60 to-transparent" />
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-display-landing text-xl font-semibold tracking-tight">
          Соберите подписку
        </h2>
      </div>

      {loading ? <ConfiguratorSkeleton /> : null}

      {failed && !loading ? (
        <div className="mt-6 rounded-2xl border border-line bg-bg/60 p-5">
          <p className="text-base text-ink">Не удалось загрузить тарифы.</p>
          <p className="mt-1 text-sm text-muted">
            Проверьте соединение и повторите. Тарифы также доступны в боте.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" className={`${quietButton} h-10`} onClick={onRetry}>
              Повторить
            </button>
            <BotLink href={botUrl} className={`${primaryButton} h-10`}>
              Открыть бота
            </BotLink>
          </div>
        </div>
      ) : null}

      {catalog && !tariff && !loading && !failed ? (
        <p className="mt-6 text-sm leading-relaxed text-muted">
          Сейчас публичных тарифов нет. Откройте бота: там покажут, что можно подключить.
        </p>
      ) : null}

      {tariff ? (
        <div className="mt-5 space-y-5">
          {tariffs.length > 1 ? (
            <Segmented
              label="Тариф"
              layoutKey="cfg-tariff"
              options={tariffs.map((item) => ({
                value: item.id,
                label: item.name,
              }))}
              selected={tariff.id}
              onSelect={(value) => {
                setTariffId(value);
                setDays(null);
                setExtra(0);
              }}
            />
          ) : (
            <p className="font-display-landing text-lg font-semibold">{tariff.name}</p>
          )}

          {tariff.periods.length > 1 && period ? (
            <Segmented
              label="Срок"
              layoutKey="cfg-period"
              options={[...tariff.periods]
                .sort((a, b) => a.days - b.days)
                .map((item) => ({
                  value: item.days,
                  label: item.label || `${item.days} дн.`,
                  hint:
                    catalogSavings(tariff, item).discount > 0
                      ? `−${catalogSavings(tariff, item).discount}%`
                      : undefined,
                }))}
              selected={period.days}
              onSelect={setDays}
            />
          ) : null}

          {cap > 0 ? (
            <DeviceStepper
              included={tariff.base_device_limit || tariff.device_limit || 0}
              extra={Math.min(extra, cap)}
              cap={cap}
              priceLabel={tariff.device_price_label}
              onChange={setExtra}
            />
          ) : null}

          <div className="rounded-2xl border border-line bg-bg/70 p-5" aria-live="polite">
            {price && period ? (
              <>
                <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
                  <p className="font-display-landing text-5xl font-semibold leading-none tracking-tight text-mint tabular-nums sm:text-6xl">
                    {formatRubles(perMonth)}
                  </p>
                  <p className="pb-1 text-sm text-muted">в месяц</p>
                </div>
                <p className="mt-3 text-sm text-ink tabular-nums">
                  {savings && savings.saving > 0 && (
                    <s className="mr-2 text-muted">
                      {formatKopeks(price.totalKopeks + savings.saving)}
                    </s>
                  )}
                  К оплате {formatKopeks(price.totalKopeks)} за{' '}
                  {period.label || `${period.days} дн.`}
                </p>
                {savings && savings.saving > 0 ? (
                  <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-yellow/10 px-3 py-1 text-xs font-medium text-yellow">
                    −{savings.discount}% · экономия {formatKopeks(savings.saving)}
                  </p>
                ) : null}
              </>
            ) : tariff.is_daily && tariff.daily_price_label ? (
              <p className="font-display-landing text-4xl font-semibold text-mint">
                {tariff.daily_price_label}
                <span className="ml-2 text-sm font-normal text-muted">в день</span>
              </p>
            ) : (
              <p className="text-sm text-muted">Цену на выбранный срок покажет бот.</p>
            )}
          </div>

          <ul className="grid gap-2 text-sm text-ink sm:grid-cols-2">
            <Fact>{trafficFact(tariff)}</Fact>
            {whitelistFact(tariff) ? <Fact>{whitelistFact(tariff)}</Fact> : null}
            {price && price.devices > 0 ? (
              <Fact>
                {price.devices} {ruCount(price.devices, 'устройство', 'устройства', 'устройств')}
              </Fact>
            ) : null}
            {tariff.traffic_reset_label ? <Fact>{tariff.traffic_reset_label}</Fact> : null}
          </ul>

          <div className="flex flex-col gap-3 sm:flex-row">
            <BuyLink auth={auth} className={`${primaryButton} sm:flex-1`} arrow>
              {auth.status === 'user' ? 'Перейти к оплате' : 'Оформить подписку'}
            </BuyLink>
            <CabinetLink auth={auth} className={`${quietButton} sm:flex-1`}>
              {auth.status === 'user' ? 'Открыть кабинет' : 'Войти'}
            </CabinetLink>
          </div>
          {botUrl ? (
            <p className="text-center text-xs text-muted">
              Можно и в{' '}
              <a
                href={botUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="underline underline-offset-4 hover:text-ink"
              >
                Telegram-боте
              </a>
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function Fact({ children }: { children: ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <Check className="mt-0.5 h-4 w-4 shrink-0 text-mint" />
      <span>{children}</span>
    </li>
  );
}

function Segmented<T extends number>({
  label,
  layoutKey,
  options,
  selected,
  onSelect,
}: {
  label: string;
  layoutKey: string;
  options: { value: T; label: string; hint?: string }[];
  selected: T;
  onSelect: (value: T) => void;
}) {
  const reduce = useReducedMotion();
  return (
    <LayoutGroup id={layoutKey}>
      <div>
        <p className="mb-2 text-xs text-muted">{label}</p>
        <div
          className="grid grid-cols-2 gap-1 rounded-2xl border border-line bg-bg/60 p-1 sm:flex sm:flex-wrap"
          role="radiogroup"
          aria-label={label}
        >
          {options.map((option) => {
            const active = option.value === selected;
            return (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => onSelect(option.value)}
                className={`relative min-h-12 min-w-0 flex-1 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${focusRing} ${
                  active ? 'text-bg' : 'text-muted hover:text-ink'
                }`}
              >
                {active ? (
                  <m.span
                    layoutId={reduce ? undefined : `${layoutKey}-pill`}
                    className="absolute inset-0 rounded-xl bg-mint"
                    transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                  />
                ) : null}
                <span className="relative block">
                  {option.label}
                  {option.hint ? (
                    <span
                      className={`block text-xs sm:ml-1.5 sm:inline ${active ? 'text-bg/70' : 'text-mint'}`}
                    >
                      {option.hint}
                    </span>
                  ) : null}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </LayoutGroup>
  );
}

function DeviceStepper({
  included,
  extra,
  cap,
  priceLabel,
  onChange,
}: {
  included: number;
  extra: number;
  cap: number;
  priceLabel?: string;
  onChange: (value: number) => void;
}) {
  const total = included + extra;
  const stepButton = `grid h-10 w-10 place-items-center rounded-xl border border-line text-lg text-ink transition-colors hover:border-mint/60 disabled:cursor-not-allowed disabled:opacity-30 ${focusRing}`;
  return (
    <div>
      <p className="mb-2 text-xs text-muted">Устройства</p>
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-bg/60 p-2 pl-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-ink tabular-nums">
            {total} {ruCount(total, 'устройство', 'устройства', 'устройств')}
          </p>
          <p className="text-xs text-muted">
            {included} в тарифе
            {priceLabel ? `, каждое следующее ${priceLabel} в месяц` : ''}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            className={stepButton}
            aria-label="Убрать устройство"
            disabled={extra <= 0}
            onClick={() => onChange(Math.max(0, extra - 1))}
          >
            −
          </button>
          <button
            type="button"
            className={stepButton}
            aria-label="Добавить устройство"
            disabled={extra >= cap}
            onClick={() => onChange(Math.min(cap, extra + 1))}
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfiguratorSkeleton() {
  return (
    <div className="mt-5 animate-pulse space-y-4" aria-hidden="true">
      <div className="h-12 rounded-2xl bg-surface-2" />
      <div className="h-12 rounded-2xl bg-surface-2" />
      <div className="h-32 rounded-2xl bg-surface-2" />
      <div className="h-12 rounded-full bg-surface-2" />
    </div>
  );
}
