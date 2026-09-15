import { m } from 'framer-motion';
import { Link } from 'react-router';
import { BrandLogo } from '@/invoxystart/components/layout/BrandLogo';
import {
  ArrowRight,
  Check,
  Globe2,
  LockKeyhole,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Zap,
} from '@/invoxystart/components/ui/RuneIcon';

const TELEGRAM_BOT_URL = 'https://t.me/invoxy_bot';

const features = [
  {
    icon: Zap,
    title: 'Быстро в один клик',
    text: 'Откройте бота, выберите устройство — защищённое соединение готово за минуту.',
  },
  {
    icon: Smartphone,
    title: 'Для всех устройств',
    text: 'Один аккаунт для телефона, ноутбука и планшета. До 10 подключений в одном тарифе.',
  },
  {
    icon: Globe2,
    title: 'Свобода без границ',
    text: 'Стабильный доступ к нужным сервисам дома, в дороге и в любой сети.',
  },
];

const steps = [
  ['01', 'Запустите бота', 'Telegram сам проведёт вас по короткой настройке.'],
  ['02', 'Выберите тариф', 'Подключите подходящий срок и добавьте устройства при необходимости.'],
  ['03', 'Подключайтесь', 'Скопируйте ключ и оставайтесь онлайн без лишних действий.'],
];

