// @vitest-environment jsdom
// @vitest-environment-options {"url":"https://oauth.example.test/"}
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, cleanup, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CONSENT_DOCUMENTS, consentRequiredError } from '../test/consentRequiredError';

const { auth, authApi, brandingApi, infoApi, referral, translation, useAuthStore } = vi.hoisted(
  () => {
    const auth = {
      state: {
        isAuthenticated: false,
        isLoading: false,
        loginWithTelegram: vi.fn(),
        loginWithTelegramOIDC: vi.fn(),
        loginWithTelegramWidget: vi.fn(),
        loginWithDeepLink: vi.fn(),
        loginWithEmail: vi.fn(),
        registerWithEmail: vi.fn(),
      },
      telegram: { inTelegram: false, initData: null as string | null },
    };
    const useAuthStore = Object.assign(
      (selector?: (state: typeof auth.state) => unknown) =>
        selector ? selector(auth.state) : auth.state,
      { getState: () => auth.state },
    );

    return {
      auth,
      authApi: {
        getOAuthProviders: vi.fn(),
        getOAuthAuthorizeUrl: vi.fn(),
        forgotPassword: vi.fn(),
        requestDeepLinkToken: vi.fn(),
        pollDeepLinkToken: vi.fn(),
        resendVerificationPublic: vi.fn(),
      },
      brandingApi: {
        getBranding: vi.fn(),
        getEmailAuthEnabled: vi.fn(),
        getFooterEnabled: vi.fn(),
        getLogoUrl: vi.fn(),
        getTelegramWidgetConfig: vi.fn(),
      },
      infoApi: { getLegalConsentConfig: vi.fn() },
      referral: { code: '' },
      translation: {
        t: (key: string, fallback?: unknown) => {
          const values: Record<string, string> = {
            'auth.login': 'Login',
            'auth.register': 'Register',
            'auth.loginWithEmail': 'Login with Email',
            'auth.loginWithTelegram': 'Continue with Telegram',
            'auth.telegramNotConfigured': 'Telegram is not configured',
            'auth.email': 'Email',
            'auth.password': 'Password',
            'auth.loginTitle': 'Login to Cabinet',
            'auth.loginSubtitle': 'Sign in with Telegram or use your email',
            'auth.noAccount': "Don't have an account?",
            'auth.forgotPassword': 'Forgot password?',
            'auth.invalidEmail': 'Please enter a valid email address',
            'auth.invalidCredentials': 'Invalid email or password',
            'auth.referralInvite': 'You were invited',
            'auth.orOpenInApp': 'Open in Telegram',
            'auth.or': 'or',
            'auth.checkEmail': 'Check your email',
            'auth.verificationSent': 'We sent a verification email.',
            'auth.clickLinkToVerify': 'Click the link to verify.',
            'auth.spamHint': 'Check your spam folder.',
            'auth.legalConsentPrefix': 'I accept',
            'auth.legalConsentTitle': 'Legal consent',
            'auth.legalConsentSubtitle': 'Confirm the documents.',
            'auth.legalConsentContinue': 'Continue',
            'footer.offer': 'Offer',
            'footer.privacy': 'Privacy',
            'footer.recurrent': 'Recurring payments',
            'common.error': 'Something went wrong',
          };
          return values[key] ?? (typeof fallback === 'string' ? fallback : key);
        },
        i18n: { language: 'en' },
      },
      useAuthStore,
    };
  },
);

