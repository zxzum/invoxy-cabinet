// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { AppConfig } from '../types';

const mocks = vi.hoisted(() => ({
  getAppConfig: vi.fn(),
  getConnectionLink: vi.fn(),
  isTelegramWebApp: false,
  openAppScheme: vi.fn(),
  openLink: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: unknown) => {
      if (key === 'subscription.connection.title') return 'Подключение';
      if (key === 'subscription.connection.noSubscription') return 'У вас нет активной подписки';
      if (key === 'subscription.connection.openQr') return 'Open QR code';
      if (key === 'subscription.purchase') return 'Купить';
      return typeof fallback === 'string' ? fallback : key;
    },
    i18n: { language: 'ru' },
  }),
}));

vi.mock('../api/subscription', () => ({
  subscriptionApi: {
    getAppConfig: mocks.getAppConfig,
    getConnectionLink: mocks.getConnectionLink,
  },
}));

vi.mock('../hooks/useTelegramSDK', () => ({
  useTelegramSDK: () => ({ isTelegramWebApp: mocks.isTelegramWebApp }),
}));
vi.mock('../hooks/useBranding', () => ({ useBranding: () => ({ appName: 'Invoxy' }) }));
vi.mock('../components/admin', () => ({ AdminBackButton: () => null }));
vi.mock('../hooks/useTheme', () => ({ useTheme: () => ({ isLight: false, isDark: true }) }));
vi.mock('../utils/openAppScheme', () => ({ openAppScheme: mocks.openAppScheme }));
vi.mock('@telegram-apps/sdk-react', () => ({ openLink: mocks.openLink }));

vi.mock('@/platform', () => ({ useHaptic: () => ({ impact: vi.fn() }) }));
vi.mock('../store/auth', () => ({
  useAuthStore: (selector: (state: unknown) => unknown) => selector({ user: null, isAdmin: false }),
}));

const appConfig = (subscriptionUrl: string, blockLink = 'happ://block-link'): AppConfig => ({
  platformNames: {},
  hasSubscription: true,
  subscriptionUrl,
  hideLink: false,
  platforms: {
    ios: {
      apps: [
        {
          name: 'Fixture app',
          featured: true,
          deepLink: 'happ://fixture-app',
          blocks: [
            {
              title: { ru: 'Fixture step' },
              description: { ru: 'Fixture description' },
              buttons: [
                {
                  type: 'subscriptionLink',
                  text: { ru: 'Подключить' },
                  link: blockLink,
                },
              ],
            },
          ],
        },
      ],
    },
  },
});

const connectionLink = (overrides: Record<string, unknown> = {}) => ({
  subscription_url: 'https://subscription.test/fixture',
  display_link: null,
  happ_redirect_link: null,
  happ_scheme_link: null,
  happ_cryptolink: null,
  happ_crypto_link: null,
  happ_link: null,
  connect_mode: 'normal',
  hide_link: false,
  instructions: { steps: [] },
  ...overrides,
});

function renderConnection(
  initialEntry: string | { pathname: string; state?: unknown } = '/connection',
) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/connection" element={<Connection />} />
          <Route path="/connection/qr" element={<ConnectionQR />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

import Connection from './Connection';
import ConnectionQR from './ConnectionQR';

describe('Connection without a subscription', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('links to tariff purchase instead of closing the page', async () => {
    mocks.getAppConfig.mockResolvedValue({
      hasSubscription: false,
      platforms: { ios: { apps: [{ name: 'Test', deepLink: 'test://', blocks: [] }] } },
    });
    mocks.getConnectionLink.mockResolvedValue({});

    renderConnection();

    const buy = await screen.findByRole('link', { name: 'Купить' });
    expect(buy.getAttribute('href')).toBe('/subscription/purchase');
    expect(screen.queryByRole('button', { name: 'Закрыть' })).toBeNull();
  });

  it.each([
    {
      label: 'HAPP',
      subscriptionUrl: 'https://subscription.test/happ',
      expectedUrl: 'happ://crypt/happ-fixture',
      hideLink: false,
      link: connectionLink({
        connect_mode: 'happ_cryptolink',
        happ_cryptolink: 'happ://crypt/happ-fixture',
        hide_link: false,
      }),
    },
    {
      label: 'INCY',
      subscriptionUrl: 'incy://import/incy-fixture',
      expectedUrl: 'incy://import/incy-fixture',
      hideLink: true,
      link: connectionLink({
        subscription_url: 'incy://import/incy-fixture',
        connect_mode: 'incy',
        hide_link: true,
      }),
    },
  ])('selects the page-level $label connection link and honors hide-link', async (fixture) => {
    mocks.getAppConfig.mockResolvedValue(appConfig(fixture.subscriptionUrl));
    mocks.getConnectionLink.mockResolvedValue(fixture.link);

    renderConnection();

    fireEvent.click(await screen.findByRole('button', { name: 'Open QR code' }));

    expect(mocks.getConnectionLink).toHaveBeenCalledWith(undefined);
    expect(document.querySelector('svg')).toBeTruthy();
    if (fixture.hideLink) {
      expect(screen.queryByText(fixture.expectedUrl)).toBeNull();
    } else {
      expect(await screen.findByText(fixture.expectedUrl)).toBeTruthy();
    }
  });

  it.each([false, true])('uses the correct deep-link guard for Telegram=%s', async (isTelegram) => {
    mocks.isTelegramWebApp = isTelegram;
    mocks.getAppConfig.mockResolvedValue(appConfig('https://subscription.test/fixture'));
    mocks.getConnectionLink.mockResolvedValue(connectionLink());

    renderConnection();

    const openLinkButton = await screen.findByRole('button', { name: 'Подключить' });
    if (isTelegram) {
      expect(screen.queryByRole('button', { name: 'Back' })).toBeNull();
    } else {
      expect(screen.queryByRole('button', { name: 'Back' })).toBeTruthy();
    }
    fireEvent.click(openLinkButton);

    if (isTelegram) {
      expect(mocks.openLink).toHaveBeenCalledWith(
        `${window.location.origin}/miniapp/redirect.html?url=happ%3A%2F%2Fblock-link&lang=ru`,
        { tryInstantView: false },
      );
      expect(mocks.openAppScheme).not.toHaveBeenCalled();
    } else {
      expect(mocks.openAppScheme).toHaveBeenCalledWith('happ://block-link');
      expect(mocks.openLink).not.toHaveBeenCalled();
    }
  });

  it.each(['happ://crypt/fixture', 'incy://import/fixture'])(
    'renders the QR state returned by the connection flow: %s',
    (url) => {
      render(
        <MemoryRouter
          initialEntries={[
            {
              pathname: '/connection/qr',
              state: { url, hideLink: false, subscriptionId: 42 },
            },
          ]}
        >
          <ConnectionQR />
        </MemoryRouter>,
      );

      expect(screen.getByText(url)).toBeTruthy();
      expect(document.querySelector('svg')).toBeTruthy();
    },
  );
});
