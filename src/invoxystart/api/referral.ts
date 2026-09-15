import apiClient from './client';
import type { PaginatedResponse, ReferralInfo, ReferralTerms } from './types';

export interface ReferralItem {
  id: number;
  username: string | null;
  first_name: string | null;
  created_at: string;
  has_subscription: boolean;
  has_paid: boolean;
}

export interface ReferralEarning {
  id: number;
  amount_kopeks: number;
  amount_rubles: number;
  reason: string;
  reward_type?: 'money' | 'days';
  level?: number;
  days_granted?: number;
  tariff_id?: number | null;
  tariff_name?: string | null;
  referral_username: string | null;
  referral_first_name: string | null;
  campaign_name: string | null;
  created_at: string;
}

export interface ReferralEarningsList extends PaginatedResponse<ReferralEarning> {
  total_amount_kopeks: number;
  total_amount_rubles: number;
  total_days_granted?: number;
}

export const referralApi = {
  getReferralInfo: (): Promise<ReferralInfo> => apiClient.get('/cabinet/referral'),
  getReferralList: (params?: {
    page?: number;
    per_page?: number;
  }): Promise<PaginatedResponse<ReferralItem>> =>
    apiClient.get('/cabinet/referral/list', { params }),
  getReferralEarnings: (params?: {
    page?: number;
    per_page?: number;
  }): Promise<ReferralEarningsList> => apiClient.get('/cabinet/referral/earnings', { params }),
  getReferralTerms: (): Promise<ReferralTerms> => apiClient.get('/cabinet/referral/terms'),
  updateRewardChoice: (payload: {
    reward_preference?: string | null;
    days_target_subscription_id?: number | null;
    set_reward_preference?: boolean;
    set_days_target?: boolean;
  }): Promise<ReferralTerms> => apiClient.patch('/cabinet/referral/reward-choice', payload),
};
