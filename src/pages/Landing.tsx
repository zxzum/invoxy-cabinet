import { Link } from 'react-router';
import { motion } from 'framer-motion';
import { LOCAL_LOGO_URL } from '../api/branding';
import {
  buttonHover,
  buttonTap,
  easeOutExpo,
  staggerContainer,
  staggerItem,
} from '../components/motion';
import { CabinetIcon, RocketIcon, ShieldIcon, TagIcon, TelegramIcon } from '@/components/icons';

interface LandingPlan {
  name: string;
  price: string;
  details: string;
}

// INVOXY: лендинг показывает статичные тарифы — публичного эндпоинта тарифов
// без авторизации нет (/cabinet/admin/tariffs требует админку, а
// /cabinet/landing/{slug} отдаёт тарифы только настроенной промо-страницы).
const FALLBACK_PLANS: LandingPlan[] = [
  { name: 'Стандарт', price: '120 ₽', details: '350 ГБ · 3 устройства' },
  {
    name: 'Стандарт · Белый интернет',
    price: '200 ₽',
    details: '750 ГБ основной трафик + 50 ГБ Белый интернет · 5 устройств',
  },
  {
    name: 'Премиум · Белый интернет',
    price: '400 ₽',
    details: '1000 ГБ основной трафик + 150 ГБ Белый интернет · 10 устройств, максимум 15',
  },
];

const STEPS = [
  {
    icon: CabinetIcon,
    title: 'Откройте кабинет',
    text: 'Вход через Telegram или email — без лишних регистраций.',
  },
  {
    icon: TagIcon,
    title: 'Выберите тариф',
    text: 'Понятные планы на 30 / 90 / 180 / 360 дней.',
  },
  {
    icon: RocketIcon,
    title: 'Подключитесь',
    text: 'Ссылка подписки работает в любом совместимом клиенте.',
  },
];

const sectionReveal = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

const itemReveal = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: easeOutExpo } },
};

