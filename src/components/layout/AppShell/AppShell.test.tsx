// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router';
import { AppShell } from './AppShell';

const mocks = vi.hoisted(() => ({
  logout: vi.fn(),
  impact: vi.fn(),
  getBalance: vi.fn(),
  isTelegramWebApp: false,
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({ data: { balance_rubles: 125 } }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: unknown, options?: { name?: string }) => {
      const name =
        options?.name ??
        (typeof fallback === 'object' && fallback !== null && 'name' in fallback
          ? (fallback as { name?: string }).name
          : undefined);
      if (key === 'dashboard.welcome') return `Welcome, ${name}!`;
      if (key === 'dashboard.welcomeNoName') return 'Welcome!';
      return typeof fallback === 'string' ? fallback : key;
    },
  }),
}));

vi.mock('@/store/auth', () => ({
  useAuthStore: (selector: (state: unknown) => unknown) =>
    selector({ isAdmin: false, logout: mocks.logout, user: { id: 1, first_name: 'Test' } }),
}));

vi.mock('@/platform', () => ({
  useHaptic: () => ({ impact: mocks.impact }),
}));

vi.mock('@/hooks/useTelegramSDK', () => ({
  useTelegramSDK: () => ({
    isTelegramWebApp: mocks.isTelegramWebApp,
    isFullscreen: false,
    safeAreaInset: 0,
    contentSafeAreaInset: 0,
    platform: 'web',
    isMobile: false,
  }),
}));

vi.mock('@/hooks/useHeaderHeight', () => ({ useHeaderHeight: () => ({ mobile: 0 }) }));
vi.mock('@/hooks/useTheme', () => ({
  useTheme: () => ({ theme: 'dark', toggleTheme: vi.fn(), canToggle: false }),
}));
vi.mock('@/hooks/useCurrency', () => ({
  useCurrency: () => ({ formatWithCurrency: (amount: number) => `${amount} USD` }),
}));
vi.mock('@/hooks/useBranding', () => ({
  useBranding: () => ({ appName: 'Invoxy', logoLetter: 'I', logoUrl: null }),
}));
vi.mock('@/hooks/useFeatureFlags', () => ({
  useFeatureFlags: () => ({
    referralEnabled: true,
    wheelEnabled: false,
    hasContests: false,
    hasPolls: false,
    giftEnabled: false,
  }),
}));
vi.mock('@/hooks/useScrollRestoration', () => ({ useScrollRestoration: vi.fn() }));
vi.mock('@/components/backgrounds/BackgroundHost', () => ({ useBackgroundConsumer: vi.fn() }));
vi.mock('@/api/balance', () => ({ balanceApi: { getBalance: mocks.getBalance } }));
vi.mock('@/api/branding', () => ({ LOCAL_LOGO_URL: '/logo.png' }));
vi.mock('@/config/constants', () => ({ API: { BALANCE_STALE_TIME_MS: 60_000 } }));
vi.mock('@/components/WebSocketNotifications', () => ({ default: () => null }));
vi.mock('@/components/CampaignBonusNotifier', () => ({ default: () => null }));
vi.mock('@/components/SuccessNotificationModal', () => ({ default: () => null }));
vi.mock('@/components/PromptDialogHost', () => ({ PromptDialogHost: () => null }));
vi.mock('@/components/TicketNotificationBell', () => ({
  default: () => <button data-testid="ticket-notification-bell" type="button" />,
}));
vi.mock('./MobileBottomNav', () => ({
  MobileBottomNav: () => <nav data-testid="mobile-bottom-nav" />,
}));
vi.mock('./AppHeader', () => ({ AppHeader: () => null }));

function renderShell(pathname: string) {
  return render(
    <MemoryRouter initialEntries={[pathname]}>
      <AppShell>
        <div>page</div>
      </AppShell>
    </MemoryRouter>,
  );
}

