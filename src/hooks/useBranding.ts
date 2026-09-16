import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth';
import { setCachedFullscreenEnabled } from '@/hooks/useTelegramSDK';
import {
  brandingApi,
  getCachedBranding,
  setCachedBranding,
  preloadLogo,
  isLogoPreloaded,
} from '@/api/branding';

const FALLBACK_NAME = import.meta.env.VITE_APP_NAME || 'Invoxy VPN';
const FALLBACK_LOGO = import.meta.env.VITE_APP_LOGO || 'IX';

export function useBranding() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // Branding data
  const { data: branding } = useQuery({
    queryKey: ['branding'],
    queryFn: async () => {
      const data = await brandingApi.getBranding();
      setCachedBranding(data);
      await preloadLogo(data);
      return data;
    },
    initialData: getCachedBranding() ?? undefined,
    initialDataUpdatedAt: 0,
    staleTime: 60000,
    enabled: isAuthenticated,
  });

  const appName = branding ? branding.name : FALLBACK_NAME;
  const logoLetter = branding?.logo_letter || FALLBACK_LOGO;
  const hasCustomLogo = branding?.has_custom_logo || false;
  const logoUrl = branding ? brandingApi.getLogoUrl(branding) : null;

  // Заголовок, фавикон и метатеги ведёт useDocumentBranding на уровне приложения.

  useEffect(() => {
    setCachedFullscreenEnabled(false);
  }, []);

  return {
    appName,
    logoLetter,
    hasCustomLogo,
    logoUrl,
    isLogoPreloaded,
  };
}
