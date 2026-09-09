// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';

const { requestDeepLinkToken, translation } = vi.hoisted(() => ({
  requestDeepLinkToken: vi.fn(),
  translation: {
    t: (key: string, fallback?: unknown) => (typeof fallback === 'string' ? fallback : key),
    i18n: { language: 'ru', changeLanguage: () => Promise.resolve() },
  },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => translation,
  initReactI18next: { type: '3rdParty', init: () => {} },
}));

vi.mock('react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router')>()),
  useNavigate: () => vi.fn(),
}));

vi.mock('../store/auth', () => ({
  useAuthStore: (selector: (state: Record<string, unknown>) => unknown) =>
    selector({
      loginWithTelegramOIDC: vi.fn(),
      loginWithTelegramWidget: vi.fn(),
      loginWithDeepLink: vi.fn(),
    }),
}));

vi.mock('../hooks/useLegalConsentGate', () => ({
  useLegalConsentGate: () => ({
    pending: false,
    capture: () => false,
    acceptedKeys: [],
  }),
}));

vi.mock('../api/branding', () => ({
  brandingApi: {
    getTelegramWidgetConfig: () =>
      Promise.resolve({
        bot_username: 'bot',
        oidc_enabled: false,
        request_access: false,
        size: 'large',
        radius: 20,
        userpic: true,
      }),
  },
}));

vi.mock('../api/auth', () => ({ authApi: { requestDeepLinkToken } }));

async function renderButton() {
  const { default: TelegramLoginButton } = await import('./TelegramLoginButton');
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <TelegramLoginButton />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

afterEach(() => {
  cleanup();
  requestDeepLinkToken.mockReset();
});

describe('TelegramLoginButton: штатный Telegram Widget', () => {
  it('использует виджет по умолчанию без ручной альтернативы входа через бота', async () => {
    await renderButton();

    await waitFor(() => {
      expect(document.querySelector('script[data-telegram-login="bot"]')).not.toBeNull();
    });

    expect(requestDeepLinkToken).not.toHaveBeenCalled();
    expect(screen.queryByText('auth.loginWithBot')).toBeNull();
  });
});
