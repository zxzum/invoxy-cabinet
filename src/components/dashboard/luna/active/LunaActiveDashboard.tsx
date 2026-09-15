import type { Device, DevicesConfig, RenewalOption, Subscription, TrafficPackage } from '@/types';
import LunaAddonsCard from './LunaAddonsCard';
import LunaConnectionActions from './LunaConnectionActions';
import LunaDevicesCard from './LunaDevicesCard';
import LunaRenewalCard from './LunaRenewalCard';
import LunaSubscriptionHero from './LunaSubscriptionHero';
import { LunaEmptyState, LunaLoadingState } from './LunaSurfaceState';
import LunaTrafficCards from './LunaTrafficCards';
import type { LunaTrafficSnapshot } from './types';

/** Локализованные подписи для дочерних карточек; без них остаются en-дефолты. */
export interface LunaActiveLabels {
  hero?: {
    trial?: string;
    paid?: string;
    manage?: string;
    until?: string;
    daysLeft?: string;
  };
  traffic?: {
    regular?: string;
    lte?: string;
    unit?: string;
    regularEmpty?: string;
    lteEmpty?: string;
    refresh?: string;
    refreshing?: string;
  };
  devices?: {
    title?: string;
    manage?: string;
    disconnect?: string;
    empty?: string;
  };
  renewal?: {
    title?: string;
    allOptions?: string;
    submit?: string;
    empty?: string;
  };
  connection?: {
    title?: string;
    copy?: string;
    copied?: string;
    happ?: string;
    incy?: string;
    qr?: string;
    empty?: string;
  };
  addons?: {
    title?: string;
    devices?: string;
    traffic?: string;
    lte?: string;
    addDevices?: string;
    addTraffic?: string;
    addLte?: string;
    unlimited?: string;
    unavailable?: string;
    empty?: string;
  };
}

export interface LunaActiveDashboardProps {
  subscription: Subscription | null;
  devices: Device[];
  regularTraffic: LunaTrafficSnapshot | null;
  lteTraffic: LunaTrafficSnapshot | null;
  accessLink: string | null;
  happLink: string | null;
  incyLink: string | null;
  incyAvailable?: boolean;
  qrAvailable?: boolean;
  renewalOptions: RenewalOption[];
  selectedRenewalPeriod?: number | null;
  regularTrafficPackages: TrafficPackage[];
  lteTrafficPackages: TrafficPackage[];
  devicesConfig: DevicesConfig | null;
  devicesErrorMessage?: string;
  renewalErrorMessage?: string;
  connectionErrorMessage?: string;
  addonsErrorMessage?: string;
  retryLabel?: string;
  onRetryDevices?: () => void;
  onRetryRenewal?: () => void;
  onRetryConnection?: () => void;
  onRetryAddons?: () => void;
  labels?: LunaActiveLabels;
  isLoading?: boolean;
  isCopied?: boolean;
  isRemovingHwid?: string | null;
  loadingMessage?: string;
  emptyMessage?: string;
  formatDate?: (date: string) => string;
  formatDeviceDate?: (date: string) => string;
  formatUsage?: (traffic: LunaTrafficSnapshot) => string;
  formatPrice?: (option: RenewalOption) => string;
  formatPackagePrice?: (option: TrafficPackage) => string;
  formatPeriod?: (periodDays: number) => string;
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
  submitRenewalLabel?: string;
  onOpenDeviceAddon?: () => void;
  onOpenTrafficAddon?: (option: TrafficPackage) => void;
  onOpenLteAddon?: (option: TrafficPackage) => void;
  onRefreshTraffic?: () => void;
  isRefreshingTraffic?: boolean;
  trafficRefreshCooldown?: number;
}

