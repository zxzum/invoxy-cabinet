// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ActiveInvoiceCard } from './ActiveInvoiceCard';

const mocks = vi.hoisted(() => ({
  getActivePayments: vi.fn(),
  cancelPendingPayment: vi.fn(),
  refreshUser: vi.fn(),
  showToast: vi.fn(),
  openLink: vi.fn(),
  checkPaymentStatus: vi.fn(),
}));

vi.mock('@/invoxystart/api', () => ({
  balanceApi: {
    getActivePayments: mocks.getActivePayments,
    cancelPendingPayment: mocks.cancelPendingPayment,
    checkPaymentStatus: mocks.checkPaymentStatus,
  },
}));
vi.mock('@/invoxystart/api/client', () => ({ clearResponseCache: vi.fn() }));
vi.mock('@/invoxystart/auth', () => ({ useAuth: () => ({ refreshUser: mocks.refreshUser }) }));
vi.mock('@/invoxystart/components/layout/ToastProvider', () => ({
  useToast: () => ({ showToast: mocks.showToast }),
}));
vi.mock('@/platform', () => ({ usePlatform: () => ({ openLink: mocks.openLink }) }));
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
    mocks.getActivePayments
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
    mocks.getActivePayments.mockResolvedValue({ items: [invoice], total: 1 });
    mocks.cancelPendingPayment.mockResolvedValue({ status: 'cancelled' });
    renderCard();

    fireEvent.click(await screen.findByRole('button', { name: /Отменить/ }));
    await vi.waitFor(() =>
      expect(mocks.showToast).toHaveBeenCalledWith('invoxy.payment.cancelled'),
    );
  });
});

it('browses every invoice and applies actions to the selected provider and ID', async () => {
  const second = {
    ...invoice,
    id: 7,
    method: 'platega',
    method_display: 'Platega',
    amount_rubles: 500,
    payment_url: 'https://pay.example.test/second',
  };
  mocks.getActivePayments.mockResolvedValue({ items: [invoice, second], total: 2 });
  mocks.checkPaymentStatus.mockResolvedValue({ payment: { is_paid: false } });
  mocks.cancelPendingPayment.mockResolvedValue({ is_paid: false });
  renderCard();
  expect(await screen.findByText('Счёт 1 из 2')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Следующий счёт' }));
  expect(screen.getByText('Счёт 2 из 2')).toBeTruthy();
  expect(screen.getByText('Platega')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Оплатить счёт' }));
  expect(mocks.openLink).toHaveBeenCalledWith(second.payment_url);
  fireEvent.click(screen.getByRole('button', { name: 'Проверить оплату' }));
  await vi.waitFor(() => expect(mocks.checkPaymentStatus).toHaveBeenCalledWith('platega', 7));
  await vi.waitFor(() =>
    expect(screen.getByRole('button', { name: 'Отменить' }).hasAttribute('disabled')).toBe(false),
  );
  fireEvent.click(screen.getByRole('button', { name: 'Отменить' }));
  await vi.waitFor(() => expect(mocks.cancelPendingPayment).toHaveBeenCalledWith('platega', 7));
});

it('selects a remaining invoice when the currently viewed invoice disappears', async () => {
  const second = { ...invoice, id: 8, method_display: 'Другой счёт' };
  mocks.getActivePayments
    .mockResolvedValueOnce({ items: [invoice, second] })
    .mockResolvedValue({ items: [invoice] });
  const { client } = renderCard();
  await screen.findByText('Счёт 1 из 2');
  fireEvent.click(screen.getByRole('button', { name: 'Следующий счёт' }));
  expect(screen.getByText('Другой счёт')).toBeTruthy();
  await act(() => client.invalidateQueries({ queryKey: ['pendingPayments'] }));
  expect(await screen.findByText('Карта')).toBeTruthy();
  expect(screen.queryByRole('navigation', { name: 'Неоплаченные счета' })).toBeNull();
});

it('refreshes purchases when cancellation discovers an already paid invoice', async () => {
  mocks.getActivePayments.mockResolvedValue({ items: [invoice] });
  mocks.cancelPendingPayment.mockResolvedValue({ is_paid: true });
  renderCard();
  fireEvent.click(await screen.findByRole('button', { name: 'Отменить' }));
  await vi.waitFor(() => expect(mocks.refreshUser).toHaveBeenCalled());
  expect(mocks.showToast).toHaveBeenCalledWith('Платёж уже подтверждён. Баланс пополнен.');
});
