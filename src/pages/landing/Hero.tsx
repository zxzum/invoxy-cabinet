import { Link } from 'react-router';
import { NetworkBoard } from './NetworkBoard';
import type { NetworkNode } from '@/data/networkSnapshot';

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

interface HeroProps {
  selectedNodeId?: string;
  onSelectNode?: (node: NetworkNode) => void;
}

export function Hero({ selectedNodeId, onSelectNode }: HeroProps) {
  return (
    <section className="relative overflow-hidden pt-6 sm:pt-10 pb-16 sm:pb-24">
      {/* Studio lighting gradient bloom */}
      <div
        className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/3 h-[500px] w-[800px] rounded-full bg-mint/10 blur-[130px]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute right-0 top-1/4 h-[350px] w-[500px] rounded-full bg-[#1e293b]/30 blur-[120px]"
        aria-hidden="true"
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-8">
          {/* Left Column: Offer, Copy, CTAs */}
          <div className="lg:col-span-6 xl:col-span-7 flex flex-col justify-center">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 rounded-full border border-mint/25 bg-mint/10 px-3.5 py-1.5 text-xs font-medium text-mint w-fit">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-mint opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-mint" />
              </span>
              <span>Сеть онлайн · VLESS Reality</span>
            </div>

            {/* H1 Heading */}
            <h1 className="mt-5 font-display-landing text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-ink leading-[1.12]">
              Интернет без блокировок.
              <span className="block text-mint mt-1">Проверьте сами за 10 секунд.</span>
            </h1>

            {/* Subtitle */}
            <p className="mt-5 text-base sm:text-lg leading-relaxed text-muted max-w-xl">
              YouTube 4K, Instagram и ChatGPT. Без привязки карты на старте —{' '}
              <span className="text-ink font-medium">10 ГБ в подарок</span>.
            </p>

            {/* 3 Value Bullets */}
            <ul className="mt-6 space-y-2.5 text-sm sm:text-base text-ink/90">
              <li className="flex items-center gap-2.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-mint/20 text-mint shrink-0">
                  <CheckIcon className="h-3 w-3" />
                </span>
                <span>
                  <strong className="text-ink font-semibold">10 ГБ бесплатно</strong> на 2 дня без
                  карты
                </span>
              </li>
              <li className="flex items-center gap-2.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-mint/20 text-mint shrink-0">
                  <CheckIcon className="h-3 w-3" />
                </span>
                <span>
                  Работает на{' '}
                  <strong className="text-ink font-semibold">МТС, Билайн, Мегафон, Теле2</strong>
                </span>
              </li>
              <li className="flex items-center gap-2.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-mint/20 text-mint shrink-0">
                  <CheckIcon className="h-3 w-3" />
                </span>
                <span>Телефон, ноутбук и ТВ на одном аккаунте</span>
              </li>
            </ul>

            {/* Actions */}
            <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
              <a
                href={TELEGRAM_BOT_URL}
                target="_blank"
                rel="noreferrer noopener"
                className="button-lift inline-flex items-center justify-center gap-2.5 rounded-2xl bg-mint px-6 py-3.5 text-base font-bold text-bg shadow-[0_4px_24px_rgba(165,232,196,0.38)] hover:bg-[#bbf0d4] transition-all"
              >
                <TelegramIcon className="h-5 w-5" />
                <span>Открыть Telegram-бота</span>
              </a>

              <Link
                to="/register"
                className="button-lift inline-flex items-center justify-center rounded-2xl border border-line bg-surface px-6 py-3.5 text-base font-semibold text-ink hover:border-mint/40 hover:bg-surface-2 transition-all"
              >
                Создать аккаунт
              </Link>
            </div>

            {/* Microcopy reassurance */}
            <p className="mt-3 text-xs text-muted flex items-center gap-1.5">
              <span className="text-mint">⚡</span>
              <span>В Telegram быстрее: без почты, пароля и ввода данных.</span>
            </p>
          </div>

          {/* Right Column: NetworkBoard interactive console */}
          <div className="lg:col-span-6 xl:col-span-5">
            <NetworkBoard selectedNodeId={selectedNodeId} onSelectNode={onSelectNode} />
          </div>
        </div>
      </div>
    </section>
  );
}