vi.mock('react-i18next', () => ({ useTranslation: () => translation }));
vi.mock('../store/auth', () => ({ useAuthStore }));
vi.mock('../api/auth', () => ({ authApi }));
vi.mock('../api/branding', () => ({
  brandingApi,
  getCachedBranding: () => null,
  setCachedBranding: vi.fn(),
  preloadLogo: vi.fn(),
  isLogoPreloaded: () => false,
}));
vi.mock('../api/info', () => ({ infoApi }));
vi.mock('../hooks/useTelegramSDK', () => ({
  isInTelegramWebApp: () => auth.telegram.inTelegram,
  getTelegramInitData: () => auth.telegram.initData,
  useTelegramSDK: () => ({
    safeAreaInset: { top: 0, bottom: 0 },
    contentSafeAreaInset: { top: 0, bottom: 0 },
  }),
}));
vi.mock('../utils/api-error', () => ({
  getApiErrorMessage: (error: { detail?: string }, fallback: string) => error.detail || fallback,
}));
vi.mock('../utils/referral', () => ({ getPendingReferralCode: () => referral.code }));
vi.mock('../utils/token', () => ({
  getAndClearReturnUrl: () => null,
  tokenStorage: { clearTokens: vi.fn() },
}));
vi.mock('@telegram-apps/sdk-react', () => ({ closeMiniApp: vi.fn() }));
vi.mock('../components/LanguageSwitcher', () => ({ default: () => null }));

const { default: Login } = await import('./Login');

const TELEGRAM_SCRIPT_ID = 'telegram-login-oidc-script';

function installTelegramLoginStub() {
  let callback: ((data: { id_token?: string; error?: string }) => void) | undefined;
  const init = vi.fn((_config: unknown, next: typeof callback) => {
    callback = next;
  });
  const open = vi.fn(() => callback?.({ id_token: 'telegram-token' }));

  (window as unknown as { Telegram: unknown }).Telegram = { Login: { init, open } };
  const script = document.createElement('script');
  script.id = TELEGRAM_SCRIPT_ID;
  document.head.appendChild(script);

  return { init, open };
}

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="location">{location.pathname}</output>;
}

function renderLogin(initialEntry: string | { pathname: string; state?: unknown } = '/login') {
  return render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <MemoryRouter initialEntries={[initialEntry]}>
        <Login />
        <LocationProbe />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function fillLoginForm(email = 'user@example.com', password = 'password123') {
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: email } });
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: password } });
}

beforeEach(() => {
  auth.state.isAuthenticated = false;
  auth.state.isLoading = false;
  auth.state.loginWithTelegram.mockReset();
  auth.state.loginWithTelegramOIDC.mockReset().mockResolvedValue(undefined);
  auth.state.loginWithTelegramWidget.mockReset();
  auth.state.loginWithDeepLink.mockReset();
  auth.state.loginWithEmail.mockReset().mockResolvedValue(undefined);
  auth.state.registerWithEmail.mockReset();
  auth.telegram.inTelegram = false;
  auth.telegram.initData = null;
  authApi.getOAuthProviders.mockReset().mockResolvedValue({ providers: [] });
  authApi.getOAuthAuthorizeUrl.mockReset();
  authApi.forgotPassword.mockReset();
  authApi.requestDeepLinkToken.mockReset();
  authApi.pollDeepLinkToken.mockReset();
  authApi.resendVerificationPublic.mockReset();
  brandingApi.getBranding.mockReset().mockResolvedValue(null);
  brandingApi.getEmailAuthEnabled.mockReset().mockResolvedValue({ enabled: true });
  brandingApi.getFooterEnabled.mockReset().mockResolvedValue(false);
  brandingApi.getLogoUrl.mockReset().mockReturnValue(null);
  brandingApi.getTelegramWidgetConfig.mockReset().mockResolvedValue({
    bot_username: '',
    size: 'large',
    radius: 20,
    userpic: true,
    request_access: false,
    oidc_enabled: false,
    oidc_client_id: '',
  });
  infoApi.getLegalConsentConfig.mockReset().mockResolvedValue(null);
  referral.code = '';
  sessionStorage.clear();
});

afterEach(() => {
  cleanup();
  document.getElementById(TELEGRAM_SCRIPT_ID)?.remove();
  (window as unknown as { Telegram?: unknown }).Telegram = undefined;
});

