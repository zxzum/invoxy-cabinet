// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LazyMotion, domAnimation } from 'framer-motion';
import { MemoryRouter } from 'react-router';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import TariffsPage from './TariffsPage';

const mocks = vi.hoisted(() => ({
  getPurchaseOptions: vi.fn(),
  getSubscriptions: vi.fn(),
  pay: vi.fn(),
}));
vi.mock('@/invoxystart/api', () => ({
  subscriptionApi: {
    getPurchaseOptions: mocks.getPurchaseOptions,
    getSubscriptions: mocks.getSubscriptions,
    getTrialInfo: vi.fn(),
  },
  promoApi: { getLoyaltyTiers: async () => ({ tiers: [] }) },
}));
vi.mock('@/invoxystart/components/payments/PaymentFlow', () => ({
  usePayment: () => ({ pay: mocks.pay, topUp: vi.fn() }),
  PaymentMethods: ({ onPay }: { onPay: (method: string) => void }) => (
    <button type="button" onClick={() => onPay('balance')}>
      Баланс
    </button>
  ),
}));
vi.mock('@/invoxystart/components/layout/ToastProvider', () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));
vi.mock('@/invoxystart/components/dashboard/AddonsCard', () => ({ AddonsCard: () => null }));
vi.mock('@/invoxystart/components/layout/PageHeader', () => ({ PageHeader: () => null }));
vi.mock('@/invoxystart/components/ui/AdaptiveDialog', () => ({
  AdaptiveDialog: ({ open, children }: { open: boolean; children: ReactNode }) =>
    open ? <div role="dialog">{children}</div> : null,
}));
vi.mock('@/invoxystart/components/tariffs/TariffSwitchModal', () => ({
  TariffSwitchModal: ({ open }: { open: boolean }) => (open ? <div>Switch preview</div> : null),
}));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));

const tariffs = [
  {
    id: 1,
    name: 'Базовый',
    device_limit: 5,
    periods: [{ days: 30, months: 1, price_kopeks: 10000 }],
  },
  {
    id: 2,
    name: 'Стандарт',
    device_limit: 5,
    periods: [
      { days: 90, months: 3, price_kopeks: 57000 },
      { days: 30, months: 1, price_kopeks: 20000 },
    ],
  },
];
const future = () => new Date(Date.now() + 86400000 * 10).toISOString();
const past = () => new Date(Date.now() - 86400000).toISOString();

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getPurchaseOptions.mockResolvedValue({ tariffs, current_tariff_id: 1 });
});
afterEach(cleanup);

function mount(path = '/tariffs') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <LazyMotion features={domAnimation}>
        <MemoryRouter initialEntries={[path]}>
          <TariffsPage />
        </MemoryRouter>
      </LazyMotion>
    </QueryClientProvider>,
  );
}

