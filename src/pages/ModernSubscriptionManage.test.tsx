// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PlatformProvider } from '../platform/PlatformProvider';
import ModernSubscriptionManage from './ModernSubscriptionManage';

const mocks = vi.hoisted(() => ({
  copyToClipboard: vi.fn(),
  deleteDevice: vi.fn(),
  deleteSubscription: vi.fn(),
  getConnectionLink: vi.fn(),
  getDevices: vi.fn(),
  getRenewalOptions: vi.fn(),
  getSubscription: vi.fn(),
  getSubscriptions: vi.fn(),
  renewSubscription: vi.fn(),
  showToast: vi.fn(),
  updateAutopay: vi.fn(),
}));

vi.mock('../api/subscription', () => ({
  subscriptionApi: {
    deleteDevice: mocks.deleteDevice,
    deleteSubscription: mocks.deleteSubscription,
    getConnectionLink: mocks.getConnectionLink,
    getDevices: mocks.getDevices,
    getRenewalOptions: mocks.getRenewalOptions,
    getSubscription: mocks.getSubscription,
    getSubscriptions: mocks.getSubscriptions,
    renewSubscription: mocks.renewSubscription,
    updateAutopay: mocks.updateAutopay,
  },
}));
vi.mock('../components/Toast', () => ({ useToast: () => ({ showToast: mocks.showToast }) }));
vi.mock('../utils/clipboard', () => ({ copyToClipboard: mocks.copyToClipboard }));
vi.mock('../utils/openAppScheme', () => ({ openAppScheme: vi.fn() }));
vi.mock('../platform/hooks/useNativeDialog', () => ({
  useDestructiveConfirm: () => vi.fn().mockResolvedValue(true),
}));
vi.mock('qrcode.react', () => ({ QRCodeSVG: () => <svg data-testid="qr-code" /> }));
vi.mock('@telegram-apps/sdk-react', () => ({ openLink: vi.fn() }));
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: unknown) => (typeof fallback === 'string' ? fallback : key),
    i18n: { language: 'ru' },
  }),
  initReactI18next: { type: '3rdParty', init: () => {} },
}));

const subscription = {
  id: 42,
  status: 'active',
  is_trial: false,
  start_date: '2026-01-01T00:00:00Z',
  end_date: '2027-01-01T00:00:00Z',
  days_left: 108,
  hours_left: 0,
  minutes_left: 0,
  time_left_display: '108 days',
  traffic_limit_gb: 100,
  traffic_used_gb: 12,
  traffic_used_percent: 12,
  whitelist_traffic_limit_gb: 50,
  whitelist_traffic_used_gb: 5,
  whitelist_traffic_used_percent: 10,
  device_limit: 3,
  connected_squads: [],
  servers: [],
  autopay_enabled: true,
  autopay_days_before: 3,
  subscription_url: 'https://example.test/subscription',
  hide_subscription_link: false,
  is_active: true,
  is_expired: false,
  is_limited: false,
  tariff_name: 'Стандарт',
};

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/subscriptions/42']}>
      <QueryClientProvider
        client={
          new QueryClient({
            defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
          })
        }
      >
        <PlatformProvider>
          <Routes>
            <Route path="/subscriptions/:subscriptionId" element={<ModernSubscriptionManage />} />
          </Routes>
        </PlatformProvider>
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('ModernSubscriptionManage', () => {
  it('renders real subscription actions and sends their subscription id', async () => {
    mocks.getSubscription.mockResolvedValue({ has_subscription: true, subscription });
    mocks.getConnectionLink.mockResolvedValue({
      subscription_url: subscription.subscription_url,
      display_link: null,
      happ_scheme_link: 'happ://add/key',
      happ_redirect_link: null,
      happ_cryptolink: null,
      happ_crypto_link: null,
      happ_link: null,
      connect_mode: 'SUBSCRIPTION',
      hide_link: false,
      instructions: { steps: ['Добавьте ссылку в приложение'] },
    });
    mocks.getDevices.mockResolvedValue({
      devices: [
        {
          hwid: 'hwid-1',
          platform: 'iOS',
          device_model: 'iPhone',
          local_name: null,
          created_at: '2026-09-01T00:00:00Z',
        },
      ],
      total: 1,
      device_limit: 3,
    });
    mocks.getRenewalOptions.mockResolvedValue([
      {
        period_days: 30,
        price_kopeks: 12000,
        price_rubles: 120,
        discount_percent: 0,
        original_price_kopeks: null,
      },
    ]);
    mocks.getSubscriptions.mockResolvedValue({
      multi_tariff_enabled: true,
      subscriptions: [{ id: 42 }, { id: 43 }],
    });
    mocks.copyToClipboard.mockResolvedValue(undefined);
    mocks.updateAutopay.mockResolvedValue({ autopay_enabled: false });
    mocks.deleteDevice.mockResolvedValue({ success: true });
    mocks.renewSubscription.mockResolvedValue({ message: 'ok' });

    renderPage();

    expect(await screen.findByRole('heading', { name: 'Стандарт' })).toBeTruthy();
    expect(screen.getByText(subscription.subscription_url)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Скопировать ключ' }));
    await waitFor(() =>
      expect(mocks.copyToClipboard).toHaveBeenCalledWith(subscription.subscription_url),
    );

    await waitFor(() =>
      expect(
        screen.getByRole('switch', { name: 'Автопродление' }).getAttribute('aria-checked'),
      ).toBe('true'),
    );
    fireEvent.click(screen.getByRole('switch', { name: 'Автопродление' }));
    await waitFor(() => expect(mocks.updateAutopay).toHaveBeenCalledWith(false, 3, 42));

    fireEvent.click(screen.getByRole('button', { name: 'Отключить iPhone' }));
    await waitFor(() => expect(mocks.deleteDevice).toHaveBeenCalledWith('hwid-1', 42));

    fireEvent.click(screen.getByRole('button', { name: 'Продлить подписку' }));
    await waitFor(() => expect(mocks.renewSubscription).toHaveBeenCalledWith(30, 42));
  });
});
