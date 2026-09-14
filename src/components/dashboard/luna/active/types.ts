import type { Device, DevicesConfig, RenewalOption, Subscription, TrafficPackage } from '@/types';

export interface LunaTrafficSnapshot {
  usedGb: number;
  limitGb: number;
  percent: number;
  isUnlimited: boolean;
}

export interface LunaConnectionState {
  accessLink: string | null;
  happLink: string | null;
  incyLink: string | null;
}

export interface LunaActiveData {
  subscription: Subscription | null;
  devices: Device[];
  regularTraffic: LunaTrafficSnapshot | null;
  lteTraffic: LunaTrafficSnapshot | null;
  connection: LunaConnectionState;
  renewalOptions: RenewalOption[];
  selectedRenewalPeriod: number | null;
  regularTrafficPackages: TrafficPackage[];
  lteTrafficPackages: TrafficPackage[];
  devicesConfig: DevicesConfig | null;
}
