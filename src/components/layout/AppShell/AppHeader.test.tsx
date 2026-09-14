// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AppHeader } from './AppHeader';

const mocks = vi.hoisted(() => ({
  branding: vi.fn(),
  hapticImpact: vi.fn(),
  logout: vi.fn(),
}));

vi.mock('@/api/branding', () => ({
  brandingApi: { getBranding: mocks.branding },
  getCachedBranding: () => null,
  setCachedBranding: vi.fn(),
  preloadLogo: vi.fn(),
  LOCAL_LOGO_URL: '/logo.png',
}));
vi.mock('@/components/LanguageSwitcher', () => ({ default: () => null }));
vi.mock('@/components/TicketNotificationBell', () => ({ default: () => null }));
vi.mock('@/hooks/useTheme', () => ({
  useTheme: () => ({ theme: 'dark', toggleTheme: vi.fn(), canToggle: false }),
}));
vi.mock('@/hooks/useUserAvatar', () => ({
  useUserAvatar: () => ({ src: null, onError: vi.fn() }),
}));
vi.mock('@/platform', () => ({
  usePlatform: () => ({
    platform: 'web',
    haptic: { impact: mocks.hapticImpact },
  }),
}));
vi.mock('@/store/auth', () => ({
  useAuthStore: (selector: (state: unknown) => unknown) =>
    selector({
      user: { id: 1, first_name: 'Fixture', username: 'fixture' },
      logout: mocks.logout,
      isAdmin: false,
    }),
}));
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: unknown) => (typeof fallback === 'string' ? fallback : key),
  }),
}));

function createClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function headerProps(mobileMenuOpen: boolean, setMobileMenuOpen: (open: boolean) => void) {
  return {
    mobileMenuOpen,
    setMobileMenuOpen,
    onCommandPaletteOpen: vi.fn(),
    headerHeight: 64,
    isFullscreen: false,
    safeAreaInset: { top: 0, bottom: 0, left: 0, right: 0 },
    contentSafeAreaInset: { top: 0, bottom: 0, left: 0, right: 0 },
  } as const;
}

function renderHeader() {
  return render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <QueryClientProvider client={createClient()}>
        <AppHeader {...headerProps(false, vi.fn())} />
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('AppHeader dashboard navigation', () => {
  it('links the mobile logo directly to the dashboard', async () => {
    mocks.branding.mockResolvedValue({ name: 'Fixture VPN' });

    renderHeader();

    expect((await screen.findByRole('link', { name: /Fixture VPN/ })).getAttribute('href')).toBe(
      '/dashboard',
    );
  });

  it('opens the mobile menu with the dashboard item on its target route', async () => {
    mocks.branding.mockResolvedValue({ name: 'Fixture VPN' });

    function Harness() {
      const [open, setOpen] = useState(false);
      return <AppHeader {...headerProps(open, setOpen)} />;
    }

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <QueryClientProvider client={createClient()}>
          <Harness />
        </QueryClientProvider>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));

    const dashboardLink = await screen.findByRole('link', { name: 'nav.dashboard' });
    expect(dashboardLink.getAttribute('href')).toBe('/dashboard');
  });
});
