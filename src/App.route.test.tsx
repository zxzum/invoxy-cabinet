// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes, useLocation, useNavigationType } from 'react-router';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { auth, authApi, blocking, landingApi, permissions, translation } = vi.hoisted(() => ({
  auth: {
    state: {
      isAuthenticated: false,
      isLoading: false,
      isAdmin: false,
      loginWithTelegram: vi.fn(),
      loginWithEmail: vi.fn(),
      registerWithEmail: vi.fn(),
      loginWithTelegramWidget: vi.fn(),
      loginWithOAuth: vi.fn(),
      setTokens: vi.fn(),
      setUser: vi.fn(),
      checkAdminStatus: vi.fn().mockResolvedValue(undefined),
    },
  },
  authApi: {
    getOAuthProviders: vi.fn(),
    forgotPassword: vi.fn(),
    verifyEmail: vi.fn(),
    autoLogin: vi.fn(),
    linkProviderCallback: vi.fn(),
  },
  blocking: {
    state: { blockingType: null as string | null },
  },
  landingApi: {
    getPurchaseStatus: vi.fn(),
    activatePurchase: vi.fn(),
  },
  permissions: {
    state: {
      isLoaded: true,
      hasPermission: () => true,
      hasAnyPermission: () => true,
      hasAllPermissions: () => true,
    },
  },
  translation: {
    t: (key: string, fallback?: unknown) => (typeof fallback === 'string' ? fallback : key),
    i18n: { language: 'ru', changeLanguage: () => Promise.resolve() },
  },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => translation,
  initReactI18next: { type: '3rdParty', init: () => {} },
}));

vi.mock('./store/auth', () => ({
  useAuthStore: (selector?: (state: typeof auth.state) => unknown) =>
    selector ? selector(auth.state) : auth.state,
}));

vi.mock('./store/permissions', () => ({
  usePermissionStore: (selector: (state: typeof permissions.state) => unknown) =>
    selector(permissions.state),
}));

vi.mock('./store/blocking', () => ({
  useBlockingStore: (selector: (state: typeof blocking.state) => unknown) =>
    selector(blocking.state),
}));

vi.mock('./hooks/useAnalyticsCounters', () => ({ useAnalyticsCounters: () => {} }));
vi.mock('./hooks/useSiteVerification', () => ({ useSiteVerification: () => {} }));
vi.mock('./hooks/useDoneKey', () => ({ useDoneKey: () => {} }));
vi.mock('./hooks/useTelegramSDK', () => ({
  isInTelegramWebApp: () => false,
  getTelegramInitData: () => null,
  useTelegramSDK: () => ({
    safeAreaInset: { top: 0, bottom: 0 },
    contentSafeAreaInset: { top: 0, bottom: 0 },
  }),
}));

vi.mock('./hooks/useLegalConsentGate', () => ({
  useLegalConsentGate: () => ({
    pending: false,
    capture: () => false,
    acceptedKeys: [],
    documents: [],
    accepted: {},
    toggle: vi.fn(),
    allAccepted: true,
  }),
}));

vi.mock('./api/auth', () => ({
  authApi,
}));

vi.mock('./api/landings', () => ({ landingApi }));

vi.mock('./api/branding', () => ({
  brandingApi: {
    getBranding: vi.fn().mockResolvedValue(null),
    getEmailAuthEnabled: vi.fn().mockResolvedValue({ enabled: true }),
    getFooterEnabled: vi.fn().mockResolvedValue(false),
    getTelegramWidgetConfig: vi.fn().mockResolvedValue(null),
  },
  getCachedBranding: () => null,
  setCachedBranding: () => {},
  preloadLogo: vi.fn(),
  isLogoPreloaded: () => false,
  getLogoUrl: () => null,
}));

vi.mock('./api/info', () => ({
  infoApi: {
    getLegalConsentConfig: vi.fn().mockResolvedValue(null),
    getPublicOffer: vi.fn().mockResolvedValue({ content: '<p>Offer</p>', updated_at: null }),
    getPrivacyPolicy: vi.fn().mockResolvedValue({ content: '<p>Privacy</p>', updated_at: null }),
    getRecurrentPayments: vi
      .fn()
      .mockResolvedValue({ content: '<p>Recurring</p>', updated_at: null }),
  },
}));

