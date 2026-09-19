import { useEffect, useState } from 'react';
import { Smartphone, Laptop, Check, X, Zap } from '@/invoxystart/components/ui/RuneIcon';

export interface ManagedDevice {
  id: string;
  name: string;
  status: string;
  platform?: string;
  timestamp?: string;
}

const initialDevices: ManagedDevice[] = [];

type DevicesCardProps = {
  devices?: ManagedDevice[];
  deviceLimit?: number | null;
  onRemove?: (device: ManagedDevice) => void | Promise<void>;
  title?: string;
  onConnect?: (platform?: string) => void;
  isExpired?: boolean;
};

export function DevicesCard({
  devices: controlledDevices,
  deviceLimit = 5,
  onRemove,
  title = 'Подключенные устройства',
  onConnect,
  isExpired = false,
}: DevicesCardProps) {
  const [localDevices, setLocalDevices] = useState(initialDevices);
  const [pendingRemoval, setPendingRemoval] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const devices = controlledDevices ?? localDevices;

  useEffect(() => {
    if (!pendingRemoval) return;

    const timeout = window.setTimeout(() => setPendingRemoval(null), 3000);
    return () => window.clearTimeout(timeout);
  }, [pendingRemoval]);

  return (
    <div className="glass-panel motion-card flex w-full flex-col rounded-[28px] p-4 lg:rounded-[clamp(22px,1.1vw,26px)] lg:p-[clamp(20px,1.3vw,26px)]">
      <div className="flex w-full items-center justify-between pb-3.5 lg:pb-[clamp(14px,0.9vw,18px)]">
        <h3 className="text-[17px] font-bold text-ink lg:text-[clamp(17px,1.1vw,22px)]">{title}</h3>
        <span className="text-xs text-muted lg:text-[clamp(12px,0.8vw,16px)]">
          {devices.length} из {deviceLimit ?? '—'}
        </span>
      </div>

      {devices.map((device, i) => {
        const isPendingRemoval = pendingRemoval === device.id;

        return (
          <div
            key={device.id}
            className={`flex items-center gap-3 overflow-hidden ${
              i < devices.length - 1 ? 'border-b border-line/60' : ''
            }`}
          >
            <div className="flex h-[68px] w-full items-center gap-3 lg:h-[clamp(54px,3.6vw,72px)] lg:gap-[clamp(12px,0.8vw,16px)]">
              <div className="glass-control flex h-10 w-10 shrink-0 items-center justify-center rounded-full lg:h-[clamp(36px,2.3vw,46px)] lg:w-[clamp(36px,2.3vw,46px)]">
                {device.platform?.toLowerCase().includes('ios') ||
                device.platform?.toLowerCase().includes('android') ? (
                  <Smartphone size={18} className="text-muted" />
                ) : (
                  <Laptop size={18} className="text-muted" />
                )}
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
                <p className="truncate text-sm font-bold text-ink lg:text-[clamp(13px,0.85vw,17px)]">
                  {device.name}
                </p>
                <p className="truncate text-[11px] text-muted lg:text-[clamp(11px,0.7vw,14px)]">
                  {device.status}
                </p>
              </div>
              {device.timestamp ? (
                <span className="hidden shrink-0 text-[11px] text-muted sm:block lg:text-[clamp(11px,0.7vw,14px)]">
                  {device.timestamp}
                </span>
              ) : null}
              <button
                type="button"
                aria-label={`Отключить ${device.name}${isPendingRemoval ? ' — нажмите ещё раз для подтверждения' : ''}`}
                title={
                  isPendingRemoval ? 'Нажмите ещё раз, чтобы отключить' : 'Отключить устройство'
                }
                disabled={removing === device.id}
                onClick={() => {
                  if (isPendingRemoval) {
                    setPendingRemoval(null);
                    setRemoving(device.id);
                    const removal = onRemove
                      ? onRemove(device)
                      : setLocalDevices((prev) => prev.filter((d) => d.id !== device.id));
                    void Promise.resolve(removal).finally(() => setRemoving(null));
                    return;
                  }

                  setPendingRemoval(device.id);
                }}
                className={`flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full border text-red-200 transition active:scale-90 ${
                  isPendingRemoval
                    ? 'border-red-300/75 bg-red-300/35 text-red-50'
                    : 'border-red-300/25 bg-red-300/8 hover:border-red-300/50 hover:bg-red-300/15'
                }`}
              >
                {isPendingRemoval ? (
                  <Check size={20} strokeWidth={2.2} />
                ) : (
                  <X size={20} strokeWidth={2.2} />
                )}
              </button>
            </div>
          </div>
        );
      })}

      {devices.length === 0 && (
        <div className="flex flex-col items-center justify-center py-5 text-center">
          <div
            className={`relative mb-3.5 flex h-14 w-14 items-center justify-center rounded-2xl border ${
              isExpired
                ? 'border-rose-500/25 bg-rose-500/10 text-rose-300'
                : 'border-mint/25 bg-mint/10 text-mint shadow-[0_0_24px_rgba(6,214,160,0.2)]'
            }`}
          >
            {!isExpired && (
              <span className="absolute -inset-1.5 rounded-2xl bg-mint/20 animate-ping opacity-40 pointer-events-none" />
            )}
            <Smartphone size={26} className={isExpired ? 'text-rose-400' : 'text-mint'} />
          </div>

          <div className="flex items-center gap-1.5 mb-1.5">
            <span
              className={`h-2 w-2 rounded-full ${
                isExpired ? 'bg-rose-400' : 'bg-amber-400 animate-pulse'
              }`}
            />
            <span
              className={`text-[11px] font-bold uppercase tracking-wider ${
                isExpired ? 'text-rose-300' : 'text-amber-300'
              }`}
            >
              {isExpired ? 'Подписка не активна' : 'Ожидает первого подключения'}
            </span>
          </div>

          <h4 className="text-base font-bold text-ink sm:text-[17px]">
            {isExpired ? 'Срок действия подписки истёк' : 'Подключите ваше первое устройство'}
          </h4>
          <p className="mt-1 max-w-[320px] text-xs text-muted leading-relaxed">
            {isExpired
              ? 'Продлите подписку или выберите подходящий тариф, чтобы подключить устройства.'
              : 'VPN настроен и готов к работе. Нажмите кнопку для быстрого подключения или выберите систему:'}
          </p>

          {!isExpired && (
            <>
              <div className="mt-3.5 flex flex-wrap items-center justify-center gap-1.5">
                {[
                  { key: 'ios', label: 'iOS', icon: Smartphone },
                  { key: 'android', label: 'Android', icon: Smartphone },
                  { key: 'windows', label: 'Windows', icon: Laptop },
                  { key: 'macos', label: 'macOS', icon: Laptop },
                  { key: 'tv', label: 'TV', icon: Laptop },
                ].map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => onConnect?.(p.key)}
                    className="group flex cursor-pointer items-center gap-1.5 rounded-xl border border-white/8 bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-ink/80 transition-all hover:border-mint/40 hover:bg-mint/10 hover:text-mint active:scale-95"
                  >
                    <p.icon
                      size={13}
                      className="text-muted/70 transition-colors group-hover:text-mint"
                    />
                    <span>{p.label}</span>
                  </button>
                ))}
              </div>

              {onConnect && (
                <button
                  type="button"
                  onClick={() => onConnect()}
                  className="mt-4 flex h-11 w-full max-w-[260px] cursor-pointer items-center justify-center gap-2 rounded-2xl bg-mint px-5 font-bold text-xs text-bg shadow-[0_4px_16px_rgba(6,214,160,0.25)] transition-all hover:bg-mint/90 hover:shadow-[0_6px_22px_rgba(6,214,160,0.4)] active:scale-[0.98]"
                >
                  <Zap size={15} />
                  <span>Подключить в 1 клик</span>
                </button>
              )}
            </>
          )}

          <div className="mt-3.5 flex items-center gap-2 text-[11px] text-muted">
            <div className="flex gap-1.5">
              {Array.from({ length: Math.min(deviceLimit ?? 5, 5) }).map((_, idx) => (
                <span
                  key={idx}
                  className="h-1.5 w-1.5 rounded-full bg-white/20 border border-white/10"
                  title={`Слот ${idx + 1} свободен`}
                />
              ))}
            </div>
            <span>Все {deviceLimit ?? 5} слотов свободны</span>
          </div>
        </div>
      )}
    </div>
  );
}