describe('Login visual shell', () => {
  it('uses the compact auth shell and removes the old accordion and tabs', async () => {
    renderLogin();

    const main = screen.getByRole('main');
    expect(main.className).toContain('auth-page');
    expect(main.querySelector('.glass-panel')).toBeTruthy();
    expect(main.querySelectorAll('.glass-control')).toHaveLength(2);
    expect(main.querySelector('button.bg-mint')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Login to Cabinet' })).toBeTruthy();
    expect(screen.getByText('Sign in with Telegram or use your email')).toBeTruthy();
    expect(screen.getByText('Telegram is not configured')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Register' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Login with Email' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Register' })).toBeNull();
  });
});

describe('Login integration shell', () => {
  it('keeps configured Telegram, OAuth, consent, branding, referral, check-email, and footer branches', async () => {
    referral.code = 'invite-42';
    brandingApi.getBranding.mockResolvedValue({
      name: 'Luna VPN',
      logo_url: '/branding/logo.png',
      logo_letter: 'L',
      has_custom_logo: true,
    });
    brandingApi.getLogoUrl.mockReturnValue('/branding/logo.png');
    brandingApi.getFooterEnabled.mockResolvedValue(true);
    brandingApi.getTelegramWidgetConfig.mockResolvedValue({
      bot_username: 'luna_bot',
      size: 'large',
      radius: 20,
      userpic: true,
      request_access: false,
      oidc_enabled: true,
      oidc_client_id: '42',
    });
    authApi.getOAuthProviders.mockResolvedValue({
      providers: [{ name: 'google', display_name: 'Google' }],
    });
    authApi.getOAuthAuthorizeUrl.mockResolvedValue({
      authorize_url: 'https://oauth.example.test/#authorize',
      state: 'oauth-state',
    });
    infoApi.getLegalConsentConfig.mockResolvedValue({
      required: true,
      prechecked: false,
      documents: CONSENT_DOCUMENTS,
    });
    auth.state.registerWithEmail.mockResolvedValue({ email: 'new@example.com' });
    const telegram = installTelegramLoginStub();

    renderLogin('/register');

    expect(await screen.findByRole('link', { name: 'Luna VPN' })).toBeTruthy();
    expect(screen.getByRole('img', { name: 'Luna VPN' }).getAttribute('src')).toBe(
      '/branding/logo.png',
    );
    expect(screen.getByText('You were invited')).toBeTruthy();
    expect(await screen.findByRole('button', { name: 'Continue with Telegram' })).toBeTruthy();
    expect(telegram.init).toHaveBeenCalled();
    expect(screen.getByRole('link', { name: /Open in Telegram/ }).getAttribute('href')).toBe(
      'https://t.me/luna_bot?start=invite-42',
    );
    expect(await screen.findByRole('button', { name: 'Google' })).toBeTruthy();
    const footer = screen.getByRole('contentinfo');
    expect(footer).toBeTruthy();
    expect(footer.querySelector('a[href="/offer"]')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Google' }));
    await waitFor(() => expect(authApi.getOAuthAuthorizeUrl).toHaveBeenCalledWith('google'));
    expect(sessionStorage.getItem('oauth_state')).toBe('oauth-state');
    expect(sessionStorage.getItem('oauth_provider')).toBe('google');

    const checkboxes = await screen.findAllByRole('checkbox');
    for (const checkbox of checkboxes) fireEvent.click(checkbox);
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'new@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText('Confirm Password'), {
      target: { value: 'password123' },
    });
    fireEvent.submit(screen.getByRole('form', { name: 'Register' }));

    await waitFor(() =>
      expect(auth.state.registerWithEmail).toHaveBeenCalledWith(
        'new@example.com',
        'password123',
        undefined,
        'invite-42',
        CONSENT_DOCUMENTS,
      ),
    );
    expect(await screen.findByRole('heading', { name: 'Check your email' })).toBeTruthy();
    expect(screen.getByText('new@example.com')).toBeTruthy();
    expect(screen.getByRole('contentinfo')).toBeTruthy();
  });

  it('keeps Telegram consent retry inside the auth shell', async () => {
    brandingApi.getBranding.mockResolvedValue({
      name: 'Luna VPN',
      logo_url: null,
      logo_letter: 'L',
      has_custom_logo: false,
    });
    brandingApi.getTelegramWidgetConfig.mockResolvedValue({
      bot_username: 'luna_bot',
      size: 'large',
      radius: 20,
      userpic: true,
      request_access: false,
      oidc_enabled: true,
      oidc_client_id: '42',
    });
    auth.state.loginWithTelegramOIDC
      .mockRejectedValueOnce(consentRequiredError())
      .mockResolvedValueOnce(undefined);
    const telegram = installTelegramLoginStub();

    renderLogin();

    fireEvent.click(await screen.findByRole('button', { name: 'Continue with Telegram' }));
    expect(telegram.open).toHaveBeenCalled();

    const checkboxes = await screen.findAllByRole('checkbox');
    expect(checkboxes).toHaveLength(CONSENT_DOCUMENTS.length);
    for (const checkbox of checkboxes) fireEvent.click(checkbox);
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    await waitFor(() => expect(auth.state.loginWithTelegramOIDC).toHaveBeenCalledTimes(2));
    expect(auth.state.loginWithTelegramOIDC.mock.calls[1]).toEqual([
      'telegram-token',
      CONSENT_DOCUMENTS,
    ]);
    await waitFor(() => expect(screen.getByTestId('location').textContent).toBe('/dashboard'));
  });

  it('renders clean preloader without login form during Telegram auto-auth', async () => {
    auth.telegram.inTelegram = true;
    auth.telegram.initData = 'valid-init-data';
    let resolveAuth: () => void = () => {};
    auth.state.loginWithTelegram.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveAuth = resolve;
        }),
    );

    renderLogin('/login');

    expect(screen.getByText('Авторизация...')).toBeTruthy();
    expect(screen.queryByLabelText('Email')).toBeNull();
    expect(screen.queryByLabelText('Password')).toBeNull();

    auth.state.isAuthenticated = true;
    resolveAuth();
    await waitFor(() => expect(screen.getByTestId('location').textContent).toBe('/dashboard'));
  });
});

