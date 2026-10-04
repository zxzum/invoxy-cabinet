import apiClient from './client';

export type AppPlatform = 'android' | 'ios' | 'macos' | 'windows';

export interface AppLinks {
  cabinet: string | null;
  renew: string | null;
  app_page: string | null;
  bot: string | null;
  support: string | null;
  promo: string | null;
  downloads: Record<AppPlatform, string | null>;
}

export interface AppConfig {
  links: AppLinks;
  routing: {
    version: string;
    normal: { android_packages: string[] };
    restricted: { domains: string[]; android_packages: string[] };
  };
}

export interface PendingAppLogin {
  platform: AppPlatform;
  app_version: string | null;
  created_at: string | null;
}

export const appApi = {
  getConfig: () => apiClient.get<AppConfig>('/cabinet/app/config', { skipAuth: true }),
  getLogin: (requestId: string) =>
    apiClient.get<PendingAppLogin>(`/cabinet/app/login/${encodeURIComponent(requestId)}`),
  decideLogin: (requestId: string, decision: 'confirm' | 'deny') =>
    apiClient.post<{ status: string; return_url: string }>(
      `/cabinet/app/login/${encodeURIComponent(requestId)}/${decision}`,
    ),
};

export const APP_PLATFORMS: { key: AppPlatform; label: string }[] = [
  { key: 'android', label: 'Android' },
  { key: 'ios', label: 'iPhone и iPad' },
  { key: 'windows', label: 'Windows' },
  { key: 'macos', label: 'macOS' },
];

export const APP_RETURN_URL = 'invoxyvpn://login';

export function detectAppPlatform(): AppPlatform | null {
  if (typeof navigator === 'undefined') return null;
  const ua = navigator.userAgent;
  if (/android/i.test(ua)) return 'android';
  if (/iphone|ipad|ipod/i.test(ua)) return 'ios';
  if (/macintosh|mac os x/i.test(ua)) return navigator.maxTouchPoints > 1 ? 'ios' : 'macos';
  if (/windows/i.test(ua)) return 'windows';
  return null;
}
