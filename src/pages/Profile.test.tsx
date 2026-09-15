// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, useLocation } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Profile from './Profile';

const mocks = vi.hoisted(() => ({
  setUser: vi.fn(),
  getBalance: vi.fn(),
  getTransactions: vi.fn(),
  getPaymentMethods: vi.fn(),
  getLoyaltyTiers: vi.fn(),
  getReferralInfo: vi.fn(),
  getReferralTerms: vi.fn(),
  getBranding: vi.fn(),
  getEmailAuthEnabled: vi.fn(),
  getSettings: vi.fn(),
  updateSettings: vi.fn(),
  getMe: vi.fn(),
  resendVerification: vi.fn(),
  requestEmailChange: vi.fn(),
  verifyEmailChange: vi.fn(),
}));

vi.mock('../api/balance', () => ({
  balanceApi: {
    getBalance: mocks.getBalance,
    getTransactions: mocks.getTransactions,
    getPaymentMethods: mocks.getPaymentMethods,
  },
}));
vi.mock('../api/promo', () => ({
  promoApi: {
    getLoyaltyTiers: mocks.getLoyaltyTiers,
  },
}));
vi.mock('../hooks/useCurrency', () => ({
  useCurrency: () => ({
    formatAmount: (amount: number) => String(amount),
    currencySymbol: '₽',
  }),
}));

vi.mock('../store/auth', () => ({
  useAuthStore: (selector: (state: unknown) => unknown) =>
    selector({
      user: {
        id: 17,
        telegram_id: 70017,
        username: 'api_user',
        first_name: 'API',
        last_name: 'User',
        email: 'api@example.test',
        email_verified: true,
        balance_kopeks: 32100,
        balance_rubles: 321,
        referral_code: null,
        language: 'ru',
        created_at: '2026-09-01T00:00:00Z',
        auth_type: 'telegram',
      },
      setUser: mocks.setUser,
    }),
}));
vi.mock('../api/referral', () => ({
  referralApi: {
    getReferralInfo: mocks.getReferralInfo,
    getReferralTerms: mocks.getReferralTerms,
  },
}));
vi.mock('../api/branding', () => ({
  brandingApi: {
    getBranding: mocks.getBranding,
    getEmailAuthEnabled: mocks.getEmailAuthEnabled,
  },
}));
vi.mock('../api/notifications', () => ({
  notificationsApi: {
    getSettings: mocks.getSettings,
    updateSettings: mocks.updateSettings,
  },
}));
vi.mock('../api/auth', () => ({
  authApi: {
    getMe: mocks.getMe,
    resendVerification: mocks.resendVerification,
    requestEmailChange: mocks.requestEmailChange,
    verifyEmailChange: mocks.verifyEmailChange,
  },
}));
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: unknown) => (typeof fallback === 'string' ? fallback : key),
  }),
}));
vi.mock('../components/TicketNotificationBell', () => ({ default: () => null }));
vi.mock('@/platform', () => ({
  usePlatform: () => ({
    platform: 'web',
    openTelegramLink: vi.fn(),
    haptic: { impact: vi.fn() },
  }),
}));

function renderProfile(initialEntry = '/profile') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <QueryClientProvider
        client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
      >
        <Profile />
        <LocationProbe />
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="location">{location.pathname}</output>;
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.getBalance.mockResolvedValue({ balance_kopeks: 32100, balance_rubles: 321 });
  mocks.getTransactions.mockResolvedValue({
    items: [],
    page: 1,
    pages: 1,
    total: 0,
    per_page: 4,
  });
  mocks.getPaymentMethods.mockResolvedValue([]);
  mocks.getLoyaltyTiers.mockResolvedValue({
    tiers: [],
    current_spent_rubles: 3200,
    current_tier_name: 'Friends',
    next_tier_name: 'VIP',
    next_tier_threshold_rubles: 5000,
    progress_percent: 64,
  });
  mocks.getReferralInfo.mockResolvedValue(null);
  mocks.getReferralTerms.mockResolvedValue({ is_enabled: false });
  mocks.getBranding.mockResolvedValue({ name: 'Configured Cabinet' });
  mocks.getEmailAuthEnabled.mockResolvedValue({ enabled: true, verification_enabled: true });
  mocks.getSettings.mockResolvedValue({
    subscription_expiry_enabled: true,
    subscription_expiry_days: 3,
    traffic_warning_enabled: false,
    traffic_warning_percent: 80,
    balance_low_enabled: true,
    balance_low_threshold: 100,
    news_enabled: true,
    promo_offers_enabled: false,
  });
  mocks.updateSettings.mockResolvedValue({});
  mocks.requestEmailChange.mockResolvedValue({
    message: 'sent',
    new_email: 'new@example.test',
    expires_in_minutes: 10,
  });
  mocks.verifyEmailChange.mockResolvedValue({ message: 'changed', email: 'new@example.test' });
  mocks.getMe.mockResolvedValue({
    id: 17,
    telegram_id: 70017,
    username: 'api_user',
    first_name: 'API',
    last_name: 'User',
    email: 'new@example.test',
    email_verified: true,
    balance_kopeks: 32100,
    balance_rubles: 321,
    referral_code: null,
    language: 'ru',
    created_at: '2026-09-01T00:00:00Z',
    auth_type: 'telegram',
  });
});

