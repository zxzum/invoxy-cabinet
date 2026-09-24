import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { useAuthStore } from '@/store/auth';

const BOT_USERNAME = (import.meta.env.VITE_TELEGRAM_BOT_USERNAME || 'invoxy_bot').replace(/^@/, '');
const TELEGRAM_BOT_URL = `https://t.me/${BOT_USERNAME}`;

function TelegramIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .37z" />
    </svg>
  );
}

export function Header() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinks = [
    { label: 'Сеть', href: '#network' },
    { label: 'Проверка', href: '#check' },
    { label: 'Тарифы', href: '#tariffs' },
    { label: 'Белый интернет', href: '#whitelist' },
    { label: 'Приложения', href: '#apps' },
    { label: 'FAQ', href: '#faq' },
  ];

  return (
    <header
      className={`sticky top-0 z-40 transition-colors duration-200 ${
        scrolled
          ? 'border-b border-line/70 bg-bg/85 backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.4)]'
          : 'border-b border-transparent bg-bg/50 backdrop-blur-md'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-3 group focus:outline-none">
          <img
            src="/images/brand-mark.png?v=3d"
            alt="Invoxy"
            className="h-8 w-8 object-contain transition-transform group-hover:scale-105"
            width={32}
            height={32}
          />
          <span className="font-display-landing text-xl font-bold tracking-tight text-ink">
            Invoxy<span className="text-mint">VPN</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-7" aria-label="Основная навигация">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted hover:text-ink transition-colors duration-150"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Desktop CTA actions */}
        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated ? (
            <Link
              to="/dashboard"
              className="button-lift inline-flex items-center justify-center rounded-xl bg-mint px-4 py-2 text-sm font-semibold text-bg shadow-[0_0_20px_rgba(165,232,196,0.3)] hover:brightness-105 transition-all"
            >
              В кабинет →
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm font-medium text-muted hover:text-ink transition-colors px-2 py-1.5"
              >
                Войти
              </Link>
              <Link
                to="/register"
                className="button-lift hidden lg:inline-flex items-center justify-center rounded-xl border border-line bg-surface/80 px-3.5 py-2 text-sm font-medium text-ink hover:border-mint/40 hover:bg-surface-2 transition-all"
              >
                Регистрация
              </Link>
              <a
                href={TELEGRAM_BOT_URL}
                target="_blank"
                rel="noreferrer noopener"
                className="button-lift inline-flex items-center gap-2 rounded-xl bg-mint px-4 py-2 text-sm font-semibold text-bg shadow-[0_0_24px_rgba(165,232,196,0.35)] hover:bg-[#bbf0d4] transition-all"
              >
                <TelegramIcon className="h-4 w-4" />
                <span>Бот в Telegram</span>
              </a>
            </>
          )}
        </div>

        {/* Mobile menu trigger */}
        <div className="flex items-center gap-2 md:hidden">
          {isAuthenticated ? (
            <Link
              to="/dashboard"
              className="rounded-lg bg-mint px-3 py-1.5 text-xs font-semibold text-bg"
            >
              Кабинет
            </Link>
          ) : (
            <a
              href={TELEGRAM_BOT_URL}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-1.5 rounded-lg bg-mint px-3 py-1.5 text-xs font-semibold text-bg"
            >
              <TelegramIcon className="h-3.5 w-3.5" />
              <span>Бот</span>
            </a>
          )}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-line bg-surface text-ink focus:outline-none focus:ring-2 focus:ring-mint/50"
            aria-expanded={mobileMenuOpen}
            aria-label="Меню сайта"
          >
            {mobileMenuOpen ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <div className="border-b border-line bg-surface/95 px-4 pt-3 pb-6 backdrop-blur-2xl md:hidden">
          <nav className="flex flex-col gap-3 py-2">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center py-2 text-base font-medium text-muted hover:text-ink transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="mt-4 flex flex-col gap-2.5 pt-4 border-t border-line/60">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="flex w-full items-center justify-center rounded-xl bg-mint py-2.5 text-sm font-semibold text-bg"
              >
                Перейти в личный кабинет
              </Link>
            ) : (
              <>
                <a
                  href={TELEGRAM_BOT_URL}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-mint py-2.5 text-sm font-semibold text-bg shadow-[0_0_20px_rgba(165,232,196,0.3)]"
                >
                  <TelegramIcon className="h-4 w-4" />
                  <span>Открыть Telegram-бота</span>
                </a>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center rounded-xl border border-line bg-surface-2 py-2 text-sm font-medium text-ink"
                  >
                    Войти
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center rounded-xl border border-line bg-surface-2 py-2 text-sm font-medium text-ink"
                  >
                    Регистрация
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
