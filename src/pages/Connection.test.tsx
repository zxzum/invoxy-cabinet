// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getAppConfig: vi.fn(),
  getConnectionLink: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: unknown) => {
      if (key === 'subscription.connection.title') return 'Подключение';
      if (key === 'subscription.connection.noSubscription') return 'У вас нет активной подписки';
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
  useTelegramSDK: () => ({ isTelegramWebApp: false }),
}));

vi.mock('@/platform', () => ({ useHaptic: () => ({ impact: vi.fn() }) }));
vi.mock('../store/auth', () => ({
  useAuthStore: (selector: (state: unknown) => unknown) => selector({ user: null, isAdmin: false }),
}));
vi.mock('../components/connection/InstallationGuide', () => ({ default: () => null }));

function renderConnection() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/connection']}>
        <Connection />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

import Connection from './Connection';

describe('Connection without a subscription', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('links to tariff purchase instead of closing the page', async () => {
    mocks.getAppConfig.mockResolvedValue({
      hasSubscription: false,
      platforms: { ios: { apps: [{ name: 'Test', deepLink: 'test://' }] } },
    });
    mocks.getConnectionLink.mockResolvedValue({});

    renderConnection();

    const buy = await screen.findByRole('link', { name: 'Купить' });
    expect(buy.getAttribute('href')).toBe('/subscription/purchase');
    expect(screen.queryByRole('button', { name: 'Закрыть' })).toBeNull();
  });
});