export default function Landing() {
  return (
    <main className="relative min-h-dvh overflow-hidden bg-dark-950 text-dark-50">
      {/* Декоративное свечение поверх фона */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 h-[28rem] w-[46rem] -translate-x-1/2 rounded-full bg-accent-500/10 blur-3xl" />
        <div className="absolute right-[-10%] top-1/3 h-72 w-72 rounded-full bg-accent-500/5 blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-500/40 to-transparent" />
      </div>

      <div className="relative mx-auto flex min-h-dvh w-full max-w-6xl flex-col px-5 py-6 sm:px-8 lg:px-12">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.img
              src={LOCAL_LOGO_URL}
              alt="Invoxy VPN"
              className="h-10 w-10 rounded-xl object-cover shadow-glow"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: easeOutExpo }}
            />
            <span className="text-lg font-semibold tracking-wide">Invoxy VPN</span>
          </div>
          <Link to="/login" className="text-sm text-dark-300 transition hover:text-accent-400">
            Войти
          </Link>
        </header>

        {/* 1. Hero */}
        <motion.section
          className="flex flex-1 flex-col items-center justify-center py-16 text-center lg:py-20"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          <motion.div variants={staggerItem}>
            <span className="inline-flex items-center gap-2 rounded-full border border-accent-500/30 bg-accent-500/10 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.22em] text-accent-300">
              <ShieldIcon className="h-4 w-4" />
              Invoxy
            </span>
          </motion.div>

          <motion.h1
            variants={staggerItem}
            className="mt-6 max-w-3xl text-4xl font-semibold leading-tight sm:text-6xl"
          >
            VPN без{' '}
            <span className="bg-gradient-to-r from-accent-300 to-accent-500 bg-clip-text text-transparent">
              лишних шагов
            </span>
            .
          </motion.h1>

          <motion.p
            variants={staggerItem}
            className="mt-6 max-w-xl text-lg leading-8 text-dark-300"
          >
            Стабильное соединение, понятные тарифы и отдельный лимит для Белого интернета.
          </motion.p>

          <motion.div variants={staggerItem} className="mt-9 flex flex-wrap justify-center gap-3">
            <motion.div whileHover={buttonHover} whileTap={buttonTap}>
              <Link
                to="/login"
                className="block rounded-xl bg-accent-500 px-6 py-3 font-semibold text-on-accent shadow-glow transition hover:bg-accent-400"
              >
                Открыть кабинет
              </Link>
            </motion.div>
            <motion.div whileHover={buttonHover} whileTap={buttonTap}>
              <a
                href="https://t.me/invoxyvpn"
                className="flex items-center gap-2 rounded-xl border border-dark-700 px-6 py-3 font-semibold text-dark-100 transition hover:border-accent-500/60 hover:text-accent-300"
              >
                <TelegramIcon className="h-5 w-5" />
                Поддержка в Telegram
              </a>
            </motion.div>
          </motion.div>
        </motion.section>

        {/* 2. Тарифы */}
        <motion.section
          className="pb-16"
          variants={sectionReveal}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
        >
          <motion.div variants={itemReveal} className="mb-8 text-center">
            <h2 className="text-2xl font-semibold sm:text-3xl">Тарифы</h2>
            <p className="mt-2 text-sm text-dark-400">
              Периоды 30 / 90 / 180 / 360 дней. Белый интернет можно пополнять отдельно.
            </p>
          </motion.div>

          <div className="grid gap-4 sm:grid-cols-3">
            {FALLBACK_PLANS.map((plan, index) => {
              const highlighted = index === 1;
              return (
                <motion.div
                  key={plan.name}
                  variants={itemReveal}
                  whileHover={{ y: -4 }}
                  className={`relative rounded-2xl border p-5 transition-shadow ${
                    highlighted
                      ? 'border-accent-500/50 bg-dark-900/80 shadow-glow'
                      : 'border-dark-800 bg-dark-900/60 hover:shadow-card'
                  }`}
                >
                  {highlighted && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent-500 px-3 py-0.5 text-xs font-semibold text-on-accent shadow-glow">
                      Популярный
                    </span>
                  )}
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="font-medium">{plan.name}</h3>
                    <strong className="text-lg text-accent-400">{plan.price}</strong>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-dark-400">{plan.details} · 30 дней</p>
                </motion.div>
              );
            })}
          </div>
        </motion.section>

        {/* 3. Как начать */}
        <motion.section
          className="pb-16"
          variants={sectionReveal}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
        >
          <motion.h2
            variants={itemReveal}
            className="mb-8 text-center text-2xl font-semibold sm:text-3xl"
          >
            Как начать
          </motion.h2>

          <div className="grid gap-4 sm:grid-cols-3">
            {STEPS.map((step, index) => (
              <motion.div
                key={step.title}
                variants={itemReveal}
                className="rounded-2xl border border-dark-800 bg-dark-900/60 p-5"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-accent-500/30 bg-accent-500/10 text-accent-400">
                    <step.icon className="h-5 w-5" />
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-widest text-dark-500">
                    Шаг {index + 1}
                  </span>
                </div>
                <h3 className="mt-4 font-medium">{step.title}</h3>
                <p className="mt-1 text-sm leading-6 text-dark-400">{step.text}</p>
              </motion.div>
            ))}
          </div>

          <motion.div variants={itemReveal} className="mt-10 text-center">
            <motion.div whileHover={buttonHover} whileTap={buttonTap} className="inline-block">
              <Link
                to="/login"
                className="block rounded-xl bg-accent-500 px-8 py-3 font-semibold text-on-accent shadow-glow transition hover:bg-accent-400"
              >
                Начать пользоваться
              </Link>
            </motion.div>
          </motion.div>
        </motion.section>

        <footer className="flex flex-wrap gap-4 border-t border-dark-900 py-5 text-xs text-dark-500">
          <span>© Invoxy VPN</span>
          <Link to="/offer" className="transition hover:text-dark-300">
            Оферта
          </Link>
          <Link to="/privacy" className="transition hover:text-dark-300">
            Политика конфиденциальности
          </Link>
        </footer>
      </div>
    </main>
  );
}