describe('AppShell support FAB', () => {
  beforeEach(() => {
    mocks.getBalance.mockResolvedValue({ balance_rubles: 0 });
    if (!window.matchMedia) {
      window.matchMedia = (() => ({
        matches: false,
        media: '',
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })) as unknown as typeof window.matchMedia;
    }
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    mocks.isTelegramWebApp = false;
  });

  it('mounts one support FAB immediately on a normal shell route', () => {
    renderShell('/balance');

    expect(screen.getAllByRole('link', { name: 'Поддержка' })).toHaveLength(1);
  });

  it.each(['/dashboard', '/news', '/news/sample', '/info', '/info/rules'])(
    'does not render the legacy support FAB on modern customer route %s',
    (pathname) => {
      renderShell(pathname);

      expect(screen.queryByRole('link', { name: 'Поддержка' })).toBeNull();
    },
  );

  it('does not render the support FAB on /support', () => {
    renderShell('/support');

    expect(screen.queryByRole('link', { name: 'Поддержка' })).toBeNull();
  });

  it('places personal navigation after tariffs in the sidebar', () => {
    renderShell('/dashboard');

    const tariffs = screen.getByRole('link', { name: 'Тарифы' });
    const referral = screen.getByRole('link', { name: 'Рефералы' });
    const info = screen.getByRole('link', { name: 'Информация' });
    const profile = screen.getByRole('link', { name: 'Профиль' });

    for (const [before, after] of [
      [tariffs, referral],
      [referral, info],
      [info, profile],
    ]) {
      expect(before.compareDocumentPosition(after) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    }
    expect(screen.queryByRole('link', { name: 'Моя подписка' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Подключение' })).toBeNull();
  });

  it('renders desktop navigation as an island without dropping balance controls', () => {
    renderShell('/dashboard');

    const sidebar = screen.getByRole('complementary');

    expect(sidebar.classList.contains('ix-sidebar-island')).toBe(true);
    expect(sidebar.classList.contains('glass-surface-elevated')).toBe(true);
    expect(screen.getByRole('link', { name: 'Тарифы' })).toBeTruthy();
    expect(screen.getByText('Баланс')).toBeTruthy();
    expect(screen.getByText('Баланс').parentElement?.classList.contains('glass-surface')).toBe(
      true,
    );
    expect(screen.getByRole('link', { name: 'Пополнить' })).toBeTruthy();
  });

  it('renders the configured user balance in the authenticated shell', () => {
    renderShell('/dashboard');

    expect(screen.getByTestId('sidebar-balance').textContent).toContain('125 USD');
  });

  it('links the authenticated home to /dashboard', () => {
    renderShell('/dashboard');

    expect(screen.getByRole('link', { name: 'Кабинет' }).getAttribute('href')).toBe('/dashboard');
  });

  it('scopes the mint palette to modern customer routes', () => {
    const { container } = renderShell('/dashboard');

    expect(container.querySelector('.ix-app')?.getAttribute('data-customer-ui')).toBe('modern');
    expect(document.documentElement.getAttribute('data-customer-palette')).toBe('mint');

    cleanup();
    renderShell('/subscriptions');

    expect(screen.getByText('page').closest('.ix-app')?.getAttribute('data-customer-ui')).toBe(
      'modern',
    );
    expect(document.documentElement.getAttribute('data-customer-palette')).toBe('mint');

    cleanup();
    renderShell('/referral');

    expect(screen.getByText('page').closest('.ix-app')?.getAttribute('data-customer-ui')).toBe(
      'modern',
    );
    expect(document.documentElement.getAttribute('data-customer-palette')).toBe('mint');

    cleanup();
    renderShell('/news/sample');

    expect(screen.getByText('page').closest('.ix-app')?.getAttribute('data-customer-ui')).toBe(
      'modern',
    );
    expect(document.documentElement.getAttribute('data-customer-palette')).toBe('mint');

    cleanup();
    renderShell('/info');

    expect(screen.getByText('page').closest('.ix-app')?.getAttribute('data-customer-ui')).toBe(
      'modern',
    );
    expect(document.documentElement.getAttribute('data-customer-palette')).toBe('mint');
  });

  it.each(['/dashboard', '/subscriptions', '/balance', '/referral', '/support', '/info'])(
    'keeps the mobile nav on a direct user route: %s',
    (pathname) => {
      renderShell(pathname);

      expect(screen.getByTestId('mobile-bottom-nav')).toBeTruthy();
    },
  );

  it('does not mount the mobile nav in admin', () => {
    renderShell('/admin');

    expect(screen.queryByTestId('mobile-bottom-nav')).toBeNull();
  });

  it('renders Mini App page content without the cross-page motion wrapper', () => {
    mocks.isTelegramWebApp = true;
    const { container } = renderShell('/info');
    const page = screen.getByText('page');

    expect(page.parentElement).toBe(container.querySelector('main.ix-main'));
  });
});
