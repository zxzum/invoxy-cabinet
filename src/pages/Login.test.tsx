// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, cleanup, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { auth, authApi, brandingApi, translation } = vi.hoisted(() => ({
  auth: {
    state: {
      isAuthenticated: false,
      isLoading: false,
      loginWithTelegram: vi.fn(),
      loginWithEmail: vi.fn(),
      registerWithEmail: vi.fn(),
    },
  },
  authApi: {
    getOAuthProviders: vi.fn(),
    getOAuthAuthorizeUrl: vi.fn(),
    forgotPassword: vi.fn(),
  },
  brandingApi: {
    getBranding: vi.fn(),
    getEmailAuthEnabled: vi.fn(),
    getFooterEnabled: vi.fn(),
    getLogoUrl: vi.fn(),
  },
  translation: {
    t: (key: string, fallback?: unknown) => {
      const values: Record<string, string> = {
        'auth.login': 'Login',
        'auth.register': 'Register',
        'auth.loginWithEmail': 'Login with Email',
        'auth.email': 'Email',
        'auth.password': 'Password',
        'auth.loginTitle': 'Login to Cabinet',
        'auth.loginSubtitle': 'Sign in with Telegram or use your email',
        'auth.noAccount': "Don't have an account?",
        'auth.forgotPassword': 'Forgot password?',
        'auth.invalidEmail': 'Please enter a valid email address',
        'auth.invalidCredentials': 'Invalid email or password',
        'common.error': 'Something went wrong',
      };
      return values[key] ?? (typeof fallback === 'string' ? fallback : key);
    },
    i18n: { language: 'en' },
  },
}));

vi.mock('react-i18next', () => ({ useTranslation: () => translation }));
vi.mock('../store/auth', () => ({
  useAuthStore: (selector?: (state: typeof auth.state) => unknown) =>
    selector ? selector(auth.state) : auth.state,
}));
vi.mock('../api/auth', () => ({ authApi }));
vi.mock('../api/branding', () => ({
  brandingApi,
  getCachedBranding: () => null,
  setCachedBranding: vi.fn(),
  preloadLogo: vi.fn(),
  isLogoPreloaded: () => false,
}));
vi.mock('../api/info', () => ({
  infoApi: { getLegalConsentConfig: vi.fn().mockResolvedValue(null) },
}));
vi.mock('../hooks/useTelegramSDK', () => ({
  isInTelegramWebApp: () => false,
  getTelegramInitData: () => null,
  useTelegramSDK: () => ({
    safeAreaInset: { top: 0, bottom: 0 },
    contentSafeAreaInset: { top: 0, bottom: 0 },
  }),
}));
vi.mock('../hooks/useLegalConsentGate', () => ({
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
vi.mock('../utils/api-error', () => ({
  getApiErrorMessage: (error: { detail?: string }, fallback: string) => error.detail || fallback,
}));
vi.mock('../utils/referral', () => ({ getPendingReferralCode: () => '' }));
vi.mock('../utils/token', () => ({
  getAndClearReturnUrl: () => null,
  tokenStorage: { clearTokens: vi.fn() },
}));
vi.mock('../utils/oauth', () => ({ saveOAuthState: vi.fn(() => true) }));
vi.mock('@telegram-apps/sdk-react', () => ({ closeMiniApp: vi.fn() }));
vi.mock('../components/LanguageSwitcher', () => ({ default: () => null }));
vi.mock('../components/TelegramLoginButton', () => ({
  default: () => <div data-testid="telegram-auth">Telegram auth</div>,
}));
vi.mock('../components/OAuthProviderIcon', () => ({ default: () => null }));
vi.mock('../components/auth/CheckEmailCard', () => ({ CheckEmailCard: () => null }));
vi.mock('../components/LegalFooter', () => ({ default: () => null }));
vi.mock('../components/LegalConsent', () => ({ default: () => null }));
vi.mock('../components/LegalConsentGate', () => ({ default: () => null }));

const { default: Login } = await import('./Login');

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
  auth.state.loginWithEmail.mockReset().mockResolvedValue(undefined);
  auth.state.registerWithEmail.mockReset();
  authApi.getOAuthProviders.mockReset().mockResolvedValue({ providers: [] });
  authApi.getOAuthAuthorizeUrl.mockReset();
  authApi.forgotPassword.mockReset();
  brandingApi.getBranding.mockReset().mockResolvedValue(null);
  brandingApi.getEmailAuthEnabled.mockReset().mockResolvedValue({ enabled: true });
  brandingApi.getFooterEnabled.mockReset().mockResolvedValue(false);
  brandingApi.getLogoUrl.mockReset().mockReturnValue(null);
});

afterEach(() => cleanup());

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
    expect(screen.getByTestId('telegram-auth')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Register' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Login with Email' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Register' })).toBeNull();
  });
});

describe('Login email semantics', () => {
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
