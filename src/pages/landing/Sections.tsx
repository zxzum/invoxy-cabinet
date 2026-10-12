import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import {
  LayoutGroup,
  m,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from 'framer-motion';
import type { CatalogTariff, PublicCatalog } from '@/api/publicCatalog';
import brandLogo from '@/assets/landing/logo-192.png';
import heroImage from '@/assets/landing/hero.webp';
import shieldImage from '@/assets/landing/shield.webp';
import phoneImage from '@/assets/landing/phone.webp';
import laptopImage from '@/assets/landing/laptop.webp';
import orbImage from '@/assets/landing/orb.webp';
import keyImage from '@/assets/landing/key.webp';
import whitelistPath from '@/assets/landing/whitelist-path.webp';
import finalGlow from '@/assets/landing/final-glow.webp';
import {
  addonLines,
  catalogSavings,
  formatKopeks,
  defaultPeriodDays,
  featuredTariff,
  periodChoices,
  periodFor,
  trafficFact,
  trialSentence,
  whitelistFact,
} from './catalogView';
import {
  BotLink,
  BuyLink,
  CabinetLink,
  Check,
  CountUp,
  SplitTitle,
  focusRing,
  primaryButton,
  quietButton,
  type TitlePart,
} from './ui';
import type { LandingAuth } from './useLandingAuth';

export const sectionTitle =
  'font-display-landing text-3xl font-semibold leading-tight tracking-tight sm:text-5xl';

/* ───────────── Hero backdrop and shield ───────────── */

export function HeroBackdrop() {
  return (
    <div
      data-hero-bg
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      aria-hidden="true"
    >
      <img
        src={heroImage}
        alt=""
        fetchPriority="high"
        className="absolute inset-y-0 right-0 h-full w-full object-cover object-right opacity-50 lg:w-[75%] lg:opacity-80"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-bg from-20% via-bg/70 to-bg/10" />
      <div
        data-blob
        className="absolute -left-24 top-10 h-96 w-96 rounded-full bg-[#8b7bff]/25 blur-[110px]"
      />
      <div
        data-blob
        className="absolute right-[8%] top-[18%] h-[26rem] w-[26rem] rounded-full bg-[#5cd6ff]/20 blur-[120px]"
      />
      <div
        data-blob
        className="absolute bottom-0 left-[30%] h-80 w-80 rounded-full bg-[#a5e8c4]/20 blur-[110px]"
      />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-bg to-transparent" />
    </div>
  );
}

/** Floating glass shield that leans toward the pointer on desktop. */
export function HeroShield() {
  const reduce = useReducedMotion();
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const x = useSpring(useTransform(px, [-1, 1], [-14, 14]), { stiffness: 80, damping: 18 });
  const y = useSpring(useTransform(py, [-1, 1], [-10, 10]), { stiffness: 80, damping: 18 });
  const rotate = useSpring(useTransform(px, [-1, 1], [-5, 5]), { stiffness: 80, damping: 18 });

  useEffect(() => {
    if (reduce) return;
    const onMove = (event: PointerEvent) => {
      px.set((event.clientX / window.innerWidth) * 2 - 1);
      py.set((event.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, [reduce, px, py]);

  return (
    <m.div
      className="pointer-events-none absolute -right-1 -top-12 z-10 w-24 sm:-right-4 sm:-top-14 sm:w-32 lg:-right-10 lg:-top-5 lg:w-40"
      style={{ x, y, rotate }}
      aria-hidden="true"
    >
      <m.img
        src={shieldImage}
        alt=""
        width={900}
        height={900}
        className="w-full drop-shadow-[0_30px_40px_rgba(0,0,0,0.6)]"
        animate={reduce ? undefined : { y: [0, -12, 0] }}
        transition={{ duration: 6, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
      />
    </m.div>
  );
}

/* ───────────── Value strip ───────────── */

export interface StripItem {
  label: string;
  prefix?: string;
  value?: number;
  suffix?: string;
  text?: string;
}

const stripColors = ['#a5e8c4', '#5cd6ff', '#8b7bff', '#ff7ad9'];

export function ValueStrip({ items }: { items: StripItem[] }) {
  if (!items.length) return null;
  return (
    <section aria-label="Коротко о сервисе" className="border-y border-line/70 bg-surface/40">
      <dl className="mx-auto grid max-w-6xl grid-cols-2 gap-px px-4 sm:px-6 md:grid-cols-4">
        {items.map((item, index) => (
          <div key={item.label} className="px-1 py-7 sm:px-4">
            <dd
              className="font-display-landing text-3xl font-semibold tracking-tight sm:text-4xl"
              style={{ color: stripColors[index % stripColors.length] }}
            >
              {item.value !== undefined ? (
                <CountUp value={item.value} prefix={item.prefix} suffix={item.suffix} />
              ) : (
                item.text
              )}
            </dd>
            <dt className="mt-1 text-sm text-muted">{item.label}</dt>
          </div>
        ))}
      </dl>
    </section>
  );
}

/* ───────────── Tariffs ───────────── */

const ACCENTS = [
  { c: '#5cd6ff', c2: '#8b7bff' },
  { c: '#a5e8c4', c2: '#5cd6ff' },
  { c: '#8b7bff', c2: '#ff7ad9' },
  { c: '#ff7ad9', c2: '#f5f17a' },
];

export function TariffSection({
  catalog,
  loading,
  failed,
  onRetry,
  auth,
}: {
  catalog: PublicCatalog | undefined;
  loading: boolean;
  failed: boolean;
  onRetry: () => void;
  auth: LandingAuth;
}) {
  const reduce = useReducedMotion();
  const tariffs = catalog?.tariffs ?? [];
  const choices = periodChoices(tariffs);
  const [days, setDays] = useState<number | null>(null);
  const selected = days ?? defaultPeriodDays(tariffs);
  const featured = featuredTariff(tariffs);

  return (
    <section id="tariffs" className="relative scroll-mt-20">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <SplitTitle
              mode="scroll"
              className={sectionTitle}
              parts={[{ text: 'Тарифы' }, { text: 'без сюрпризов', aurora: true }]}
            />
            <p data-reveal className="mt-4 max-w-[52ch] text-base leading-relaxed text-muted">
              Срок, трафик, устройства и доплаты берутся из кассы. Сумма на оплате совпадает с
              карточкой.
            </p>
          </div>
          {choices.length > 1 && selected ? (
            <LayoutGroup id="tariff-grid-period">
              <div
                data-reveal
                className="inline-flex flex-wrap gap-1 self-start rounded-full border border-line bg-surface p-1 md:self-auto"
                role="radiogroup"
                aria-label="Срок оплаты"
              >
                {choices.map((value) => {
                  const sample = tariffs
                    .flatMap((tariff) => tariff.periods)
                    .find((period) => period.days === value);
                  const active = value === selected;
                  return (
                    <button
                      key={value}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setDays(value)}
                      className={`relative rounded-full px-4 py-2 text-sm font-medium transition-colors ${focusRing} ${
                        active ? 'text-bg' : 'text-muted hover:text-ink'
                      }`}
                    >
                      {active ? (
                        <m.span
                          layoutId={reduce ? undefined : 'grid-period-pill'}
                          className="bg-aurora absolute inset-0 rounded-full"
                          transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                        />
                      ) : null}
                      <span className="relative">{sample?.label || `${value} дн.`}</span>
                    </button>
                  );
                })}
              </div>
            </LayoutGroup>
          ) : null}
        </div>

        {loading ? (
          <div
            className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
            aria-hidden="true"
          >
            {[0, 1, 2].map((item) => (
              <div
                key={item}
                className="h-80 animate-pulse rounded-3xl border border-line bg-surface"
              />
            ))}
          </div>
        ) : null}

        {failed && !loading ? (
          <div className="mt-10 rounded-3xl border border-line bg-surface p-6">
            <p className="text-base text-ink">Тарифы не загрузились.</p>
            <p className="mt-2 text-sm text-muted">Проверьте связь и повторите попытку.</p>
            <button type="button" className={`${quietButton} mt-5`} onClick={onRetry}>
              Повторить
            </button>
          </div>
        ) : null}

        {catalog && tariffs.length === 0 && !loading ? (
          <p className="mt-10 max-w-[48ch] text-base text-muted">
            Сейчас публичных тарифов нет. Загляните позже или напишите в поддержку.
          </p>
        ) : null}

        {selected ? (
          <ul
            data-stagger
            className="mt-12 grid grid-cols-1 items-stretch gap-5 md:grid-cols-2 xl:grid-cols-3"
          >
            {tariffs.map((tariff, index) => (
              <li key={tariff.id} className="min-w-0">
                <TariffCard
                  tariff={tariff}
                  days={selected}
                  auth={auth}
                  featured={tariff.id === featured?.id}
                  accent={tariff.id === featured?.id ? ACCENTS[1] : ACCENTS[index % ACCENTS.length]}
                />
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}

function TariffCard({
  tariff,
  days,
  auth,
  accent,
  featured,
}: {
  tariff: CatalogTariff;
  days: number;
  auth: LandingAuth;
  accent: { c: string; c2: string };
  featured: boolean;
}) {
  const period = periodFor(tariff, days);
  const savings = period ? catalogSavings(tariff, period) : null;
  const lines = addonLines(tariff);
  const lte = whitelistFact(tariff);
  const hot = featured;
  return (
    <article
      data-spot
      style={{ '--accent': accent.c, '--accent-2': accent.c2 } as CSSProperties}
      className="spot edge-glow relative flex h-full flex-col rounded-3xl bg-gradient-to-b from-surface-2/80 to-surface p-6 transition-transform duration-300 hover:-translate-y-1.5"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="break-words font-display-landing text-2xl font-semibold">{tariff.name}</h3>
        {hot ? (
          <span className="bg-aurora shrink-0 rounded-full px-3 py-1 text-xs font-semibold text-bg">
            Низкая цена
          </span>
        ) : null}
      </div>
      {period ? (
        <div className="mt-6">
          <p
            className="font-display-landing text-5xl font-semibold tracking-tight tabular-nums"
            style={{ color: accent.c }}
          >
            {period.price_per_month_label}
          </p>
          <p className="mt-1 text-sm text-muted">
            {period.price_label === period.price_per_month_label
              ? 'в месяц'
              : `в месяц, ${period.price_label} за срок`}
          </p>
          {savings && savings.saving > 0 ? (
            <p className="mt-3 inline-block rounded-full bg-yellow/10 px-3 py-1 text-xs font-medium text-yellow">
              −{savings.discount}% · экономия {formatKopeks(savings.saving)}
            </p>
          ) : null}
        </div>
      ) : (
        <p className="mt-6 text-sm text-muted">На этот срок тариф не продаётся.</p>
      )}
      <ul className="mt-6 space-y-2.5 text-sm leading-relaxed text-ink">
        <li className="flex gap-2">
          <Check className="mt-0.5 h-4 w-4 shrink-0" />
          {trafficFact(tariff)}
        </li>
        {lte ? (
          <li className="flex gap-2">
            <Check className="mt-0.5 h-4 w-4 shrink-0" />
            {lte}
          </li>
        ) : null}
        {lines.map((line) => (
          <li key={line} className="flex gap-2 text-muted">
            <Check className="mt-0.5 h-4 w-4 shrink-0 opacity-60" />
            {line}
          </li>
        ))}
      </ul>
      {tariff.description ? (
        <details className="mt-4 text-sm text-muted">
          <summary className={`cursor-pointer rounded text-ink ${focusRing}`}>
            Подробнее о тарифе
          </summary>
          <p className="mt-3 whitespace-pre-line leading-relaxed">{tariff.description}</p>
        </details>
      ) : null}
      <div className="mt-auto pt-6">
        <BuyLink auth={auth} className={`${hot ? primaryButton : quietButton} w-full`}>
          {auth.status === 'user' ? 'Выбрать' : 'Начать'}
        </BuyLink>
      </div>
    </article>
  );
}

/* ───────────── Trial hook ───────────── */

export function TrialBand({
  catalog,
  auth,
}: {
  catalog: PublicCatalog | undefined;
  auth: LandingAuth;
}) {
  if (!catalog?.trial) return null;
  const trial = catalog.trial;
  const title: TitlePart[] = trial.requires_payment
    ? [{ text: 'Начните с' }, { text: 'короткого теста', aurora: true }]
    : [
        { text: 'Попробуйте' },
        { text: 'бесплатно', aurora: true },
        { text: `${trial.duration_days} дн.` },
      ];
  return (
    <section aria-labelledby="trial-title" className="mx-auto max-w-6xl px-4 sm:px-6">
      <div className="relative overflow-hidden rounded-3xl border border-mint/30 bg-gradient-to-br from-[#10261d] via-[#101725] to-surface p-7 sm:p-12">
        <div
          data-blob
          className="pointer-events-none absolute -right-20 -top-24 h-80 w-80 rounded-full bg-[#5cd6ff]/20 blur-3xl"
        />
        <div
          data-blob
          className="pointer-events-none absolute -bottom-24 left-1/4 h-72 w-72 rounded-full bg-[#8b7bff]/20 blur-3xl"
        />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-[56ch]">
            <SplitTitle mode="scroll" className={sectionTitle} parts={title} />
            <p id="trial-title" data-reveal className="mt-4 text-base leading-relaxed text-ink/80">
              {trialSentence(trial)}
            </p>
          </div>
          <span data-magnetic className="inline-block shrink-0 self-start md:self-center">
            {auth.status === 'user' ? (
              <CabinetLink auth={auth} className={primaryButton} arrow>
                Открыть кабинет
              </CabinetLink>
            ) : (
              <BuyLink auth={auth} className={primaryButton} arrow>
                {trial.requires_payment ? 'Начать' : 'Попробовать бесплатно'}
              </BuyLink>
            )}
          </span>
        </div>
      </div>
    </section>
  );
}

/* ───────────── How it works ───────────── */

const steps = [
  {
    title: 'Создайте аккаунт',
    text: 'Через Telegram или по почте, меньше минуты.',
  },
  {
    title: 'Выберите тариф',
    text: 'Срок, устройства и итоговая сумма видны до оплаты. Платить можно в кабинете или в Telegram-боте.',
  },
  {
    title: 'Подключите устройство',
    text: 'Кабинет подскажет приложение и выдаст ключ. Расход трафика и устройства видны там же.',
  },
];

export function HowItWorks({ auth }: { auth: LandingAuth }) {
  return (
    <section id="start" className="scroll-mt-20 border-t border-line/70">
      <div className="mx-auto grid max-w-6xl gap-14 px-4 py-20 sm:px-6 sm:py-28 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div>
          <SplitTitle
            mode="scroll"
            className={sectionTitle}
            parts={[{ text: 'Подключение' }, { text: 'за три шага', aurora: true }]}
          />
          <div data-steps className="relative mt-12">
            <div className="absolute bottom-6 left-[21px] top-6 w-px bg-line" aria-hidden="true" />
            <div
              data-steps-line
              className="bg-aurora absolute bottom-6 left-[21px] top-6 w-px origin-top"
              aria-hidden="true"
            />
            <ol className="space-y-10">
              {steps.map((step, index) => (
                <li key={step.title} data-step className="relative flex gap-5">
                  <span className="step-dot relative z-10 grid h-11 w-11 shrink-0 place-items-center rounded-full border border-line bg-bg font-display-landing text-lg font-semibold text-muted">
                    {index + 1}
                  </span>
                  <div className="step-body">
                    <h3 className="font-display-landing text-xl font-semibold">{step.title}</h3>
                    <p className="mt-1.5 max-w-[48ch] text-sm leading-relaxed text-muted">
                      {step.text}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <div data-reveal className="mt-10 flex flex-col gap-3 sm:flex-row">
            {auth.status === 'user' ? (
              <CabinetLink auth={auth} className={primaryButton} arrow>
                Открыть кабинет
              </CabinetLink>
            ) : (
              <>
                <BuyLink auth={auth} className={primaryButton} arrow>
                  Создать аккаунт
                </BuyLink>
                <CabinetLink auth={auth} className={quietButton}>
                  Войти
                </CabinetLink>
              </>
            )}
          </div>
        </div>
        <PhoneStage />
      </div>
    </section>
  );
}

const ticks = ['Аккаунт создан', 'Тариф оплачен', 'Устройство подключено'];

function PhoneStage() {
  return (
    <div className="relative mx-auto w-full max-w-md">
      <img
        data-parallax="90"
        src={phoneImage}
        alt=""
        loading="lazy"
        width={900}
        height={900}
        className="mx-auto w-[88%] drop-shadow-[0_40px_60px_rgba(0,0,0,0.55)]"
        aria-hidden="true"
      />
      <div
        data-ticks
        className="relative -mt-32 rounded-[2rem] border border-white/10 bg-surface/90 p-5 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9)] backdrop-blur-xl sm:-mt-52 sm:ml-auto sm:w-[82%]"
        aria-hidden="true"
      >
        <div className="flex items-center gap-2.5 border-b border-line pb-3">
          <img src={brandLogo} alt="" className="h-8 w-8 rounded-full object-contain" />
          <p className="text-sm font-semibold">Invoxy</p>
        </div>
        <ul className="mt-4 space-y-3 text-sm">
          {ticks.map((tick, index) => (
            <li
              key={tick}
              data-tick
              className="flex items-center gap-3 rounded-2xl bg-surface-2 px-4 py-3"
            >
              <span
                className="grid h-6 w-6 place-items-center rounded-full text-bg"
                style={{ backgroundColor: ['#a5e8c4', '#5cd6ff', '#8b7bff'][index] }}
              >
                <Check className="h-3.5 w-3.5" />
              </span>
              {tick}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ───────────── Cabinet ───────────── */

const cabinetPoints = [
  'Расход трафика и белого интернета',
  'Список устройств и их удаление',
  'Продление, смена тарифа и докупка трафика',
  'Реферальная программа и поддержка',
];

const chips = [
  { label: 'Подписка', color: '#a5e8c4', pos: 'left-0 top-[12%]' },
  { label: 'Трафик', color: '#5cd6ff', pos: 'right-0 top-[4%]' },
  { label: 'Устройства', color: '#8b7bff', pos: 'left-[4%] bottom-[10%]' },
  { label: 'Продление', color: '#ff7ad9', pos: 'right-[2%] bottom-[18%]' },
];

export function CabinetSection({ auth }: { auth: LandingAuth }) {
  return (
    <section id="cabinet" className="scroll-mt-20 border-t border-line/70">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 sm:py-28 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div>
          <SplitTitle
            mode="scroll"
            className={sectionTitle}
            parts={[
              { text: 'Личный кабинет:' },
              { text: 'вся подписка', aurora: true },
              { text: 'в одном окне' },
            ]}
          />
          <p data-reveal className="mt-4 max-w-[48ch] text-base leading-relaxed text-muted">
            Всё видно и управляется в кабинете. Вход через Telegram или по почте.
          </p>
          <ul data-stagger className="mt-6 space-y-3 text-sm">
            {cabinetPoints.map((point) => (
              <li key={point} className="flex gap-3">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-mint" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
          <div data-reveal className="mt-8">
            <CabinetLink auth={auth} className={primaryButton} arrow>
              {auth.status === 'user' ? 'Открыть кабинет' : 'Войти в кабинет'}
            </CabinetLink>
          </div>
        </div>
        <div className="relative mx-auto w-full max-w-xl">
          <img
            data-parallax="50"
            src={laptopImage}
            alt=""
            loading="lazy"
            width={900}
            height={675}
            className="w-full drop-shadow-[0_40px_60px_rgba(0,0,0,0.55)]"
            aria-hidden="true"
          />
          {chips.map((chip) => (
            <span
              key={chip.label}
              data-float
              aria-hidden="true"
              className={`absolute ${chip.pos} inline-flex items-center gap-2 rounded-full border border-white/10 bg-surface/80 px-3.5 py-2 text-xs font-medium backdrop-blur-xl`}
              style={{ boxShadow: `0 10px 30px -10px ${chip.color}88` }}
            >
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: chip.color }} />
              {chip.label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────── Whitelist ───────────── */

export function WhitelistSection({ catalog }: { catalog: PublicCatalog | undefined }) {
  const tariff =
    catalog?.tariffs.find((item) => (item.whitelist_traffic_limit_gb ?? 0) > 0) ?? null;
  const wl = tariff?.whitelist_traffic_limit_gb ?? 0;
  return (
    <section
      id="whitelist"
      className="relative isolate scroll-mt-20 overflow-hidden border-t border-line/70"
    >
      <img
        data-parallax="90"
        src={whitelistPath}
        alt=""
        loading="lazy"
        className="pointer-events-none absolute inset-x-0 -top-12 -z-10 h-[calc(100%+6rem)] w-full object-cover opacity-70"
        aria-hidden="true"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-bg via-bg/80 to-bg/30" />
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 sm:py-28 lg:grid-cols-2 lg:items-center">
        <div>
          <SplitTitle
            mode="scroll"
            className={sectionTitle}
            parts={[{ text: 'Белый интернет' }, { text: 'считается отдельно', aurora: true }]}
          />
          <p data-reveal className="mt-4 max-w-[54ch] text-base leading-relaxed text-muted">
            Это свой запас трафика для сотовой сети. Он виден в кабинете рядом с обычным VPN. Когда
            запас кончается, обычное подключение остаётся, если у тарифа ещё есть его лимит. Доступ
            к конкретному сайту зависит и от оператора.
          </p>
        </div>
        <div data-stagger className="grid gap-4 sm:grid-cols-2">
          <div
            data-spot
            style={{ '--accent': '#5cd6ff', '--accent-2': '#8b7bff' } as CSSProperties}
            className="spot edge-glow relative rounded-3xl bg-surface/90 p-6 backdrop-blur"
          >
            <p className="text-sm text-muted">Обычный VPN</p>
            <p className="mt-3 font-display-landing text-4xl font-semibold text-[#5cd6ff]">
              {tariff && tariff.traffic_limit_gb > 0 ? (
                <CountUp value={tariff.traffic_limit_gb} suffix=" ГБ" />
              ) : (
                'Безлимит'
              )}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Для Wi-Fi и мобильной сети, где доступен обычный интернет.
            </p>
          </div>
          <div
            data-spot
            style={{ '--accent': '#a5e8c4', '--accent-2': '#5cd6ff' } as CSSProperties}
            className="spot edge-glow relative rounded-3xl bg-gradient-to-b from-[#10261d] to-surface p-6"
          >
            <div className="flex items-start justify-between">
              <p className="text-sm text-mint">Белый интернет</p>
              <img
                data-float
                src={orbImage}
                alt=""
                loading="lazy"
                className="-mr-2 -mt-3 h-14 w-14"
                aria-hidden="true"
              />
            </div>
            <p className="mt-3 font-display-landing text-4xl font-semibold text-mint">
              {wl > 0 ? <CountUp value={wl} suffix=" ГБ" /> : 'Свой запас'}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Отдельный лимит для сотовой сети. Расход считается независимо.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ───────────── Lazeika → Invoxy ───────────── */

export function LazeikaSection({ botUrl, auth }: { botUrl: string | null; auth: LandingAuth }) {
  return (
    <section id="lazeika" className="scroll-mt-20 border-t border-line/70">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        <div className="relative overflow-hidden rounded-3xl border border-line bg-gradient-to-br from-surface via-surface to-[#17142b] p-7 sm:p-12">
          <div
            data-blob
            className="pointer-events-none absolute -right-10 top-0 h-72 w-72 rounded-full bg-[#8b7bff]/25 blur-3xl"
          />
          <div className="relative grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <SplitTitle
                mode="scroll"
                className={sectionTitle}
                parts={[
                  { text: 'Invoxy — новый проект после' },
                  { text: 'Lazeika VPN', aurora: true },
                ]}
              />
              <p data-reveal className="mt-4 max-w-[56ch] text-base leading-relaxed text-muted">
                Если вы пользовались Лазейкой, оплаченную подписку можно перенести в Invoxy с
                бонусом +5 дней. Перенос идёт по вашему Telegram-аккаунту, пробный период не
                переносится. Откройте Telegram-бота и отправьте команду{' '}
                <code className="rounded bg-surface-2 px-1.5 py-0.5 text-ink">/migrate</code>.
              </p>
            </div>
            <div className="relative flex flex-col gap-3">
              <div className="relative mx-auto h-40 w-40">
                <img
                  data-spin
                  src={keyImage}
                  alt=""
                  loading="lazy"
                  width={900}
                  height={900}
                  className="h-full w-full drop-shadow-[0_24px_30px_rgba(0,0,0,0.5)]"
                  aria-hidden="true"
                />
              </div>
              <BotLink href={botUrl} className={primaryButton} arrow>
                Перенести через бота
              </BotLink>
              {auth.status === 'user' ? null : (
                <BuyLink auth={auth} className={quietButton}>
                  Сначала создать аккаунт
                </BuyLink>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ───────────── FAQ ───────────── */

function FaqItem({ question, children }: { question: string; children: ReactNode }) {
  return (
    <details className="group py-5">
      <summary
        className={`flex cursor-pointer list-none items-center justify-between gap-4 rounded font-display-landing text-lg font-semibold marker:content-none ${focusRing}`}
      >
        <span>{question}</span>
        <span
          className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-line text-muted transition-transform duration-200 group-open:rotate-45 group-open:border-mint group-open:text-mint"
          aria-hidden="true"
        >
          +
        </span>
      </summary>
      <div className="mt-3 max-w-[65ch] text-sm leading-relaxed text-muted">{children}</div>
    </details>
  );
}

export function FaqSection({
  catalog,
  supportUrl,
  showWhitelist,
}: {
  catalog: PublicCatalog | undefined;
  supportUrl: string;
  showWhitelist: boolean;
}) {
  return (
    <section id="faq" className="scroll-mt-20 border-t border-line/70">
      <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6 sm:py-28">
        <SplitTitle
          mode="scroll"
          className={sectionTitle}
          parts={[{ text: 'Частые' }, { text: 'вопросы', aurora: true }]}
        />
        <div data-reveal className="mt-8 divide-y divide-line/80 border-y border-line/80">
          <FaqItem question="Откуда цены на этой странице?">
            Из кассы. Если тариф, срок или доплату изменят в админке, страница покажет новые цифры
            после загрузки.
          </FaqItem>
          {catalog?.trial ? (
            <FaqItem question="Как устроен пробный период?">{trialSentence(catalog.trial)}</FaqItem>
          ) : null}
          <FaqItem question="Нужен ли Telegram?">
            Нет. Аккаунт можно создать по почте. Telegram-бот остаётся дополнительным способом
            купить и подключиться.
          </FaqItem>
          <FaqItem question="Сколько устройств можно подключить?">
            На каждой карточке написано, сколько устройств уже входит и сколько стоит ещё одно, если
            докупка включена.
          </FaqItem>
          <FaqItem question="Где оплатить?">
            В личном кабинете и в Telegram-боте. Перед оплатой видна итоговая сумма и срок.
          </FaqItem>
          {showWhitelist ? (
            <FaqItem question="Что такое белый интернет?">
              Отдельный запас трафика для сотовой сети. Он считается независимо от обычного VPN и
              виден в кабинете. Доступ к конкретному сайту зависит и от оператора.
            </FaqItem>
          ) : null}
          <FaqItem question="Я пользовался Lazeika VPN. Что с подпиской?">
            Оплаченную подписку можно перенести в Invoxy с бонусом +5 дней: откройте Telegram-бота и
            отправьте /migrate. Пробный период не переносится.
          </FaqItem>
          <FaqItem question="Куда писать, если что-то не работает?">
            <a
              href={supportUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="text-mint underline-offset-4 hover:underline"
            >
              В поддержку в Telegram
            </a>
            . Опишите, что произошло и на каком устройстве.
          </FaqItem>
        </div>
      </div>
    </section>
  );
}

/* ───────────── Final CTA ───────────── */

export function FinalCta({
  catalog,
  auth,
}: {
  catalog: PublicCatalog | undefined;
  auth: LandingAuth;
}) {
  const free = catalog?.trial && !catalog.trial.requires_payment;
  return (
    <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6 sm:pb-28">
      <div className="relative isolate overflow-hidden rounded-3xl border border-line p-8 sm:p-16">
        <img
          src={finalGlow}
          alt=""
          loading="lazy"
          className="absolute inset-0 -z-10 h-full w-full object-cover"
          aria-hidden="true"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-bg/90 via-bg/60 to-transparent" />
        <SplitTitle
          mode="scroll"
          className={`${sectionTitle} max-w-[16ch]`}
          parts={
            auth.status === 'user'
              ? [{ text: 'Всё готово' }, { text: 'в кабинете', aurora: true }]
              : free
                ? [{ text: 'Проверьте' }, { text: 'Invoxy', aurora: true }, { text: 'на себе' }]
                : [{ text: 'Подключите' }, { text: 'Invoxy', aurora: true }]
          }
        />
        <p data-reveal className="mt-4 max-w-[46ch] text-base leading-relaxed text-ink/80">
          Один аккаунт для покупки, ключа, трафика и устройств.
        </p>
        <div data-reveal className="mt-8 flex flex-col gap-3 sm:flex-row">
          <span data-magnetic className="inline-block">
            {auth.status === 'user' ? (
              <CabinetLink auth={auth} className={primaryButton} arrow>
                Открыть кабинет
              </CabinetLink>
            ) : (
              <BuyLink auth={auth} className={primaryButton} arrow>
                {free ? 'Попробовать бесплатно' : 'Создать аккаунт'}
              </BuyLink>
            )}
          </span>
          {auth.status === 'user' ? (
            <BuyLink auth={auth} className={quietButton}>
              Выбрать тариф
            </BuyLink>
          ) : (
            <CabinetLink auth={auth} className={quietButton}>
              Войти
            </CabinetLink>
          )}
        </div>
      </div>
    </section>
  );
}