export default function LunaActiveDashboard({
  subscription,
  devices,
  regularTraffic,
  lteTraffic,
  accessLink,
  happLink,
  incyLink,
  incyAvailable,
  qrAvailable,
  renewalOptions,
  selectedRenewalPeriod = null,
  regularTrafficPackages,
  lteTrafficPackages,
  devicesConfig,
  devicesErrorMessage,
  renewalErrorMessage,
  connectionErrorMessage,
  addonsErrorMessage,
  retryLabel,
  onRetryDevices,
  onRetryRenewal,
  onRetryConnection,
  onRetryAddons,
  labels,
  isLoading = false,
  isCopied = false,
  isRemovingHwid = null,
  loadingMessage = 'Loading active subscription',
  emptyMessage = 'No active subscription',
  formatDate,
  formatDeviceDate,
  formatUsage,
  formatPrice,
  formatPackagePrice,
  formatPeriod,
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
  submitRenewalLabel,
  onOpenDeviceAddon,
  onOpenTrafficAddon,
  onOpenLteAddon,
  onRefreshTraffic,
  isRefreshingTraffic = false,
  trafficRefreshCooldown = 0,
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
          trialLabel={labels?.hero?.trial}
          paidLabel={labels?.hero?.paid}
          manageLabel={labels?.hero?.manage}
          untilLabel={labels?.hero?.until}
          daysLabel={labels?.hero?.daysLeft}
        />
        <LunaTrafficCards
          regularTraffic={regularTraffic}
          lteTraffic={lteTraffic}
          formatUsage={formatUsage}
          trafficUnitLabel={labels?.traffic?.unit}
          regularLabel={labels?.traffic?.regular}
          lteLabel={labels?.traffic?.lte}
          regularEmptyMessage={labels?.traffic?.regularEmpty}
          lteEmptyMessage={labels?.traffic?.lteEmpty}
          onRefreshTraffic={onRefreshTraffic}
          isRefreshing={isRefreshingTraffic}
          trafficRefreshCooldown={trafficRefreshCooldown}
          refreshLabel={labels?.traffic?.refresh}
          refreshingLabel={labels?.traffic?.refreshing}
        />
        <LunaDevicesCard
          devices={devices}
          deviceLimit={subscription.device_limit}
          errorMessage={devicesErrorMessage}
          onRetry={onRetryDevices}
          retryLabel={retryLabel}
          formatDeviceDate={formatDeviceDate}
          onManageDevices={onManageDevices}
          onRemoveDevice={onRemoveDevice}
          isRemovingHwid={isRemovingHwid}
          title={labels?.devices?.title}
          manageLabel={labels?.devices?.manage}
          disconnectLabel={labels?.devices?.disconnect}
          emptyMessage={labels?.devices?.empty}
        />
        <LunaRenewalCard
          options={renewalOptions}
          selectedPeriodDays={selectedRenewalPeriod}
          errorMessage={renewalErrorMessage}
          onRetry={onRetryRenewal}
          retryLabel={retryLabel}
          formatPrice={formatPrice}
          formatPeriod={formatPeriod}
          onSelect={onSelectRenewal}
          onSubmit={onSubmitRenewal}
          onOpenRenewalOptions={onOpenRenewalOptions}
          title={labels?.renewal?.title}
          allOptionsLabel={labels?.renewal?.allOptions}
          submitLabel={submitRenewalLabel ?? labels?.renewal?.submit}
          emptyMessage={labels?.renewal?.empty}
        />
      </div>

      <div className="flex min-w-0 flex-col gap-5">
        <LunaConnectionActions
          accessLink={accessLink}
          happLink={happLink}
          incyLink={incyLink}
          incyAvailable={incyAvailable}
          qrAvailable={qrAvailable}
          errorMessage={connectionErrorMessage}
          onRetry={onRetryConnection}
          retryLabel={retryLabel}
          isCopied={isCopied}
          onCopyAccess={onCopyAccess}
          onConnectHapp={onConnectHapp}
          onConnectIncy={onConnectIncy}
          onShowQr={onShowQr}
          title={labels?.connection?.title}
          copyLabel={labels?.connection?.copy}
          copiedLabel={labels?.connection?.copied}
          happLabel={labels?.connection?.happ}
          incyLabel={labels?.connection?.incy}
          qrLabel={labels?.connection?.qr}
          emptyMessage={labels?.connection?.empty}
        />
        <LunaAddonsCard
          devicesConfig={devicesConfig}
          regularTrafficPackages={regularTrafficPackages}
          lteTrafficPackages={lteTrafficPackages}
          errorMessage={addonsErrorMessage}
          onRetry={onRetryAddons}
          retryLabel={retryLabel}
          formatPackagePrice={formatPackagePrice}
          onOpenDeviceAddon={onOpenDeviceAddon}
          onOpenTrafficAddon={onOpenTrafficAddon}
          onOpenLteAddon={onOpenLteAddon}
          trafficUnitLabel={labels?.traffic?.unit}
          title={labels?.addons?.title}
          devicesLabel={labels?.addons?.devices}
          trafficLabel={labels?.addons?.traffic}
          lteLabel={labels?.addons?.lte}
          addDevicesLabel={labels?.addons?.addDevices}
          addTrafficLabel={labels?.addons?.addTraffic}
          addLteLabel={labels?.addons?.addLte}
          unlimitedLabel={labels?.addons?.unlimited}
          unavailableLabel={labels?.addons?.unavailable}
          emptyMessage={labels?.addons?.empty}
        />
      </div>
    </div>
  );
}
