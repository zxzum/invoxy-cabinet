import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import type { NetworkNode } from '@/data/networkSnapshot';

const BOT_USERNAME = (import.meta.env.VITE_TELEGRAM_BOT_USERNAME || 'invoxy_bot').replace(/^@/, '');
const TELEGRAM_BOT_URL = `https://t.me/${BOT_USERNAME}`;

type DeviceType = 'ios' | 'android' | 'windows' | 'mac' | 'tv';

interface DeviceInfo {
  id: DeviceType;
  label: string;
  clientName: string;
  clientIcon: string;
  step3Text: string;
}

const DEVICES: DeviceInfo[] = [
  {
    id: 'ios',
    label: 'iPhone / iPad',
    clientName: 'Happ',
    clientIcon: '/images/apps/happ.png',
    step3Text: 'Нажмите «Подключить» в боте — ключ сам откроется в Happ. Один тап.',
  },
  {
    id: 'android',
    label: 'Android',
    clientName: 'Happ',
    clientIcon: '/images/apps/happ.png',
    step3Text: 'Скопируйте ключ из бота и вставьте в Happ. Соединение поднимется мгновенно.',
  },
  {
    id: 'windows',
    label: 'Windows',
    clientName: 'Incy',
    clientIcon: '/images/apps/incy.png',
    step3Text: 'Откройте Incy на ПК, нажмите «Импорт ключа» из Telegram и активируйте туннель.',
  },
  {
    id: 'mac',
    label: 'macOS',
    clientName: 'Incy',
    clientIcon: '/images/apps/incy.png',
    step3Text: 'Импортируйте ссылку подписки в Incy в один клик. Работает бесшовно.',
  },
  {
    id: 'tv',
    label: 'Android TV',
    clientName: 'Happ / v2rayNG',
    clientIcon: '/images/apps/happ.png',
    step3Text: 'Отсканируйте QR-код ключа камерой или передайте ссылку через ТВ-браузер.',
  },
];

function TelegramIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .37z" />
    </svg>
  );
}

interface SetupStepsProps {
  selectedNode?: NetworkNode;
}

