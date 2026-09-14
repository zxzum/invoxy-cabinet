// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ConnectedAccounts from './ConnectedAccounts';

const mocks = vi.hoisted(() => ({
  getLinkedProviders: vi.fn(),
  unlinkProvider: vi.fn(),
  linkProviderInit: vi.fn(),
  registerEmail: vi.fn(),
  verifyEmailMerge: vi.fn(),
  getMe: vi.fn(),
  getEmailAuthEnabled: vi.fn(),
  getTelegramWidgetConfig: vi.fn(),
  showToast: vi.fn(),
  setUser: vi.fn(),
  openLink: vi.fn(),
}));

vi.mock('../api/auth', () => ({
  authApi: {
    getLinkedProviders: mocks.getLinkedProviders,
    unlinkProvider: mocks.unlinkProvider,
    linkProviderInit: mocks.linkProviderInit,
    registerEmail: mocks.registerEmail,
    verifyEmailMerge: mocks.verifyEmailMerge,
    getMe: mocks.getMe,
    linkTelegram: vi.fn(),
  },
}));
vi.mock('../api/branding', () => ({
  brandingApi: {
    getEmailAuthEnabled: mocks.getEmailAuthEnabled,
    getTelegramWidgetConfig: mocks.getTelegramWidgetConfig,
  },
}));
vi.mock('../components/Toast', () => ({
  useToast: () => ({ showToast: mocks.showToast }),
}));
vi.mock('../store/auth', () => ({
  useAuthStore: (selector: (state: { setUser: (user: unknown) => void }) => unknown) =>
    selector({ setUser: mocks.setUser }),
}));
vi.mock('../hooks/useTelegramSDK', () => ({ getTelegramInitData: () => null }));
vi.mock('@/platform/hooks/usePlatform', () => ({
  useIsTelegram: () => true,
  usePlatform: () => ({ openLink: mocks.openLink }),
}));
vi.mock('@/platform', () => ({
  usePlatform: () => ({ haptic: { impact: vi.fn() } }),
}));
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/profile/accounts']}>
      <QueryClientProvider
        client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
      >
        <ConnectedAccounts />
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.getEmailAuthEnabled.mockResolvedValue({ enabled: true, verification_enabled: true });
  mocks.getTelegramWidgetConfig.mockResolvedValue({
    bot_username: '',
    oidc_enabled: false,
    oidc_client_id: null,
  });
  mocks.unlinkProvider.mockResolvedValue({ success: true });
  mocks.linkProviderInit.mockResolvedValue({
    authorize_url: 'https://accounts.example.test/oauth',
    state: 'server-state',
  });
});

afterEach(cleanup);

describe('ConnectedAccounts', () => {
  it('renders the target query error state', async () => {
    mocks.getLinkedProviders.mockRejectedValue(new Error('unavailable'));
    renderPage();

    expect(await screen.findByText('common.error')).toBeTruthy();
  });

  it('preserves two-step unlink confirmation and the provider mutation', async () => {
    mocks.getLinkedProviders.mockResolvedValue({
      providers: [
        { provider: 'google', linked: true, identifier: 'api@example.test' },
        { provider: 'email', linked: true, identifier: 'api@example.test' },
      ],
    });
    renderPage();

    fireEvent.click(await screen.findByRole('button', { name: 'profile.accounts.unlink' }));
    fireEvent.click(screen.getByRole('button', { name: 'profile.accounts.unlinkConfirmBtn' }));

    await waitFor(() => expect(mocks.unlinkProvider).toHaveBeenCalledWith('google'));
    await waitFor(() =>
      expect(mocks.showToast).toHaveBeenCalledWith({
        type: 'success',
        message: 'profile.accounts.unlinkSuccess',
      }),
    );
  });

  it('preserves OAuth initialization and external-browser handoff', async () => {
    mocks.getLinkedProviders.mockResolvedValue({
      providers: [
        { provider: 'google', linked: false, identifier: null },
        { provider: 'email', linked: true, identifier: 'api@example.test' },
      ],
    });
    renderPage();

    fireEvent.click(await screen.findByRole('button', { name: 'profile.accounts.link' }));

    await waitFor(() => expect(mocks.linkProviderInit).toHaveBeenCalledWith('google'));
    expect(mocks.openLink).toHaveBeenCalledWith('https://accounts.example.test/oauth');
    expect(mocks.showToast).toHaveBeenCalledWith({
      type: 'info',
      message: 'profile.accounts.continueInBrowser',
    });
  });
});
