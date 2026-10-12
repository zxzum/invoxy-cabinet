import { Link } from 'react-router';
import brandLogo from '@/assets/landing/logo-192.png';
import type { LandingAuth } from './useLandingAuth';
import { Arrow, BuyLink, focusRing, primaryButton, quietButton } from './ui';

export function ScrollProgress() {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-40 h-0.5" aria-hidden="true">
      <div data-progress className="bg-aurora h-full origin-left scale-x-0" />
    </div>
  );
}

function Avatar({ name }: { name: string }) {
  const initial = (name || '•').slice(0, 1).toUpperCase();
  return (
    <span className="bg-aurora grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-semibold text-bg">
      {initial}
    </span>
  );
}

function AuthActions({ auth }: { auth: LandingAuth }) {
  if (auth.status === 'loading') {
    return (
      <div className="flex items-center gap-2" aria-hidden="true">
        <div className="h-10 w-20 animate-pulse rounded-full bg-surface" />
        <div className="h-10 w-32 animate-pulse rounded-full bg-surface" />
      </div>
    );
  }

  if (auth.status === 'user') {
    return (
      <div className="flex items-center gap-3">
        <span className="hidden items-center gap-2 text-sm text-muted xl:flex">
          <Avatar name={auth.name} />
          <span className="max-w-[10ch] truncate text-ink">{auth.name || 'Аккаунт'}</span>
        </span>
        <Link
          to="/dashboard"
          className={`group relative inline-flex h-10 items-center gap-2.5 rounded-full bg-gradient-to-r from-[#a5e8c4] via-[#5cd6ff] to-[#8b7bff] px-5 text-sm font-semibold text-bg shadow-[0_0_0_1px_rgba(165,232,196,0.5),0_10px_34px_-8px_rgba(92,214,255,0.7)] transition-transform active:scale-[0.97] ${focusRing}`}
        >
          <span
            className="ping-dot relative h-2 w-2 rounded-full bg-bg text-bg"
            aria-hidden="true"
          />
          Открыть кабинет
          <Arrow className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        to="/login"
        className={`inline-flex h-10 items-center rounded-full px-4 text-sm font-semibold text-ink transition-colors hover:bg-surface ${focusRing}`}
      >
        Войти
      </Link>
      <Link to="/register" state={{ from: '/tariffs' }} className={`${primaryButton} !h-10 !px-5`}>
        Регистрация
      </Link>
    </div>
  );
}

export function SiteHeader({ auth, showWhitelist }: { auth: LandingAuth; showWhitelist: boolean }) {
  const link = `rounded-md px-1 py-1 transition-colors hover:text-ink ${focusRing}`;
  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-bg/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/" className={`flex min-w-0 items-center gap-2.5 rounded-lg ${focusRing}`}>
          <img src={brandLogo} alt="" className="h-8 w-8 object-contain" width={32} height={32} />
          <span className="truncate font-display-landing text-lg font-semibold tracking-tight">
            Invoxy
          </span>
        </Link>
        <nav
          className={`hidden items-center gap-6 text-sm text-muted ${auth.status === 'user' ? 'xl:flex' : 'lg:flex'}`}
          aria-label="Разделы"
        >
          <a href="#tariffs" className={link}>
            Тарифы
          </a>
          <a href="#start" className={link}>
            Как это работает
          </a>
          {showWhitelist ? (
            <a href="#whitelist" className={link}>
              Белый интернет
            </a>
          ) : null}
          <a href="#lazeika" className={link}>
            Из Lazeika
          </a>
          <a href="#faq" className={link}>
            Вопросы
          </a>
          {auth.status === 'user' ? (
            <Link to="/subscriptions" className={`${link} text-mint`}>
              Мои подписки
            </Link>
          ) : null}
        </nav>
        <AuthActions auth={auth} />
      </div>
    </header>
  );
}

export function StickyCta({ auth }: { auth: LandingAuth }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 flex gap-2 border-t border-line/80 bg-bg/90 px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-xl md:hidden">
      {auth.status === 'user' ? (
        <Link to="/dashboard" className={`${primaryButton} flex-1`}>
          Открыть кабинет
          <Arrow />
        </Link>
      ) : (
        <>
          <BuyLink auth={auth} className={`${primaryButton} flex-1`}>
            Создать аккаунт
          </BuyLink>
          <Link to="/login" className={`${quietButton} flex-1`}>
            Войти
          </Link>
        </>
      )}
    </div>
  );
}

export function SiteFooter({
  botUrl,
  supportUrl,
  auth,
}: {
  botUrl: string | null;
  supportUrl: string;
  auth: LandingAuth;
}) {
  const link = `rounded transition-colors hover:text-ink ${focusRing}`;
  return (
    <footer className="border-t border-line/80 pb-28 md:pb-0">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2.5">
            <img src={brandLogo} alt="" className="h-8 w-8 object-contain" width={32} height={32} />
            <span className="font-display-landing text-lg font-semibold">Invoxy</span>
          </div>
          <p className="mt-4 max-w-[32ch] text-sm leading-relaxed text-muted">
            VPN и белый интернет с личным кабинетом. Новый проект после Lazeika VPN.
          </p>
        </div>
        <nav aria-label="Сервис">
          <p className="text-sm font-semibold text-ink">Сервис</p>
          <ul className="mt-4 space-y-2.5 text-sm text-muted">
            <li>
              <a href="#tariffs" className={link}>
                Тарифы
              </a>
            </li>
            <li>
              <a href="#start" className={link}>
                Как это работает
              </a>
            </li>
            <li>
              <a href="#lazeika" className={link}>
                Перенос из Lazeika
              </a>
            </li>
            <li>
              <a href="#faq" className={link}>
                Вопросы
              </a>
            </li>
          </ul>
        </nav>
        <nav aria-label="Документы">
          <p className="text-sm font-semibold text-ink">Документы</p>
          <ul className="mt-4 space-y-2.5 text-sm text-muted">
            <li>
              <Link to="/offer" className={link}>
                Публичная оферта
              </Link>
            </li>
            <li>
              <Link to="/privacy" className={link}>
                Политика конфиденциальности
              </Link>
            </li>
            <li>
              <Link to="/recurrent-payments" className={link}>
                Рекуррентные платежи
              </Link>
            </li>
          </ul>
        </nav>
        <nav aria-label="Связь">
          <p className="text-sm font-semibold text-ink">Связь</p>
          <ul className="mt-4 space-y-2.5 text-sm text-muted">
            <li>
              <Link to={auth.status === 'user' ? '/dashboard' : '/login'} className={link}>
                Личный кабинет
              </Link>
            </li>
            {botUrl ? (
              <li>
                <a href={botUrl} target="_blank" rel="noreferrer noopener" className={link}>
                  Telegram-бот
                </a>
              </li>
            ) : null}
            <li>
              <a href={supportUrl} target="_blank" rel="noreferrer noopener" className={link}>
                Поддержка
              </a>
            </li>
          </ul>
        </nav>
      </div>
      <div className="border-t border-line/60">
        <p className="mx-auto max-w-6xl px-4 py-5 text-xs text-muted sm:px-6">
          © {new Date().getFullYear()} Invoxy. Все права защищены.
        </p>
      </div>
    </footer>
  );
}
