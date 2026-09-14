import type { Device, DevicesConfig, RenewalOption, Subscription, TrafficPackage } from '@/types';
import LunaAddonsCard from './LunaAddonsCard';
import LunaConnectionActions from './LunaConnectionActions';
import LunaDevicesCard from './LunaDevicesCard';
import LunaRenewalCard from './LunaRenewalCard';
import LunaSubscriptionHero from './LunaSubscriptionHero';
import { LunaEmptyState, LunaLoadingState } from './LunaSurfaceState';
import LunaTrafficCards from './LunaTrafficCards';
import type { LunaTrafficSnapshot } from './types';

export interface LunaActiveDashboardProps {
  subscription: Subscription | null;
  devices: Device[];
  regularTraffic: LunaTrafficSnapshot | null;
  lteTraffic: LunaTrafficSnapshot | null;
  accessLink: string | null;
  happLink: string | null;
  incyLink: string | null;
  renewalOptions: RenewalOption[];
  selectedRenewalPeriod?: number | null;
  regularTrafficPackages: TrafficPackage[];
  lteTrafficPackages: TrafficPackage[];
  devicesConfig: DevicesConfig | null;
  isLoading?: boolean;
  loadingMessage?: string;
  emptyMessage?: string;
  formatDate?: (date: string) => string;
  formatDeviceDate?: (date: string) => string;
  formatUsage?: (traffic: LunaTrafficSnapshot) => string;
  formatPrice?: (option: RenewalOption) => string;
  formatPackagePrice?: (option: TrafficPackage) => string;
  onManageSubscription?: () => void;
  onManageDevices?: () => void;
  onRemoveDevice?: (device: Device) => void;
  onCopyAccess?: () => void;
  onConnectHapp?: () => void;
  onConnectIncy?: () => void;
  onShowQr?: () => void;
  onSelectRenewal?: (option: RenewalOption) => void;
  onSubmitRenewal?: (option: RenewalOption) => void;
  onOpenRenewalOptions?: () => void;
  onOpenDeviceAddon?: () => void;
  onOpenTrafficAddon?: (option: TrafficPackage) => void;
  onOpenLteAddon?: (option: TrafficPackage) => void;
}

export default function LunaActiveDashboard({
  subscription,
  devices,
  regularTraffic,
  lteTraffic,
  accessLink,
  happLink,
  incyLink,
  renewalOptions,
  selectedRenewalPeriod = null,
  regularTrafficPackages,
  lteTrafficPackages,
  devicesConfig,
  isLoading = false,
  loadingMessage = 'Loading active subscription',
  emptyMessage = 'No active subscription',
  formatDate,
  formatDeviceDate,
  formatUsage,
  formatPrice,
  formatPackagePrice,
  onManageSubscription,
  onManageDevices,
  onRemoveDevice,
  onCopyAccess,
  onConnectHapp,
  onConnectIncy,
  onShowQr,
  onSelectRenewal,
  onSubmitRenewal,
  onOpenRenewalOptions,
  onOpenDeviceAddon,
  onOpenTrafficAddon,
  onOpenLteAddon,
}: LunaActiveDashboardProps) {
  if (isLoading) return <LunaLoadingState message={loadingMessage} />;
  if (!subscription) return <LunaEmptyState message={emptyMessage} />;

  return (
    <div className="grid w-full gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(310px,0.85fr)]">
      <div className="flex min-w-0 flex-col gap-5">
        <LunaSubscriptionHero
          subscription={subscription}
          formatDate={formatDate}
          onManageSubscription={onManageSubscription}
        />
        <LunaTrafficCards
          regularTraffic={regularTraffic}
          lteTraffic={lteTraffic}
          formatUsage={formatUsage}
        />
        <LunaDevicesCard
          devices={devices}
          deviceLimit={subscription.device_limit}
          formatDeviceDate={formatDeviceDate}
          onManageDevices={onManageDevices}
          onRemoveDevice={onRemoveDevice}
        />
        <LunaRenewalCard
          options={renewalOptions}
          selectedPeriodDays={selectedRenewalPeriod}
          formatPrice={formatPrice}
          onSelect={onSelectRenewal}
          onSubmit={onSubmitRenewal}
          onOpenRenewalOptions={onOpenRenewalOptions}
        />
      </div>

      <div className="flex min-w-0 flex-col gap-5">
        <LunaConnectionActions
          accessLink={accessLink}
          happLink={happLink}
          incyLink={incyLink}
          onCopyAccess={onCopyAccess}
          onConnectHapp={onConnectHapp}
          onConnectIncy={onConnectIncy}
          onShowQr={onShowQr}
        />
        <LunaAddonsCard
          devicesConfig={devicesConfig}
          regularTrafficPackages={regularTrafficPackages}
          lteTrafficPackages={lteTrafficPackages}
          formatPackagePrice={formatPackagePrice}
          onOpenDeviceAddon={onOpenDeviceAddon}
          onOpenTrafficAddon={onOpenTrafficAddon}
          onOpenLteAddon={onOpenLteAddon}
        />
      </div>
    </div>
  );
}
