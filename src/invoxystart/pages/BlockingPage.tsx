import { useState } from 'react';
import { Link } from 'react-router';
import { BrandLogo } from '@/invoxystart/components/layout/BrandLogo';
import {
  Check,
  ChevronRight,
  Info,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  WifiOff,
} from '@/invoxystart/components/ui/RuneIcon';
import { requestJson, safeExternalUrl } from './_contentApi';

export type BlockingType =
  | 'maintenance'
  | 'channel_subscription'
  | 'blacklisted'
  | 'account_deleted'
  | 'backend_unavailable';
export interface BlockingChannel {
  channel_id: string;
  channel_link?: string;
  title?: string;
  is_subscribed?: boolean;
}
export interface BlockingInfo {
  message?: string;
  reason?: string;
  channel_link?: string;
  channels?: BlockingChannel[];
  telegram_deep_link?: string;
}

const copy: Record<BlockingType, { title: string; description: string; accent: string }> = {
  maintenance: {
    title: 'Технические работы',
    description: 'Сервис временно недоступен. Мы уже работаем над восстановлением.',
    accent: 'text-yellow',
  },
  channel_subscription: {
    title: 'Нужна подписка на канал',
    description: 'Подпишитесь на обязательный канал и нажмите «Проверить подписку».',
    accent: 'text-mint',
  },
  blacklisted: {
    title: 'Доступ ограничен',
    description: 'Для этого аккаунта доступ к сервису ограничен.',
    accent: 'text-red-200',
  },
  account_deleted: {
    title: 'Аккаунт удалён',
    description: 'Верните аккаунт через Telegram-бота, затем повторите вход.',
    accent: 'text-yellow',
  },
  backend_unavailable: {
    title: 'Сервис недоступен',
    description: 'Не удалось связаться с сервером. Проверьте соединение и повторите попытку.',
    accent: 'text-mint',
  },
};

export default function BlockingPage({
  type,
  info,
  onRetry,
  onCheckSubscription,
}: {
  type: BlockingType;
  info?: BlockingInfo | null;
  onRetry?: () => void | Promise<void>;
  onCheckSubscription?: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const current = copy[type];
  const channels = (info?.channels ?? []).filter((channel) => !channel.is_subscribed);

  async function retry() {
    setBusy(true);
    setMessage('');
    try {
      if (onRetry) await onRetry();
      else window.location.reload();
    } catch {
      setMessage('Повторная проверка не удалась. Попробуйте позже.');
    } finally {
      setBusy(false);
    }
  }

  async function checkSubscription() {
    setBusy(true);
    setMessage('');
    try {
      if (onCheckSubscription) await onCheckSubscription();
      else {
        await requestJson('/cabinet/auth/me');
        window.location.reload();
      }
    } catch {
      setMessage('Подписка пока не подтверждена. Подпишитесь на канал и попробуйте снова.');
    } finally {
      setBusy(false);
    }
  }

  const botLink = safeExternalUrl(info?.telegram_deep_link);
  const channelLink = safeExternalUrl(info?.channel_link);
  return (
    <main className="fixed inset-0 z-[100] overflow-y-auto bg-bg px-4 py-6 text-ink sm:px-8 sm:py-10">
      <div className="mx-auto flex min-h-full max-w-xl flex-col">
        <div className="flex items-center justify-between">
          <Link to="/" aria-label="На главную">
            <BrandLogo iconClassName="h-9 w-9 rounded-xl" textClassName="text-base font-bold" />
          </Link>
          <span className="text-[10px] font-bold tracking-[.16em] text-muted">INVOXYVPN</span>
        </div>
        <section className="glass-panel my-auto rounded-[36px] p-7 text-center sm:p-10">
          <div
            className={`mx-auto grid h-20 w-20 place-items-center rounded-full bg-white/[.05] ring-1 ring-white/10 ${current.accent}`}
          >
            {type === 'maintenance' ? (
              <Sparkles size={32} />
            ) : type === 'channel_subscription' ? (
              <ShieldCheck size={32} />
            ) : type === 'blacklisted' ? (
              <LockKeyhole size={32} />
            ) : type === 'account_deleted' ? (
              <Info size={32} />
            ) : (
              <WifiOff size={32} />
            )}
          </div>
          <h1 className="mt-7 text-3xl font-medium tracking-[-.05em]">{current.title}</h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted">
            {info?.message || current.description}
          </p>
          {info?.reason && (
            <div className="mt-6 rounded-2xl bg-white/[.04] p-4 text-left">
              <p className="text-[10px] font-bold uppercase tracking-[.14em] text-muted">Причина</p>
              <p className="mt-2 text-sm">{info.reason}</p>
            </div>
          )}
          {type === 'channel_subscription' && (
            <div className="mt-6 grid gap-2 text-left">
              {channels.length > 0
                ? channels.map((channel) => (
                    <div
                      key={channel.channel_id}
                      className="flex items-center justify-between gap-3 rounded-2xl bg-white/[.04] p-3"
                    >
                      <span className="truncate text-sm">
                        {channel.title || channel.channel_id}
                      </span>
                      {safeExternalUrl(channel.channel_link) && (
                        <a
                          href={safeExternalUrl(channel.channel_link) ?? undefined}
                          target="_blank"
                          rel="noreferrer"
                          className="shrink-0 rounded-full bg-mint px-3 py-2 text-[11px] font-bold text-bg"
                        >
                          Открыть
                        </a>
                      )}
                    </div>
                  ))
                : safeExternalUrl(info?.channel_link) && (
                    <a
                      href={channelLink ?? undefined}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full bg-mint px-4 py-3 text-sm font-bold text-bg"
                    >
                      Открыть канал
                    </a>
                  )}
            </div>
          )}
          {message && (
            <p role="alert" className="mt-5 rounded-2xl bg-red-300/10 p-3 text-sm text-red-200">
              {message}
            </p>
          )}
          <div className="mt-7 grid gap-2">
            {type === 'channel_subscription' && (
              <button
                type="button"
                disabled={busy}
                onClick={() => void checkSubscription()}
                className="button-lift flex h-13 items-center justify-center gap-2 rounded-full bg-mint text-sm font-bold text-bg disabled:opacity-50"
              >
                {busy ? 'Проверяем…' : 'Проверить подписку'}
                <Check size={16} />
              </button>
            )}
            {type === 'account_deleted' && botLink && (
              <a
                href={botLink}
                target="_blank"
                rel="noreferrer"
                className="button-lift flex h-13 items-center justify-center gap-2 rounded-full bg-mint text-sm font-bold text-bg"
              >
                Открыть Telegram-бота <ChevronRight size={16} />
              </a>
            )}
            {(type === 'maintenance' ||
              type === 'backend_unavailable' ||
              type === 'account_deleted') && (
              <button
                type="button"
                disabled={busy}
                onClick={() => void retry()}
                className="glass-control h-13 rounded-full text-sm font-bold disabled:opacity-50"
              >
                {busy ? 'Проверяем…' : 'Повторить'}
              </button>
            )}
            {type === 'blacklisted' && (
              <a
                href="https://t.me/invoxyvpn"
                target="_blank"
                rel="noreferrer"
                className="glass-control flex h-13 items-center justify-center rounded-full text-sm font-bold"
              >
                Связаться с поддержкой
              </a>
            )}
          </div>
          <p className="mt-7 text-xs text-muted">
            Если проблема сохраняется, напишите в поддержку.
          </p>
        </section>
      </div>
    </main>
  );
}
