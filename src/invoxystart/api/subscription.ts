import apiClient from './client';
import type {
  AppConfig,
  Device,
  PurchasePreview,
  PurchaseSelection,
  RenewalOption,
  Subscription,
  SubscriptionListItem,
  SubscriptionStatusResponse,
  SubscriptionsListResponse,
  TrafficPackage,
  TrafficResetResponse,
  TrafficResetStatus,
  TrialInfo,
} from './types';

const query = (subscriptionId?: number, extra?: Record<string, string | number | boolean>) => ({
  params: { ...(subscriptionId == null ? {} : { subscription_id: subscriptionId }), ...extra },
});

export interface DeviceListResponse {
  devices: Device[];
  total: number;
  device_limit: number;
}

export interface ConnectionLinkResponse {
  subscription_url: string | null;
  display_link: string | null;
  happ_redirect_link: string | null;
  happ_scheme_link: string | null;
  happ_cryptolink?: string | null;
  happ_crypto_link?: string | null;
  happ_link?: string | null;
  connect_mode: string;
  hide_link: boolean;
  instructions: { steps: string[] };
}

export interface TariffInvoiceResult {
  payment_id: string;
  payment_url: string;
  amount_kopeks: number;
  amount_rubles: number;
  price_kopeks: number;
  balance_kopeks: number;
  method: string;
}

