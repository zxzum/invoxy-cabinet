import apiClient from './client';
import type { AuthResponse, OAuthProvider, RegisterResponse, TokenResponse, User } from './types';

export interface TelegramWidgetData {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

export const authApi = {
  loginTelegram: (
    initData: string,
    campaignSlug?: string | null,
    referralCode?: string | null,
    acceptedLegalDocuments?: string[],
  ) =>
    apiClient.post<AuthResponse>('/cabinet/auth/telegram', {
      init_data: initData,
      campaign_slug: campaignSlug || undefined,
      referral_code: referralCode || undefined,
      accepted_legal_documents: acceptedLegalDocuments,
    }),

  loginTelegramWidget: (
    data: TelegramWidgetData,
    campaignSlug?: string | null,
    referralCode?: string | null,
    acceptedLegalDocuments?: string[],
  ) =>
    apiClient.post<AuthResponse>('/cabinet/auth/telegram/widget', {
      ...data,
      campaign_slug: campaignSlug || undefined,
      referral_code: referralCode || undefined,
      accepted_legal_documents: acceptedLegalDocuments,
    }),

  loginTelegramOIDC: (
    idToken: string,
    campaignSlug?: string | null,
    referralCode?: string | null,
    acceptedLegalDocuments?: string[],
  ) =>
    apiClient.post<AuthResponse>('/cabinet/auth/telegram/oidc', {
      id_token: idToken,
      campaign_slug: campaignSlug || undefined,
      referral_code: referralCode || undefined,
      accepted_legal_documents: acceptedLegalDocuments,
    }),

  loginEmail: (
    email: string,
    password: string,
    campaignSlug?: string | null,
    referralCode?: string | null,
  ) =>
    apiClient.post<AuthResponse>('/cabinet/auth/email/login', {
      email,
      password,
      campaign_slug: campaignSlug || undefined,
      referral_code: referralCode || undefined,
    }),

  registerEmail: (
    emailOrData:
      | string
      | {
          email: string;
          password: string;
          first_name?: string;
          language?: string;
          referral_code?: string;
          campaign_slug?: string;
          accepted_legal_documents?: string[];
        },
    password?: string,
  ): Promise<RegisterResponse> => {
    if (typeof emailOrData === 'string') {
      return apiClient.post('/cabinet/auth/email/register', { email: emailOrData, password });
    }
    return apiClient.post('/cabinet/auth/email/register/standalone', emailOrData);
  },

  registerEmailStandalone: (data: {
    email: string;
    password: string;
    first_name?: string;
    language?: string;
    referral_code?: string;
    campaign_slug?: string;
    accepted_legal_documents?: string[];
  }): Promise<RegisterResponse> => apiClient.post('/cabinet/auth/email/register/standalone', data),

  verifyEmail: (token: string, campaignSlug?: string | null) =>
    apiClient.post<AuthResponse>('/cabinet/auth/email/verify', {
      token,
      campaign_slug: campaignSlug || undefined,
    }),

  resendVerification: () => apiClient.post<{ message: string }>('/cabinet/auth/email/resend'),

  resendVerificationPublic: (email: string) =>
    apiClient.post<{ message: string }>('/cabinet/auth/email/register/resend', { email }),

  forgotPassword: (email: string) =>
    apiClient.post<{ message: string }>('/cabinet/auth/password/forgot', { email }),

  resetPassword: (token: string, password: string) =>
    apiClient.post<{ message: string }>('/cabinet/auth/password/reset', { token, password }),

  refreshToken: (refreshToken: string): Promise<TokenResponse> =>
    apiClient.post<TokenResponse>('/cabinet/auth/refresh', { refresh_token: refreshToken }),

  logout: async (refreshToken: string): Promise<void> => {
    await apiClient.post('/cabinet/auth/logout', { refresh_token: refreshToken });
  },

  getMe: (): Promise<User> => apiClient.get<User>('/cabinet/auth/me'),

  getMyAvatar: (): Promise<{ photo_url: string | null }> =>
    apiClient.get<{ photo_url: string | null }>('/cabinet/auth/me/avatar'),

  requestEmailChange: (newEmail: string) =>
    apiClient.post<{ message: string; new_email: string; expires_in_minutes: number }>(
      '/cabinet/auth/email/change',
      { new_email: newEmail },
    ),

  verifyEmailChange: (code: string) =>
    apiClient.post<{ message: string; email: string }>('/cabinet/auth/email/change/verify', {
      code,
    }),

  getOAuthProviders: () =>
    apiClient.get<{ providers: OAuthProvider[] }>('/cabinet/auth/oauth/providers'),

  getOAuthAuthorizeUrl: (provider: string) =>
    apiClient.get<{ authorize_url: string; state: string }>(
      `/cabinet/auth/oauth/${encodeURIComponent(provider)}/authorize`,
    ),

  oauthCallback: (provider: string, code: string, state: string) =>
    apiClient.post<AuthResponse>(`/cabinet/auth/oauth/${encodeURIComponent(provider)}/callback`, {
      code,
      state,
    }),

  autoLogin: (token: string) => apiClient.post<AuthResponse>('/cabinet/auth/login/auto', { token }),

  getLinkedProviders: (): Promise<{
    providers: Array<{ provider: string; linked: boolean; identifier?: string | null }>;
  }> => apiClient.get('/cabinet/auth/account/linked-providers'),

  linkProviderInit: (provider: string) =>
    apiClient.get<{ authorize_url: string; state: string }>(
      `/cabinet/auth/account/link/${encodeURIComponent(provider)}/init`,
    ),

  linkProviderCallback: (provider: string, code: string, state: string, deviceId?: string) =>
    apiClient.post<{ success: boolean }>(
      `/cabinet/auth/account/link/${encodeURIComponent(provider)}/callback`,
      { code, state, device_id: deviceId },
    ),

  linkTelegram: (data: { init_data: string } | { id_token: string } | TelegramWidgetData) =>
    apiClient.post<{ success: boolean }>('/cabinet/auth/account/link/telegram', data),

  unlinkProvider: (provider: string) =>
    apiClient.post<{ success: boolean }>(
      `/cabinet/auth/account/unlink/${encodeURIComponent(provider)}`,
    ),

  requestDeepLinkToken: () =>
    apiClient.post<{ token: string; bot_username: string; expires_in: number }>(
      '/cabinet/auth/deeplink/request',
    ),

  pollDeepLinkToken: (token: string) =>
    apiClient.post<AuthResponse>('/cabinet/auth/deeplink/poll', { token }),

  getAppLink: () =>
    apiClient.post<{ url: string; token_expires_in: number }>('/cabinet/auth/app-link'),

  getPairCode: () =>
    apiClient.post<{ code: string; expires_in: number }>('/cabinet/auth/pair-code'),
};

export type AuthApi = typeof authApi;
