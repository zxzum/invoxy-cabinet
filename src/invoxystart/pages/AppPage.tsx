import { useEffect, useState, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import {
  appApi,
  APP_PLATFORMS,
  APP_RETURN_URL,
  detectAppPlatform,
  type PendingAppLogin,
} from '@/invoxystart/api/app';
import { ApiError } from '@/invoxystart/api';
import { Check, ShieldCheck, Smartphone, X } from '@/invoxystart/components/ui/RuneIcon';

function Frame({ children }: { children: ReactNode }) {
  return (
    <main className="relative z-10 mx-auto flex min-h-dvh w-full max-w-xl flex-col justify-center gap-4 px-4 py-10">
      <Link to="/" className="text-center text-sm font-bold text-ink">
        Invoxy VPN
      </Link>
      <section className="glass-panel flex flex-col gap-4 rounded-[28px] p-5 sm:p-6">
        {children}
      </section>
    </main>
  );
}

const STEPS = [
  'Установите приложение Invoxy VPN.',
  'Нажмите «Войти через Telegram» или «Войти через сайт».',
  'Подтвердите вход и вернитесь в приложение — подписка подключится сама.',
];

export default function AppPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['invoxy-app-config'],
    queryFn: appApi.getConfig,
  });
  const current = detectAppPlatform();
  const platforms = [...APP_PLATFORMS].sort(
    (a, b) => Number(b.key === current) - Number(a.key === current),
  );

  return (
    <Frame>
      <div>
        <h1 className="text-2xl font-bold text-ink">Приложение Invoxy VPN</h1>
        <p className="mt-1 text-sm text-muted">Одна кнопка подключения и вход без ввода ключа.</p>
      </div>
      <ul className="grid gap-2 sm:grid-cols-2">
        {platforms.map((p) => {
          const url = data?.links.downloads[p.key];
          return (
            <li key={p.key}>
              {url ? (
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="glass-control flex h-12 items-center gap-2 rounded-2xl px-4 text-sm font-bold text-mint hover:bg-white/[.06]"
                >
                  <Smartphone size={16} /> {p.label}
                </a>
              ) : (
                <span className="glass-control flex h-12 items-center justify-between gap-2 rounded-2xl px-4 text-sm text-muted">
                  {p.label}
                  <span className="text-[11px]">{isLoading ? '…' : 'скоро'}</span>
                </span>
              )}
            </li>
          );
        })}
      </ul>
      <ol className="flex flex-col gap-2 text-sm text-ink">
        {STEPS.map((step, i) => (
          <li key={step} className="flex gap-3">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-mint/15 text-xs font-bold text-mint">
              {i + 1}
            </span>
            {step}
          </li>
        ))}
      </ol>
      <p className="text-xs text-muted">
        Ключ доступа из личного кабинета тоже можно вставить в приложение вручную: он открывает
        только VPN, без доступа к аккаунту.
      </p>
    </Frame>
  );
}

type LoginState = 'loading' | 'pending' | 'expired' | 'confirmed' | 'denied' | 'error';

export function AppLoginPage() {
  const [params] = useSearchParams();
  const requestId = params.get('request') ?? '';
  const [state, setState] = useState<LoginState>('loading');
  const [info, setInfo] = useState<PendingAppLogin | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    appApi
      .getLogin(requestId)
      .then((result) => {
        if (!active) return;
        setInfo(result);
        setState('pending');
      })
      .catch((error: unknown) => {
        if (active)
          setState(error instanceof ApiError && error.status === 410 ? 'expired' : 'error');
      });
    return () => {
      active = false;
    };
  }, [requestId]);

  async function decide(decision: 'confirm' | 'deny') {
    setBusy(true);
    try {
      await appApi.decideLogin(requestId, decision);
      setState(decision === 'confirm' ? 'confirmed' : 'denied');
      if (decision === 'confirm') window.location.href = APP_RETURN_URL;
    } catch (error) {
      setState(error instanceof ApiError && error.status === 410 ? 'expired' : 'error');
    } finally {
      setBusy(false);
    }
  }

  const platform = APP_PLATFORMS.find((p) => p.key === info?.platform)?.label ?? 'устройство';

  return (
    <Frame>
      {state === 'loading' && <p className="text-sm text-muted">Проверяем запрос на вход…</p>}
      {state === 'pending' && (
        <>
          <ShieldCheck size={28} className="text-mint" />
          <h1 className="text-xl font-bold text-ink">
            Войти в приложение на устройстве {platform}?
          </h1>
          <p className="text-sm text-muted">
            Подтверждайте, только если вход начали вы сами на своём устройстве.
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => void decide('confirm')}
              className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-mint text-sm font-bold text-bg disabled:opacity-50"
            >
              <Check size={16} /> Да, войти
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void decide('deny')}
              className="glass-control flex h-12 items-center justify-center gap-2 rounded-2xl text-sm font-bold text-ink disabled:opacity-50"
            >
              <X size={16} /> Нет
            </button>
          </div>
        </>
      )}
      {state === 'confirmed' && <ReturnToApp />}
      {state === 'denied' && <p className="text-sm text-ink">Вход отменён.</p>}
      {state === 'expired' && (
        <p className="text-sm text-ink">Запрос устарел. Начните вход в приложении заново.</p>
      )}
      {state === 'error' && (
        <p className="text-sm text-ink">Не удалось проверить запрос. Попробуйте ещё раз позже.</p>
      )}
    </Frame>
  );
}

function ReturnToApp() {
  return (
    <>
      <Check size={28} className="text-mint" />
      <h1 className="text-xl font-bold text-ink">Вход подтверждён</h1>
      <p className="text-sm text-muted">
        Вернитесь в приложение Invoxy VPN — подписка подключится автоматически.
      </p>
      <a
        href={APP_RETURN_URL}
        className="flex h-12 items-center justify-center rounded-2xl bg-mint text-sm font-bold text-bg"
      >
        Открыть приложение
      </a>
    </>
  );
}

export function AppReturnPage() {
  useEffect(() => {
    window.location.href = APP_RETURN_URL;
  }, []);
  return (
    <Frame>
      <ReturnToApp />
    </Frame>
  );
}
