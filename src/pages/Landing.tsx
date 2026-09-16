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
      title: t('landing.featureFastTitle'),
      text: t('landing.featureFastText'),
    },
    {
      icon: CabinetIcon,
      title: t('landing.featureSimpleTitle'),
      text: t('landing.featureSimpleText'),
    },
    {
      icon: GlobeIcon,
      title: t('landing.featureFreedomTitle'),
      text: t('landing.featureFreedomText'),
    },
  ];

  const steps = [
    [t('landing.stepOneLabel'), t('landing.stepOneTitle'), t('landing.stepOneText')],
    [t('landing.stepTwoLabel'), t('landing.stepTwoTitle'), t('landing.stepTwoText')],
    [t('landing.stepThreeLabel'), t('landing.stepThreeTitle'), t('landing.stepThreeText')],
  ];

  const telegramCta = telegramHref ? (
    <a
      href={telegramHref}
      target="_blank"
      rel="noreferrer"
      className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full bg-accent-400 px-6 text-sm font-bold text-dark-950 shadow-glow transition hover:bg-accent-300"
    >
      <TelegramIcon className="h-4 w-4" />
      {t('landing.openTelegram')}
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

        {/* STICKY HEADER */}
        <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#0b0c0e]/75 backdrop-blur-2xl transition-all duration-300">
          <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-8 lg:px-10">
            {/* Logo with 3D depth and subtle neon glow */}
            <Link
              to="/"
              aria-label={`${appName} — ${t('landing.home')}`}
              className="group relative flex shrink-0 items-center gap-3 outline-none"
            >
              <div className="relative">
                <div className="absolute -inset-1 rounded-2xl bg-accent-400/30 opacity-0 blur-md transition-opacity duration-300 group-hover:opacity-100" />
                <img
                  src="/images/brand-mark.png?v=3d"
                  alt={appName}
                  className="relative h-10 w-10 rounded-2xl border border-white/15 bg-dark-900 object-cover shadow-[0_4px_20px_rgba(0,0,0,0.5)] transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold tracking-tight text-dark-50 transition-colors">
                  Invoxy
                  <span className="bg-gradient-to-r from-accent-300 to-accent-100 bg-clip-text text-transparent">
                    VPN
                  </span>
                </span>
                <span className="text-[10px] font-semibold tracking-wider text-dark-400 uppercase">
                  Fast & Secure
                </span>
              </div>
            </Link>

            {/* Desktop Navigation: Floating frosted glass island */}
            <nav className="hidden items-center rounded-full border border-white/10 bg-white/[0.03] p-1.5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)] backdrop-blur-xl lg:flex">
              <a
                href="#features"
                className="rounded-full px-4 py-2 text-xs font-semibold text-dark-400 transition-all duration-200 hover:bg-white/[0.07] hover:text-dark-50"
              >
                {t('landing.navFeatures')}
              </a>
              <a
                href="#security"
                className="rounded-full px-4 py-2 text-xs font-semibold text-dark-400 transition-all duration-200 hover:bg-white/[0.07] hover:text-dark-50"
              >
                {t('landing.navSecurity')}
              </a>
              <a
                href="#start"
                className="rounded-full px-4 py-2 text-xs font-semibold text-dark-400 transition-all duration-200 hover:bg-white/[0.07] hover:text-dark-50"
              >
                {t('landing.navStart')}
              </a>
              {telegramHref && (
                <a
                  href={telegramHref}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold text-sky-300/90 transition-all duration-200 hover:bg-sky-500/10 hover:text-sky-200"
                >
                  <TelegramIcon className="h-3.5 w-3.5 text-[#2AABEE]" /> Telegram-бот
                </a>
              )}
            </nav>

            {/* Direct Authentication Actions */}
            <div className="flex items-center gap-2.5 sm:gap-3">
              {telegramHref && (
                <a
                  href={telegramHref}
                  target="_blank"
                  rel="noreferrer"
                  title="Открыть Telegram-бота"
                  className="hidden items-center gap-2 rounded-full border border-sky-400/25 bg-sky-500/[0.08] px-3.5 py-2 text-xs font-semibold text-sky-300 shadow-[0_2px_12px_rgba(42,171,238,0.12)] transition-all duration-200 hover:-translate-y-0.5 hover:border-sky-400/50 hover:bg-sky-500/20 md:inline-flex"
                >
                  <TelegramIcon className="h-3.5 w-3.5 text-sky-400" />
                  <span>Бот в TG</span>
                </a>
              )}

              <Link
                to="/login"
                className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-dark-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition-all duration-200 hover:border-white/20 hover:bg-white/[0.09] hover:text-dark-50 sm:text-sm"
              >
                {t('auth.login', 'Войти')}
              </Link>

              <Link
                to="/register"
                className="group relative inline-flex items-center justify-center overflow-hidden rounded-full bg-accent-400 px-5 py-2 text-xs font-bold text-dark-950 shadow-[0_0_24px_rgba(var(--ix-accent-rgb),0.35)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-accent-300 hover:shadow-[0_0_32px_rgba(var(--ix-accent-rgb),0.55)] sm:text-sm"
              >
                <span className="relative z-10 flex items-center gap-1.5">
                  {t('auth.register', 'Регистрация')}
                  <ArrowRightIcon className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
                </span>
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-white/0 via-white/30 to-white/0 transition-transform duration-700 group-hover:translate-x-full" />
              </Link>
            </div>
          </div>
        </header>

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
              {t('landing.eyebrow')}
            </motion.p>
            <motion.h1
              variants={itemReveal}
              className="mt-6 max-w-[720px] text-[clamp(48px,7vw,92px)] font-medium leading-[.92] tracking-[-.065em]"
            >
              {t('landing.heroTitle')}
              <br />
              <span className="text-accent-300">{t('landing.heroTitleAccent')}</span>
            </motion.h1>
            <motion.p
              variants={itemReveal}
              className="mt-6 max-w-xl text-base leading-relaxed text-dark-300 sm:text-lg"
            >
              {t('landing.heroText')}
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
                {t('landing.register')}
              </Link>
            </motion.div>
            <motion.div
              variants={itemReveal}
              className="mt-9 flex flex-wrap items-center gap-x-5 gap-y-3 text-xs text-dark-400 sm:text-sm"
            >
              {[
                t('landing.promiseSimple'),
                t('landing.promiseReadable'),
                t('landing.promiseControl'),
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
                  alt={t('landing.heroImageAlt')}
                  className="h-full w-full object-cover opacity-90 mix-blend-screen"
                />
                <div className="absolute inset-0 bg-[linear-gradient(140deg,rgba(var(--color-dark-950),.68),transparent_40%,rgba(var(--color-dark-950),.1))]" />
                <div className="absolute left-5 top-5 rounded-2xl border border-dark-600/30 bg-dark-950/60 px-3 py-2 backdrop-blur-md sm:left-7 sm:top-7 sm:px-4 sm:py-3">
                  <p className="text-[9px] font-bold tracking-[.18em] text-dark-400">
                    {t('landing.statusLabel')}
                  </p>
                  <p className="mt-1 flex items-center gap-2 text-xs font-semibold sm:text-sm">
                    <span className="h-2 w-2 rounded-full bg-accent-300 shadow-[0_0_12px_rgba(var(--ix-accent-rgb),.9)]" />
                    {t('landing.statusProtected')}
                  </p>
                </div>
                <div className="absolute bottom-5 right-5 rounded-2xl border border-accent-400/20 bg-dark-950/60 px-3 py-2.5 backdrop-blur-md sm:bottom-7 sm:right-7 sm:px-4 sm:py-3">
                  <p className="text-[9px] font-bold tracking-[.18em] text-dark-400">
                    {t('landing.readyLabel')}
                  </p>
                  <p className="mt-1 text-xs font-semibold sm:text-sm">{t('landing.readyText')}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 p-2 sm:gap-3 sm:p-3">
                {[t('landing.tileSecure'), t('landing.tileSimple'), t('landing.tileControl')].map(
                  (label) => (
                    <div key={label} className="rounded-2xl bg-dark-50/5 px-3 py-3 sm:px-4">
                      <CheckIcon className="h-4 w-4 text-accent-300" />
                      <p className="mt-1 text-[10px] text-dark-400 sm:text-xs">{label}</p>
                    </div>
                  ),
                )}
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
              {t('landing.featuresEyebrow')}
            </p>
            <h2 className="mt-4 text-3xl font-medium tracking-[-.045em] sm:text-5xl">
              {t('landing.featuresTitle')}
              <br />
              <span className="text-dark-400">{t('landing.featuresTitleMuted')}</span>
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
                alt={t('landing.shieldAlt')}
                className="mx-auto aspect-[.84] w-full object-contain"
                loading="lazy"
              />
              <div className="absolute bottom-5 left-5 right-5 flex items-center gap-3 rounded-2xl border border-accent-400/20 bg-dark-950/70 px-4 py-3 backdrop-blur-md sm:bottom-8 sm:left-8 sm:right-8">
                <ShieldIcon className="h-5 w-5 shrink-0 text-accent-300" />
                <span className="text-xs font-semibold sm:text-sm">
                  {t('landing.shieldCaption')}
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
                {t('landing.stepsEyebrow')}
              </p>
              <h2 className="mt-4 max-w-xl text-3xl font-medium tracking-[-.045em] sm:text-5xl">
                {t('landing.stepsTitle')}
              </h2>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-dark-400">
                {t('landing.stepsText')}
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
              {t('landing.encryption')}
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
              {t('landing.ctaEyebrow')}
            </p>
            <h2 className="mt-4 text-3xl font-medium tracking-[-.045em] sm:text-5xl">
              {t('landing.ctaTitle')}
              <br />
              <span className="text-accent-300">{t('landing.ctaTitleAccent')}</span>
            </h2>
            <p className="mt-5 max-w-lg text-sm leading-relaxed text-dark-400 sm:text-base">
              {t('landing.ctaText')}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              {telegramCta}
              <Link
                to="/login"
                className="inline-flex min-h-[52px] items-center justify-center rounded-full border border-dark-600/50 px-6 text-sm font-semibold transition-colors hover:border-accent-400/40 hover:bg-dark-950/30"
              >
                {t('landing.openCabinet')}
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
        <span>{t('landing.footer')}</span>
        {telegramHref && (
          <a
            href={telegramHref}
            target="_blank"
            rel="noreferrer"
            className="transition-colors hover:text-accent-300"
          >
            {t('landing.telegramSupport')}
          </a>
        )}
      </footer>
    </main>
  );
}