afterEach(cleanup);

describe('Profile target data presentation', () => {
  it('keeps the top-up hash on the profile surface', async () => {
    renderProfile('/profile#top-up');

    await waitFor(() => expect(screen.getByTestId('location').textContent).toBe('/profile'));
    expect(document.getElementById('top-up')).toBeTruthy();
  });

  it('puts live balance and loyalty before account details with discoverable routes', async () => {
    renderProfile();

    const balance = await screen.findByText((_, element) => element?.textContent === '321 ₽');
    const overview = screen.getByTestId('profile-financial-overview');
    const accountInfo = screen.getByText('profile.accountInfo').closest('.glass-surface');
    if (!accountInfo) throw new Error('account info card is missing');

    expect(balance).toBeTruthy();
    expect(screen.getByText('Friends')).toBeTruthy();
    expect(screen.getByRole('progressbar', { name: 'info.yourProgress' })).toBeTruthy();
    expect(overview.compareDocumentPosition(accountInfo)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);

    expect(document.getElementById('top-up')?.querySelector('button')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'balance.topUpBalance' })).toBeNull();
  });

  it('routes transaction history to the balance owner', async () => {
    renderProfile();

    fireEvent.click(await screen.findByRole('button', { name: 'balance.transactionHistory' }));
    expect(screen.getByTestId('location').textContent).toBe('/balance');
  });

  it('falls back safely when balance or loyalty values are malformed', async () => {
    mocks.getBalance.mockResolvedValue({ balance_kopeks: 32100, balance_rubles: Number.NaN });
    mocks.getLoyaltyTiers.mockResolvedValue({
      tiers: [],
      current_spent_rubles: Number.NaN,
      current_tier_name: 'Friends',
      next_tier_name: 'VIP',
      next_tier_threshold_rubles: Number.POSITIVE_INFINITY,
      progress_percent: Number.NaN,
    });

    renderProfile();

    const overview = await screen.findByTestId('profile-financial-overview');
    expect(await screen.findByText('common.noData')).toBeTruthy();
    expect(await screen.findByText('info.noLoyaltyTiers')).toBeTruthy();
    expect(overview.innerHTML).not.toMatch(/NaN|Infinity/);
  });

  it('falls back safely when financial payloads are empty', async () => {
    mocks.getBalance.mockResolvedValue({});
    mocks.getLoyaltyTiers.mockResolvedValue({});

    renderProfile();

    const overview = await screen.findByTestId('profile-financial-overview');
    expect(await screen.findByText('common.noData')).toBeTruthy();
    expect(await screen.findByText('info.noLoyaltyTiers')).toBeTruthy();
    expect(overview.innerHTML).not.toMatch(/NaN|Infinity/);
  });

  it('shows explicit errors when balance and loyalty requests fail', async () => {
    mocks.getBalance.mockRejectedValue(new Error('balance unavailable'));
    mocks.getLoyaltyTiers.mockRejectedValue(new Error('loyalty unavailable'));

    renderProfile();

    expect(await screen.findByText('common.error')).toBeTruthy();
    expect(await screen.findByText('subscription.promoGroup.error')).toBeTruthy();
  });

  it('renders the target user and account action in glass panels', async () => {
    renderProfile();

    expect(await screen.findByText('@api_user')).toBeTruthy();
    expect(screen.getByText('profile.accountInfo').closest('.glass-surface')).toBeTruthy();
    expect(
      screen.getByText('profile.accounts.goToAccounts').closest('.glass-surface'),
    ).toBeTruthy();
  });

  it('does not render a fixed source balance', async () => {
    renderProfile();

    await screen.findByText('@api_user');
    expect(screen.queryByText(/2490|2 490|2000|2 000/)).toBeNull();
  });

  it('opens connected accounts through a focusable native button', async () => {
    renderProfile();

    const accountButton = await screen.findByRole('button', {
      name: /profile.accounts.goToAccounts/,
    });
    accountButton.focus();
    expect(document.activeElement).toBe(accountButton);
    expect(accountButton.tagName).toBe('BUTTON');
  });

  it('preserves the request and verify email-change mutations', async () => {
    renderProfile();

    fireEvent.click(await screen.findByRole('button', { name: 'profile.changeEmail.button' }));
    fireEvent.change(screen.getByPlaceholderText('new@email.com'), {
      target: { value: 'new@example.test' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'profile.changeEmail.sendCode' }));

    await waitFor(() => expect(mocks.requestEmailChange).toHaveBeenCalledWith('new@example.test'));
    fireEvent.change(await screen.findByPlaceholderText('000000'), {
      target: { value: '123456' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'profile.changeEmail.verify' }));

    await waitFor(() => expect(mocks.verifyEmailChange).toHaveBeenCalledWith('123456'));
    await waitFor(() =>
      expect(mocks.setUser).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'new@example.test',
        }),
      ),
    );
  });
});
