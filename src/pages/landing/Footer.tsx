import { Link } from 'react-router';
import brandLogo from '@/assets/logo.png';

const BOT_USERNAME = (import.meta.env.VITE_TELEGRAM_BOT_USERNAME || 'invoxy_bot').replace(/^@/, '');
const TELEGRAM_BOT_URL = `https://t.me/${BOT_USERNAME}`;
const TELEGRAM_SUPPORT_URL = 'https://t.me/invoxyvpn';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-line/60 bg-bg py-12 pb-24 sm:pb-12 text-xs text-muted">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Brand & tagline */}
          <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
            <Link to="/" className="flex items-center gap-2.5 group">
              <img
                src={brandLogo}
                alt="Invoxy"
                className="h-6 w-6 object-contain"
                width={24}
                height={24}
              />
              <span className="font-display-landing text-base font-bold text-ink">
                Invoxy<span className="text-mint">VPN</span>
              </span>
            </Link>
            <span className="hidden sm:inline text-line">|</span>
            <span className="text-muted">Свободный интернет. Без лишних слов.</span>
          </div>

          {/* External links */}
          <div className="flex items-center gap-5">
            <a
              href={TELEGRAM_BOT_URL}
              target="_blank"
              rel="noreferrer noopener"
              className="text-muted hover:text-ink transition-colors"
            >
              Telegram-бот
            </a>
            <a
              href={TELEGRAM_SUPPORT_URL}
              target="_blank"
              rel="noreferrer noopener"
              className="text-muted hover:text-ink transition-colors"
            >
              Служба поддержки
            </a>
          </div>
        </div>

        {/* Legal documents and copyright */}
        <div className="mt-8 pt-6 border-t border-line/40 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex flex-wrap justify-center sm:justify-start gap-4 sm:gap-6 text-[11px]">
            <Link to="/offer" className="hover:text-ink transition-colors">
              Пользовательское соглашение
            </Link>
            <Link to="/privacy" className="hover:text-ink transition-colors">
              Политика конфиденциальности
            </Link>
            <Link to="/recurrent-payments" className="hover:text-ink transition-colors">
              Рекуррентные платежи
            </Link>
          </div>

          <div className="text-[11px] font-mono-landing text-muted/80">
            © {currentYear} InvoxyVPN · invoxy.my
          </div>
        </div>
      </div>
    </footer>
  );
}
