import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { AdaptiveDialog } from '@/invoxystart/components/ui/AdaptiveDialog';
import { LivelyCopyButton } from '@/invoxystart/components/ui/LivelyCopyButton';
import {
  ArrowRight,
  ArrowUpRight,
  Link2,
  Smartphone,
  Laptop,
} from '@/invoxystart/components/ui/RuneIcon';
import { openDeepLink } from '@/utils/openDeepLink';
import { findInvoxyAsset, useLatestInvoxyRelease, type InvoxyPlatform } from './invoxyDownloads';

export interface ConnectDeviceModalProps {
  open: boolean;
  onClose: () => void;
  accessLink?: string | null;
  happLink?: string | null;
  incyLink?: string | null;
  initialPlatform?: PlatformKey;
}

export type PlatformKey = 'ios' | 'android' | 'windows' | 'macos' | 'linux' | 'tv';

interface AppInfo {
  name: string;
  icon: string;
  badge?: string;
  description: string;
  downloadUrl: string;
  downloadLabel: string;
  oneClickLink?: string | null;
  oneClickLabel?: string;
}

export function detectUserOS(): PlatformKey {
  if (typeof window === 'undefined' || !navigator?.userAgent) return 'ios';
  const ua = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return 'ios';
  if (/android/.test(ua)) return /tv|television/.test(ua) ? 'tv' : 'android';
  if (/macintosh|mac os x/.test(ua)) return 'macos';
  if (/windows/.test(ua)) return 'windows';
  if (/linux/.test(ua)) return 'linux';
  return 'ios';
}

