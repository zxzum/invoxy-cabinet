import { useEffect, useState } from 'react';
import { Smartphone, Laptop, Check, X } from '@/invoxystart/components/ui/RuneIcon';

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
};

export function DevicesCard({
  devices: controlledDevices,
  deviceLimit = 5,
  onRemove,
  title = 'Подключенные устройства',
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
        <p className="py-6 text-center text-xs text-muted">Нет подключённых устройств</p>
      )}
    </div>
  );
}
