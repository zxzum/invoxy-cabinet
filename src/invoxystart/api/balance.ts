import apiClient from './client';
import type {
  Balance,
  ManualCheckResponse,
  PaginatedResponse,
  PaymentMethod,
  PendingPayment,
  SavedCardsResponse,
  Transaction,
} from './types';

export const balanceApi = {
  getBalance: (): Promise<Balance> => apiClient.get('/cabinet/balance'),

  getTransactions: (params?: {
    page?: number;
    per_page?: number;
    type?: string;
  }): Promise<PaginatedResponse<Transaction>> =>
    apiClient.get('/cabinet/balance/transactions', { params }),

  getPaymentMethods: (): Promise<PaymentMethod[]> =>
    apiClient.get('/cabinet/balance/payment-methods'),

  createTopUp: (
    amountKopeks: number,
    paymentMethod: string,
    paymentOption?: string,
  ): Promise<{
    payment_id: string;
    payment_url: string;
    amount_kopeks: number;
    amount_rubles: number;
    status: string;
    expires_at: string | null;
  }> =>
    apiClient.post('/cabinet/balance/topup', {
      amount_kopeks: amountKopeks,
      payment_method: paymentMethod,
      ...(paymentOption ? { payment_option: paymentOption } : {}),
      language: 'ru',
    }),

  createStarsInvoice: (amountKopeks: number) =>
    apiClient.post<{ invoice_url: string; stars_amount?: number; amount_kopeks?: number }>(
      '/cabinet/balance/stars-invoice',
      { amount_kopeks: amountKopeks },
    ),

  activatePromocode: (code: string, subscriptionId?: number) =>
    apiClient.post<{
      success: boolean;
      message?: string;
      balance_before?: number;
      balance_after?: number;
      bonus_description?: string | null;
      error?: string;
      eligible_subscriptions?: Array<{ id: number; tariff_name: string; days_left: number }>;
      code?: string;
    }>('/cabinet/promocode/activate', {
      code,
      ...(subscriptionId == null ? {} : { subscription_id: subscriptionId }),
    }),

  getPendingPayments: (params?: {
    page?: number;
    per_page?: number;
  }): Promise<PaginatedResponse<PendingPayment>> =>
    apiClient.get('/cabinet/balance/pending-payments', { params }),

  getPendingPayment: (method: string, paymentId: number): Promise<PendingPayment> =>
    apiClient.get(
      `/cabinet/balance/pending-payments/${encodeURIComponent(method)}/${encodeURIComponent(paymentId)}`,
    ),

  getLatestPayment: (method: string): Promise<PendingPayment> =>
    apiClient.get(`/cabinet/balance/pending-payments/${encodeURIComponent(method)}/latest`),

  checkPaymentStatus: (method: string, paymentId: number | string): Promise<ManualCheckResponse> =>
    apiClient.post(
      `/cabinet/balance/pending-payments/${encodeURIComponent(method)}/${encodeURIComponent(paymentId)}/check`,
    ),

  cancelPendingPayment: (method: string, paymentId: number | string): Promise<PendingPayment> =>
    apiClient.post(
      `/cabinet/balance/pending-payments/${encodeURIComponent(method)}/${encodeURIComponent(paymentId)}/cancel`,
    ),

  getSavedCards: (): Promise<SavedCardsResponse> => apiClient.get('/cabinet/balance/saved-cards'),

  deleteSavedCard: async (id: number): Promise<void> => {
    await apiClient.delete(`/cabinet/balance/saved-cards/${id}`);
  },
};

export type BalanceApi = typeof balanceApi;
