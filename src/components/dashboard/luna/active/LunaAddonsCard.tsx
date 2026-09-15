import { DevicesIcon, PlusIcon, TrafficIcon } from '@/components/icons';
import type { DevicesConfig, TrafficPackage } from '@/types';
import { LunaEmptyState, LunaErrorState, LunaLoadingState } from './LunaSurfaceState';

export interface LunaAddonsCardProps {
  devicesConfig: DevicesConfig | null;
  regularTrafficPackages: TrafficPackage[];
  lteTrafficPackages: TrafficPackage[];
  isLoading?: boolean;
  errorMessage?: string;
  onRetry?: () => void;
  retryLabel?: string;
  onOpenDeviceAddon?: () => void;
  onOpenTrafficAddon?: (packageOption: TrafficPackage) => void;
  onOpenLteAddon?: (packageOption: TrafficPackage) => void;
  formatPackagePrice?: (packageOption: TrafficPackage) => string;
  trafficUnitLabel?: string;
  title?: string;
  devicesLabel?: string;
  trafficLabel?: string;
  lteLabel?: string;
  addDevicesLabel?: string;
  addTrafficLabel?: string;
  addLteLabel?: string;
  unlimitedLabel?: string;
  unavailableLabel?: string;
  emptyMessage?: string;
  loadingMessage?: string;
}

function PackageCard({
  packageOption,
  label,
  addLabel,
  trafficUnitLabel,
  unlimitedLabel,
  unavailableLabel,
  formatPrice,
  onOpen,
}: {
  packageOption: TrafficPackage;
  label: string;
  addLabel: string;
  trafficUnitLabel: string;
  unlimitedLabel: string;
  unavailableLabel: string;
  formatPrice: (packageOption: TrafficPackage) => string;
  onOpen?: (packageOption: TrafficPackage) => void;
}) {
  const unavailable = packageOption.is_available === false;
  const packageLabel = packageOption.is_unlimited
    ? unlimitedLabel
    : `${String(packageOption.gb)} ${trafficUnitLabel}`;

  return (
    <article className="rounded-2xl border border-dark-700/70 bg-dark-800/35 p-3">
      <div className="flex items-start gap-2">
        <TrafficIcon className="mt-0.5 h-4 w-4 shrink-0 text-accent-300" />
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-dark-50">{label}</h3>
          <p className="mt-1 text-base font-bold text-dark-100">{packageLabel}</p>
          <p className="mt-1 text-xs text-accent-300">{formatPrice(packageOption)}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => onOpen?.(packageOption)}
        disabled={unavailable || !onOpen}
        aria-label={addLabel}
        className="mt-3 flex min-h-10 w-full items-center justify-center gap-1.5 rounded-full border border-accent-400/25 bg-accent-400/10 px-3 text-xs font-semibold text-accent-300 transition-colors hover:border-accent-400/45 hover:bg-accent-400/15 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <PlusIcon className="h-4 w-4" />
        {addLabel}
      </button>
      {unavailable && (
        <p className="mt-2 text-center text-[11px] text-dark-500">
          {packageOption.unavailable_reason || unavailableLabel}
        </p>
      )}
    </article>
  );
}

export default function LunaAddonsCard({
  devicesConfig,
  regularTrafficPackages,
  lteTrafficPackages,
  isLoading = false,
  errorMessage,
  onRetry,
  retryLabel,
  onOpenDeviceAddon,
  onOpenTrafficAddon,
  onOpenLteAddon,
  formatPackagePrice = (packageOption) => String(packageOption.price_rubles),
  trafficUnitLabel = 'GB',
  title = 'Add-ons',
  devicesLabel = 'More devices',
  trafficLabel = 'Main traffic',
  lteLabel = 'LTE traffic',
  addDevicesLabel = 'Add devices',
  addTrafficLabel = 'Add main traffic',
  addLteLabel = 'Add LTE traffic',
  unlimitedLabel = 'Unlimited',
  unavailableLabel = 'Unavailable',
  emptyMessage = 'No add-ons available',
  loadingMessage = 'Loading add-ons',
}: LunaAddonsCardProps) {
  if (isLoading) return <LunaLoadingState message={loadingMessage} />;

  const hasDeviceAddon = Boolean(devicesConfig);
  const hasTrafficAddons = regularTrafficPackages.length > 0 || lteTrafficPackages.length > 0;

  const canAddDevice = Boolean(
    devicesConfig &&
      (devicesConfig.max === 0 || devicesConfig.current < devicesConfig.max) &&
      onOpenDeviceAddon,
  );

  if (!hasDeviceAddon && !hasTrafficAddons && !errorMessage) {
    return <LunaEmptyState message={emptyMessage} />;
  }

  return (
    <section className="glass-surface rounded-[28px] p-4 sm:p-5" aria-label={title}>
      <h2 className="text-lg font-semibold text-dark-50">{title}</h2>

      {errorMessage && (
        <LunaErrorState
          message={errorMessage}
          onRetry={onRetry}
          retryLabel={retryLabel}
          className="mt-4"
        />
      )}

      <div className="mt-4 space-y-3">
        {devicesConfig && (
          <article className="rounded-2xl border border-dark-700/70 bg-dark-800/35 p-3">
            <div className="flex items-start gap-2">
              <DevicesIcon className="mt-0.5 h-4 w-4 shrink-0 text-accent-300" />
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-dark-50">{devicesLabel}</h3>
                <p className="mt-1 text-xs text-dark-400">
                  {devicesConfig.current} / {devicesConfig.max || '∞'}
                </p>
                <p className="mt-1 text-xs text-accent-300">
                  {devicesConfig.price_per_device_label}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onOpenDeviceAddon}
              disabled={!canAddDevice}
              aria-label={addDevicesLabel}
              className="mt-3 flex min-h-10 w-full items-center justify-center gap-1.5 rounded-full border border-accent-400/25 bg-accent-400/10 px-3 text-xs font-semibold text-accent-300 transition-colors hover:border-accent-400/45 hover:bg-accent-400/15 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <PlusIcon className="h-4 w-4" />
              {addDevicesLabel}
            </button>
          </article>
        )}

        {regularTrafficPackages.map((packageOption) => (
          <PackageCard
            key={`regular-${packageOption.gb}`}
            packageOption={packageOption}
            label={trafficLabel}
            addLabel={addTrafficLabel}
            trafficUnitLabel={trafficUnitLabel}
            unlimitedLabel={unlimitedLabel}
            unavailableLabel={unavailableLabel}
            formatPrice={formatPackagePrice}
            onOpen={onOpenTrafficAddon}
          />
        ))}

        {lteTrafficPackages.map((packageOption) => (
          <PackageCard
            key={`lte-${packageOption.gb}`}
            packageOption={packageOption}
            label={lteLabel}
            addLabel={addLteLabel}
            trafficUnitLabel={trafficUnitLabel}
            unlimitedLabel={unlimitedLabel}
            unavailableLabel={unavailableLabel}
            formatPrice={formatPackagePrice}
            onOpen={onOpenLteAddon}
          />
        ))}
      </div>
    </section>
  );
}
