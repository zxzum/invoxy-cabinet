// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router';
import { AppShell } from './AppShell';

const mocks = vi.hoisted(() => ({
  logout: vi.fn(),
  impact: vi.fn(),
  getBalance: vi.fn(),
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({ data: { balance_rubles: 0 } }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: unknown) => (typeof fallback === 'string' ? fallback : key),
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
vi.mock('@/hooks/useBranding', () => ({
  useBranding: () => ({ appName: 'Invoxy', logoLetter: 'I', logoUrl: null }),
}));
vi.mock('@/hooks/useFeatureFlags', () => ({
  useFeatureFlags: () => ({
    referralEnabled: false,
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
vi.mock('@/components/TicketNotificationBell', () => ({ default: () => null }));
vi.mock('./MobileBottomNav', () => ({ MobileBottomNav: () => null }));
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
  });

  it('mounts one support FAB immediately on a normal shell route', () => {
    renderShell('/');

    expect(screen.getAllByRole('link', { name: 'Поддержка' })).toHaveLength(1);
  });

  it('does not render the support FAB on /support', () => {
    renderShell('/support');

    expect(screen.queryByRole('link', { name: 'Поддержка' })).toBeNull();
  });
});