describe('tariff purchase routing', () => {
  it('converts a trial on the same plan through purchase', async () => {
    mocks.getSubscriptions.mockResolvedValue({
      subscriptions: [
        { id: 7, tariff_id: 1, is_trial: true, status: 'active', end_date: future() },
      ],
    });
    mount('/tariffs?plan=1');
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'invoxy.tariffs.connectPlan' }));
    fireEvent.click(await within(dialog).findByRole('button', { name: 'Баланс' }));
    expect(mocks.pay).toHaveBeenCalledWith(
      'balance',
      expect.objectContaining({ tariffId: 1, periodDays: 30, subscriptionId: 7, amount: 100 }),
    );
  });
  it.each([
    { is_trial: true, status: 'active', expired: false },
    { is_trial: true, status: 'expired', expired: true },
    { is_trial: false, status: 'expired', expired: true },
    { is_trial: false, status: 'active', expired: true },
  ])(
    'opens purchase rather than switch preview for $is_trial/$status/expired=$expired',
    async ({ is_trial, status, expired }) => {
      mocks.getSubscriptions.mockResolvedValue({
        subscriptions: [
          { id: 7, tariff_id: 1, is_trial, status, end_date: expired ? past() : future() },
        ],
      });
      mount();
      const article = (await screen.findByRole('heading', { name: 'Стандарт' })).closest('article');
      if (!article) throw new Error('tariff article missing');
      fireEvent.click(within(article).getByRole('button'));
      const dialog = await screen.findByRole('dialog');
      expect(screen.queryByText('Switch preview')).toBeNull();
      fireEvent.click(within(dialog).getByRole('button', { name: 'invoxy.tariffs.connectPlan' }));
      fireEvent.click(await within(dialog).findByRole('button', { name: 'Баланс' }));
      expect(mocks.pay).toHaveBeenCalledWith(
        'balance',
        expect.objectContaining({
          tariffId: 2,
          periodDays: 30,
          subscriptionId: 7,
          amount: 200,
          devices: 5,
        }),
      );
    },
  );

  it('keeps prorated switching for an active paid subscription', async () => {
    mocks.getSubscriptions.mockResolvedValue({
      subscriptions: [
        { id: 7, tariff_id: 1, is_trial: false, status: 'active', end_date: future() },
      ],
    });
    mount();
    const article = (await screen.findByRole('heading', { name: 'Стандарт' })).closest('article');
    if (!article) throw new Error('tariff article missing');
    fireEvent.click(within(article).getByRole('button'));
    expect(await screen.findByText('Switch preview')).toBeTruthy();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('honors the selected period in a trial upgrade deep link', async () => {
    mocks.getSubscriptions.mockResolvedValue({
      subscriptions: [
        { id: 7, tariff_id: 1, is_trial: true, status: 'active', end_date: future() },
      ],
    });
    mount('/tariffs?plan=2&period=90');
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'invoxy.tariffs.connectPlan' }));
    fireEvent.click(await within(dialog).findByRole('button', { name: 'Баланс' }));
    expect(mocks.pay).toHaveBeenCalledWith(
      'balance',
      expect.objectContaining({ periodDays: 90, amount: 570 }),
    );
  });

  it('shows retry when purchase options fail instead of an empty tariff grid', async () => {
    mocks.getPurchaseOptions.mockRejectedValue(new Error('offline'));
    mocks.getSubscriptions.mockResolvedValue({ subscriptions: [] });
    mount();
    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'invoxy.ended.retry' })).toBeTruthy();
  });
});

it('labels an unlimited plan instead of showing 0 GB', async () => {
  mocks.getSubscriptions.mockResolvedValue({ subscriptions: [] });
  mount();
  expect((await screen.findAllByText('subscription.unlimited')).length).toBe(tariffs.length);
  expect(screen.queryByText('invoxy.tariffs.traffic')).toBeNull();
});

it('shows an inferred annual discount and still charges the server total', async () => {
  mocks.getSubscriptions.mockResolvedValue({ subscriptions: [] });
  mocks.getPurchaseOptions.mockResolvedValue({
    tariffs: [
      {
        ...tariffs[0],
        periods: [
          { days: 30, months: 1, price_kopeks: 10000, original_price_kopeks: 10000 },
          { days: 360, months: 12, price_kopeks: 96000, original_price_kopeks: 96000 },
        ],
      },
    ],
  });
  mount('/tariffs?plan=1');
  const dialog = await screen.findByRole('dialog');
  const annual = within(dialog).getByRole('button', { name: /−20%/ });
  expect(annual.getAttribute('aria-pressed')).toBe('false');
  fireEvent.click(annual);
  expect(
    within(dialog)
      .getAllByText(/1.200 ₽/)
      .some((node) => node.tagName === 'S'),
  ).toBe(true);
  expect(screen.queryByText('invoxy.renewal.bestValue')).toBeNull();
  fireEvent.click(within(dialog).getByRole('button', { name: 'invoxy.tariffs.connectPlan' }));
  fireEvent.click(await within(dialog).findByRole('button', { name: 'Баланс' }));
  expect(mocks.pay).toHaveBeenCalledWith(
    'balance',
    expect.objectContaining({ tariffId: 1, periodDays: 360, amount: 960 }),
  );
});