export function LandingPage() {
  return (
    <main className="landing-page min-h-screen overflow-x-clip bg-bg text-ink">
      <section className="relative isolate overflow-hidden border-b border-white/8">
        <img
          src="/images/landing-hero.png"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute right-[-22%] top-[-6%] z-[-2] h-[690px] w-[900px] max-w-none object-cover opacity-55 mix-blend-screen sm:right-[-15%] lg:right-[-8%] lg:top-[-12%] lg:h-[820px] lg:w-[1200px]"
        />
        <div className="pointer-events-none absolute inset-0 z-[-1] bg-[radial-gradient(circle_at_78%_24%,rgba(165,232,196,.13),transparent_30%),linear-gradient(180deg,rgba(11,12,14,.38),#0b0c0e_92%)]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 z-[-1] h-28 bg-[linear-gradient(90deg,rgba(165,232,196,.07)_1px,transparent_1px),linear-gradient(rgba(165,232,196,.07)_1px,transparent_1px)] bg-[size:72px_72px] [mask-image:linear-gradient(to_bottom,black,transparent)]" />

        <nav className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-5 py-5 sm:px-8 lg:px-10 lg:py-7">
          <Link
            to="/"
            aria-label="InvoxyVPN — на главную"
            className="shrink-0 rounded-2xl outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-mint/70"
          >
            <BrandLogo
              iconClassName="h-9 w-9 rounded-xl sm:h-10 sm:w-10"
              textClassName="text-base font-bold sm:text-lg"
            />
          </Link>
          <div className="hidden items-center gap-7 text-sm text-muted md:flex">
            <a href="#features" className="transition-colors hover:text-ink">
              Возможности
            </a>
            <a href="#security" className="transition-colors hover:text-ink">
              Как работает
            </a>
            <a href="#start" className="transition-colors hover:text-ink">
              Подключение
            </a>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/login"
              className="hidden rounded-full px-3 py-2 text-sm font-semibold text-muted transition-colors hover:text-ink sm:inline-flex"
            >
              Войти
            </Link>
            <Link
              to="/register"
              className="button-lift inline-flex h-10 items-center rounded-full bg-ink px-4 text-xs font-bold text-bg sm:h-11 sm:px-5 sm:text-sm"
            >
              Создать аккаунт
            </Link>
          </div>
        </nav>

        <div className="relative z-10 mx-auto grid w-full max-w-7xl items-center gap-8 px-5 pb-16 pt-10 sm:px-8 sm:pb-24 lg:grid-cols-[minmax(0,.83fr)_minmax(420px,1.17fr)] lg:gap-4 lg:px-10 lg:pb-28 lg:pt-16">
          <m.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65 }}
            className="max-w-2xl"
          >
            <p className="inline-flex items-center gap-2 rounded-full border border-mint/20 bg-mint/[.07] px-3 py-1.5 text-[10px] font-bold tracking-[.2em] text-mint sm:text-[11px]">
              <Sparkles size={13} /> VPN ДЛЯ СВОБОДЫ
            </p>
            <h1 className="mt-6 max-w-[720px] text-[clamp(48px,7vw,92px)] font-medium leading-[.92] tracking-[-.065em]">
              Связь
              <br />
              <span className="text-mint">без границ.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
              Invoxy защищает соединение и держит ваши устройства онлайн — спокойно, быстро, без
              лишнего шума.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <a
                href={TELEGRAM_BOT_URL}
                target="_blank"
                rel="noreferrer"
                className="button-lift inline-flex h-13 items-center justify-center gap-2 rounded-full bg-mint px-6 text-sm font-bold text-bg shadow-[0_10px_36px_rgba(165,232,196,.18)] transition-transform hover:-translate-y-0.5 active:scale-[.98]"
              >
                Открыть Telegram-бота <ArrowRight size={17} />
              </a>
              <Link
                to="/register"
                className="inline-flex h-13 items-center justify-center rounded-full border border-white/12 px-6 text-sm font-semibold text-ink transition-colors hover:border-mint/40 hover:bg-white/[.04]"
              >
                Регистрация
              </Link>
            </div>
            <div className="mt-9 flex flex-wrap items-center gap-x-5 gap-y-3 text-xs text-muted sm:text-sm">
              {['Без привязки карты', 'Поддержка 24/7', 'Старт за 60 секунд'].map((item) => (
                <span key={item} className="inline-flex items-center gap-2">
                  <Check size={14} className="text-mint" />
                  {item}
                </span>
              ))}
            </div>
          </m.div>

          <m.div
            initial={{ opacity: 0, scale: 0.96, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.12 }}
            className="relative mx-auto w-full max-w-[620px] lg:ml-auto"
          >
            <div className="absolute -inset-5 rounded-[44px] bg-mint/[.07] blur-3xl" />
            <div className="glass-panel relative overflow-hidden rounded-[32px] border-white/12 p-3 shadow-[0_24px_80px_rgba(0,0,0,.38)] sm:rounded-[40px] sm:p-4">
              <div className="relative aspect-[1.18] overflow-hidden rounded-[26px] border border-white/10 bg-[#0d1114] sm:rounded-[32px]">
                <img
                  src="/images/landing-hero.png"
                  alt="Абстрактный символ InvoxyVPN"
                  className="h-full w-full object-cover opacity-90 mix-blend-screen"
                />
                <div className="absolute inset-0 bg-[linear-gradient(140deg,rgba(11,12,14,.68),transparent_40%,rgba(11,12,14,.1))]" />
                <div className="absolute left-5 top-5 rounded-2xl border border-white/12 bg-bg/55 px-3 py-2 backdrop-blur-md sm:left-7 sm:top-7 sm:px-4 sm:py-3">
                  <p className="text-[9px] font-bold tracking-[.18em] text-muted">STATUS</p>
                  <p className="mt-1 flex items-center gap-2 text-xs font-semibold sm:text-sm">
                    <span className="h-2 w-2 rounded-full bg-mint shadow-[0_0_12px_rgba(165,232,196,.9)]" />{' '}
                    Защищено
                  </p>
                </div>
                <div className="absolute bottom-5 right-5 rounded-2xl border border-mint/20 bg-bg/60 px-3 py-2.5 backdrop-blur-md sm:bottom-7 sm:right-7 sm:px-4 sm:py-3">
                  <p className="text-[9px] font-bold tracking-[.18em] text-muted">СЕЙЧАС</p>
                  <p className="mt-1 text-xs font-semibold sm:text-sm">3 устройства онлайн</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 p-2 sm:gap-3 sm:p-3">
                {[
                  ['AES-256', 'Шифрование'],
                  ['24/7', 'Поддержка'],
                  ['10', 'Устройств'],
                ].map(([value, label]) => (
                  <div key={value} className="rounded-2xl bg-white/[.045] px-3 py-3 sm:px-4">
                    <p className="text-base font-semibold sm:text-lg">{value}</p>
                    <p className="mt-0.5 text-[10px] text-muted sm:text-xs">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </m.div>
        </div>
      </section>

      <section
        id="features"
        className="relative mx-auto w-full max-w-7xl px-5 py-20 sm:px-8 sm:py-28 lg:px-10"
      >
        <m.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.55 }}
          className="max-w-2xl"
        >
          <p className="text-[10px] font-bold tracking-[.2em] text-mint sm:text-[11px]">
            ВЫ СОСРЕДОТОЧЕНЫ НА ВАЖНОМ
          </p>
          <h2 className="mt-4 text-3xl font-medium tracking-[-.045em] sm:text-5xl">
            Простая защита,
            <br />
            <span className="text-muted">которая не мешает жить.</span>
          </h2>
        </m.div>
        <div className="mt-10 grid gap-3 md:grid-cols-3 sm:mt-14 sm:gap-4">
          {features.map(({ icon: Icon, title, text }, index) => (
            <m.article
              key={title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, delay: index * 0.08 }}
              className="group rounded-[28px] border border-white/10 bg-white/[.035] p-6 transition-colors hover:border-mint/25 hover:bg-mint/[.055] sm:p-7"
            >
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-mint/10 text-mint transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">
                <Icon size={20} />
              </span>
              <h3 className="mt-7 text-lg font-semibold tracking-[-.02em]">{title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">{text}</p>
            </m.article>
          ))}
        </div>
      </section>

      <section
        id="security"
        className="relative overflow-hidden border-y border-white/8 bg-[#0e1114]"
      >
        <div className="mx-auto grid w-full max-w-7xl items-center gap-10 px-5 py-20 sm:px-8 sm:py-28 lg:grid-cols-[.8fr_1.2fr] lg:gap-20 lg:px-10">
          <m.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6 }}
            className="relative mx-auto w-full max-w-[420px]"
          >
            <div className="absolute inset-10 rounded-full bg-cyan-300/10 blur-3xl" />
            <div className="relative rounded-[40px] border border-white/10 bg-white/[.025] p-5 shadow-[0_24px_70px_rgba(0,0,0,.3)] sm:p-8">
              <img
                src="/images/landing-shield.png"
                alt="Стеклянный щит с замком"
                className="mx-auto aspect-[.84] w-full object-contain"
                loading="lazy"
              />
              <div className="absolute bottom-5 left-5 right-5 flex items-center gap-3 rounded-2xl border border-mint/20 bg-bg/70 px-4 py-3 backdrop-blur-md sm:bottom-8 sm:left-8 sm:right-8">
                <ShieldCheck size={19} className="shrink-0 text-mint" />
                <span className="text-xs font-semibold sm:text-sm">Ваш трафик под защитой</span>
              </div>
            </div>
          </m.div>
          <div>
            <m.div
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.55 }}
            >
              <p className="text-[10px] font-bold tracking-[.2em] text-mint sm:text-[11px]">
                ПОДКЛЮЧЕНИЕ БЕЗ ЛИШНИХ ШАГОВ
              </p>
              <h2 className="mt-4 max-w-xl text-3xl font-medium tracking-[-.045em] sm:text-5xl">
                Технология, которой можно доверять.
              </h2>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-muted">
                Мы собрали всё сложное внутри, чтобы снаружи остались только понятные действия и
                чистый интерфейс.
              </p>
            </m.div>
            <div className="mt-9 border-t border-white/10">
              {steps.map(([number, title, text], index) => (
                <m.div
                  key={number}
                  initial={{ opacity: 0, x: 18 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.25 }}
                  transition={{ duration: 0.5, delay: index * 0.08 }}
                  className="flex gap-4 border-b border-white/10 py-5 sm:gap-6 sm:py-6"
                >
                  <span className="pt-1 text-xs font-bold text-mint">{number}</span>
                  <div>
                    <h3 className="font-semibold">{title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted">{text}</p>
                  </div>
                </m.div>
              ))}
            </div>
            <div className="mt-7 flex items-center gap-2 text-xs text-muted">
              <LockKeyhole size={15} className="text-mint" /> Данные защищены сквозным шифрованием
            </div>
          </div>
        </div>
      </section>

      <section id="start" className="mx-auto w-full max-w-7xl px-5 py-20 sm:px-8 sm:py-28 lg:px-10">
        <m.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-[32px] border border-mint/20 bg-[radial-gradient(circle_at_80%_0%,rgba(165,232,196,.18),transparent_40%),rgba(165,232,196,.06)] px-6 py-10 sm:rounded-[42px] sm:px-12 sm:py-14 lg:px-16 lg:py-16"
        >
          <div className="relative z-10 max-w-2xl">
            <p className="text-[10px] font-bold tracking-[.2em] text-mint sm:text-[11px]">
              НАЧНИТЕ СЕЙЧАС
            </p>
            <h2 className="mt-4 text-3xl font-medium tracking-[-.045em] sm:text-5xl">
              Свободный интернет
              <br />
              <span className="text-mint">начинается здесь.</span>
            </h2>
            <p className="mt-5 max-w-lg text-sm leading-relaxed text-muted sm:text-base">
              Подключитесь через Telegram или создайте аккаунт — вернётесь к настройке тогда, когда
              будет удобно.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href={TELEGRAM_BOT_URL}
                target="_blank"
                rel="noreferrer"
                className="button-lift inline-flex h-13 items-center justify-center gap-2 rounded-full bg-mint px-6 text-sm font-bold text-bg transition-transform hover:-translate-y-0.5 active:scale-[.98]"
              >
                Перейти в Telegram <ArrowRight size={17} />
              </a>
              <Link
                to="/login"
                className="inline-flex h-13 items-center justify-center rounded-full border border-white/12 px-6 text-sm font-semibold transition-colors hover:border-mint/40 hover:bg-white/[.04]"
              >
                Войти в кабинет
              </Link>
            </div>
          </div>
          <div className="pointer-events-none absolute -right-20 -top-28 h-72 w-72 rounded-full border border-mint/15 sm:-right-10 sm:-top-20 sm:h-96 sm:w-96" />
          <div className="pointer-events-none absolute -right-8 -top-16 h-48 w-48 rounded-full border border-mint/10 sm:right-16 sm:top-12 sm:h-56 sm:w-56" />
        </m.div>
      </section>

      <footer className="mx-auto flex w-full max-w-7xl flex-col gap-4 border-t border-white/8 px-5 py-7 text-xs text-muted sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10">
        <BrandLogo iconClassName="h-7 w-7 rounded-lg" textClassName="text-sm font-semibold" />
        <p>© 2026 InvoxyVPN · Защищённое соединение без лишнего шума</p>
        <a
          href="https://t.me/invoxyvpn"
          target="_blank"
          rel="noreferrer"
          className="transition-colors hover:text-mint"
        >
          Поддержка в Telegram
        </a>
      </footer>
    </main>
  );
}

export default LandingPage;
