// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useCurrency } from './useCurrency';

let language = 'ru';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    i18n: { language },
    t: () => (language === 'ru' ? '₽' : '$'),
  }),
}));

vi.mock('../api/currency', () => ({
  currencyApi: {
    getExchangeRates: vi.fn().mockResolvedValue({ USD: 100, CNY: 14, IRR: 0.0024 }),
    convertFromRub: (rubles: number, currency: string) =>
      currency === 'USD' ? rubles / 100 : rubles,
    convertToRub: (amount: number) => amount,
  },
}));

function Amount() {
  const { formatAmount } = useCurrency();
  return <span>{formatAmount(100)}</span>;
}

function renderAmount() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <Amount />
    </QueryClientProvider>,
  );
}

describe('useCurrency', () => {
  beforeEach(() => {
    language = 'ru';
  });

  it('shows whole rubles by default', () => {
    renderAmount();
    expect(screen.getByText('100')).toBeTruthy();
  });

  it('keeps two decimals for converted currencies', () => {
    language = 'en';
    renderAmount();
    expect(screen.getByText('1.00')).toBeTruthy();
  });
});
