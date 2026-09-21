import { useState, useMemo, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { AdaptiveDialog } from '@/invoxystart/components/ui/AdaptiveDialog';
import { LivelyCopyButton } from '@/invoxystart/components/ui/LivelyCopyButton';
import {
  ArrowRight,
  ArrowUpRight,
  Link2,
  ShieldCheck,
  Smartphone,
  Laptop,
} from '@/invoxystart/components/ui/RuneIcon';
import { openDeepLink } from '@/utils/openDeepLink';

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

function detectUserOS(): PlatformKey {
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
  const initialOS = useMemo(() => initialPlatform || detectUserOS(), [initialPlatform]);
  const [selectedOS, setSelectedOS] = useState<PlatformKey>(initialOS);
  const [qrOpen, setQrOpen] = useState(false);

  useEffect(() => {
    if (initialPlatform) {
      setSelectedOS(initialPlatform);
    }
  }, [initialPlatform]);

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
        name: 'Invoxy VPN (Официальное)',
        icon: '/images/apps/invoxy.png',
        badge: 'Официальное',
        description: 'Фирменное приложение с мгновенной синхронизацией в 1 клик',
        downloadUrl: 'https://github.com/zxzum/InvoxyApp/releases/latest',
        downloadLabel: 'GitHub / App',
        oneClickLink: 'https://invoxy.my/app/connect',
        oneClickLabel: 'Подключить Invoxy VPN',
      },
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
        name: 'Invoxy VPN (Официальное)',
        icon: '/images/apps/invoxy.png',
        badge: 'Официальное',
        description:
          'Фирменное приложение с входом в 1 клик, обходом ТСПУ и умным выбором серверов',
        downloadUrl:
          'https://github.com/zxzum/InvoxyApp/releases/latest/download/app-arm64-v8a-release.apk',
        downloadLabel: 'Скачать APK (ARM64)',
        oneClickLink: 'https://invoxy.my/app/connect',
        oneClickLabel: 'Подключить Invoxy VPN',
      },
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
        name: 'Invoxy VPN Windows (Официальное)',
        icon: '/images/apps/invoxy.png',
        badge: 'Официальное',
        description: 'Фирменный клиент для Windows с автозапуском и раздельным туннелированием',
        downloadUrl: 'https://github.com/zxzum/InvoxyApp/releases/latest',
        downloadLabel: 'Скачать для Windows',
        oneClickLink: 'https://invoxy.my/app/connect',
        oneClickLabel: 'Подключить Invoxy VPN',
      },
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
        name: 'Invoxy VPN macOS (Официальное)',
        icon: '/images/apps/invoxy.png',
        badge: 'Официальное',
        description:
          'Фирменное приложение: системный прокси без пароля root, Apple Silicon & Intel',
        downloadUrl:
          'https://github.com/zxzum/InvoxyApp/releases/latest/download/Invoxy_VPN_macOS.dmg',
        downloadLabel: 'Скачать DMG',
        oneClickLink: 'https://invoxy.my/app/connect',
        oneClickLabel: 'Подключить Invoxy VPN',
      },
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

  return (
    <AdaptiveDialog
      open={open}
      onClose={onClose}
      titleId="connect-device-title"
      maxWidth="max-w-2xl"
    >
      <div className="flex flex-col gap-5 p-1 sm:p-2">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-mint">
            <ShieldCheck size={16} /> Настройка подключения
          </div>
          <h2 id="connect-device-title" className="mt-1 text-2xl font-bold tracking-tight text-ink">
            Подключить устройство
          </h2>
          <p className="mt-1 text-sm text-muted">
            Выберите ваше устройство, установите приложение и подключитесь в один клик.
          </p>
        </div>

        {/* Платформы */}
        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
          {platforms.map((p) => {
            const active = selectedOS === p.key;
            return (
              <button
                key={p.key}
                type="button"
                onClick={() => setSelectedOS(p.key)}
                className={`flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all cursor-pointer ${
                  active
                    ? 'bg-mint text-bg shadow-[0_0_15px_rgba(6,214,160,0.35)]'
                    : 'glass-control text-muted hover:text-ink hover:bg-white/10'
                }`}
              >
                <p.icon size={15} />
                <span>{p.label}</span>
              </button>
            );
          })}
        </div>

        {/* Приложения для выбранной ОС */}
        <div className="flex flex-col gap-3">
          {currentApps.map((app) => (
            <div
              key={app.name}
              className="glass-panel relative flex flex-col gap-3.5 rounded-2xl p-4 transition-all hover:border-mint/20"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/5 p-1.5">
                    <img src={app.icon} alt={app.name} className="h-7 w-7 object-contain" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-ink">{app.name}</h3>
                      {app.badge && (
                        <span className="rounded-md bg-mint/15 px-2 py-0.5 text-[10px] font-bold text-mint">
                          {app.badge}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-muted">{app.description}</p>
                  </div>
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                {app.oneClickLink && (
                  <button
                    type="button"
                    onClick={() => openDeepLink(app.oneClickLink)}
                    className="flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-mint px-3 text-center text-xs font-bold text-bg shadow-[0_0_12px_rgba(6,214,160,0.3)] transition-all hover:bg-mint/90 active:scale-[0.98]"
                  >
                    <ArrowUpRight size={14} />
                    {app.oneClickLabel || 'Подключить в 1 клик'}
                  </button>
                )}
                <a
                  href={app.downloadUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={`glass-control flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-3 text-center text-xs font-semibold text-ink transition-colors hover:border-mint/30 hover:bg-white/[.08] active:scale-[0.98] ${
                    !app.oneClickLink ? 'sm:col-span-2' : ''
                  }`}
                >
                  <ArrowRight size={14} />
                  {app.downloadLabel}
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Ссылка доступа и ручная настройка */}
        <div className="glass-panel flex flex-col gap-3 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted">
              Ключ доступа
            </span>
            <button
              type="button"
              onClick={() => setQrOpen((prev) => !prev)}
              className="flex items-center gap-1.5 text-xs font-bold text-mint hover:underline cursor-pointer"
            >
              <Link2 size={13} /> {qrOpen ? 'Скрыть QR-код' : 'Показать QR-код'}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="glass-control flex h-11 min-w-0 flex-1 items-center truncate rounded-xl px-3 font-mono text-xs text-muted">
              {accessLink || 'Ссылка формируется...'}
            </div>
            <div className="shrink-0 w-36">
              <LivelyCopyButton
                text={accessLink || ''}
                label="Копировать"
                copiedLabel="Скопировано!"
                disabled={!accessLink}
              />
            </div>
          </div>

          {qrOpen && accessLink && (
            <div className="mt-2 flex flex-col items-center justify-center rounded-xl bg-white/5 p-4 animate-fade-in">
              <QRCodeSVG
                value={accessLink}
                size={180}
                bgColor="#f3f1ec"
                fgColor="#0b0c0e"
                includeMargin
                className="rounded-lg shadow-md"
              />
              <p className="mt-2 text-center text-xs text-muted">
                Отсканируйте камерой в приложении на другом устройстве
              </p>
            </div>
          )}
        </div>

        {/* 3 простых шага */}
        <div className="rounded-2xl bg-white/[0.03] p-3 text-xs text-muted">
          <div className="font-semibold text-ink mb-1.5">3 простых шага:</div>
          <ol className="list-decimal space-y-1 pl-4">
            <li>Установите приложение из списка выше.</li>
            <li>Нажмите «Подключить в 1 клик» или скопируйте ключ и вставьте в приложение.</li>
            <li>Включите защиту в приложении и наслаждайтесь интернетом без ограничений!</li>
          </ol>
        </div>
      </div>
    </AdaptiveDialog>
  );
}
