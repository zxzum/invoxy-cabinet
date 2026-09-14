// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, useLocation } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getPartnerStatus: vi.fn(),
  applyPartner: vi.fn(),
  getBalance: vi.fn(),
  createWithdrawal: vi.fn(),
}));

vi.mock('../api/partners', () => ({
  partnerApi: {
    getStatus: mocks.getPartnerStatus,
    apply: mocks.applyPartner,
  },
}));

vi.mock('../api/withdrawals', () => ({
  withdrawalApi: {
    getBalance: mocks.getBalance,
    create: mocks.createWithdrawal,
  },
}));

vi.mock('../hooks/useCurrency', () => ({
  useCurrency: () => ({
    formatWithCurrency: (amount: number) => `${amount} RUB`,
    currencySymbol: 'RUB',
  }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'ru' },
  }),
}));

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="location">{location.pathname}</output>;
}

function renderPage(page: React.ReactNode, path: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        {page}
        <LocationProbe />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

import ReferralPartnerApply from './ReferralPartnerApply';
import ReferralWithdrawalRequest from './ReferralWithdrawalRequest';

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('partner and withdrawal request flows', () => {
  it('submits the partner application payload and returns to referral', async () => {
    mocks.getPartnerStatus.mockResolvedValue({
      partner_status: 'none',
      commission_percent: null,
      latest_application: null,
      campaigns: [],
    });
    mocks.applyPartner.mockResolvedValue({ id: 1, status: 'pending' });

    renderPage(<ReferralPartnerApply />, '/referral/partner/apply');

    fireEvent.change(screen.getByLabelText('referral.partner.fields.companyName'), {
      target: { value: 'API partner' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'referral.partner.submitApplication' }));

    await waitFor(() =>
      expect(mocks.applyPartner.mock.calls[0]?.[0]).toEqual({ company_name: 'API partner' }),
    );
    await waitFor(() => expect(screen.getByTestId('location').textContent).toBe('/referral'));
  });

  it('submits a withdrawal in kopeks using the API balance limits', async () => {
    mocks.getBalance.mockResolvedValue({
      total_earned: 150000,
      referral_spent: 0,
      withdrawn: 0,
      pending: 0,
      available_referral: 150000,
      available_total: 150000,
      only_referral_mode: false,
      min_amount_kopeks: 100000,
      is_withdrawal_enabled: true,
      can_request: true,
      cannot_request_reason: null,
      requisites_text: 'Wallet address',
    });
    mocks.createWithdrawal.mockResolvedValue({ id: 4, amount_kopeks: 120000, status: 'pending' });

    renderPage(<ReferralWithdrawalRequest />, '/referral/withdrawal/request');

    fireEvent.change(await screen.findByLabelText('referral.withdrawal.fields.amount'), {
      target: { value: '1200' },
    });
    fireEvent.change(screen.getByLabelText('Wallet address'), {
      target: { value: 'wallet-12345' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'referral.withdrawal.submitRequest' }));

    await waitFor(() =>
      expect(mocks.createWithdrawal.mock.calls[0]?.[0]).toEqual({
        amount_kopeks: 120000,
        payment_details: 'wallet-12345',
      }),
    );
    await waitFor(() => expect(screen.getByTestId('location').textContent).toBe('/referral'));
  });
});