export function ConnectDeviceModal({
  open,
  onClose,
  accessLink,
  happLink,
  incyLink,
  initialPlatform,
}: ConnectDeviceModalProps) {
  const [selectedOS, setSelectedOS] = useState<PlatformKey>(
    () => initialPlatform || detectUserOS(),
  );
  const [qrOpen, setQrOpen] = useState(false);
  const [showInvoxyApp, setShowInvoxyApp] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSelectedOS(initialPlatform || detectUserOS());
    setQrOpen(false);
    setShowInvoxyApp(false);
    setManualOpen(false);
  }, [open, initialPlatform]);

  const supportedInvoxyPlatform: InvoxyPlatform | null =
    selectedOS === 'android' || selectedOS === 'windows' || selectedOS === 'macos'
      ? selectedOS
      : null;
  const {
    release: latestInvoxyRelease,
    status: invoxyReleaseStatus,
    retry: retryInvoxyRelease,
  } = useLatestInvoxyRelease(open && showInvoxyApp && !!supportedInvoxyPlatform);

  const effectiveHappLink = happLink || (accessLink ? `happ://add/${accessLink}` : null);
  const effectiveIncyLink = incyLink || (accessLink ? `incy://import/${accessLink}` : null);

  const platforms: { key: PlatformKey; label: string; icon: typeof Smartphone }[] = [
    { key: 'ios', label: 'iOS / iPhone', icon: Smartphone },
    { key: 'android', label: 'Android', icon: Smartphone },
    { key: 'windows', label: 'Windows', icon: Laptop },
    { key: 'macos', label: 'macOS', icon: Laptop },
    { key: 'linux', label: 'Linux', icon: Laptop },
    { key: 'tv', label: 'Android TV', icon: Laptop },
  ];

  const appMap: Record<PlatformKey, AppInfo[]> = {
    ios: [
      {
        name: 'HAPP',
        icon: '/images/apps/happ.png',
        badge: 'Рекомендуем',
        description: 'Самое быстрое подключение в 1 клик с поддержкой Smart Routing',
        downloadUrl: 'https://apps.apple.com/app/happ-proxy-utility/id6504287215',
        downloadLabel: 'App Store',
        oneClickLink: effectiveHappLink,
        oneClickLabel: 'Подключить в HAPP',
      },
      {
        name: 'INCY',
        icon: '/images/apps/incy.png',
        description: 'Надёжный современный клиент для iOS',
        downloadUrl: 'https://apps.apple.com/app/incy/id6475850983',
        downloadLabel: 'App Store',
        oneClickLink: effectiveIncyLink,
        oneClickLabel: 'Подключить в INCY',
      },
    ],
    android: [
      {
        name: 'HAPP',
        icon: '/images/apps/happ.png',
        badge: 'Рекомендуем',
        description: 'Подключение в 1 клик, низкое энергопотребление и высокая скорость',
        downloadUrl: 'https://play.google.com/store/apps/details?id=com.happproxy',
        downloadLabel: 'Google Play',
        oneClickLink: effectiveHappLink,
        oneClickLabel: 'Подключить в HAPP',
      },
      {
        name: 'INCY',
        icon: '/images/apps/incy.png',
        description: 'Легковесный клиент для Android',
        downloadUrl: 'https://play.google.com/store/apps/details?id=com.incy.app',
        downloadLabel: 'Google Play',
        oneClickLink: effectiveIncyLink,
        oneClickLabel: 'Подключить в INCY',
      },
    ],
    windows: [
      {
        name: 'HAPP Windows',
        icon: '/images/apps/happ.png',
        badge: 'Рекомендуем',
        description: 'Быстрый клиент с автоподключением и раздельным туннелированием',
        downloadUrl: 'https://github.com/happ-proxy/happ-desktop/releases/latest',
        downloadLabel: 'Скачать для Windows',
        oneClickLink: effectiveHappLink,
        oneClickLabel: 'Импортировать в HAPP',
      },
      {
        name: 'Hiddify Next',
        icon: '/images/apps/happ.png',
        description: 'Универсальный клиент с поддержкой всех современных протоколов',
        downloadUrl: 'https://github.com/hiddify/hiddify-next/releases/latest',
        downloadLabel: 'GitHub Releases',
      },
    ],
    macos: [
      {
        name: 'HAPP macOS',
        icon: '/images/apps/happ.png',
        badge: 'Рекомендуем',
        description: 'Оптимизирован для Apple Silicon (M1/M2/M3/M4) и Intel',
        downloadUrl: 'https://apps.apple.com/app/happ-proxy-utility/id6504287215',
        downloadLabel: 'Mac App Store',
        oneClickLink: effectiveHappLink,
        oneClickLabel: 'Подключить в HAPP',
      },
    ],
    linux: [
      {
        name: 'Hiddify / Sing-Box',
        icon: '/images/apps/happ.png',
        badge: 'CLI / GUI',
        description: 'Поддержка VLESS Reality, Trojan, ShadowTLS',
        downloadUrl: 'https://github.com/hiddify/hiddify-next/releases/latest',
        downloadLabel: 'AppImage / Deb',
      },
    ],
    tv: [
      {
        name: 'HAPP Android TV',
        icon: '/images/apps/happ.png',
        badge: 'Для ТВ',
        description: 'Удобное управление с пульта, быстрая передача ссылки через QR-код',
        downloadUrl: 'https://play.google.com/store/apps/details?id=com.happproxy',
        downloadLabel: 'Google Play TV',
        oneClickLink: effectiveHappLink,
      },
    ],
  };

  const currentApps = appMap[selectedOS] || appMap.ios;
  const invoxyAsset =
    supportedInvoxyPlatform && latestInvoxyRelease
      ? findInvoxyAsset(latestInvoxyRelease.assets, supportedInvoxyPlatform)
      : undefined;

  const primaryApp = currentApps[0];
  const alternatives = currentApps.slice(1);

  return (
    <AdaptiveDialog
      open={open}
      onClose={onClose}
      titleId="connect-device-title"
      maxWidth="max-w-xl"
    >
      <div className="flex flex-col gap-5 p-1 sm:p-2">
        <div>
          <h2 id="connect-device-title" className="text-2xl font-bold tracking-tight text-ink">
            Подключить устройство
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-muted">
            Выберите систему устройства. Затем установите приложение и добавьте в него подписку.
          </p>
        </div>

        <div
          className="no-scrollbar flex gap-2 overflow-x-auto pb-1"
          role="group"
          aria-label="Система устройства"
        >
          {platforms.map((platform) => (
            <button
              key={platform.key}
              type="button"
              aria-pressed={selectedOS === platform.key}
              onClick={() => {
                setSelectedOS(platform.key);
                setShowInvoxyApp(false);
                setManualOpen(false);
                setQrOpen(false);
              }}
              className={
                selectedOS === platform.key
                  ? 'flex min-h-11 shrink-0 cursor-pointer items-center gap-2 rounded-xl bg-mint px-3 text-sm font-semibold text-bg'
                  : 'glass-control flex min-h-11 shrink-0 cursor-pointer items-center gap-2 rounded-xl px-3 text-sm font-semibold text-muted'
              }
            >
              <platform.icon size={16} />
              {platform.label}
            </button>
          ))}
        </div>

        {primaryApp && (
          <div className="space-y-5">
            <section className="border-t border-white/10 pt-5">
              <div className="flex items-center gap-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-mint/15 text-sm font-bold text-mint">
                  1
                </span>
                <div>
                  <h3 className="text-base font-bold text-ink">Установите приложение</h3>
                  <p className="text-xs text-muted">
                    Рекомендуем {primaryApp.name} для этого устройства
                  </p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-3 rounded-2xl bg-white/[.04] p-3">
                <img src={primaryApp.icon} alt="" className="h-10 w-10 rounded-xl object-contain" />
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-ink">{primaryApp.name}</h4>
                  <p className="text-xs leading-relaxed text-muted">{primaryApp.description}</p>
                </div>
              </div>
              <a
                href={primaryApp.downloadUrl}
                target="_blank"
                rel="noreferrer"
                className="glass-control mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl px-4 text-sm font-semibold text-ink"
              >
                <ArrowRight size={16} /> {primaryApp.downloadLabel}
              </a>
            </section>

            <section className="border-t border-white/10 pt-5">
              <div className="flex items-center gap-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-mint/15 text-sm font-bold text-mint">
                  2
                </span>
                <div>
                  <h3 className="text-base font-bold text-ink">Добавьте подписку</h3>
                  <p className="text-xs text-muted">После установки нажмите кнопку ниже</p>
                </div>
              </div>
              {primaryApp.oneClickLink ? (
                <button
                  type="button"
                  onClick={() => openDeepLink(primaryApp.oneClickLink!)}
                  className="mt-3 flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-mint px-4 text-sm font-bold text-bg"
                >
                  <ArrowUpRight size={16} />{' '}
                  {primaryApp.oneClickLabel || 'Открыть подписку в приложении'}
                </button>
              ) : (
                <div className="mt-3">
                  <p className="mb-2 text-xs leading-relaxed text-muted">
                    Скопируйте ключ и добавьте его в приложение.
                  </p>
                  <LivelyCopyButton
                    text={accessLink || ''}
                    label="Скопировать ключ"
                    disabled={!accessLink}
                  />
                </div>
              )}
              {!accessLink && (
                <p className="mt-2 text-xs text-amber-200">
                  Ссылка доступа ещё не готова. Попробуйте снова через несколько секунд.
                </p>
              )}
            </section>

            <section className="border-t border-white/10 pt-5">
              <div className="flex items-center gap-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-mint/15 text-sm font-bold text-mint">
                  3
                </span>
                <div>
                  <h3 className="text-base font-bold text-ink">Включите VPN</h3>
                  <p className="text-xs leading-relaxed text-muted">
                    Откройте приложение и включите переключатель подключения.
                  </p>
                </div>
              </div>
            </section>
          </div>
        )}

        {(alternatives.length > 0 || supportedInvoxyPlatform) && (
          <section className="border-t border-white/10 pt-4">
            <button
              type="button"
              aria-expanded={showInvoxyApp}
              onClick={() => setShowInvoxyApp((value) => !value)}
              className="min-h-11 cursor-pointer py-2 text-sm font-semibold text-mint"
            >
              Другие приложения
            </button>
            {showInvoxyApp && (
              <div className="mt-2 space-y-3">
                {alternatives.map((app) => (
                  <div key={app.name} className="rounded-2xl bg-white/[.04] p-4">
                    <h3 className="font-bold text-ink">{app.name}</h3>
                    <p className="mt-1 text-xs text-muted">{app.description}</p>
                    <div className="mt-3 flex flex-wrap gap-3 text-sm">
                      <a
                        href={app.downloadUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="font-semibold text-mint"
                      >
                        {app.downloadLabel}
                      </a>
                      {app.oneClickLink && (
                        <button
                          type="button"
                          onClick={() => openDeepLink(app.oneClickLink!)}
                          className="cursor-pointer font-semibold text-mint"
                        >
                          {app.oneClickLabel || 'Подключить'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {supportedInvoxyPlatform && (
                  <div className="rounded-2xl bg-white/[.04] p-4 text-sm">
                    <h3 className="font-bold text-ink">Invoxy VPN</h3>
                    {invoxyReleaseStatus === 'loading' || invoxyReleaseStatus === 'idle' ? (
                      <p className="mt-1 text-muted">Получаем актуальную версию…</p>
                    ) : invoxyReleaseStatus === 'error' ? (
                      <button
                        type="button"
                        onClick={retryInvoxyRelease}
                        className="mt-2 cursor-pointer text-mint"
                      >
                        Не удалось загрузить ссылку · Повторить
                      </button>
                    ) : invoxyAsset ? (
                      <a
                        href={invoxyAsset.downloadUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-block font-semibold text-mint"
                      >
                        Скачать Invoxy VPN
                      </a>
                    ) : (
                      <p className="mt-1 text-muted">
                        Файл для этого устройства сейчас недоступен.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        <section className="border-t border-white/10 pt-4">
          <button
            type="button"
            aria-expanded={manualOpen}
            onClick={() => setManualOpen((value) => !value)}
            className="min-h-11 cursor-pointer py-2 text-sm font-semibold text-mint"
          >
            Подключить вручную
          </button>
          {manualOpen && (
            <div className="mt-2 space-y-3">
              <p className="text-xs leading-relaxed text-muted">
                Используйте ключ, если автоматическое добавление не открыло приложение. Для другого
                устройства можно показать QR-код.
              </p>
              <p className="break-all rounded-xl bg-white/[.04] p-3 font-mono text-xs text-ink">
                {accessLink || 'Ссылка доступа пока недоступна'}
              </p>
              <LivelyCopyButton
                text={accessLink || ''}
                label="Скопировать ключ"
                disabled={!accessLink}
              />
              <button
                type="button"
                disabled={!accessLink}
                onClick={() => setQrOpen((value) => !value)}
                className="flex min-h-11 cursor-pointer items-center gap-2 text-sm font-semibold text-mint disabled:opacity-50"
              >
                <Link2 size={16} /> {qrOpen ? 'Скрыть QR-код' : 'Показать QR-код'}
              </button>
              {qrOpen && accessLink && (
                <div className="flex flex-col items-center gap-2 rounded-xl bg-white/[.04] p-4">
                  <QRCodeSVG
                    value={accessLink}
                    size={180}
                    bgColor="#f3f1ec"
                    fgColor="#0b0c0e"
                    includeMargin
                    className="rounded-lg"
                  />
                  <p className="text-center text-xs text-muted">
                    Отсканируйте QR-код в приложении на другом устройстве
                  </p>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </AdaptiveDialog>
  );
}
