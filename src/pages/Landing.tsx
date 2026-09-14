import { Link } from 'react-router';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  ArrowRightIcon,
  CabinetIcon,
  CheckIcon,
  GlobeIcon,
  LockIcon,
  RocketIcon,
  ShieldIcon,
  TelegramIcon,
} from '@/components/icons';
import { easeOutExpo } from '@/components/motion';

const sectionReveal = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

const itemReveal = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: easeOutExpo } },
};

export default function Landing() {
  const { t } = useTranslation();
  const appName = import.meta.env.VITE_APP_NAME || 'Invoxy VPN';
  const telegramUsername = import.meta.env.VITE_TELEGRAM_BOT_USERNAME?.trim();
  const telegramHref = telegramUsername ? `https://t.me/${telegramUsername}` : null;

  const features = [
    {
      icon: RocketIcon,
      title: t('landing.featureFastTitle', 'Быстрое подключение'),
      text: t(
        'landing.featureFastText',
        'Откройте кабинет и пройдите короткий путь до защищённого соединения.',
      ),
    },
    {
      icon: CabinetIcon,
      title: t('landing.featureSimpleTitle', 'Понятный кабинет'),
      text: t(
        'landing.featureSimpleText',
        'Настройки и важные действия собраны в спокойном, читаемом интерфейсе.',
      ),
    },
    {
      icon: GlobeIcon,
      title: t('landing.featureFreedomTitle', 'Свобода без границ'),
      text: t(
        'landing.featureFreedomText',
        'Оставайтесь на связи дома, в дороге и в любой привычной сети.',
      ),
    },
  ];

  const steps = [
    [
      t('landing.stepOneLabel', '01'),
      t('landing.stepOneTitle', 'Откройте кабинет'),
      t('landing.stepOneText', 'Войдите через Telegram или email и продолжите в удобном темпе.'),
    ],
    [
      t('landing.stepTwoLabel', '02'),
      t('landing.stepTwoTitle', 'Выберите подходящий вариант'),
      t('landing.stepTwoText', 'Настройте подключение с помощью понятных подсказок кабинета.'),
    ],
    [
      t('landing.stepThreeLabel', '03'),
      t('landing.stepThreeTitle', 'Подключайтесь'),
      t('landing.stepThreeText', 'Используйте готовые данные в совместимом приложении.'),
    ],
  ];

  const telegramCta = telegramHref ? (
    <a
      href={telegramHref}
      target="_blank"
      rel="noreferrer"
      className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full bg-accent-400 px-6 text-sm font-bold text-dark-950 shadow-glow transition hover:bg-accent-300"
    >
      <TelegramIcon className="h-4 w-4" />
      {t('landing.openTelegram', 'Открыть Telegram-бота')}
      <ArrowRightIcon className="h-4 w-4" />
    </a>
  ) : null;

  return (
    <main className="landing-page min-h-dvh overflow-x-clip text-dark-50">
      <section className="relative isolate overflow-hidden border-b border-dark-700/30">
        <img
          src="/images/landing-hero.png"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute right-[-22%] top-[-6%] z-[-2] h-[34rem] w-[56rem] max-w-none object-cover opacity-50 mix-blend-screen sm:right-[-15%] lg:right-[-8%] lg:top-[-12%] lg:h-[42rem] lg:w-[75rem]"
        />
        <div className="pointer-events-none absolute inset-0 z-[-1] bg-[radial-gradient(circle_at_78%_24%,rgba(var(--ix-accent-rgb),.13),transparent_30%),linear-gradient(180deg,rgba(var(--color-dark-950),.38),rgba(var(--color-dark-950),.96)_92%)]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 z-[-1] h-28 bg-[linear-gradient(90deg,rgba(var(--ix-accent-rgb),.07)_1px,transparent_1px),linear-gradient(rgba(var(--ix-accent-rgb),.07)_1px,transparent_1px)] bg-[size:72px_72px] [mask-image:linear-gradient(to_bottom,black,transparent)]" />

        <nav className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-5 py-5 sm:px-8 lg:px-10 lg:py-7">
          <Link
            to="/"
            aria-label={`${appName} — ${t('landing.home', 'на главную')}`}
            className="flex shrink-0 items-center gap-3 rounded-2xl outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-accent-400/70"
          >
            <img
              src="/images/brand-mark.png"
              alt={appName}
              className="h-9 w-9 rounded-xl sm:h-10 sm:w-10"
            />
            <span className="text-base font-bold sm:text-lg">{appName}</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/login"
              className="hidden rounded-full px-3 py-2 text-sm font-semibold text-dark-300 transition-colors hover:text-dark-50 sm:inline-flex"
            >
              {t('auth.login', 'Войти')}
            </Link>
            <Link
              to="/register"
              className="inline-flex min-h-[44px] items-center rounded-full bg-dark-50 px-4 text-xs font-bold text-dark-950 transition hover:bg-dark-100 sm:px-5 sm:text-sm"
            >
              {t('auth.register', 'Создать аккаунт')}
            </Link>
          </div>
        </nav>

        <div className="relative z-10 mx-auto grid w-full max-w-7xl items-center gap-8 px-5 pb-16 pt-10 sm:px-8 sm:pb-24 lg:grid-cols-[minmax(0,.83fr)_minmax(420px,1.17fr)] lg:gap-4 lg:px-10 lg:pb-28 lg:pt-16">
          <motion.div
            initial="hidden"
            animate="show"
            variants={sectionReveal}
            className="max-w-2xl"
          >
            <motion.p
              variants={itemReveal}
              className="inline-flex items-center gap-2 rounded-full border border-accent-400/20 bg-accent-400/10 px-3 py-1.5 text-[10px] font-bold tracking-[.2em] text-accent-300 sm:text-[11px]"
            >
              <ShieldIcon className="h-4 w-4" />
              {t('landing.eyebrow', 'VPN ДЛЯ СВОБОДЫ')}
            </motion.p>
            <motion.h1
              variants={itemReveal}
              className="mt-6 max-w-[720px] text-[clamp(48px,7vw,92px)] font-medium leading-[.92] tracking-[-.065em]"
            >
              {t('landing.heroTitle', 'Связь')}
              <br />
              <span className="text-accent-300">{t('landing.heroTitleAccent', 'без границ.')}</span>
            </motion.h1>
            <motion.p
              variants={itemReveal}
              className="mt-6 max-w-xl text-base leading-relaxed text-dark-300 sm:text-lg"
            >
              {t(
                'landing.heroText',
                'Защищённое соединение и спокойный интерфейс — без лишнего шума.',
              )}
            </motion.p>
            <motion.div
              variants={itemReveal}
              className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center"
            >
              {telegramCta}
              <Link
                to="/register"
                className="inline-flex min-h-[52px] items-center justify-center rounded-full border border-dark-600/50 px-6 text-sm font-semibold text-dark-50 transition-colors hover:border-accent-400/40 hover:bg-dark-900/40"
              >
                {t('landing.register', 'Регистрация')}
              </Link>
            </motion.div>
            <motion.div
              variants={itemReveal}
              className="mt-9 flex flex-wrap items-center gap-x-5 gap-y-3 text-xs text-dark-400 sm:text-sm"
            >
              {[
                t('landing.promiseSimple', 'Без лишних шагов'),
                t('landing.promiseReadable', 'Понятные настройки'),
                t('landing.promiseControl', 'Контроль в кабинете'),
              ].map((promise) => (
                <span key={promise} className="inline-flex items-center gap-2">
                  <CheckIcon className="h-4 w-4 text-accent-300" />
                  {promise}
                </span>
              ))}
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.12 }}
            className="relative mx-auto w-full max-w-[620px] lg:ml-auto"
          >
            <div className="absolute -inset-5 rounded-[44px] bg-accent-400/10 blur-3xl" />
            <div className="glass-surface relative overflow-hidden rounded-[32px] p-3 shadow-2xl sm:rounded-[40px] sm:p-4">
              <div className="relative aspect-[1.18] overflow-hidden rounded-[26px] border border-dark-600/30 bg-dark-950 sm:rounded-[32px]">
                <img
                  src="/images/landing-hero.png"
                  alt={t('landing.heroImageAlt', 'Абстрактный символ защищённого соединения')}
                  className="h-full w-full object-cover opacity-90 mix-blend-screen"
                />
                <div className="absolute inset-0 bg-[linear-gradient(140deg,rgba(var(--color-dark-950),.68),transparent_40%,rgba(var(--color-dark-950),.1))]" />
                <div className="absolute left-5 top-5 rounded-2xl border border-dark-600/30 bg-dark-950/60 px-3 py-2 backdrop-blur-md sm:left-7 sm:top-7 sm:px-4 sm:py-3">
                  <p className="text-[9px] font-bold tracking-[.18em] text-dark-400">
                    {t('landing.statusLabel', 'STATUS')}
                  </p>
                  <p className="mt-1 flex items-center gap-2 text-xs font-semibold sm:text-sm">
                    <span className="h-2 w-2 rounded-full bg-accent-300 shadow-[0_0_12px_rgba(var(--ix-accent-rgb),.9)]" />
                    {t('landing.statusProtected', 'Защищено')}
                  </p>
                </div>
                <div className="absolute bottom-5 right-5 rounded-2xl border border-accent-400/20 bg-dark-950/60 px-3 py-2.5 backdrop-blur-md sm:bottom-7 sm:right-7 sm:px-4 sm:py-3">
                  <p className="text-[9px] font-bold tracking-[.18em] text-dark-400">
                    {t('landing.readyLabel', 'ГОТОВО')}
                  </p>
                  <p className="mt-1 text-xs font-semibold sm:text-sm">
                    {t('landing.readyText', 'Можно подключаться')}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 p-2 sm:gap-3 sm:p-3">
                {[
                  t('landing.tileSecure', 'Защита'),
                  t('landing.tileSimple', 'Простота'),
                  t('landing.tileControl', 'Контроль'),
                ].map((label) => (
                  <div key={label} className="rounded-2xl bg-dark-50/5 px-3 py-3 sm:px-4">
                    <CheckIcon className="h-4 w-4 text-accent-300" />
                    <p className="mt-1 text-[10px] text-dark-400 sm:text-xs">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section
        id="features"
        className="relative mx-auto w-full max-w-7xl px-5 py-20 sm:px-8 sm:py-28 lg:px-10"
      >
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          variants={sectionReveal}
        >
          <motion.div variants={itemReveal} className="max-w-2xl">
            <p className="text-[10px] font-bold tracking-[.2em] text-accent-300 sm:text-[11px]">
              {t('landing.featuresEyebrow', 'ВЫ СОСРЕДОТОЧЕНЫ НА ВАЖНОМ')}
            </p>
            <h2 className="mt-4 text-3xl font-medium tracking-[-.045em] sm:text-5xl">
              {t('landing.featuresTitle', 'Простая защита,')}
              <br />
              <span className="text-dark-400">
                {t('landing.featuresTitleMuted', 'которая не мешает жить.')}
              </span>
            </h2>
          </motion.div>
          <div className="mt-10 grid gap-3 md:grid-cols-3 sm:mt-14 sm:gap-4">
            {features.map(({ icon: Icon, title, text }) => (
              <motion.article
                key={title}
                variants={itemReveal}
                className="group rounded-[28px] border border-dark-700/30 bg-dark-50/[.035] p-6 transition-colors hover:border-accent-400/25 hover:bg-accent-400/[.055] sm:p-7"
              >
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-accent-400/10 text-accent-300 transition-transform duration-500 group-hover:scale-110">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-7 text-lg font-semibold tracking-[-.02em]">{title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-dark-400">{text}</p>
              </motion.article>
            ))}
          </div>
        </motion.div>
      </section>

      <section
        id="security"
        className="relative overflow-hidden border-y border-dark-700/30 bg-dark-950/70"
      >
        <div className="mx-auto grid w-full max-w-7xl items-center gap-10 px-5 py-20 sm:px-8 sm:py-28 lg:grid-cols-[.8fr_1.2fr] lg:gap-20 lg:px-10">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6 }}
            className="relative mx-auto w-full max-w-[420px]"
          >
            <div className="absolute inset-10 rounded-full bg-accent-300/10 blur-3xl" />
            <div className="glass-surface relative rounded-[40px] p-5 shadow-2xl sm:p-8">
              <img
                src="/images/landing-shield.png"
                alt={t('landing.shieldAlt', 'Стеклянный щит с замком')}
                className="mx-auto aspect-[.84] w-full object-contain"
                loading="lazy"
              />
              <div className="absolute bottom-5 left-5 right-5 flex items-center gap-3 rounded-2xl border border-accent-400/20 bg-dark-950/70 px-4 py-3 backdrop-blur-md sm:bottom-8 sm:left-8 sm:right-8">
                <ShieldIcon className="h-5 w-5 shrink-0 text-accent-300" />
                <span className="text-xs font-semibold sm:text-sm">
                  {t('landing.shieldCaption', 'Ваш трафик под защитой')}
                </span>
              </div>
            </div>
          </motion.div>
          <div>
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.55 }}
            >
              <p className="text-[10px] font-bold tracking-[.2em] text-accent-300 sm:text-[11px]">
                {t('landing.stepsEyebrow', 'ПОДКЛЮЧЕНИЕ БЕЗ ЛИШНИХ ШАГОВ')}
              </p>
              <h2 className="mt-4 max-w-xl text-3xl font-medium tracking-[-.045em] sm:text-5xl">
                {t('landing.stepsTitle', 'Технология, которой можно доверять.')}
              </h2>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-dark-400">
                {t(
                  'landing.stepsText',
                  'Мы собрали сложное внутри, чтобы снаружи остались только понятные действия.',
                )}
              </p>
            </motion.div>
            <div className="mt-9 border-t border-dark-700/30">
              {steps.map(([number, title, text], index) => (
                <motion.div
                  key={number}
                  initial={{ opacity: 0, x: 18 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.25 }}
                  transition={{ duration: 0.5, delay: index * 0.08 }}
                  className="flex gap-4 border-b border-dark-700/30 py-5 sm:gap-6 sm:py-6"
                >
                  <span className="pt-1 text-xs font-bold text-accent-300">{number}</span>
                  <div>
                    <h3 className="font-semibold">{title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-dark-400">{text}</p>
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="mt-7 flex items-center gap-2 text-xs text-dark-400">
              <LockIcon className="h-4 w-4 text-accent-300" />
              {t('landing.encryption', 'Данные защищены сквозным шифрованием')}
            </div>
          </div>
        </div>
      </section>

      <section id="start" className="mx-auto w-full max-w-7xl px-5 py-20 sm:px-8 sm:py-28 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-[32px] border border-accent-400/20 bg-accent-400/[.06] px-6 py-10 sm:rounded-[42px] sm:px-12 sm:py-14 lg:px-16 lg:py-16"
        >
          <div className="relative z-10 max-w-2xl">
            <p className="text-[10px] font-bold tracking-[.2em] text-accent-300 sm:text-[11px]">
              {t('landing.ctaEyebrow', 'НАЧНИТЕ СЕЙЧАС')}
            </p>
            <h2 className="mt-4 text-3xl font-medium tracking-[-.045em] sm:text-5xl">
              {t('landing.ctaTitle', 'Свободный интернет')}
              <br />
              <span className="text-accent-300">
                {t('landing.ctaTitleAccent', 'начинается здесь.')}
              </span>
            </h2>
            <p className="mt-5 max-w-lg text-sm leading-relaxed text-dark-400 sm:text-base">
              {t(
                'landing.ctaText',
                'Подключитесь через Telegram или создайте аккаунт — вернётесь к настройке тогда, когда будет удобно.',
              )}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              {telegramCta}
              <Link
                to="/login"
                className="inline-flex min-h-[52px] items-center justify-center rounded-full border border-dark-600/50 px-6 text-sm font-semibold transition-colors hover:border-accent-400/40 hover:bg-dark-950/30"
              >
                {t('landing.openCabinet', 'Войти в кабинет')}
              </Link>
            </div>
          </div>
          <div className="pointer-events-none absolute -right-20 -top-28 h-72 w-72 rounded-full border border-accent-400/15 sm:-right-10 sm:-top-20 sm:h-96 sm:w-96" />
          <div className="pointer-events-none absolute -right-8 -top-16 h-48 w-48 rounded-full border border-accent-400/10 sm:right-16 sm:top-12 sm:h-56 sm:w-56" />
        </motion.div>
      </section>

      <footer className="mx-auto flex w-full max-w-7xl flex-col gap-4 border-t border-dark-700/30 px-5 py-7 text-xs text-dark-400 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10">
        <span className="flex items-center gap-2 font-semibold text-dark-100">
          <img src="/images/brand-mark.png" alt="" className="h-7 w-7 rounded-lg" />
          {appName}
        </span>
        <span>{t('landing.footer', 'Защищённое соединение без лишнего шума')}</span>
        {telegramHref && (
          <a
            href={telegramHref}
            target="_blank"
            rel="noreferrer"
            className="transition-colors hover:text-accent-300"
          >
            {t('landing.telegramSupport', 'Поддержка в Telegram')}
          </a>
        )}
      </footer>
    </main>
  );
}