describe('Login email semantics', () => {
  it('does not auto-authenticate or show Telegram loading on explicit /register', async () => {
    auth.telegram.inTelegram = true;
    auth.telegram.initData = 'valid-init-data';

    renderLogin('/register');

    expect(await screen.findByLabelText('First Name')).toBeTruthy();
    expect(auth.state.loginWithTelegram).not.toHaveBeenCalled();
    expect(screen.queryByText('auth.authenticating')).toBeNull();
  });

  it('shows validation without calling the store for an invalid email', () => {
    renderLogin();
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'invalid' } });
    fireEvent.submit(screen.getByRole('form'));

    expect(screen.getByRole('alert').textContent).toContain('Please enter a valid email address');
    expect(auth.state.loginWithEmail).not.toHaveBeenCalled();
  });

  it('shows the target error when email login fails', async () => {
    auth.state.loginWithEmail.mockRejectedValueOnce({
      response: { status: 401 },
      detail: 'bad credentials',
    });
    renderLogin();
    fillLoginForm();
    fireEvent.submit(screen.getByRole('form'));

    expect((await screen.findByRole('alert')).textContent).toContain('Invalid email or password');
  });

  it('returns to the requested route after a successful email login', async () => {
    renderLogin({ pathname: '/login', state: { from: '/checkout' } });
    fillLoginForm();
    fireEvent.submit(screen.getByRole('form'));

    await waitFor(() => expect(screen.getByTestId('location').textContent).toContain('/checkout'));
    expect(auth.state.loginWithEmail).toHaveBeenCalledWith('user@example.com', 'password123');
  });
});
