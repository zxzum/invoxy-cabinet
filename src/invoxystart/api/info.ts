import apiClient from './client';
import type { FaqPage, InfoDocument, LanguageInfo, LegalConsentConfig, ServiceInfo } from './types';

export interface InfoVisibility {
  faq: boolean;
  rules: boolean;
  privacy: boolean;
  offer: boolean;
  recurrent: boolean;
}

export const infoApi = {
  getFaqPages: (): Promise<FaqPage[]> => apiClient.get('/cabinet/info/faq'),
  getFaqPage: (pageId: number): Promise<FaqPage> => apiClient.get(`/cabinet/info/faq/${pageId}`),
  getRules: (): Promise<InfoDocument> => apiClient.get('/cabinet/info/rules'),
  getPrivacyPolicy: (): Promise<InfoDocument> => apiClient.get('/cabinet/info/privacy-policy'),
  getPublicOffer: (): Promise<InfoDocument> => apiClient.get('/cabinet/info/public-offer'),
  getRecurrentPayments: (): Promise<InfoDocument> =>
    apiClient.get('/cabinet/info/recurrent-payments'),
  getServiceInfo: (): Promise<ServiceInfo> => apiClient.get('/cabinet/info/service'),
  getLanguages: (): Promise<{ languages: LanguageInfo[]; default: string }> =>
    apiClient.get('/cabinet/info/languages'),
  getUserLanguage: (): Promise<{ language: string }> =>
    apiClient.get('/cabinet/info/user/language'),
  updateUserLanguage: (language: string): Promise<{ language: string }> =>
    apiClient.patch('/cabinet/info/user/language', { language }),
  getVisibility: (): Promise<InfoVisibility> => apiClient.get('/cabinet/info/visibility'),
  getLegalConsentConfig: (language?: string): Promise<LegalConsentConfig> =>
    apiClient.get('/cabinet/info/legal-consent', {
      params: language ? { language } : undefined,
      skipAuth: true,
    }),
};

export default infoApi;
