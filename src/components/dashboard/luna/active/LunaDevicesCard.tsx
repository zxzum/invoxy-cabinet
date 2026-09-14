import { DevicesIcon, PlusIcon, TrashIcon } from '@/components/icons';
import type { Device } from '@/types';
import { LunaEmptyState, LunaLoadingState } from './LunaSurfaceState';

export interface LunaDevicesCardProps {
  devices: Device[];
  deviceLimit: number | null;
  isLoading?: boolean;
  isRemovingHwid?: string | null;
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
  onManageDevices,
  onRemoveDevice,
  formatDeviceDate,
  title = 'Connected devices',
  manageLabel = 'Manage devices',
  disconnectLabel = 'Disconnect',
  emptyMessage = 'No connected devices',
  loadingMessage = 'Loading connected devices',
}: LunaDevicesCardProps) {
  if (isLoading) return <LunaLoadingState message={loadingMessage} />;

  return (
    <section className="glass-surface rounded-[28px] p-4 sm:p-5" aria-label={title}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-400/10 text-accent-300">
            <DevicesIcon className="h-5 w-5" />
          </span>
          <h2 className="truncate text-lg font-semibold text-dark-50">{title}</h2>
        </div>
        <span className="shrink-0 text-xs text-dark-400">
          {devices.length} / {deviceLimit ?? '—'}
        </span>
      </div>

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
                  className="flex min-h-10 min-w-10 shrink-0 items-center justify-center rounded-xl border border-error-500/25 bg-error-500/10 text-error-400 transition-colors hover:bg-error-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <button
        type="button"
        onClick={onManageDevices}
        disabled={!onManageDevices}
        className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-accent-400/25 bg-accent-400/10 px-4 text-sm font-semibold text-accent-300 transition-colors hover:border-accent-400/45 hover:bg-accent-400/15 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <PlusIcon className="h-4 w-4" />
        {manageLabel}
      </button>
    </section>
  );
}
