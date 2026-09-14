// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, useLocation } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import TopUpMethodSelect from './TopUpMethodSelect';

const mocks = vi.hoisted(() => ({ getPaymentMethods: vi.fn() }));

vi.mock('../api/balance', () => ({
  balanceApi: { getPaymentMethods: mocks.getPaymentMethods },
}));
vi.mock('../hooks/useCurrency', () => ({
  useCurrency: () => ({
    formatAmount: (amount: number) => String(amount),
    currencySymbol: '₽',
  }),
}));
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { defaultValue?: string }) => options?.defaultValue || key,
  }),
}));
vi.mock('@/platform', () => ({
  usePlatform: () => ({ haptic: { impact: vi.fn() } }),
}));

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="location">{location.pathname + location.search}</output>;
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/balance/top-up?amount=250&returnTo=%2Fsubscriptions']}>
      <QueryClientProvider
        client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
      >
        <TopUpMethodSelect />
        <LocationProbe />
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.getPaymentMethods.mockResolvedValue([
    {
      id: 'card',
      name: 'API card',
      description: 'Target provider',
      min_amount_kopeks: 10000,
      max_amount_kopeks: 500000,
      is_available: true,
      options: null,
      quick_amounts: [10000, 30000],
    },
  ]);
});

afterEach(cleanup);

describe('TopUpMethodSelect', () => {
  it('uses a focusable native button and preserves forwarded query parameters', async () => {
    renderPage();

    const method = await screen.findByRole('button', { name: /API card/ });
    method.focus();
    expect(document.activeElement).toBe(method);
    expect(method.tagName).toBe('BUTTON');

    fireEvent.click(method);
    expect(screen.getByTestId('location').textContent).toBe(
      '/balance/top-up/card?amount=250&returnTo=%2Fsubscriptions',
    );
  });
});
