import { useState, useEffect, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { AdaptiveDialog } from '@/invoxystart/components/ui/AdaptiveDialog';
import { LivelyCopyButton } from '@/invoxystart/components/ui/LivelyCopyButton';
import { ShieldCheck, Smartphone, Laptop, Zap } from '@/invoxystart/components/ui/RuneIcon';
import { openDeepLink } from '@/utils/openDeepLink';
import { authApi } from '@/invoxystart/api';
import { findInvoxyAsset, useLatestInvoxyRelease, type InvoxyPlatform } from './invoxyDownloads';

export interface AppConnectModalProps {
  open: boolean;
  onClose: () => void;
}

const INVOXY_PLATFORMS: { key: InvoxyPlatform; label: string; icon: typeof Smartphone }[] = [
  { key: 'android', label: 'Android', icon: Smartphone },
  { key: 'windows', label: 'Windows', icon: Laptop },
  { key: 'macos', label: 'macOS', icon: Laptop },
];

export function AppConnectModal({ open, onClose }: AppConnectModalProps) {
  const [loading, setLoading] = useState(false);
  const [appLink, setAppLink] = useState<{ url: string; token_expires_in: number } | null>(null);
  const [pairCode, setPairCode] = useState<{ code: string; expires_in: number } | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(120);
  const [error, setError] = useState<string | null>(null);
  const [downloadsOpen, setDownloadsOpen] = useState(false);
  const {
    release,
    status: releaseStatus,
    retry: retryRelease,
  } = useLatestInvoxyRelease(open && downloadsOpen);

  const fetchTokens = useCallback(async (isBackground = false) => {
    if (!isBackground) {
      setLoading(true);
    }
    setError(null);
    try {
      const [linkData, codeData] = await Promise.all([authApi.getAppLink(), authApi.getPairCode()]);
      setAppLink(linkData);
      setPairCode(codeData);
      setSecondsLeft(Math.min(linkData.token_expires_in || 120, codeData.expires_in || 300));
    } catch {
      if (!isBackground) {
        setError('Не удалось создать ссылку или код для входа. Попробуйте снова.');
      }
    } finally {
      if (!isBackground) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (open) {
      void fetchTokens();
    } else {
      setAppLink(null);
      setPairCode(null);
      setError(null);
    }
  }, [open, fetchTokens]);

  // Countdown timer with auto-refresh
  useEffect(() => {
    if (!open) return;
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          void fetchTokens(true);
          return 120;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [open, fetchTokens]);

  const handleConnectThisDevice = () => {
    if (!appLink?.url) return;
    openDeepLink(appLink.url);
  };
  const hasInvoxyDownload =
    release && INVOXY_PLATFORMS.some(({ key }) => findInvoxyAsset(release.assets, key));

  return (
    <AdaptiveDialog
      open={open}
      onClose={onClose}
      titleId="app-connect-modal-title"
      maxWidth="max-w-xl"
    >
      <div className="flex flex-col gap-5 p-1 sm:p-2">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-mint">
            <ShieldCheck size={16} /> Вход в 1 клик
          </div>
          <h2
            id="app-connect-modal-title"
            className="mt-1 text-2xl font-bold tracking-tight text-ink"
          >
            📱 Приложение Invoxy VPN
          </h2>
          <p className="mt-1 text-sm text-muted">
            Вход в официальное приложение без логина и паролей
          </p>
        </div>

        {/* Главная кнопка: Подключить это устройство */}
        <div className="rounded-2xl border border-mint/30 bg-mint/10 p-4 text-center flex flex-col items-center gap-3">
          <div className="flex items-center gap-2 text-mint font-bold text-sm">
            <Zap size={18} className="animate-pulse" />
            <span>Автоматический вход без логина и пароля</span>
          </div>
          <p className="text-xs text-muted max-w-sm">
            Нажмите кнопку ниже, чтобы моментально авторизоваться и синхронизировать все ваши
            подписки в приложении.
          </p>

          <button
            type="button"
            disabled={loading || !appLink}
            onClick={handleConnectThisDevice}
            className={`flex h-12 w-full max-w-xs cursor-pointer items-center justify-center gap-2 rounded-xl bg-mint px-5 text-sm font-bold text-bg transition-all hover:bg-mint/90 active:scale-95 shadow-[0_0_20px_rgba(165,232,196,0.3)] ${
              loading || !appLink ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <ShieldCheck size={18} />
            <span>Подключить это устройство</span>
          </button>

          {/* Таймер жизни ссылки с автообновлением */}
          <div className="flex items-center gap-2 text-[11px] text-muted">
            {loading ? (
              <span>Генерация защищённого токена...</span>
            ) : (
              <span>
                Автообновление через: <b className="text-mint">{secondsLeft}с</b>
              </span>
            )}
            {!loading && (
              <button
                type="button"
                onClick={() => void fetchTokens(false)}
                className="text-mint hover:underline font-bold ml-1 cursor-pointer"
              >
                Обновить
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-error/30 bg-error/10 p-3 text-center text-xs text-error">
            {error}{' '}
            <button
              type="button"
              onClick={() => void fetchTokens()}
              className="underline font-bold ml-1"
            >
              Повторить
            </button>
          </div>
        )}

        {/* Код сопряжения (Pair-Code) для ввода вручную */}
        {pairCode?.code && (
          <div className="glass-panel flex flex-col items-center justify-center rounded-2xl p-4 gap-2">
            <div className="flex items-center justify-between w-full">
              <span className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
                <Zap size={15} className="text-mint" /> Код подключения для приложения
              </span>
              <span className="text-[11px] text-muted">6 символов</span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 mt-1 w-full">
              <span className="rounded-2xl border border-mint/40 bg-mint/10 px-6 py-2.5 font-mono text-2xl sm:text-3xl font-black tracking-[0.25em] text-mint shadow-[0_0_25px_rgba(165,232,196,0.2)] select-all">
                {pairCode.code}
              </span>
              <div className="w-28 shrink-0">
                <LivelyCopyButton
                  text={pairCode.code}
                  label="Копировать"
                  copiedLabel="Скопировано!"
                />
              </div>
            </div>
            <p className="text-[11px] text-center text-muted max-w-xs mt-1">
              Введите этот код в приложении Invoxy VPN на экране входа.
            </p>
          </div>
        )}

        {/* QR-код для смартфона */}
        {appLink?.url && (
          <div className="glass-panel flex flex-col items-center justify-center rounded-2xl p-4 gap-2">
            <div className="flex items-center justify-between w-full">
              <span className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
                <Smartphone size={15} className="text-mint" /> Вход с телефона (QR-код)
              </span>
              <button
                type="button"
                onClick={() => void fetchTokens(false)}
                className="text-[11px] font-bold text-mint hover:underline cursor-pointer"
              >
                Обновить QR
              </button>
            </div>

            <div className="p-3 bg-white rounded-2xl shadow-lg mt-1">
              <QRCodeSVG
                value={appLink.url}
                size={170}
                bgColor="#ffffff"
                fgColor="#0b0c0e"
                includeMargin
                className="rounded-lg"
              />
            </div>
            <p className="text-[11px] text-center text-muted max-w-xs mt-1">
              Отсканируйте стандартной камерой телефона или планшета для моментального входа.
            </p>
          </div>
        )}

        {/* Копирование ссылки */}
        {appLink?.url && (
          <div className="glass-panel flex flex-col gap-2 rounded-2xl p-3.5">
            <span className="text-xs font-bold uppercase tracking-wider text-muted">
              Прямая ссылка для входа
            </span>
            <div className="flex items-center gap-2">
              <div className="glass-control flex h-10 min-w-0 flex-1 items-center truncate rounded-xl px-3 font-mono text-xs text-muted select-all">
                {appLink.url}
              </div>
              <div className="shrink-0 w-32">
                <LivelyCopyButton
                  text={appLink.url}
                  label="Копировать"
                  copiedLabel="Скопировано!"
                />
              </div>
            </div>
          </div>
        )}

        <details
          className="border-t border-white/8 pt-3"
          onToggle={(event) => setDownloadsOpen(event.currentTarget.open)}
        >
          <summary className="cursor-pointer text-xs text-muted underline decoration-white/20 underline-offset-4 transition-colors hover:text-ink">
            Дополнительно: скачать приложение Invoxy VPN
          </summary>
          {downloadsOpen && (
            <div className="mt-3 rounded-2xl border border-white/8 bg-white/[0.02] p-4">
              <p className="text-xs text-muted">
                Приложение доступно для Android, Windows и macOS. На iOS используйте HAPP или INCY.
              </p>
              <div aria-live="polite" className="mt-3">
                {releaseStatus === 'loading' || releaseStatus === 'idle' ? (
                  <p className="text-xs text-muted">Получаем актуальные файлы…</p>
                ) : releaseStatus === 'error' ? (
                  <div className="flex items-center gap-2 text-xs text-muted">
                    <span>Не удалось получить ссылки на загрузку.</span>
                    <button
                      type="button"
                      onClick={retryRelease}
                      className="cursor-pointer font-semibold text-mint hover:underline"
                    >
                      Повторить
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {INVOXY_PLATFORMS.map(({ key, label, icon: Icon }) => {
                        const asset = release && findInvoxyAsset(release.assets, key);
                        return asset ? (
                          <a
                            key={key}
                            href={asset.downloadUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="glass-control flex h-10 items-center justify-center gap-2 rounded-xl px-3 text-xs font-semibold text-ink transition-colors hover:border-mint/30 hover:bg-white/[.08]"
                          >
                            <Icon size={15} className="text-mint" /> {label}
                          </a>
                        ) : null;
                      })}
                    </div>
                    {!hasInvoxyDownload && (
                      <p className="mt-2 text-xs text-muted">
                        Файлы для загрузки пока не опубликованы.
                      </p>
                    )}
                  </>
                )}
                {releaseStatus === 'ready' && release?.version && (
                  <p className="mt-2 text-[11px] text-muted">Последняя версия: {release.version}</p>
                )}
              </div>
            </div>
          )}
        </details>
      </div>
    </AdaptiveDialog>
  );
}
