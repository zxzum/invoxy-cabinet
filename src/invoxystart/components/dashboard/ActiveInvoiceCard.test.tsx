// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ActiveInvoiceCard } from './ActiveInvoiceCard';

const mocks = vi.hoisted(() => ({
  getPendingPayments: vi.fn(),
  cancelPendingPayment: vi.fn(),
  refreshUser: vi.fn(),
  showToast: vi.fn(),
}));

vi.mock('@/invoxystart/api', () => ({
  balanceApi: {
    getPendingPayments: mocks.getPendingPayments,
    cancelPendingPayment: mocks.cancelPendingPayment,
    checkPaymentStatus: vi.fn(),
  },
}));
vi.mock('@/invoxystart/api/client', () => ({ clearResponseCache: vi.fn() }));
vi.mock('@/invoxystart/auth', () => ({ useAuth: () => ({ refreshUser: mocks.refreshUser }) }));
vi.mock('@/invoxystart/components/layout/ToastProvider', () => ({
  useToast: () => ({ showToast: mocks.showToast }),
}));
vi.mock('@/platform', () => ({ usePlatform: () => ({ openLink: vi.fn() }) }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
vi.mock('@/invoxystart/components/ui/RuneIcon', () => {
  const Icon = () => <svg />;
  return { ArrowUpRight: Icon, CreditCard: Icon };
});

const invoice = {
  id: 7,
  method: 'yookassa',
  method_display: 'Карта',
  identifier: 'p-7',
  amount_kopeks: 20000,
  amount_rubles: 200,
  status: 'pending',
  is_paid: false,
  is_checkable: true,
  created_at: new Date().toISOString(),
  expires_at: new Date(Date.now() + 20 * 60 * 1000).toISOString(),
  payment_url: 'https://pay.example.test/7',
  purpose: 'Тариф',
};

function renderCard() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return {
    client,
    ...render(
      <QueryClientProvider client={client}>
        <ActiveInvoiceCard />
      </QueryClientProvider>,
    ),
  };
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.refreshUser.mockResolvedValue(null);
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('ActiveInvoiceCard', () => {
  it('refreshes purchased data again after the invoice disappears', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mocks.getPendingPayments
      .mockResolvedValueOnce({ items: [invoice], total: 1 })
      .mockResolvedValue({ items: [], total: 0 });
    const { client } = renderCard();
    expect(await screen.findByText('Карта')).toBeTruthy();

    await act(() => client.invalidateQueries({ queryKey: ['pendingPayments'] }));
    await act(() => vi.advanceTimersByTimeAsync(0));
    expect(mocks.refreshUser).toHaveBeenCalledTimes(1);
    await act(() => vi.advanceTimersByTimeAsync(10_000));
    expect(mocks.refreshUser).toHaveBeenCalledTimes(3);
  });

  it('explains that a cancelled invoice may still be credited', async () => {
    mocks.getPendingPayments.mockResolvedValue({ items: [invoice], total: 1 });
    mocks.cancelPendingPayment.mockResolvedValue({ status: 'cancelled' });
    renderCard();

    fireEvent.click(await screen.findByRole('button', { name: /Отменить/ }));
    await vi.waitFor(() =>
      expect(mocks.showToast).toHaveBeenCalledWith('invoxy.payment.cancelled'),
    );
  });
});
