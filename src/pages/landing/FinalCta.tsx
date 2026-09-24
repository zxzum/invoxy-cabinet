import { Link } from 'react-router';

const BOT_USERNAME = (import.meta.env.VITE_TELEGRAM_BOT_USERNAME || 'invoxy_bot').replace(/^@/, '');
const TELEGRAM_BOT_URL = `https://t.me/${BOT_USERNAME}`;

function TelegramIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .37z" />
    </svg>
  );
}

export function FinalCta() {
  return (
    <section className="py-20 sm:py-28 relative overflow-hidden border-t border-line/40">
      {/* Background ambient lighting bloom */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[450px] w-[650px] rounded-full bg-mint/10 blur-[130px]"
        aria-hidden="true"
      />

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 relative">
        <div className="glass-panel rounded-[36px] border border-line/80 bg-surface/85 p-8 sm:p-14 text-center shadow-[0_24px_64px_rgba(0,0,0,0.5)]">
          <div className="inline-flex items-center gap-2 rounded-full border border-mint/30 bg-mint/10 px-3.5 py-1 text-xs font-mono-landing font-semibold text-mint mb-4">
            <span>Начните прямо сейчас</span>
          </div>

          <h2 className="font-display-landing text-3xl sm:text-5xl font-extrabold tracking-tight text-ink leading-tight">
            Свободный интернет. Без лишних слов.
          </h2>

          <p className="mt-4 text-base sm:text-lg text-muted max-w-xl mx-auto">
            10 ГБ на 2 дня бесплатно. Без привязки карты. Подключение за 10 секунд через
            Telegram-бота.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <a
              href={TELEGRAM_BOT_URL}
              target="_blank"
              rel="noreferrer noopener"
              className="button-lift flex w-full sm:w-auto items-center justify-center gap-2.5 rounded-2xl bg-mint px-8 py-4 text-base font-bold text-bg shadow-[0_4px_24px_rgba(165,232,196,0.38)] hover:bg-[#bbf0d4] transition-all"
            >
              <TelegramIcon className="h-5 w-5" />
              <span>Открыть Telegram-бота</span>
            </a>

            <Link
              to="/register"
              className="button-lift flex w-full sm:w-auto items-center justify-center rounded-2xl border border-line bg-surface-2 px-7 py-4 text-base font-semibold text-ink hover:border-mint/40 hover:bg-surface-2/90 transition-all"
            >
              Создать аккаунт на сайте
            </Link>
          </div>

          <div className="mt-5 text-xs text-muted font-mono-landing">
            МТС · Билайн · Мегафон · Tele2 · Wi-Fi
          </div>
        </div>
      </div>
    </section>
  );
}
