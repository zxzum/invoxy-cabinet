import { useState, useEffect, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { AdaptiveDialog } from '@/invoxystart/components/ui/AdaptiveDialog';
import { LivelyCopyButton } from '@/invoxystart/components/ui/LivelyCopyButton';
import {
  ArrowRight,
  ArrowUpRight,
  ShieldCheck,
  Smartphone,
  Laptop,
  Zap,
} from '@/invoxystart/components/ui/RuneIcon';
import { openDeepLink } from '@/utils/openDeepLink';
import { authApi } from '@/invoxystart/api';

export interface AppConnectModalProps {
  open: boolean;
  onClose: () => void;
}

export function AppConnectModal({ open, onClose }: AppConnectModalProps) {
  const [loading, setLoading] = useState(false);
  const [appLink, setAppLink] = useState<{ url: string; token_expires_in: number } | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(120);
  const [error, setError] = useState<string | null>(null);

  const fetchToken = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await authApi.getAppLink();
      setAppLink(data);
      setSecondsLeft(data.token_expires_in || 120);
    } catch {
      setError('Не удалось создать ссылку для входа. Попробуйте снова.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      void fetchToken();
    } else {
      setAppLink(null);
      setError(null);
    }
  }, [open, fetchToken]);

  // Countdown timer
  useEffect(() => {
    if (!open || !appLink || secondsLeft <= 0) return;
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [open, appLink, secondsLeft]);

  const handleConnectThisDevice = () => {
    if (!appLink?.url) return;
    openDeepLink(appLink.url);
  };

  const isExpired = secondsLeft <= 0;

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
            disabled={loading || isExpired || !appLink}
            onClick={handleConnectThisDevice}
            className={`flex h-12 w-full max-w-xs cursor-pointer items-center justify-center gap-2 rounded-xl bg-mint px-5 text-sm font-bold text-bg transition-all hover:bg-mint/90 active:scale-95 shadow-[0_0_20px_rgba(165,232,196,0.3)] ${
              loading || isExpired || !appLink ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <ShieldCheck size={18} />
            <span>Подключить это устройство</span>
          </button>

          {/* Таймер жизни ссылки */}
          <div className="flex items-center gap-2 text-[11px] text-muted">
            {loading ? (
              <span>Генерация защищённого токена...</span>
            ) : isExpired ? (
              <span className="text-error font-medium">Ссылка истекла</span>
            ) : (
              <span>
                Код действителен ещё: <b className="text-mint">{secondsLeft}с</b>
              </span>
            )}
            {(isExpired || secondsLeft < 30) && !loading && (
              <button
                type="button"
                onClick={() => void fetchToken()}
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
              onClick={() => void fetchToken()}
              className="underline font-bold ml-1"
            >
              Повторить
            </button>
          </div>
        )}

        {/* QR-код для смартфона */}
        {appLink?.url && !isExpired && (
          <div className="glass-panel flex flex-col items-center justify-center rounded-2xl p-4 gap-2">
            <div className="flex items-center justify-between w-full">
              <span className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
                <Smartphone size={15} className="text-mint" /> Вход с телефона (QR-код)
              </span>
              <button
                type="button"
                onClick={() => void fetchToken()}
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
        {appLink?.url && !isExpired && (
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

        {/* Скачать приложение */}
        <div className="glass-panel flex flex-col gap-3 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted">
              📥 Скачать приложение Invoxy VPN
            </span>
            <a
              href="https://github.com/zxzum/InvoxyApp/releases/latest"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-bold text-mint hover:underline flex items-center gap-1"
            >
              Все версии <ArrowUpRight size={12} />
            </a>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <a
              href="https://github.com/zxzum/InvoxyApp/releases/latest/download/app-arm64-v8a-release.apk"
              target="_blank"
              rel="noopener noreferrer"
              className="glass-control flex h-11 items-center justify-center gap-2 rounded-xl px-3 text-xs font-semibold text-ink hover:border-mint/30 hover:bg-white/[.08] transition-all"
            >
              <Smartphone size={16} className="text-mint" />
              <span>Android (APK)</span>
            </a>

            <a
              href="https://github.com/zxzum/InvoxyApp/releases/latest/download/Invoxy_VPN_macOS.dmg"
              target="_blank"
              rel="noopener noreferrer"
              className="glass-control flex h-11 items-center justify-center gap-2 rounded-xl px-3 text-xs font-semibold text-ink hover:border-mint/30 hover:bg-white/[.08] transition-all"
            >
              <Laptop size={16} className="text-mint" />
              <span>macOS (DMG)</span>
            </a>

            <a
              href="https://github.com/zxzum/InvoxyApp/releases/latest"
              target="_blank"
              rel="noopener noreferrer"
              className="glass-control col-span-2 sm:col-span-1 flex h-11 items-center justify-center gap-2 rounded-xl px-3 text-xs font-semibold text-ink hover:border-mint/30 hover:bg-white/[.08] transition-all"
            >
              <ArrowRight size={16} className="text-mint" />
              <span>Windows / iOS</span>
            </a>
          </div>
        </div>
      </div>
    </AdaptiveDialog>
  );
}
