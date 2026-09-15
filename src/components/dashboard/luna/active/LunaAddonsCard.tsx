import { DevicesIcon, TrafficIcon } from '@/components/icons';
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
  packages,
  label,
  addLabel,
  trafficUnitLabel,
  unlimitedLabel,
  unavailableLabel,
  formatPrice,
  onOpen,
}: {
  packages: TrafficPackage[];
  label: string;
  addLabel: string;
  trafficUnitLabel: string;
  unlimitedLabel: string;
  unavailableLabel: string;
  formatPrice: (packageOption: TrafficPackage) => string;
  onOpen?: (packageOption: TrafficPackage) => void;
}) {
  const packageOption = packages.find((item) => item.is_available !== false) ?? packages[0];
  const unavailable = !packageOption || packageOption.is_available === false;
  const packageLabel = packageOption?.is_unlimited
    ? unlimitedLabel
    : packageOption
      ? `${packageOption.gb} ${trafficUnitLabel}`
      : unavailableLabel;
  const priceLabel = packageOption ? formatPrice(packageOption) : unavailableLabel;

  return (
    <article className="glass-surface motion-card flex items-center gap-3 rounded-2xl p-3 lg:rounded-[clamp(14px,0.8vw,18px)] lg:p-[clamp(12px,0.8vw,16px)]">
      <div className="flex min-w-0 flex-1 items-start gap-2">
        <TrafficIcon className="mt-0.5 h-4 w-4 shrink-0 text-accent-300" />
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-dark-50">{label}</h3>
          <p className="mt-1 text-base font-bold text-dark-100">{packageLabel}</p>
          <p className="mt-1 text-xs font-semibold text-accent-300">от {priceLabel}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => packageOption && onOpen?.(packageOption)}
        disabled={unavailable || !onOpen || !packageOption}
        aria-label={addLabel}
        className="button-lift flex h-9 shrink-0 items-center justify-center rounded-full bg-accent-400 px-4 text-[11px] font-bold text-on-accent transition-colors hover:bg-accent-300 disabled:cursor-not-allowed disabled:opacity-50"
      >
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
      <h2 className="text-[17px] font-bold text-dark-50 lg:text-[clamp(17px,1.1vw,22px)]">
        {title}
      </h2>

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
          <article className="glass-surface motion-card flex items-center gap-3 rounded-2xl p-3 lg:rounded-[clamp(14px,0.8vw,18px)] lg:p-[clamp(12px,0.8vw,16px)]">
            <div className="flex min-w-0 flex-1 items-start gap-2">
              <DevicesIcon className="mt-0.5 h-4 w-4 shrink-0 text-accent-300" />
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-dark-50">{devicesLabel}</h3>
                <p className="mt-1 text-xs text-dark-400">
                  {devicesConfig.max
                    ? `До ${Math.max(0, devicesConfig.max - devicesConfig.current)} дополнительных`
                    : 'Без ограничений'}
                </p>
                <p className="mt-1 text-xs font-semibold text-accent-300">
                  от {devicesConfig.price_per_device_label} / мес
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onOpenDeviceAddon}
              disabled={!canAddDevice}
              aria-label={addDevicesLabel}
              className="button-lift flex h-9 shrink-0 items-center justify-center rounded-full bg-accent-400 px-4 text-[11px] font-bold text-on-accent transition-colors hover:bg-accent-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {addDevicesLabel}
            </button>
          </article>
        )}

        {regularTrafficPackages.length > 0 && (
          <PackageCard
            key="regular"
            packages={regularTrafficPackages}
            label={trafficLabel}
            addLabel={addTrafficLabel}
            trafficUnitLabel={trafficUnitLabel}
            unlimitedLabel={unlimitedLabel}
            unavailableLabel={unavailableLabel}
            formatPrice={formatPackagePrice}
            onOpen={onOpenTrafficAddon}
          />
        )}

        {lteTrafficPackages.length > 0 && (
          <PackageCard
            key="lte"
            packages={lteTrafficPackages}
            label={lteLabel}
            addLabel={addLteLabel}
            trafficUnitLabel={trafficUnitLabel}
            unlimitedLabel={unlimitedLabel}
            unavailableLabel={unavailableLabel}
            formatPrice={formatPackagePrice}
            onOpen={onOpenLteAddon}
          />
        )}
      </div>
    </section>
  );
}
