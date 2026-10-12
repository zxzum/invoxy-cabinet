// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { PublicCatalog } from '@/api/publicCatalog';
import { useAuthStore } from '@/store/auth';
import LiveLanding from './LiveLanding';

vi.mock('@/api/publicCatalog', () => ({
  fetchPublicCatalog: vi.fn(),
}));

import { fetchPublicCatalog } from '@/api/publicCatalog';

const catalog: PublicCatalog = {
  sales_mode: 'tariffs',
  bot_url: 'https://t.me/configured_bot',
  support_url: 'https://t.me/invoxy_support_bot',
  trial: {
    duration_days: 2,
    traffic_limit_gb: 10,
    whitelist_traffic_limit_gb: 5,
    device_limit: 1,
    requires_payment: false,
    price_kopeks: 0,
    price_label: '0 ₽',
  },
  tariffs: [
    {
      id: 7,
      name: 'Ночной',
      is_highlighted: true,
      traffic_limit_gb: 420,
      whitelist_traffic_limit_gb: 15,
      base_device_limit: 2,
      max_device_limit: 4,
      device_price_kopeks: 1500,
      device_price_label: '15 ₽',
      description: 'Текст из админки',
      periods: [
        {
          days: 30,
          months: 1,
          label: '30 дней',
          price_kopeks: 33300,
          price_label: '333 ₽',
          price_per_month_kopeks: 33300,
          price_per_month_label: '333 ₽',
        },
      ],
    },
  ],
};

afterEach(() => {
  cleanup();
  useAuthStore.setState({ isAuthenticated: false, isLoading: false, user: null });
  vi.clearAllMocks();
});

function renderLanding() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <LiveLanding />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('LiveLanding', () => {
  it('starts with the basic 100 ₽ plan and marks annual value without selecting it', async () => {
    const basic = {
      ...catalog.tariffs[0],
      id: 1,
      name: 'Базовый',
      is_highlighted: false,
      whitelist_traffic_limit_gb: 0,
      periods: [
        {
          days: 360,
          months: 12,
          label: '360 дней',
          price_kopeks: 90000,
          price_label: '900 ₽',
          price_per_month_kopeks: 7500,
          price_per_month_label: '75 ₽',
          is_highlighted: true,
        },
        {
          days: 180,
          months: 6,
          label: '180 дней',
          price_kopeks: 60000,
          price_label: '600 ₽',
          price_per_month_kopeks: 10000,
          price_per_month_label: '100 ₽',
        },
        {
          days: 90,
          months: 3,
          label: '90 дней',
          price_kopeks: 30000,
          price_label: '300 ₽',
          price_per_month_kopeks: 10000,
          price_per_month_label: '100 ₽',
        },
        {
          days: 30,
          months: 1,
          label: '30 дней',
          price_kopeks: 10000,
          price_label: '100 ₽',
          price_per_month_kopeks: 10000,
          price_per_month_label: '100 ₽',
        },
      ],
    };
    vi.mocked(fetchPublicCatalog).mockResolvedValue({
      ...catalog,
      tariffs: [...catalog.tariffs, basic],
    });
    const { container } = renderLanding();
    await screen.findByRole('heading', { name: 'Базовый' });
    const configurator = container.querySelector('#configurator');
    if (!configurator) throw new Error('configurator missing');
    const config = within(configurator as HTMLElement);
    expect(
      within(config.getByRole('radiogroup', { name: 'Срок' }))
        .getAllByRole('radio')
        .map((button) => button.textContent),
    ).toEqual(['30 дней', '90 дней', '180 дней', '360 дней−25%']);
    expect(config.getByRole('radio', { name: 'Базовый' }).getAttribute('aria-checked')).toBe(
      'true',
    );
    expect(config.getByRole('radio', { name: /360 дней/ }).getAttribute('aria-checked')).toBe(
      'false',
    );
    expect(config.getByText(/К оплате 100 ₽ за 30 дней/)).toBeTruthy();
    expect(config.getByText('−25%')).toBeTruthy();
    expect(config.queryByText('Самый выгодный')).toBeNull();
    expect(screen.getByText('Низкая цена').closest('article')?.textContent).toContain('Базовый');
    expect(screen.getAllByText('15 ГБ белого интернета').length).toBeGreaterThan(0);
    fireEvent.click(config.getByRole('radio', { name: /360 дней/ }));
    expect(config.getByText(/К оплате 900 ₽ за 360 дней/)).toBeTruthy();
    fireEvent.click(config.getByRole('radio', { name: 'Ночной' }));
    fireEvent.click(config.getByRole('radio', { name: 'Базовый' }));
    expect(config.getByText(/К оплате 100 ₽ за 30 дней/)).toBeTruthy();
  });
  it('renders prices and the bot link from the catalog', async () => {
    vi.mocked(fetchPublicCatalog).mockResolvedValue(catalog);
    renderLanding();

    expect(await screen.findByRole('heading', { name: 'Ночной' })).toBeTruthy();
    expect(screen.getAllByText('333 ₽').length).toBeGreaterThan(0);
    expect(screen.getAllByText('420 ГБ VPN-трафика').length).toBeGreaterThan(0);
    expect(screen.getAllByText('15 ГБ белого интернета').length).toBeGreaterThan(0);
    expect(screen.getByText('Подробнее о тарифе').closest('details')?.textContent).toContain(
      'Текст из админки',
    );
    expect(screen.queryByText(/120 ₽|600 ГБ|1 Гбит/)).toBeNull();
    expect(
      screen
        .getAllByRole('link', { name: 'Telegram-боте' })
        .some((link) => link.getAttribute('href') === 'https://t.me/configured_bot'),
    ).toBe(true);
  });

  it('offers sign in and registration to guests', async () => {
    vi.mocked(fetchPublicCatalog).mockResolvedValue(catalog);
    renderLanding();
    await screen.findByRole('heading', { name: 'Ночной' });

    const hrefs = (name: RegExp | string) =>
      screen.getAllByRole('link', { name }).map((link) => link.getAttribute('href'));
    expect(hrefs('Войти')).toContain('/login');
    expect(hrefs('Регистрация')).toContain('/register');
    expect(screen.queryByRole('link', { name: /Открыть кабинет/ })).toBeNull();
  });

  it('sends a signed-in user straight to the cabinet', async () => {
    useAuthStore.setState({
      isAuthenticated: true,
      isLoading: false,
      user: { id: 1, first_name: 'Аня' } as never,
    });
    vi.mocked(fetchPublicCatalog).mockResolvedValue(catalog);
    renderLanding();
    await screen.findByRole('heading', { name: 'Ночной' });

    const cabinet = screen.getAllByRole('link', { name: /Открыть кабинет/ });
    expect(cabinet.length).toBeGreaterThan(0);
    expect(cabinet.every((link) => link.getAttribute('href') === '/dashboard')).toBe(true);
    expect(screen.queryByRole('link', { name: 'Регистрация' })).toBeNull();
    expect(screen.getAllByText('Аня').length).toBeGreaterThan(0);
  });
});
