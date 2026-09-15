import apiClient from './client';
import type { SpinResult, WheelConfig } from './types';

export interface SpinAvailability {
  can_spin: boolean;
  reason: string | null;
  spins_remaining_today: number;
  can_pay_stars: boolean;
  can_pay_days: boolean;
  min_subscription_days: number;
  user_subscription_days: number;
}

export interface SpinHistoryItem {
  id: number;
  prize_id: number | null;
  payment_type: string;
  payment_amount: number;
  prize_type: string;
  prize_value: number;
  prize_display_name: string;
  emoji: string;
  color: string;
  prize_value_kopeks: number;
  created_at: string;
}

export const wheelApi = {
  getConfig: (): Promise<WheelConfig> => apiClient.get('/cabinet/wheel/config'),
  checkAvailability: (): Promise<SpinAvailability> => apiClient.get('/cabinet/wheel/availability'),
  spin: (
    paymentType: 'telegram_stars' | 'subscription_days',
    subscriptionId?: number,
  ): Promise<SpinResult> =>
    apiClient.post('/cabinet/wheel/spin', {
      payment_type: paymentType,
      ...(subscriptionId == null ? {} : { subscription_id: subscriptionId }),
    }),
  getHistory: (
    page = 1,
    perPage = 20,
  ): Promise<{
    items: SpinHistoryItem[];
    total: number;
    page: number;
    per_page: number;
    pages: number;
  }> => apiClient.get('/cabinet/wheel/history', { params: { page, per_page: perPage } }),
  createStarsInvoice: (): Promise<{ invoice_url: string; stars_amount: number }> =>
    apiClient.post('/cabinet/wheel/stars-invoice'),
};
