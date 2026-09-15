// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import PurchaseSuccess from './PurchaseSuccess';
import GiftClaim from './GiftClaim';
import CouponStatus from './CouponStatus';
import AutoLogin from './AutoLogin';
import PublicLegal from './PublicLegal';
import LegalFooter from '../components/LegalFooter';

const mocks = vi.hoisted(() => ({
  getPurchaseStatus: vi.fn(),
  activatePurchase: vi.fn(),
  getGiftClaim: vi.fn(),
  claimGift: vi.fn(),
  getCouponStatus: vi.fn(),
  redeemCoupon: vi.fn(),
  autoLogin: vi.fn(),
  getPublicOffer: vi.fn(),
  getPrivacyPolicy: vi.fn(),
  getRecurrentPayments: vi.fn(),
  copyToClipboard: vi.fn(),
  auth: {
    isAuthenticated: false,
    setTokens: vi.fn(),
    setUser: vi.fn(),
    checkAdminStatus: vi.fn(),
  },
}));

vi.mock('../api/landings', () => ({
  landingApi: {
    getPurchaseStatus: mocks.getPurchaseStatus,
    activatePurchase: mocks.activatePurchase,
    getGiftClaim: mocks.getGiftClaim,
    claimGift: mocks.claimGift,
  },
}));
vi.mock('../api/coupons', () => ({
  couponsApi: {
    getCouponStatus: mocks.getCouponStatus,
    redeemCoupon: mocks.redeemCoupon,
  },
}));
vi.mock('../api/auth', () => ({ authApi: { autoLogin: mocks.autoLogin } }));
vi.mock('../api/info', () => ({
  infoApi: {
    getPublicOffer: mocks.getPublicOffer,
    getPrivacyPolicy: mocks.getPrivacyPolicy,
    getRecurrentPayments: mocks.getRecurrentPayments,
  },
}));
vi.mock('../store/auth', () => ({
  useAuthStore: (selector?: (state: typeof mocks.auth) => unknown) =>
    selector ? selector(mocks.auth) : mocks.auth,
}));
vi.mock('../utils/clipboard', () => ({ copyToClipboard: mocks.copyToClipboard }));
vi.mock('../utils/format', () => ({
  formatShortDate: (date: string | null) => date ?? '-',
}));
vi.mock('../components/LanguageSwitcher', () => ({ default: () => null }));
vi.mock('@/components/icons', () => {
  const Icon = () => <span aria-hidden="true" />;
  return {
    CheckIcon: Icon,
    CheckCircleIcon: Icon,
    ClipboardIcon: Icon,
    ClockIcon: Icon,
    CopyIcon: Icon,
    ExclamationIcon: Icon,
    TicketIcon: Icon,
    XIcon: Icon,
  };
});
vi.mock('@/components/ui/Spinner', () => ({ Spinner: () => <span role="status" /> }));
vi.mock('@/components/ui/AnimatedCheckmark', () => ({
  AnimatedCheckmark: () => <span data-testid="success-mark" />,
}));
vi.mock('@/components/ui/AnimatedCrossmark', () => ({
  AnimatedCrossmark: () => <span data-testid="error-mark" />,
}));
vi.mock('@/components/ui/skeleton', () => ({
  Skeleton: () => <span role="status" />,
  SkeletonGroup: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock('qrcode.react', () => ({
  QRCodeSVG: ({ value }: { value: string }) => <output data-testid="qr">{value}</output>,
}));
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: unknown) => (typeof fallback === 'string' ? fallback : key),
  }),
}));
vi.mock('framer-motion', () => ({
  motion: { div: ({ children }: { children: ReactNode }) => <div>{children}</div> },
  AnimatePresence: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="location">{location.pathname + location.search}</output>;
}

function renderRoute(initialEntry: string, routes: ReactNode, locationProbe = true) {
  return render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <MemoryRouter initialEntries={[initialEntry]}>
        {routes}
        {locationProbe && <LocationProbe />}
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function renderPurchase(initialEntry = '/buy/success/purchase-token') {
  return renderRoute(
    initialEntry,
    <Routes>
      <Route path="/buy/success/:token" element={<PurchaseSuccess />} />
    </Routes>,
  );
}

function renderGift(initialEntry = '/buy/gift/gift-token') {
  return renderRoute(
    initialEntry,
    <Routes>
      <Route path="/buy/gift/:token" element={<GiftClaim />} />
      <Route path="/auto-login" element={<div data-testid="auto-login-route" />} />
    </Routes>,
  );
}

function renderCoupon() {
  return renderRoute(
    '/coupon/coupon-token',
    <Routes>
      <Route path="/coupon/:token" element={<CouponStatus />} />
    </Routes>,
    false,
  );
}

function renderAutoLogin() {
  return renderRoute(
    '/auto-login?token=login-token',
    <Routes>
      <Route path="/auto-login" element={<AutoLogin />} />
      <Route path="/dashboard" element={<div data-testid="dashboard-route" />} />
      <Route path="/login" element={<div data-testid="login-route" />} />
    </Routes>,
  );
}

function purchaseStatus(overrides: Record<string, unknown> = {}) {
  return {
    status: 'pending' as const,
    subscription_url: null,
    subscription_crypto_link: null,
    is_gift: false,
    contact_value: 'buyer@example.com',
    recipient_contact_value: null,
    period_days: 30,
    tariff_name: 'API tariff',
    gift_message: null,
    contact_type: 'email' as const,
    cabinet_email: null,
    cabinet_password: null,
    auto_login_token: null,
    recipient_in_bot: null,
    bot_link: null,
    is_claimable: false,
    claim_url: null,
    bot_claim_link: null,
    ...overrides,
  };
}

function giftStatus(overrides: Record<string, unknown> = {}) {
  return purchaseStatus({
    status: 'paid',
    is_gift: true,
    is_claimable: true,
    tariff_name: 'Gift tariff',
    bot_claim_link: 'javascript:alert(1)',
    ...overrides,
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.auth.isAuthenticated = false;
  mocks.auth.checkAdminStatus.mockResolvedValue(undefined);
  mocks.autoLogin.mockResolvedValue({
    access_token: 'access-token',
    refresh_token: 'refresh-token',
    user: { id: 1 },
  });
  mocks.getPublicOffer.mockResolvedValue({ content: '<p>Offer</p>', updated_at: null });
  mocks.getPrivacyPolicy.mockResolvedValue({ content: '<p>Privacy</p>', updated_at: null });
  mocks.getRecurrentPayments.mockResolvedValue({ content: '<p>Recurring</p>', updated_at: null });
  mocks.copyToClipboard.mockResolvedValue(undefined);
});

afterEach(() => cleanup());

describe('PurchaseSuccess', () => {
  it('keeps the purchase token through pending, failed, and delivered states', async () => {
    mocks.getPurchaseStatus.mockResolvedValueOnce(purchaseStatus({ status: 'pending' }));
    renderPurchase();
    expect(await screen.findByText('Awaiting payment')).toBeTruthy();
    expect(mocks.getPurchaseStatus).toHaveBeenCalledWith('purchase-token');

    cleanup();
    mocks.getPurchaseStatus.mockResolvedValueOnce(purchaseStatus({ status: 'failed' }));
    renderPurchase();
    expect(await screen.findByText('landing.purchaseFailed')).toBeTruthy();

    cleanup();
    mocks.getPurchaseStatus.mockResolvedValueOnce(
      purchaseStatus({ status: 'delivered', subscription_url: 'https://sub.example/abc' }),
    );
    renderPurchase();
    expect((await screen.findByTestId('qr')).textContent).toContain('https://sub.example/abc');
  });

  it('activates a pending purchase with the route token and renders the result', async () => {
    mocks.getPurchaseStatus.mockResolvedValue(purchaseStatus({ status: 'pending_activation' }));
    mocks.activatePurchase.mockResolvedValue(
      purchaseStatus({ status: 'delivered', subscription_url: 'https://sub.example/activated' }),
    );

    renderPurchase('/buy/success/purchase-token?activate=1');
    fireEvent.click(await screen.findByRole('button', { name: 'landing.activateNow' }));

    await waitFor(() => expect(mocks.activatePurchase).toHaveBeenCalledWith('purchase-token'));
    expect((await screen.findByTestId('qr')).textContent).toContain(
      'https://sub.example/activated',
    );
  });

  it('does not render unsafe gift or subscription URLs from the API', async () => {
    mocks.getPurchaseStatus.mockResolvedValue(
      giftStatus({
        claim_url: 'javascript:alert(1)',
        bot_claim_link: 'data:text/html,bad',
        subscription_url: 'javascript:alert(1)',
        subscription_crypto_link: 'data:text/html,bad',
        bot_link: 'javascript:alert(1)',
      }),
    );

    renderPurchase();

    expect(await screen.findByText('Gift is ready!')).toBeTruthy();
    expect(screen.queryByTestId('qr')).toBeNull();
    expect(screen.queryAllByText(/javascript:|data:text/)).toHaveLength(0);
    expect(screen.queryByRole('link')).toBeNull();
  });
});

describe('GiftClaim', () => {
  it('retains the gift token when claiming by email and hands off auto-login', async () => {
    mocks.getGiftClaim.mockResolvedValue(giftStatus());
    mocks.claimGift.mockResolvedValue({
      status: 'delivered',
      tariff_name: 'Gift tariff',
      period_days: 30,
      subscription_url: 'https://sub.example/gift',
      subscription_crypto_link: null,
      auto_login_token: 'gift-login-token',
    });

    renderGift();
    fireEvent.click(await screen.findByRole('button', { name: 'Activate by email' }));
    fireEvent.change(screen.getByLabelText('Your email'), {
      target: { value: 'recipient@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Get my gift' }));

    await waitFor(() =>
      expect(mocks.claimGift).toHaveBeenCalledWith('gift-token', 'recipient@example.com'),
    );
    expect(await screen.findByTestId('auto-login-route')).toBeTruthy();
  });

  it('drops unsafe Telegram and subscription links', async () => {
    mocks.getGiftClaim.mockResolvedValue(giftStatus());
    mocks.claimGift.mockResolvedValue({
      status: 'delivered',
      tariff_name: 'Gift tariff',
      period_days: 30,
      subscription_url: 'javascript:alert(1)',
      subscription_crypto_link: null,
      auto_login_token: null,
    });

    renderGift();
    expect(await screen.findByText('You have a gift!')).toBeTruthy();
    expect(screen.queryByRole('link', { name: 'Activate in Telegram' })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Activate by email' }));
    fireEvent.change(screen.getByLabelText('Your email'), {
      target: { value: 'recipient@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Get my gift' }));

    await waitFor(() => expect(screen.getByText('Gift activated!')).toBeTruthy());
    expect(screen.queryByText('javascript:alert(1)')).toBeNull();
  });
});

describe('CouponStatus', () => {
  it('keeps the public coupon state but does not render an unsafe bot URL', async () => {
    mocks.getCouponStatus.mockResolvedValue({
      tariff_name: 'Coupon tariff',
      period_days: 30,
      valid_until: null,
      bot_link: 'javascript:alert(1)',
    });

    renderCoupon();

    expect(await screen.findByText('Coupon tariff')).toBeTruthy();
    expect(screen.queryByRole('link', { name: 'coupon.openBot' })).toBeNull();
  });

  it('redeems the API coupon with its route token for an authenticated user', async () => {
    mocks.auth.isAuthenticated = true;
    mocks.getCouponStatus.mockResolvedValue({
      tariff_name: 'Coupon tariff',
      period_days: 30,
      valid_until: null,
      bot_link: 'https://t.me/example_bot',
    });
    mocks.redeemCoupon.mockResolvedValue({
      success: true,
      tariff_name: 'Coupon tariff',
      period_days: 30,
      renewed: false,
      end_date: null,
    });

    renderCoupon();
    fireEvent.click(await screen.findByRole('button', { name: 'coupon.redeemCabinet' }));

    await waitFor(() => expect(mocks.redeemCoupon).toHaveBeenCalledWith('coupon-token'));
    expect(await screen.findByText('coupon.success.activated')).toBeTruthy();
  });
});

describe('AutoLogin', () => {
  it('stores the target session and navigates to the dashboard', async () => {
    renderAutoLogin();

    await waitFor(() => expect(mocks.autoLogin).toHaveBeenCalledWith('login-token'));
    expect(await screen.findByTestId('dashboard-route')).toBeTruthy();
    expect(mocks.auth.setTokens).toHaveBeenCalledWith('access-token', 'refresh-token');
    expect(mocks.auth.setUser).toHaveBeenCalledWith({ id: 1 });
  });

  it('offers a login fallback after a failed auto-login', async () => {
    mocks.autoLogin.mockRejectedValue(new Error('expired'));

    renderAutoLogin();
    expect(await screen.findByText('landing.autoLoginFailed')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Login' }));
    expect(await screen.findByTestId('login-route')).toBeTruthy();
  });
});

describe('PublicLegal and LegalFooter', () => {
  it.each([
    ['/offer', 'Оферта'],
    ['/privacy', 'Политика'],
    ['/recurrent-payments', 'Рекуррентные платежи'],
  ])('exposes source-equivalent legal navigation on %s', (path, activeLabel) => {
    renderRoute(
      path,
      <Routes>
        <Route path="/offer" element={<PublicLegal doc="offer" />} />
        <Route path="/privacy" element={<PublicLegal doc="privacy" />} />
        <Route path="/recurrent-payments" element={<PublicLegal doc="recurrent" />} />
      </Routes>,
      false,
    );

    const navigation = screen.getByRole('navigation', { name: 'Разделы информации' });
    const links = within(navigation).getAllByRole('link');

    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/info?tab=faq',
      '/info?tab=rules',
      '/privacy',
      '/offer',
      '/recurrent-payments',
    ]);
    expect(navigation.className).toContain('overflow-x-auto');
    expect(links.every((link) => link.className.includes('shrink-0'))).toBe(true);
    expect(
      within(navigation).getByRole('link', { name: activeLabel }).getAttribute('aria-current'),
    ).toBe('page');
  });

  it('sanitizes API legal HTML while keeping the public document readable', async () => {
    mocks.getPublicOffer.mockResolvedValue({
      content:
        '<p>Safe legal text</p><script>alert(1)</script><a href="javascript:alert(1)">bad</a><a href="https://example.test">good</a>',
      updated_at: null,
    });

    renderRoute(
      '/offer',
      <Routes>
        <Route path="/offer" element={<PublicLegal doc="offer" />} />
      </Routes>,
      false,
    );

    expect(await screen.findByText('Safe legal text')).toBeTruthy();
    expect(document.querySelector('script')).toBeNull();
    expect(document.querySelector('a[href^="javascript:"]')).toBeNull();
    expect(screen.getByRole('link', { name: 'good' }).getAttribute('href')).toBe(
      'https://example.test',
    );
  });

  it('keeps the three public legal footer routes stable', () => {
    renderRoute('/login', <LegalFooter />, false);

    expect(screen.getAllByRole('link').map((link) => link.getAttribute('href'))).toEqual([
      '/offer',
      '/privacy',
      '/recurrent-payments',
    ]);
  });
});
