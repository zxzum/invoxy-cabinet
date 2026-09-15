import apiClient from './client';
import type { LoyaltyTiersResponse, PromoGroupDiscounts, PromoOffer } from './types';

export interface ActiveDiscount {
  discount_percent: number;
  source: string | null;
  expires_at: string | null;
  is_active: boolean;
}

export const promoApi = {
  getOffers: (): Promise<PromoOffer[]> => apiClient.get('/cabinet/promo/offers'),
  getActiveDiscount: (): Promise<ActiveDiscount> => apiClient.get('/cabinet/promo/active-discount'),
  getGroupDiscounts: (): Promise<PromoGroupDiscounts> =>
    apiClient.get('/cabinet/promo/group-discounts'),
  getLoyaltyTiers: (): Promise<LoyaltyTiersResponse> =>
    apiClient.get('/cabinet/promo/loyalty-tiers'),
  claimOffer: (offerId: number) =>
    apiClient.post<{
      success: boolean;
      message: string;
      discount_percent: number | null;
      expires_at: string | null;
    }>('/cabinet/promo/claim', { offer_id: offerId }),
  clearActiveDiscount: (): Promise<{ message: string }> =>
    apiClient.delete('/cabinet/promo/active-discount'),
  deactivateDiscount: (): Promise<{ success: boolean }> =>
    apiClient.post('/cabinet/promocode/deactivate-discount'),
};
