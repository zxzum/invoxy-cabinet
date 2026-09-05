import { Link } from 'react-router';
import { LOCAL_LOGO_URL } from '../api/branding';

const plans = [
  { name: 'Стандарт', price: '120 ₽', details: '350 ГБ · 3 устройства' },
  { name: 'Стандарт · Белый интернет', price: '200 ₽', details: '50 + 750 ГБ · 5 устройств' },
  { name: 'Премиум · Белый интернет', price: '400 ₽', details: '150 + 1000 ГБ · 10 устройств' },
];

export default function Landing() {
  return (
    <main className="min-h-dvh overflow-hidden bg-dark-950 text-dark-50">
      <div className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col px-5 py-6 sm:px-8 lg:px-12">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={LOCAL_LOGO_URL}
              alt="Invoxy VPN"
              className="h-10 w-10 rounded-xl object-cover"
            />
            <span className="text-lg font-semibold tracking-wide">Invoxy VPN</span>
          </div>
          <Link to="/login" className="text-sm text-dark-300 transition hover:text-accent-400">
            Войти
          </Link>
        </header>

        <section className="grid flex-1 items-center gap-12 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:py-24">
          <div>
            <p className="mb-5 text-sm font-medium uppercase tracking-[0.28em] text-accent-400">
              Invoxy
            </p>
            <h1 className="max-w-2xl text-4xl font-semibold leading-tight sm:text-6xl">
              VPN без лишних шагов.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-dark-300">
              Стабильное соединение, понятные тарифы и отдельный лимит для сервисов из белого
              списка.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                to="/login"
                className="rounded-xl bg-accent-500 px-6 py-3 font-semibold text-on-accent shadow-lg shadow-accent-500/20 transition hover:bg-accent-400"
              >
                Открыть кабинет
              </Link>
              <a
                href="https://t.me/invoxyvpn"
                className="rounded-xl border border-dark-700 px-6 py-3 font-semibold text-dark-100 transition hover:border-accent-500/60"
              >
                Поддержка в Telegram
              </a>
            </div>
          </div>

          <div className="rounded-3xl border border-dark-800 bg-dark-900/70 p-5 shadow-2xl shadow-black/20 sm:p-7">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Тарифы</h2>
              <span className="rounded-full bg-success-500/10 px-3 py-1 text-xs text-success-400">
                от 120 ₽
              </span>
            </div>
            <div className="space-y-3">
              {plans.map((plan) => (
                <div
                  key={plan.name}
                  className="rounded-2xl border border-dark-800 bg-dark-950/60 p-4"
                >
                  <div className="flex items-baseline justify-between gap-4">
                    <h3 className="font-medium">{plan.name}</h3>
                    <strong className="text-accent-400">{plan.price}</strong>
                  </div>
                  <p className="mt-1 text-sm text-dark-400">{plan.details} · 30 дней</p>
                </div>
              ))}
            </div>
            <p className="mt-5 text-xs leading-5 text-dark-500">
              Периоды 30 / 90 / 180 / 360 дней. Белый интернет можно пополнять отдельно.
            </p>
          </div>
        </section>

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
