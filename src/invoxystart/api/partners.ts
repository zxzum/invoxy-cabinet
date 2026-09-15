import apiClient from './client';
import type { PartnerStatusResponse } from './types';

export interface PartnerApplicationRequest {
  company_name?: string;
  website_url?: string;
  telegram_channel?: string;
  description?: string;
  expected_monthly_referrals?: number;
  desired_commission_percent?: number;
}

export interface PartnerCampaignStats {
  campaign_id: number;
  campaign_name: string;
  registrations_count: number;
  referrals_count: number;
  earnings_kopeks: number;
  conversion_rate: number;
  earnings_today: number;
  earnings_week: number;
  earnings_month: number;
}

export const partnerApi = {
  getStatus: (): Promise<PartnerStatusResponse> =>
    apiClient.get('/cabinet/referral/partner/status'),
  apply: (data: PartnerApplicationRequest) =>
    apiClient.post<Record<string, unknown>>('/cabinet/referral/partner/apply', data),
  getCampaignStats: (campaignId: number): Promise<PartnerCampaignStats> =>
    apiClient.get(`/cabinet/referral/partner/campaigns/${campaignId}/stats`),
};
