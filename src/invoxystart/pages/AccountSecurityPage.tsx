import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import {
  Check,
  Link2,
  LockKeyhole,
  Mail,
  ShieldCheck,
  X,
} from '@/invoxystart/components/ui/RuneIcon';
import { apiClient, authApi } from '@/invoxystart/api';
import { useToast } from '@/invoxystart/components/layout/ToastProvider';
import {
  AccountPage,
  AccountPanel,
  ErrorState,
  LoadingState,
} from '@/invoxystart/components/account/AccountPrimitives';
import { useDestructiveConfirm } from '@/platform/hooks/useNativeDialog';

type LinkedProvider = { provider: string; linked: boolean; identifier?: string | null };
type OAuthProvider = { name: string; display_name?: string };

const accountApi = {
  getLinkedProviders: () =>
    apiClient.get<{ providers: LinkedProvider[] }>('/cabinet/auth/account/linked-providers'),
  linkProviderInit: (provider: string) =>
    apiClient.get<{ authorize_url: string; state: string }>(
      `/cabinet/auth/account/link/${encodeURIComponent(provider)}/init`,
    ),
  unlinkProvider: (provider: string) =>
    apiClient.post<{ success: boolean }>(
      `/cabinet/auth/account/unlink/${encodeURIComponent(provider)}`,
    ),
};

const fallbackProviders: OAuthProvider[] = [
  { name: 'google', display_name: 'Google' },
  { name: 'yandex', display_name: 'Яндекс' },
  { name: 'discord', display_name: 'Discord' },
  { name: 'vk', display_name: 'VK' },
];