vi.mock('./api/news', () => ({
  newsApi: {
    getNews: vi.fn().mockResolvedValue({
      items: [
        {
          id: 1,
          title: 'Route article',
          slug: 'route-article',
          excerpt: null,
          category: 'updates',
          category_color: '#a5e8c4',
          category_id: null,
          tag: null,
          tag_id: null,
          featured_image_url: null,
          is_published: true,
          is_featured: false,
          published_at: null,
          read_time_minutes: 1,
          views_count: 0,
        },
      ],
      total: 1,
      categories: [],
    }),
    getArticle: vi.fn(),
  },
}));

vi.mock('./components/LanguageSwitcher', () => ({ default: () => null }));
vi.mock('./components/TelegramLoginButton', () => ({ default: () => null }));
vi.mock('./components/OAuthProviderIcon', () => ({ default: () => null }));
vi.mock('./components/auth/CheckEmailCard', () => ({ CheckEmailCard: () => null }));
vi.mock('./components/LegalFooter', () => ({ default: () => null }));
vi.mock('./components/LegalConsent', () => ({ default: () => null }));
vi.mock('./components/LegalConsentGate', () => ({ default: () => null }));

vi.mock('./components/layout/Layout', () => ({
  default: ({ children }: { children: ReactNode }) => <div data-testid="layout">{children}</div>,
}));
vi.mock('./components/layout/MainPagesReady', () => ({
  MainPagesReady: ({ children }: { children: ReactNode }) => <>{children}</>,
}));
vi.mock('./components/common/PageLoader', () => ({
  default: () => <div data-testid="page-loader" />,
}));
vi.mock('./components/backgrounds/BackgroundHost', () => ({
  BackgroundHost: () => null,
}));
vi.mock('./components/blocking', () => ({
  MaintenanceScreen: () => <div data-testid="maintenance-screen" />,
  ChannelSubscriptionScreen: () => <div data-testid="channel-screen" />,
  BlacklistedScreen: () => <div data-testid="blacklisted-screen" />,
  AccountDeletedScreen: () => <div data-testid="account-deleted-screen" />,
  ServiceUnavailableScreen: () => <div data-testid="service-unavailable-screen" />,
}));
vi.mock('./components/ErrorBoundary', () => ({
  ErrorBoundary: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock('./pages/Landing', () => ({
  default: () => <div data-testid="landing-page">landing</div>,
}));
vi.mock('./pages/Dashboard', () => ({
  default: () => <div data-testid="dashboard-page">dashboard</div>,
}));
vi.mock('./pages/SubscriptionPurchase', () => ({
  default: () => <div data-testid="subscription-purchase-page">subscription purchase</div>,
}));
vi.mock('./pages/Connection', () => ({ default: () => <div data-testid="connection-page" /> }));
vi.mock('./pages/Profile', () => ({ default: () => <div data-testid="profile-page" /> }));
vi.mock('./pages/Subscriptions', () => ({
  default: () => <div data-testid="subscriptions-page">subscriptions</div>,
}));
vi.mock('./pages/Subscription', () => ({
  default: () => <div data-testid="subscription-page">subscription</div>,
}));
vi.mock('./pages/SavedCards', () => ({
  default: () => <div data-testid="saved-cards-page">saved cards</div>,
}));
vi.mock('./pages/Referral', () => ({ default: () => <div data-testid="referral-page" /> }));
vi.mock('./components/news/NewsSection', () => ({
  default: () => <div data-testid="news-page">news</div>,
}));
vi.mock('./pages/ConnectedAccounts', () => ({
  default: () => <div data-testid="accounts-page">accounts</div>,
}));

function LocationProbe() {
  const location = useLocation();
  const navigationType = useNavigationType();
  const from = (location.state as { from?: string } | null)?.from;
  return (
    <output data-testid="location" data-from={from ?? ''}>
      {location.pathname}
      {location.search}
      {location.hash}[{navigationType}]
    </output>
  );
}

async function renderApp(initialEntry: string) {
  const { default: App } = await import('./App');
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <App />
        <LocationProbe />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function renderPage(element: ReactNode, initialEntry: string) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      {element}
      <LocationProbe />
    </MemoryRouter>,
  );
}

const protectedAdminRoutes = [
  '/admin',
  '/admin/tickets',
  '/admin/tickets/settings',
  '/admin/tickets/:ticketId',
  '/admin/settings',
  '/admin/grace-access',
  '/admin/apps',
  '/admin/wheel',
  '/admin/tariffs',
  '/admin/tariffs/create',
  '/admin/tariffs/:id/edit',
  '/admin/landings',
  '/admin/landings/create',
  '/admin/landings/:id/edit',
  '/admin/landings/:id/stats',
  '/admin/servers',
  '/admin/servers/:id/edit',
  '/admin/dashboard',
  '/admin/ban-system',
  '/admin/reachability',
  '/admin/reachability/history',
  '/admin/reachability/other',
  '/admin/broadcasts',
  '/admin/broadcasts/create',
  '/admin/promocodes',
  '/admin/promocodes/create',
  '/admin/promocodes/:id/edit',
  '/admin/coupons',
  '/admin/coupons/create',
  '/admin/coupons/:id',
  '/admin/promocodes/:id/stats',
  '/admin/promo-groups',
  '/admin/promo-groups/create',
  '/admin/promo-groups/:id/edit',
  '/admin/campaigns',
  '/admin/campaigns/create',
  '/admin/campaigns/:id/stats',
  '/admin/campaigns/:id/edit',
  '/admin/partners',
  '/admin/partners/settings',
  '/admin/partners/referral-levels',
  '/admin/partners/applications/:id/review',
  '/admin/partners/:userId/commission',
  '/admin/partners/:userId/revoke',
  '/admin/partners/:userId/campaigns/assign',
  '/admin/partners/:userId',
  '/admin/withdrawals',
  '/admin/withdrawals/:id/reject',
  '/admin/withdrawals/:id',
  '/admin/users',
  '/admin/bulk-actions',
  '/admin/payments',
  '/admin/traffic-usage',
  '/admin/sales-stats',
  '/admin/referral-network',
  '/admin/payment-methods',
  '/admin/payment-methods/:methodId/edit',
  '/admin/promo-offers',
  '/admin/promo-offers/templates/:id/edit',
  '/admin/promo-offers/send',
  '/admin/remnawave',
  '/admin/remnawave/squads/:uuid',
  '/admin/email-templates',
  '/admin/updates',
  '/admin/users/:id',
  '/admin/broadcasts/:id',
  '/admin/pinned-messages',
  '/admin/pinned-messages/create',
  '/admin/pinned-messages/:id/edit',
  '/admin/channel-subscriptions',
  '/admin/roles',
  '/admin/roles/create',
  '/admin/roles/:id/edit',
  '/admin/roles/assign',
  '/admin/policies',
  '/admin/policies/create',
  '/admin/policies/:id/edit',
  '/admin/news',
  '/admin/news/create',
  '/admin/news/:id/edit',
  '/admin/info-pages',
  '/admin/info-pages/create',
  '/admin/info-pages/:id/edit',
  '/admin/legal-pages',
  '/admin/audit-log',
  '/admin/system-errors',
];

beforeEach(() => {
  auth.state.isAuthenticated = false;
  auth.state.isLoading = false;
  auth.state.isAdmin = false;
  blocking.state.blockingType = null;
  for (const mock of [
    auth.state.loginWithTelegram,
    auth.state.loginWithEmail,
    auth.state.registerWithEmail,
    auth.state.loginWithTelegramWidget,
    auth.state.loginWithOAuth,
    auth.state.setTokens,
    auth.state.setUser,
    auth.state.checkAdminStatus,
  ]) {
    mock.mockReset();
  }
  auth.state.checkAdminStatus.mockResolvedValue(undefined);
  for (const mock of Object.values(authApi)) mock.mockReset();
  authApi.getOAuthProviders.mockResolvedValue({ providers: [] });
  for (const mock of Object.values(landingApi)) mock.mockReset();
  sessionStorage.clear();
});

afterEach(() => cleanup());

describe('cabinet route boundary', () => {
  it('keeps the public root data-free for authenticated visitors', async () => {
    auth.state.isAuthenticated = true;

    await renderApp('/');

    expect(await screen.findByTestId('landing-page')).toBeTruthy();
    expect(screen.queryByTestId('dashboard-page')).toBeNull();
  });

  it('protects /dashboard and records the requested return path', async () => {
    await renderApp('/dashboard?tab=active#overview');

    expect(await screen.findByLabelText('auth.email')).toBeTruthy();
    expect(screen.getByTestId('location').textContent).toContain('/login[REPLACE]');
    expect(screen.getByTestId('location').getAttribute('data-from')).toBe(
      '/dashboard?tab=active#overview',
    );
  });

  it('renders Dashboard inside the authenticated shell', async () => {
    auth.state.isAuthenticated = true;

    await renderApp('/dashboard');

    expect(await screen.findByTestId('dashboard-page')).toBeTruthy();
    expect(screen.getByTestId('layout')).toBeTruthy();
  });

  it('renders the protected /news list route inside the authenticated shell', async () => {
    auth.state.isAuthenticated = true;

    await renderApp('/news');

    expect(await screen.findByTestId('news-page')).toBeTruthy();
    expect(screen.getByTestId('location').textContent).toContain('/news');
  });

  it('initializes Login in registration mode on /register', async () => {
    await renderApp('/register');

    expect(await screen.findByLabelText('First Name')).toBeTruthy();
  });

  it.each([
    ['/offer', 'Публичная оферта'],
    ['/privacy', 'Политика конфиденциальности'],
    ['/recurrent-payments', 'Рекуррентные платежи'],
  ])('keeps %s readable while blocking is active', async (path, title) => {
    blocking.state.blockingType = 'maintenance';

    await renderApp(path);

    expect(await screen.findByRole('heading', { name: title })).toBeTruthy();
    expect(screen.queryByTestId('maintenance-screen')).toBeNull();
  });

  it.each([
    [
      '/tariffs?ref=abc#plans',
      '/subscription/purchase?ref=abc#plans',
      'subscription-purchase-page',
    ],
    ['/referrals?ref=abc#referral', '/referral?ref=abc#referral', 'referral-page'],
    ['/partner?ref=abc#partner', '/referral?ref=abc#partner', 'referral-page'],
    [
      '/account/security?tab=oauth#accounts',
      '/profile/accounts?tab=oauth#accounts',
      'accounts-page',
    ],
    [
      '/profile/saved-cards?return=1#cards',
      '/balance/saved-cards?return=1#cards',
      'saved-cards-page',
    ],
    ['/saved-cards?return=1#cards', '/balance/saved-cards?return=1#cards', 'saved-cards-page'],
    ['/subscription?source=old#list', '/subscriptions?source=old#list', 'subscriptions-page'],
    [
      '/subscription/42?source=old#detail',
      '/subscriptions/42?source=old#detail',
      'subscription-page',
    ],
  ])('replaces %s with %s and preserves route state', async (from, to, pageTestId) => {
    auth.state.isAuthenticated = true;

    await renderApp(from);

    await waitFor(() =>
      expect(screen.getByTestId('location').textContent).toContain(`${to}[REPLACE]`),
    );
    expect(await screen.findByTestId(pageTestId)).toBeTruthy();
  });

  it('keeps every existing admin declaration behind the login boundary', async () => {
    for (const path of protectedAdminRoutes) {
      cleanup();
      await renderApp(path);
      await waitFor(() =>
        expect(screen.getByTestId('location').textContent).toContain('/login[REPLACE]'),
      );
    }
  });

  it('sends successful OAuth login to /dashboard', async () => {
    const { saveOAuthState } = await import('./utils/oauth');
    const { default: OAuthCallback } = await import('./pages/OAuthCallback');
    auth.state.loginWithOAuth.mockImplementation(async () => {
      auth.state.isAuthenticated = true;
    });
    saveOAuthState('login-state', 'github');

    renderPage(<OAuthCallback />, '/auth/oauth/callback?code=code&state=login-state');

    await waitFor(() => expect(auth.state.loginWithOAuth).toHaveBeenCalledOnce());
    await waitFor(() =>
      expect(screen.getByTestId('location').textContent).toContain('/dashboard[REPLACE]'),
    );
  });

  it('keeps successful OAuth account linking on /profile/accounts', async () => {
    const { saveLinkOAuthState } = await import('./utils/oauth');
    const { default: OAuthCallback } = await import('./pages/OAuthCallback');
    auth.state.isAuthenticated = true;
    authApi.linkProviderCallback.mockResolvedValue({ merge_required: false });
    saveLinkOAuthState('link-state', 'github');

    renderPage(<OAuthCallback />, '/auth/oauth/callback?code=code&state=link-state');

    await waitFor(() =>
      expect(screen.getByTestId('location').textContent).toContain('/profile/accounts[REPLACE]'),
    );
  });

  it('sends successful email verification to /dashboard', async () => {
    const { default: VerifyEmail } = await import('./pages/VerifyEmail');
    authApi.verifyEmail.mockResolvedValue({
      access_token: 'access',
      refresh_token: 'refresh',
      user: { id: 1 },
    });
    auth.state.setTokens.mockImplementation(() => {
      auth.state.isAuthenticated = true;
    });

    renderPage(<VerifyEmail />, '/verify-email?token=verify-token');

    await waitFor(
      () => expect(screen.getByTestId('location').textContent).toContain('/dashboard[REPLACE]'),
      { timeout: 2500 },
    );
  });

  it('sends successful auto-login to /dashboard', async () => {
    const { default: AutoLogin } = await import('./pages/AutoLogin');
    authApi.autoLogin.mockResolvedValue({
      access_token: 'access',
      refresh_token: 'refresh',
      user: { id: 1 },
    });
    auth.state.setTokens.mockImplementation(() => {
      auth.state.isAuthenticated = true;
    });

    renderPage(<AutoLogin />, '/auto-login?token=auto-token');

    await waitFor(() =>
      expect(screen.getByTestId('location').textContent).toContain('/dashboard[REPLACE]'),
    );
  });

  it('sends purchase auto-login to /dashboard', async () => {
    const { default: PurchaseSuccess } = await import('./pages/PurchaseSuccess');
    landingApi.getPurchaseStatus.mockResolvedValue({
      status: 'delivered',
      subscription_url: null,
      subscription_crypto_link: null,
      is_gift: false,
      contact_value: 'user@example.com',
      recipient_contact_value: null,
      period_days: 30,
      tariff_name: 'VPN',
      gift_message: null,
      contact_type: 'email',
      cabinet_email: 'user@example.com',
      cabinet_password: 'password',
      auto_login_token: 'auto-token',
      recipient_in_bot: null,
      bot_link: null,
      is_claimable: false,
      claim_url: null,
      bot_claim_link: null,
    });
    authApi.autoLogin.mockResolvedValue({
      access_token: 'access',
      refresh_token: 'refresh',
      user: { id: 1 },
    });
    auth.state.setTokens.mockImplementation(() => {
      auth.state.isAuthenticated = true;
    });
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/buy/success/purchase-token']}>
          <Routes>
            <Route path="/buy/success/:token" element={<PurchaseSuccess />} />
            <Route path="/dashboard" element={null} />
          </Routes>
          <LocationProbe />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    const goToCabinet = await screen.findByRole('button', { name: 'landing.goToCabinet' });
    await act(async () => {
      fireEvent.click(goToCabinet);
    });
    await waitFor(() => expect(authApi.autoLogin).toHaveBeenCalledOnce());
    await waitFor(() =>
      expect(screen.getByTestId('location').textContent).toContain('/dashboard[PUSH]'),
    );
  });

  it('keeps the unknown-route fallback at the public root', async () => {
    await renderApp('/not-a-real-route?source=unknown#top');

    await waitFor(() => expect(screen.getByTestId('location').textContent).toContain('/[REPLACE]'));
    expect(await screen.findByTestId('landing-page')).toBeTruthy();
  });
});
