// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Profile from './Profile';

const mocks = vi.hoisted(() => ({
  setUser: vi.fn(),
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
vi.mock('@/platform', () => ({
  usePlatform: () => ({ platform: 'web', openTelegramLink: vi.fn() }),
}));

function renderProfile() {
  return render(
    <MemoryRouter initialEntries={['/profile']}>
      <QueryClientProvider
        client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
      >
        <Profile />
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.resetAllMocks();
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
  mocks.getMe.mockResolvedValue({});
});

afterEach(cleanup);

describe('Profile target data presentation', () => {
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
});
