import apiClient from './client';

export interface CatalogPackage {
  gb: number;
  price_kopeks: number;
  price_label: string;
}

export interface CatalogPeriod {
  days: number;
  months: number;
  label?: string;
  price_kopeks: number;
  price_label: string;
  price_per_month_kopeks: number;
  price_per_month_label: string;
  is_highlighted?: boolean;
  discount_percent?: number;
  saving_kopeks?: number;
  saving_label?: string;
  monthly_baseline_label?: string;
  monthly_baseline_kopeks?: number;
}

export interface CatalogTariff {
  id: number;
  name: string;
  description?: string | null;
  is_highlighted?: boolean;
  traffic_limit_gb: number;
  whitelist_traffic_limit_gb?: number;
  device_limit?: number;
  base_device_limit?: number;
  max_device_limit?: number | null;
  device_price_kopeks?: number;
  device_price_label?: string;
  periods: CatalogPeriod[];
  traffic_topup_enabled?: boolean;
  traffic_topup_max_per_month?: number;
  traffic_topup_offers?: CatalogPackage[];
  whitelist_reset_enabled?: boolean;
  whitelist_reset_chunk_gb?: number;
  whitelist_reset_price_label?: string;
  whitelist_reset_min_used_gb?: number;
  whitelist_reset_max_per_month?: number;
  whitelist_topup_enabled?: boolean;
  whitelist_topup_offers?: CatalogPackage[];
  is_daily?: boolean;
  daily_price_label?: string;
  custom_days_enabled?: boolean;
  min_days?: number | null;
  max_days?: number | null;
  price_per_day_label?: string;
  traffic_reset_label?: string | null;
}

export interface CatalogTrial {
  duration_days: number;
  traffic_limit_gb: number;
  whitelist_traffic_limit_gb: number;
  device_limit: number;
  requires_payment: boolean;
  price_kopeks: number;
  price_label: string;
}

export interface PublicCatalog {
  sales_mode: string;
  bot_url: string | null;
  support_url: string | null;
  trial: CatalogTrial | null;
  tariffs: CatalogTariff[];
}

export async function fetchPublicCatalog(): Promise<PublicCatalog> {
  const response = await apiClient.get<PublicCatalog>('/cabinet/public/catalog');
  return response.data;
}
