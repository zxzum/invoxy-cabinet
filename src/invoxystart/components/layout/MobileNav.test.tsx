// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { AccountState } from '@/invoxystart/lib/accountState';
import { MobileNav, isMobileNavHidden, tariffsNudge } from './MobileNav';

const accountState = vi.hoisted(() => ({ value: 'none' as AccountState | null }));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) =>
      ({
        'nav.dashboard': 'Кабинет',
        'nav.tariffs': 'Тарифы',
        'nav.referral': 'Рефералы',
        'nav.profile': 'Профиль',
        'nav.navigation': 'Навигация',
        'invoxy.nav.renewBadge': 'Продлить',
      })[key] ?? key,
  }),
}));
vi.mock('@/platform', () => ({ usePlatform: () => ({ haptic: { selection: vi.fn() } }) }));
vi.mock('@/invoxystart/lib/useAccountState', () => ({
  useAccountState: () => ({ state: accountState.value, loading: false }),
}));
vi.mock('@/invoxystart/components/ui/RuneIcon', () => {
  const Icon = () => <svg />;
  return { House: Icon, Layers: Icon, Users: Icon, UserRound: Icon };
});

function renderNav(path = '/dashboard') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <MobileNav />
    </MemoryRouter>,
  );
}

afterEach(() => {
  cleanup();
  accountState.value = 'none';
});

describe('MobileNav', () => {
  it('shows a visible label for every tab', () => {
    renderNav();
    for (const label of ['Кабинет', 'Тарифы', 'Рефералы', 'Профиль']) {
      expect(screen.getByRole('link', { name: label })).toBeTruthy();
    }
  });

  it('links the tariffs tab to /tariffs', () => {
    renderNav();
    expect(screen.getByRole('link', { name: 'Тарифы' }).getAttribute('href')).toBe('/tariffs');
  });

  it('marks the current tab as active', () => {
    renderNav('/tariffs');
    expect(screen.getByRole('link', { name: 'Тарифы' }).getAttribute('aria-current')).toBe('page');
  });

  it('shows the renew badge when access has ended', () => {
    accountState.value = 'paid_expired';
    renderNav();
    expect(screen.getByText('Продлить')).toBeTruthy();
  });

  it('is hidden in the admin panel', () => {
    renderNav('/admin/tariffs');
    expect(screen.queryByRole('navigation')).toBeNull();
  });
});

describe('tariffsNudge', () => {
  it.each([
    ['none', 'pulse'],
    ['trial_available', 'pulse'],
    ['trial_active', null],
    ['paid_active', null],
    ['paid_expiring', 'renew'],
    ['paid_expired', 'renew'],
    ['trial_expired', 'renew'],
    ['disabled', 'renew'],
    [null, null],
  ] as const)('%s → %s', (state, expected) => {
    expect(tariffsNudge(state)).toBe(expected);
  });
});

describe('isMobileNavHidden', () => {
  it('hides only on admin routes', () => {
    expect(isMobileNavHidden('/admin')).toBe(true);
    expect(isMobileNavHidden('/admin/users/1')).toBe(true);
    expect(isMobileNavHidden('/administrator')).toBe(false);
    expect(isMobileNavHidden('/dashboard')).toBe(false);
  });
});
