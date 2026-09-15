import { DevicesIcon, XIcon } from '@/components/icons';
import type { Device } from '@/types';
import { LunaEmptyState, LunaErrorState, LunaLoadingState } from './LunaSurfaceState';

export interface LunaDevicesCardProps {
  devices: Device[];
  deviceLimit: number | null;
  isLoading?: boolean;
  isRemovingHwid?: string | null;
  errorMessage?: string;
  onRetry?: () => void;
  retryLabel?: string;
  onManageDevices?: () => void;
  onRemoveDevice?: (device: Device) => void;
  formatDeviceDate?: (date: string) => string;
  title?: string;
  manageLabel?: string;
  disconnectLabel?: string;
  emptyMessage?: string;
  loadingMessage?: string;
}

export default function LunaDevicesCard({
  devices,
  deviceLimit,
  isLoading = false,
  isRemovingHwid = null,
  errorMessage,
  onRetry,
  retryLabel,
  onRemoveDevice,
  formatDeviceDate,
  title = 'Connected devices',
  disconnectLabel = 'Disconnect',
  emptyMessage = 'No connected devices',
  loadingMessage = 'Loading connected devices',
}: LunaDevicesCardProps) {
  if (isLoading) return <LunaLoadingState message={loadingMessage} />;

  const deviceLimitLabel = deviceLimit == null ? '—' : deviceLimit === 0 ? '∞' : deviceLimit;

  return (
    <section className="glass-surface rounded-[28px] p-4 sm:p-5" aria-label={title}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="truncate text-lg font-semibold text-dark-50">{title}</h2>
        <span className="shrink-0 text-xs text-dark-400">
          {devices.length} из {deviceLimitLabel}
        </span>
      </div>

      {errorMessage && (
        <LunaErrorState
          message={errorMessage}
          onRetry={onRetry}
          retryLabel={retryLabel}
          className="mt-4"
        />
      )}

      {devices.length === 0 ? (
        <LunaEmptyState message={emptyMessage} className="mt-4 p-4" />
      ) : (
        <ul className="mt-4 divide-y divide-dark-700/50" aria-label={title}>
          {devices.map((device) => {
            const name = device.local_name || device.device_model || device.platform;
            const isRemoving = isRemovingHwid === device.hwid;

            return (
              <li key={device.hwid} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-dark-800/60 text-dark-300">
                  <DevicesIcon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-dark-50">{name}</p>
                  <p className="truncate text-xs text-dark-400">
                    {device.platform}
                    {device.created_at && formatDeviceDate
                      ? ` · ${formatDeviceDate(device.created_at)}`
                      : ''}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onRemoveDevice?.(device)}
                  disabled={!onRemoveDevice || isRemoving}
                  aria-label={`${disconnectLabel} ${name}`}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-error-500/25 bg-error-500/10 text-error-400 transition-colors hover:bg-error-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <XIcon className="h-5 w-5" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
