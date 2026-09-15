import apiClient from './client';
import type { WithdrawalBalanceResponse } from './types';

export interface WithdrawalItem {
  id: number;
  amount_kopeks: number;
  amount_rubles: number;
  status: string;
  payment_details: string | null;
  admin_comment: string | null;
  created_at: string;
  processed_at: string | null;
}

export const withdrawalApi = {
  getBalance: (): Promise<WithdrawalBalanceResponse> =>
    apiClient.get('/cabinet/referral/withdrawal/balance'),
  create: (data: { amount_kopeks: number; payment_details: string }) =>
    apiClient.post<{ id: number; amount_kopeks: number; status: string }>(
      '/cabinet/referral/withdrawal/create',
      data,
    ),
  getHistory: (): Promise<{ items: WithdrawalItem[]; total: number }> =>
    apiClient.get('/cabinet/referral/withdrawal/history'),
  cancel: async (requestId: number): Promise<void> => {
    await apiClient.post(`/cabinet/referral/withdrawal/${requestId}/cancel`);
  },
};