export const subscriptionApi = {
  getSubscriptions: (): Promise<SubscriptionsListResponse> =>
    apiClient.get('/cabinet/subscriptions'),

  getSubscriptionById: (subscriptionId: number): Promise<SubscriptionListItem> =>
    apiClient.get(`/cabinet/subscriptions/${subscriptionId}`),

  deleteSubscription: (subscriptionId: number) =>
    apiClient.delete<{ message: string }>(`/cabinet/subscriptions/${subscriptionId}`),

  getSubscription: (subscriptionId?: number): Promise<SubscriptionStatusResponse> =>
    apiClient.get('/cabinet/subscription', query(subscriptionId)),

  getRenewalOptions: (subscriptionId?: number): Promise<RenewalOption[]> =>
    apiClient.get('/cabinet/subscription/renewal-options', query(subscriptionId)),

  renewSubscription: (periodDays: number, subscriptionId?: number) =>
    apiClient.post<{
      message: string;
      new_end_date: string;
      amount_paid_kopeks: number;
    }>('/cabinet/subscription/renew', { period_days: periodDays }, query(subscriptionId)),

  getTrafficPackages: (
    subscriptionId?: number,
    scope: 'regular' | 'whitelist' = 'regular',
  ): Promise<TrafficPackage[]> =>
    apiClient.get('/cabinet/subscription/traffic-packages', query(subscriptionId, { scope })),

  purchaseTraffic: (
    gb: number,
    subscriptionId?: number,
    scope: 'regular' | 'whitelist' = 'regular',
  ) =>
    apiClient.post<{
      message: string;
      gb_added: number;
      amount_paid_kopeks: number;
    }>('/cabinet/subscription/traffic', { gb, scope }, query(subscriptionId)),

  getTrafficReset: (subscriptionId?: number): Promise<TrafficResetStatus> =>
    apiClient.get('/cabinet/subscription/traffic-reset', query(subscriptionId)),

  resetTraffic: (subscriptionId?: number): Promise<TrafficResetResponse> =>
    apiClient.post('/cabinet/subscription/traffic-reset', {}, query(subscriptionId)),

  saveTrafficResetCart: (subscriptionId?: number): Promise<void> =>
    apiClient.post('/cabinet/subscription/traffic-reset/save-cart', {}, query(subscriptionId)),

  refreshTraffic: (subscriptionId?: number) =>
    apiClient.post<{
      success: boolean;
      cached: boolean;
      rate_limited?: boolean;
      retry_after_seconds?: number;
      traffic_used_bytes: number;
      traffic_used_gb: number;
      traffic_limit_bytes: number;
      traffic_limit_gb: number;
      traffic_used_percent: number;
      is_unlimited: boolean;
    }>('/cabinet/subscription/refresh-traffic', {}, query(subscriptionId)),

  purchaseDevices: (devices: number, subscriptionId?: number) =>
    apiClient.post<{
      success: boolean;
      message: string;
      devices_added: number;
      new_device_limit: number;
      price_kopeks: number;
      price_label: string;
      balance_kopeks: number;
      balance_label: string;
    }>('/cabinet/subscription/devices/purchase', { devices }, query(subscriptionId)),

  getDevicePrice: (devices = 1, subscriptionId?: number) =>
    apiClient.get<{
      available: boolean;
      reason?: string;
      reason_code?: string;
      devices?: number;
      total_price_kopeks?: number;
      total_price_label?: string;
      current_device_limit?: number;
      max_device_limit?: number;
      can_add?: number;
    }>('/cabinet/subscription/devices/price', {
      params: { devices, ...(subscriptionId == null ? {} : { subscription_id: subscriptionId }) },
    }),

  getDeviceReductionInfo: (subscriptionId?: number) =>
    apiClient.get<{
      available: boolean;
      reason?: string;
      reason_code?: string;
      current_device_limit: number;
      min_device_limit: number;
      can_reduce: number;
      connected_devices_count: number;
    }>('/cabinet/subscription/devices/reduction-info', query(subscriptionId)),

  reduceDevices: (newDeviceLimit: number, subscriptionId?: number) =>
    apiClient.post<{
      success: boolean;
      message: string;
      old_device_limit: number;
      new_device_limit: number;
    }>(
      '/cabinet/subscription/devices/reduce',
      { new_device_limit: newDeviceLimit },
      query(subscriptionId),
    ),

  getDevices: (subscriptionId?: number): Promise<DeviceListResponse> =>
    apiClient.get('/cabinet/subscription/devices', query(subscriptionId)),

  renameDevice: (hwid: string, name: string | null, subscriptionId?: number) =>
    apiClient.patch<{ hwid: string; local_name: string | null }>(
      `/cabinet/subscription/devices/${encodeURIComponent(hwid)}/name`,
      { name },
      query(subscriptionId),
    ),

  deleteDevice: (hwid: string, subscriptionId?: number) =>
    apiClient.delete<{ success: boolean; message: string; deleted_hwid: string }>(
      `/cabinet/subscription/devices/${encodeURIComponent(hwid)}`,
      query(subscriptionId),
    ),

  deleteAllDevices: (subscriptionId?: number) =>
    apiClient.delete<{ success: boolean; message: string; deleted_count: number }>(
      '/cabinet/subscription/devices',
      query(subscriptionId),
    ),

  updateAutopay: (enabled: boolean, daysBefore?: number, subscriptionId?: number) =>
    apiClient.patch<{
      message: string;
      autopay_enabled: boolean;
      autopay_days_before: number;
    }>(
      '/cabinet/subscription/autopay',
      { enabled, days_before: daysBefore },
      query(subscriptionId),
    ),

  getSbpRecurring: (subscriptionId?: number) =>
    apiClient.get<{
      status: string;
      interval?: number;
      amount_kopeks?: number;
      next_charge_at?: string | null;
      redirect_url?: string | null;
    }>('/cabinet/subscription/platega-recurrent', query(subscriptionId)),

  enableSbpRecurring: (subscriptionId?: number) =>
    apiClient.post<{ status: string; redirect_url: string | null }>(
      '/cabinet/subscription/platega-recurrent/enable',
      {},
      query(subscriptionId),
    ),

  cancelSbpRecurring: (subscriptionId?: number) =>
    apiClient.post<{ status: string }>(
      '/cabinet/subscription/platega-recurrent/cancel',
      {},
      query(subscriptionId),
    ),

  purchaseWithSbpRecurring: (tariffId: number) =>
    apiClient.post<{ status: string; redirect_url: string | null; subscription_id: number }>(
      '/cabinet/subscription/platega-recurrent/purchase',
      {},
      { params: { tariff_id: tariffId } },
    ),

  getLavaRecurring: (subscriptionId?: number) =>
    apiClient.get<{
      status: string;
      charge_days?: number;
      amount_kopeks?: number;
      next_charge_at?: string | null;
      redirect_url?: string | null;
    }>('/cabinet/subscription/lava-recurrent', query(subscriptionId)),

  enableLavaRecurring: (subscriptionId?: number) =>
    apiClient.post<{ status: string; redirect_url: string | null }>(
      '/cabinet/subscription/lava-recurrent/enable',
      {},
      query(subscriptionId),
    ),

  cancelLavaRecurring: (subscriptionId?: number) =>
    apiClient.post<{ status: string }>(
      '/cabinet/subscription/lava-recurrent/cancel',
      {},
      query(subscriptionId),
    ),

  purchaseWithLavaRecurring: (tariffId: number) =>
    apiClient.post<{ status: string; redirect_url: string | null; subscription_id: number }>(
      '/cabinet/subscription/lava-recurrent/purchase',
      {},
      { params: { tariff_id: tariffId } },
    ),

  getTrialInfo: (): Promise<TrialInfo> => apiClient.get('/cabinet/subscription/trial'),

  activateTrial: (): Promise<Subscription> => apiClient.post('/cabinet/subscription/trial', {}),

  getPurchaseOptions: (subscriptionId?: number) =>
    apiClient.get<Record<string, unknown>>(
      '/cabinet/subscription/purchase-options',
      query(subscriptionId),
    ),

  previewPurchase: (
    selection: PurchaseSelection,
    subscriptionId?: number,
  ): Promise<PurchasePreview> =>
    apiClient.post('/cabinet/subscription/purchase-preview', { selection }, query(subscriptionId)),

  submitPurchase: (selection: PurchaseSelection, subscriptionId?: number) =>
    apiClient.post<{
      success: boolean;
      message: string;
      subscription: Subscription;
      was_trial_conversion: boolean;
    }>('/cabinet/subscription/purchase', { selection }, query(subscriptionId)),

  purchaseTariff: (
    tariffId: number,
    periodDays: number,
    trafficGb?: number,
    subscriptionId?: number,
  ) =>
    apiClient.post<{
      success: boolean;
      message: string;
      subscription: Subscription;
      tariff_id: number;
      tariff_name: string;
      balance_kopeks: number;
      balance_label: string;
    }>('/cabinet/subscription/purchase-tariff', {
      tariff_id: tariffId,
      period_days: periodDays,
      traffic_gb: trafficGb,
      subscription_id: subscriptionId,
    }),

  createTariffInvoice: (payload: {
    tariff_id: number;
    period_days?: number;
    traffic_gb?: number;
    subscription_id?: number;
    payment_method: string;
    payment_option?: string;
  }): Promise<TariffInvoiceResult> =>
    apiClient.post('/cabinet/subscription/purchase-tariff/invoice', payload),

  getConnectionLink: (subscriptionId?: number): Promise<ConnectionLinkResponse> =>
    apiClient.get('/cabinet/subscription/connection-link', query(subscriptionId)),

  getHappDownloads: () =>
    apiClient.get<{
      platforms: Record<string, { name: string; icon: string; link: string }>;
      happ_enabled: boolean;
    }>('/cabinet/subscription/happ-downloads'),

  getAppConfig: (subscriptionId?: number): Promise<AppConfig> =>
    apiClient.get('/cabinet/subscription/app-config', query(subscriptionId)),

  getCountries: (subscriptionId?: number) =>
    apiClient.get<{
      countries: Array<{
        uuid: string;
        name: string;
        country_code: string | null;
        base_price_kopeks: number;
        price_kopeks: number;
        price_per_month_kopeks: number;
        price_rubles: number;
        is_available: boolean;
        is_connected: boolean;
        has_discount: boolean;
        discount_percent: number;
      }>;
      connected_count: number;
      has_subscription: boolean;
      days_left: number;
      discount_percent: number;
    }>('/cabinet/subscription/countries', query(subscriptionId)),

  updateCountries: (countries: string[], subscriptionId?: number) =>
    apiClient.post<{
      message: string;
      added: string[];
      removed: string[];
      amount_paid_kopeks: number;
      connected_squads: string[];
    }>('/cabinet/subscription/countries', { countries }, query(subscriptionId)),

  previewTariffSwitch: (tariffId: number, subscriptionId?: number) =>
    apiClient.post<{
      can_switch: boolean;
      current_tariff_id: number | null;
      current_tariff_name: string | null;
      new_tariff_id: number;
      new_tariff_name: string;
      remaining_days: number;
      upgrade_cost_kopeks: number;
      upgrade_cost_label: string;
      balance_kopeks: number;
      balance_label: string;
      has_enough_balance: boolean;
      missing_amount_kopeks: number;
      missing_amount_label: string;
      is_upgrade: boolean;
      can_convert_days?: boolean;
      converted_days?: number;
      extra_days?: number;
      commission_days?: number;
      conversion_fee_percent?: number;
      discount_percent?: number;
      discount_kopeks?: number;
      base_upgrade_cost_kopeks?: number;
    }>(
      '/cabinet/subscription/tariff/switch/preview',
      { tariff_id: tariffId, period_days: 30 },
      query(subscriptionId),
    ),

  switchTariff: (
    tariffId: number,
    subscriptionId?: number,
    switchMode: 'prorate_cost' | 'convert_days' = 'prorate_cost',
  ) =>
    apiClient.post<{
      success: boolean;
      message: string;
      subscription: Subscription;
      old_tariff_name: string;
      new_tariff_id: number;
      new_tariff_name: string;
      charged_kopeks: number;
      balance_kopeks: number;
      balance_label: string;
      switch_mode?: string;
      converted_days?: number | null;
      extra_days?: number | null;
      is_upgrade?: boolean;
    }>(
      '/cabinet/subscription/tariff/switch',
      { tariff_id: tariffId, period_days: 30, switch_mode: switchMode },
      query(subscriptionId),
    ),

  revokeSubscription: (subscriptionId?: number) =>
    apiClient.post('/cabinet/subscription/revoke', undefined, query(subscriptionId)),

  togglePause: (subscriptionId?: number) =>
    apiClient.post<{
      success: boolean;
      message: string;
      is_paused: boolean;
      balance_kopeks: number;
      balance_label: string;
    }>('/cabinet/subscription/pause', undefined, query(subscriptionId)),
};

export type SubscriptionApi = typeof subscriptionApi;
