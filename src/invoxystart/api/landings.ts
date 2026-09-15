import apiClient from './client';
import type { PurchaseRequest, PurchaseStatus } from './types';

export interface LandingFeature {
  icon: string;
  title: string;
  description: string;
}

export interface LandingTariffPeriod {
  days: number;
  label: string;
  price_kopeks: number;
  price_label: string;
  original_price_kopeks: number | null;
  original_price_label: string | null;
  discount_percent: number | null;
}

export interface LandingTariff {
  id: number;
  name: string;
  description: string | null;
  traffic_limit_gb: number;
  device_limit: number;
  tier_level: number;
  periods: LandingTariffPeriod[];
}

export interface LandingConfig {
  slug: string;
  title: string;
  subtitle: string | null;
  features: LandingFeature[];
  footer_text: string | null;
  tariffs: LandingTariff[];
  payment_methods: Array<Record<string, unknown>>;
  gift_enabled: boolean;
  custom_css: string | null;
  discount: { percent: number; ends_at: string; badge_text: string | null } | null;
}

export const landingApi = {
  getConfig: (slug: string, lang?: string): Promise<LandingConfig> =>
    apiClient.get(`/cabinet/landing/${encodeURIComponent(slug)}`, {
      params: lang ? { lang } : undefined,
      skipAuth: true,
    }),
  createPurchase: (slug: string, data: PurchaseRequest) =>
    apiClient.post<{ purchase_token: string; payment_url: string }>(
      `/cabinet/landing/${encodeURIComponent(slug)}/purchase`,
      data,
      { skipAuth: true },
    ),
  getPurchaseStatus: (token: string): Promise<PurchaseStatus> =>
    apiClient.get(`/cabinet/landing/purchase/${encodeURIComponent(token)}`, { skipAuth: true }),
  activatePurchase: (token: string): Promise<PurchaseStatus> =>
    apiClient.post(`/cabinet/landing/activate/${encodeURIComponent(token)}`, undefined, {
      skipAuth: true,
    }),
  getGiftClaim: (token: string): Promise<PurchaseStatus> =>
    apiClient.get(`/cabinet/landing/gift/${encodeURIComponent(token)}`, { skipAuth: true }),
  claimGift: (token: string, email: string) =>
    apiClient.post<{
      status: string;
      tariff_name: string | null;
      period_days: number | null;
      subscription_url: string | null;
      auto_login_token: string | null;
    }>(`/cabinet/landing/gift/${encodeURIComponent(token)}/claim`, { email }, { skipAuth: true }),
};