export function SetupSteps({ selectedNode }: SetupStepsProps) {
  const [activeDevice, setActiveDevice] = useState<DeviceType>('ios');

  const device = DEVICES.find((d) => d.id === activeDevice) || DEVICES[0];

  const activeNodeLabel = selectedNode ? selectedNode.label : 'NL-04';
  const activeNodeCountry = selectedNode ? selectedNode.countryName : 'Нидерланды';
  const activeNodeMode = selectedNode?.mode === 'lte' ? 'LTE · Белый интернет' : 'VLESS Reality';

  return (
    <section id="start" className="py-16 sm:py-24 border-t border-line/40 relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section title */}
        <div className="text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-xs font-mono-landing text-muted mb-3">
            <span>Простое подключение</span>
          </div>
          <h2 className="font-display-landing text-3xl sm:text-4xl font-bold tracking-tight text-ink">
            Как подключить за 3 шага
          </h2>
          <p className="mt-3 text-sm sm:text-base text-muted">
            Никаких сложных настроек и терминалов. Доступ к свободному интернету за пару минут.
          </p>
        </div>

        {/* Device tabs */}
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {DEVICES.map((d) => {
            const isSelected = d.id === activeDevice;
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => setActiveDevice(d.id)}
                className={`rounded-xl px-4 py-2 text-xs sm:text-sm font-medium transition-all ${
                  isSelected
                    ? 'bg-mint text-bg font-semibold shadow-[0_0_16px_rgba(165,232,196,0.25)]'
                    : 'border border-line bg-surface text-muted hover:text-ink hover:bg-surface-2'
                }`}
              >
                {d.label}
              </button>
            );
          })}
        </div>

        {/* Content grid */}
        <div className="mt-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Steps column */}
          <div className="lg:col-span-7 space-y-4">
            {/* Step 1 */}
            <div className="glass-panel rounded-2xl border border-line/80 bg-surface/75 p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-mint text-bg font-mono-landing font-bold text-base">
                  1
                </span>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-ink">Откройте бота</h3>
                  <p className="mt-1 text-xs sm:text-sm text-muted">
                    На телефоне нажмите кнопку, с компьютера — наведите камеру на QR-код.
                  </p>
                </div>
              </div>

              <div className="shrink-0 w-full sm:w-auto">
                <a
                  href={TELEGRAM_BOT_URL}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="button-lift flex sm:inline-flex w-full items-center justify-center gap-2 rounded-xl bg-mint px-4 py-2.5 text-xs sm:text-sm font-bold text-bg shadow-[0_0_16px_rgba(165,232,196,0.3)]"
                >
                  <TelegramIcon className="h-4 w-4" />
                  <span>Открыть @{BOT_USERNAME}</span>
                </a>
              </div>
            </div>

            {/* Step 2 */}
            <div className="glass-panel rounded-2xl border border-line/80 bg-surface/75 p-5 sm:p-6 flex items-start gap-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface-2 border border-line text-mint font-mono-landing font-bold text-base">
                2
              </span>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-ink">Заберите ключ</h3>
                <p className="mt-1 text-xs sm:text-sm text-muted">
                  Бот выдаст бесплатный ключ на 10 ГБ и 2 дня сразу в чате. Банковская карта не
                  нужна.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="glass-panel rounded-2xl border border-line/80 bg-surface/75 p-5 sm:p-6 flex items-start gap-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface-2 border border-line text-mint font-mono-landing font-bold text-base">
                3
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-bold text-ink">
                    Вставьте в {device.clientName}
                  </h3>
                  <img
                    src={device.clientIcon}
                    alt={device.clientName}
                    className="h-5 w-5 rounded object-contain"
                  />
                </div>
                <p className="mt-1 text-xs sm:text-sm text-muted">{device.step3Text}</p>
              </div>
            </div>
          </div>

          {/* Right column: Interactive Device Mockup & QR Code */}
          <div className="lg:col-span-5 flex flex-col items-center">
            <div className="relative w-full max-w-[340px] rounded-[38px] border-2 border-line bg-[#090a0d] p-3 shadow-[0_24px_64px_rgba(0,0,0,0.6)] ring-1 ring-white/5">
              {/* Device outer frame */}
              <div className="rounded-[30px] border border-line/80 bg-surface p-5 flex flex-col justify-between min-h-[380px] relative overflow-hidden">
                {/* Device camera notch */}
                <div className="mx-auto h-4 w-28 rounded-full bg-black/80 flex items-center justify-center">
                  <span className="h-2 w-2 rounded-full bg-zinc-800" />
                </div>

                {/* Simulated App Screen */}
                <div className="mt-4 flex flex-col items-center text-center">
                  {/* Brand & Client indicator */}
                  <div className="flex items-center gap-2 text-xs font-mono-landing text-muted">
                    <img src={device.clientIcon} alt="" className="h-4 w-4 rounded" />
                    <span>Клиент {device.clientName}</span>
                  </div>

                  {/* Connected pulse button */}
                  <div className="my-6 relative flex items-center justify-center">
                    <div className="h-24 w-24 rounded-full bg-mint/15 flex items-center justify-center border border-mint/40 shadow-[0_0_36px_rgba(165,232,196,0.3)]">
                      <div className="h-16 w-16 rounded-full bg-mint flex items-center justify-center text-bg font-bold">
                        <svg
                          className="h-8 w-8"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2.5}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="font-display-landing text-lg font-bold text-ink">Подключено</div>
                  <div className="text-xs text-mint font-mono-landing mt-0.5">
                    Трафик защищён · Без логов
                  </div>
                </div>

                {/* Synced node details */}
                <div className="mt-4 rounded-2xl border border-line/70 bg-surface-2/90 p-3 text-xs font-mono-landing">
                  <div className="flex items-center justify-between">
                    <span className="text-muted">Активный узел:</span>
                    <span className="font-bold text-ink">{activeNodeLabel}</span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-muted">Локация:</span>
                    <span className="text-ink">{activeNodeCountry}</span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-muted">Режим:</span>
                    <span className="text-mint">{activeNodeMode}</span>
                  </div>
                  <div className="flex items-center justify-between mt-1 pt-1 border-t border-line/40 text-[11px]">
                    <span className="text-muted">Тестовый баланс:</span>
                    <span className="text-[#86efac] font-bold">10.0 ГБ</span>
                  </div>
                </div>

                {/* QR code hover/footer for desktop */}
                <div className="mt-4 hidden sm:flex items-center justify-center gap-3 pt-3 border-t border-line/40">
                  <div className="h-16 w-16 shrink-0 rounded-lg bg-white p-1 flex items-center justify-center">
                    <QRCodeSVG
                      value={TELEGRAM_BOT_URL}
                      size={56}
                      bgColor="#ffffff"
                      fgColor="#0b0c0e"
                      level="M"
                    />
                  </div>
                  <div className="text-left text-[11px] text-muted leading-snug">
                    <span className="text-ink font-semibold block">Наведите камеру</span>
                    для мгновенного запуска в Telegram
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