export default function AccountSecurityPage() {
  const { showToast } = useToast();
  const confirm = useDestructiveConfirm();
  const [providers, setProviders] = useState<LinkedProvider[]>([]);
  const [oauthProviders, setOauthProviders] = useState<OAuthProvider[]>(fallbackProviders);
  const [newEmail, setNewEmail] = useState('');
  const [code, setCode] = useState('');
  const [emailPending, setEmailPending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [linked, available] = await Promise.allSettled([
        accountApi.getLinkedProviders(),
        authApi.getOAuthProviders(),
      ]);
      if (linked.status === 'rejected') throw linked.reason;
      setProviders(
        Array.isArray(linked.value?.providers) ? (linked.value.providers as LinkedProvider[]) : [],
      );
      if (
        available.status === 'fulfilled' &&
        Array.isArray(available.value?.providers) &&
        available.value.providers.length
      )
        setOauthProviders(available.value.providers as OAuthProvider[]);
    } catch {
      setError('Не удалось загрузить настройки аккаунта');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function requestChange() {
    if (!/^\S+@\S+\.\S+$/.test(newEmail)) {
      showToast('Введите корректный e-mail');
      return;
    }
    setBusy('email');
    try {
      await authApi.requestEmailChange(newEmail.trim());
      setEmailPending(true);
      showToast('Код подтверждения отправлен на новую почту');
    } catch {
      showToast('Не удалось запросить смену e-mail');
    } finally {
      setBusy(null);
    }
  }

  async function verifyChange() {
    if (!code.trim()) return;
    setBusy('verify');
    try {
      const result = await authApi.verifyEmailChange(code.trim());
      setEmailPending(false);
      setCode('');
      setNewEmail(result.email || newEmail);
      showToast('E-mail подтверждён');
    } catch {
      showToast('Неверный или просроченный код');
    } finally {
      setBusy(null);
    }
  }

  async function connect(provider: string) {
    setBusy(`connect-${provider}`);
    try {
      const result = await accountApi.linkProviderInit(provider);
      if (result.authorize_url) window.location.assign(result.authorize_url);
    } catch {
      showToast('Не удалось начать привязку аккаунта');
      setBusy(null);
    }
  }

  async function disconnect(provider: string) {
    if (!(await confirm('Отвязать этот способ входа?', 'Подтвердите действие'))) return;
    setBusy(`unlink-${provider}`);
    try {
      await accountApi.unlinkProvider(provider);
      setProviders((current) =>
        current.map((item) =>
          item.provider === provider ? { ...item, linked: false, identifier: null } : item,
        ),
      );
      showToast('Аккаунт отвязан');
    } catch {
      showToast('Не удалось отвязать аккаунт');
    } finally {
      setBusy(null);
    }
  }

  const providerMap = new Map(providers.map((provider) => [provider.provider, provider]));
  const accountProviders = [
    { name: 'telegram', display_name: 'Telegram' },
    ...oauthProviders.filter(
      (provider) => provider.name !== 'telegram' && provider.name !== 'email',
    ),
  ];

  return (
    <AccountPage title="Безопасность" subtitle="E-mail и подключённые аккаунты">
      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={() => void load()} />
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          <AccountPanel
            title="Смена e-mail"
            description="Новый адрес нужно подтвердить кодом из письма"
          >
            <div className="mt-5 flex items-center gap-3 rounded-2xl bg-white/5 px-4 py-3">
              <Mail size={17} className="text-mint" />
              <span className="text-sm">
                {providers.find((provider) => provider.provider === 'email' && provider.linked)
                  ?.identifier || 'E-mail не привязан'}
              </span>
            </div>
            <label className="mt-4 block">
              <span className="sr-only">Новый e-mail</span>
              <input
                type="email"
                value={newEmail}
                onChange={(event) => setNewEmail(event.target.value)}
                placeholder="Новый e-mail"
                className="glass-control h-12 w-full rounded-2xl px-4 text-sm outline-none focus:border-mint/60"
              />
            </label>
            {emailPending ? (
              <div className="mt-3 flex gap-2">
                <input
                  inputMode="numeric"
                  value={code}
                  onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 8))}
                  placeholder="Код из письма"
                  className="glass-control h-12 min-w-0 flex-1 rounded-2xl px-4 text-sm outline-none focus:border-mint/60"
                />
                <button
                  type="button"
                  disabled={busy === 'verify'}
                  onClick={() => void verifyChange()}
                  className="button-lift rounded-full bg-mint px-4 text-xs font-bold text-bg disabled:opacity-50"
                >
                  {busy === 'verify' ? 'Проверка…' : 'Подтвердить'}
                </button>
              </div>
            ) : (
              <button
                type="button"
                disabled={busy === 'email'}
                onClick={() => void requestChange()}
                className="button-lift mt-3 h-12 w-full rounded-full bg-mint text-sm font-bold text-bg disabled:opacity-50"
              >
                {busy === 'email' ? 'Отправка…' : 'Отправить код'}
              </button>
            )}
            {emailPending ? (
              <p className="mt-3 text-xs text-muted">
                Письмо отправлено на {newEmail}. Если письма нет, проверьте папку «Спам».
              </p>
            ) : null}
          </AccountPanel>

          <AccountPanel title="Подключённые аккаунты" description="Добавьте запасной способ входа">
            <div className="mt-4 divide-y divide-white/8">
              {accountProviders.map((available) => {
                const linked = providerMap.get(available.name);
                const isLinked = Boolean(linked?.linked);
                return (
                  <div key={available.name} className="flex items-center gap-3 py-4">
                    <span
                      className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${isLinked ? 'bg-mint/15 text-mint' : 'glass-control text-muted'}`}
                    >
                      {isLinked ? <Check size={17} /> : <Link2 size={17} />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">
                        {available.display_name || available.name}
                      </p>
                      <p className="mt-1 truncate text-xs text-muted">
                        {isLinked ? linked?.identifier || 'Подключён' : 'Не подключён'}
                      </p>
                    </div>
                    {isLinked ? (
                      <button
                        type="button"
                        disabled={busy === `unlink-${available.name}`}
                        onClick={() => void disconnect(available.name)}
                        className="button-lift flex items-center gap-1.5 rounded-full border border-red-300/20 px-3 py-2 text-xs text-red-200"
                      >
                        <X size={14} /> Отвязать
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={busy === `connect-${available.name}`}
                        onClick={() => void connect(available.name)}
                        className="button-lift rounded-full border border-mint/30 px-3 py-2 text-xs font-bold text-mint"
                      >
                        Подключить
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="mt-5 flex items-start gap-3 rounded-2xl bg-mint/10 p-4">
              <ShieldCheck size={18} className="mt-0.5 shrink-0 text-mint" />
              <p className="text-xs text-muted">
                Оставьте хотя бы один способ входа привязанным, чтобы не потерять доступ к кабинету.
              </p>
            </div>
          </AccountPanel>

          <AccountPanel
            title="Защита аккаунта"
            description="Базовые рекомендации для безопасности"
            className="xl:col-span-2"
          >
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <SecurityTip
                icon={<LockKeyhole size={17} />}
                title="Уникальный пароль"
                detail="Не используйте пароль от других сервисов"
              />
              <SecurityTip
                icon={<Mail size={17} />}
                title="Подтверждённая почта"
                detail="Помогает восстановить доступ"
              />
              <SecurityTip
                icon={<ShieldCheck size={17} />}
                title="Два способа входа"
                detail="Подключите Telegram или OAuth"
              />
            </div>
          </AccountPanel>
        </div>
      )}
    </AccountPage>
  );
}

function SecurityTip({ icon, title, detail }: { icon: ReactNode; title: string; detail: string }) {
  return (
    <div className="rounded-2xl bg-white/5 p-4">
      <span className="text-mint">{icon}</span>
      <p className="mt-3 text-sm font-medium">{title}</p>
      <p className="mt-1 text-xs text-muted">{detail}</p>
    </div>
  );
}

export { AccountSecurityPage };
