import { Link } from 'react-router';
import { useAuthStore } from '@/store/auth';

const BOT_USERNAME = (import.meta.env.VITE_TELEGRAM_BOT_USERNAME || 'invoxy_bot').replace(/^@/, '');
const TELEGRAM_BOT_URL = `https://t.me/${BOT_USERNAME}`;

function TelegramIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .37z" />
    </svg>
  );
}

function CheckIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.5}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

export function Channels() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <section id="telegram" className="py-16 sm:py-24 border-t border-line/40 relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section title */}
        <div className="text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-xs font-mono-landing text-muted mb-3">
            <span>Два удобных формата</span>
          </div>
          <h2 className="font-display-landing text-3xl sm:text-4xl font-bold tracking-tight text-ink">
            Бот для скорости, кабинет для контроля
          </h2>
          <p className="mt-3 text-sm sm:text-base text-muted">
            Начните за 10 секунд в Telegram или управляйте всеми деталями с компьютера.
          </p>
        </div>

        {/* 2 Channels cards */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch">
          {/* Card 1: Telegram Bot (Primary) */}
          <div className="glass-panel relative rounded-3xl border border-sky-500/40 bg-surface/90 p-7 sm:p-8 flex flex-col justify-between shadow-[0_0_36px_rgba(14,165,233,0.14)] ring-1 ring-sky-500/30">
            <div className="absolute -top-3 left-7 rounded-full bg-sky-500 px-3 py-0.5 text-[11px] font-bold text-white uppercase tracking-wider shadow-[0_0_12px_rgba(14,165,233,0.4)]">
              Быстрый старт
            </div>

            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
                  <TelegramIcon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-display-landing text-2xl font-bold text-ink">Telegram-бот</h3>
                  <div className="text-xs text-sky-400 font-mono-landing">@{BOT_USERNAME}</div>
                </div>
              </div>

              <p className="mt-4 text-sm text-ink/90 font-medium">
                Без почты, без пароля, ключ сразу в чате.
              </p>

              <ul className="mt-5 space-y-2.5 text-xs sm:text-sm text-muted">
                <li className="flex items-center gap-2.5">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-sky-500/20 text-sky-400 shrink-0">
                    <CheckIcon className="h-3 w-3" />
                  </span>
                  <span>Старт за 10 секунд в мессенджере</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-sky-500/20 text-sky-400 shrink-0">
                    <CheckIcon className="h-3 w-3" />
                  </span>
                  <span>Оплата через СБП и картами в 1 клик</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-sky-500/20 text-sky-400 shrink-0">
                    <CheckIcon className="h-3 w-3" />
                  </span>
                  <span>Автоматические напоминания до окончания срока</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-sky-500/20 text-sky-400 shrink-0">
                    <CheckIcon className="h-3 w-3" />
                  </span>
                  <span>Круглосуточная поддержка в Telegram</span>
                </li>
              </ul>
            </div>

            <div className="mt-8 pt-5 border-t border-line/50">
              <a
                href={TELEGRAM_BOT_URL}
                target="_blank"
                rel="noreferrer noopener"
                className="button-lift flex w-full items-center justify-center gap-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold py-3 px-4 text-sm shadow-[0_4px_20px_rgba(14,165,233,0.3)] transition-all"
              >
                <TelegramIcon className="h-4 w-4" />
                <span>Открыть бота в Telegram</span>
              </a>
            </div>
          </div>

          {/* Card 2: Web Cabinet */}
          <div className="glass-panel rounded-3xl border border-line/80 bg-surface/75 p-7 sm:p-8 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-2 text-ink border border-line">
                  <svg
                    className="h-6 w-6 text-muted"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.75}
                      d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-display-landing text-2xl font-bold text-ink">
                    Личный кабинет
                  </h3>
                  <div className="text-xs text-muted font-mono-landing">invoxy.my/dashboard</div>
                </div>
              </div>

              <p className="mt-4 text-sm text-ink/90 font-medium">
                Статистика, устройства и рефералка с компьютера.
              </p>

              <ul className="mt-5 space-y-2.5 text-xs sm:text-sm text-muted">
                <li className="flex items-center gap-2.5">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-surface-2 text-muted shrink-0">
                    <CheckIcon className="h-3 w-3" />
                  </span>
                  <span>Наглядный график расхода трафика по дням</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-surface-2 text-muted shrink-0">
                    <CheckIcon className="h-3 w-3" />
                  </span>
                  <span>Управление списком всех активных устройств</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-surface-2 text-muted shrink-0">
                    <CheckIcon className="h-3 w-3" />
                  </span>
                  <span>Реферальная программа: вывод бонусов на карту</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-surface-2 text-muted shrink-0">
                    <CheckIcon className="h-3 w-3" />
                  </span>
                  <span>Быстрый вход через Email или Telegram-виджет</span>
                </li>
              </ul>
            </div>

            <div className="mt-8 pt-5 border-t border-line/50">
              {isAuthenticated ? (
                <Link
                  to="/dashboard"
                  className="button-lift flex w-full items-center justify-center rounded-xl bg-surface-2 border border-line text-ink font-semibold py-3 px-4 text-sm hover:border-mint/40 hover:bg-surface-2/90 transition-all"
                >
                  Перейти в личный кабинет →
                </Link>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    to="/login"
                    className="button-lift flex items-center justify-center rounded-xl bg-surface-2 border border-line text-ink font-medium py-3 px-4 text-sm hover:bg-surface-2/90"
                  >
                    Войти
                  </Link>
                  <Link
                    to="/register"
                    className="button-lift flex items-center justify-center rounded-xl border border-line/90 bg-surface text-ink font-medium py-3 px-4 text-sm hover:border-mint/40 hover:bg-surface-2"
                  >
                    Регистрация
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
