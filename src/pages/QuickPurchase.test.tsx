// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { LandingConfig } from '../api/landings';
import QuickPurchase from './QuickPurchase';

const mocks = vi.hoisted(() => ({
  getConfig: vi.fn(),
  createPurchase: vi.fn(),
  fireAnalyticsEvent: vi.fn(),
  stripContactFromUrl: vi.fn(),
}));

vi.mock('../api/landings', () => ({
  landingApi: {
    getConfig: mocks.getConfig,
    createPurchase: mocks.createPurchase,
  },
}));

vi.mock('../components/backgrounds/BackgroundRenderer', () => ({
  BackgroundRenderer: () => null,
  StaticBackgroundRenderer: () => null,
}));
vi.mock('../components/LanguageSwitcher', () => ({ default: () => null }));
vi.mock('../hooks/useCurrency', () => ({ useCurrency: () => null }));
vi.mock('../hooks/useAnalyticsCounters', () => ({
  fireAnalyticsEvent: mocks.fireAnalyticsEvent,
  getYandexCid: () => null,
}));
vi.mock('../utils/campaign', () => ({ getPendingCampaignSlug: () => null }));
vi.mock('../utils/contactPrefill', () => ({
  readContactPrefill: () => '',
  stripContactFromUrl: mocks.stripContactFromUrl,
}));
vi.mock('../utils/format', () => ({ formatPrice: (kopeks: number) => `₽${kopeks / 100}` }));
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: unknown) => (typeof fallback === 'string' ? fallback : key),
    i18n: { language: 'en' },
  }),
}));

function config(overrides: Partial<LandingConfig> = {}): LandingConfig {
  return {
    slug: 'spring',
    title: 'API landing',
    subtitle: null,
    features: [],
    footer_text: null,
    tariffs: [
      {
        id: 7,
        name: 'API tariff',
        description: null,
        traffic_limit_gb: 100,
        device_limit: 2,
        tier_level: 1,
        periods: [
          {
            days: 30,
            label: '30 days',
            price_kopeks: 12_500,
            price_label: '125 ₽',
            original_price_kopeks: null,
            original_price_label: null,
            discount_percent: null,
          },
        ],
      },
    ],
    payment_methods: [
      {
        method_id: 'card',
        display_name: 'API card',
        description: null,
        icon_url: null,
        sort_order: 1,
        min_amount_kopeks: null,
        max_amount_kopeks: null,
        currency: 'RUB',
        sub_options: [{ id: 'visa', name: 'Visa' }],
      },
    ],
    gift_enabled: true,
    custom_css: null,
    meta_title: null,
    meta_description: null,
    discount: null,
    background_config: null,
    analytics_view_enabled: false,
    analytics_view_goal: '',
    analytics_click_enabled: false,
    analytics_click_goal: '',
    sticky_pay_button: false,
    ...overrides,
  };
}

function renderPage() {
  return render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <MemoryRouter initialEntries={['/buy/spring']}>
        <Routes>
          <Route path="/buy/:slug" element={<QuickPurchase />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const unusableTariffCases = [
  [],
  [
    {
      ...config().tariffs[0],
      periods: [{ ...config().tariffs[0].periods[0], price_kopeks: undefined }],
    },
  ],
] as unknown as LandingConfig['tariffs'][];

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getConfig.mockResolvedValue(config());
  mocks.createPurchase.mockReturnValue(new Promise(() => {}));
  window.innerWidth = 1280;
  sessionStorage.clear();
});

afterEach(() => {
  cleanup();
  sessionStorage.clear();
});

describe('QuickPurchase', () => {
  it('renders API tariff/payment/gift data and preserves the purchase payload', async () => {
    renderPage();

    expect(await screen.findByText('API tariff')).toBeTruthy();
    expect(screen.getByText('API card')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'As a gift' })).toBeTruthy();

    fireEvent.change(screen.getByLabelText('Your contact'), {
      target: { value: 'buyer@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Pay/ }));

    await waitFor(() => expect(mocks.createPurchase).toHaveBeenCalledTimes(1));
    expect(mocks.createPurchase).toHaveBeenCalledWith(
      'spring',
      expect.objectContaining({
        tariff_id: 7,
        period_days: 30,
        contact_type: 'email',
        contact_value: 'buyer@example.com',
        payment_method: 'card_visa',
        language: 'en',
        is_gift: false,
      }),
    );
  });

  it.each(unusableTariffCases.map((tariffs) => [tariffs]))(
    'renders a neutral state and never offers Pay 0 for unusable tariffs',
    async (tariffs: LandingConfig['tariffs']) => {
      mocks.getConfig.mockResolvedValue(config({ tariffs }));

      renderPage();

      expect(await screen.findByText('Purchase options unavailable')).toBeTruthy();
      expect(screen.queryByRole('button', { name: /Pay/ })).toBeNull();
      expect(mocks.createPurchase).not.toHaveBeenCalled();
    },
  );

  it('rejects unsafe API payment and icon URLs', async () => {
    mocks.getConfig.mockResolvedValue(
      config({
        payment_methods: [
          {
            ...config().payment_methods[0],
            icon_url: 'javascript:alert(1)',
          },
        ],
      }),
    );
    mocks.createPurchase.mockResolvedValue({
      purchase_token: 'purchase-token',
      payment_url: 'javascript:alert(1)',
    });

    renderPage();
    await screen.findByText('API tariff');
    fireEvent.change(screen.getByLabelText('Your contact'), {
      target: { value: 'buyer@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Pay/ }));

    await waitFor(() => expect(screen.getByText('Unable to open payment link')).toBeTruthy());
    expect(screen.queryByRole('img')).toBeNull();
  });
});
