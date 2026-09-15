// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { PlatformProvider } from '@/platform/PlatformProvider';
import { MobileBottomNav } from './MobileBottomNav';

/**
 * Навбар InvoxyStart: четыре пункта, активный раскрывается с подписью,
 * неактивные остаются круглыми icon-only кнопками. При открытой клавиатуре
 * навбар скрывается aria-hidden.
 *
 * Провайдеры: usePlatform (haptic) бросает без PlatformProvider — тот же
 * хелпер, что в PaletteSwitcher.test.tsx. i18n в граф теста не попадает,
 * поэтому t() отдаёт fallback-строки из самого компонента.
 */

interface MobileNavInsets {
  isKeyboardOpen: boolean;
  safeAreaInset: { top: number; bottom: number; left: number; right: number };
  contentSafeAreaInset: { top: number; bottom: number; left: number; right: number };
}

function renderNav(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <PlatformProvider>
        <MobileBottomNav isKeyboardOpen={false} />
      </PlatformProvider>
    </MemoryRouter>,
  );
}

function renderNavWithInsets(path: string, props: MobileNavInsets) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <PlatformProvider>
        <MobileBottomNav {...props} />
      </PlatformProvider>
    </MemoryRouter>,
  );
}

describe('MobileBottomNav', () => {
  afterEach(cleanup);

  it('renders four localized items', () => {
    const { container } = renderNav('/dashboard');
    expect(container.querySelector('nav')?.className).toContain('glass-surface-elevated');
    expect(screen.getByText('Кабинет')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Тарифы' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Рефералы' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Профиль' })).toBeTruthy();
  });

  it('links the first item to the authenticated dashboard', () => {
    renderNav('/dashboard');

    expect(screen.getByRole('link', { name: 'Кабинет' }).getAttribute('href')).toBe('/dashboard');
  });

  it('uses referrals as the third InvoxyStart tab', () => {
    renderNav('/referrals');
    expect(screen.getByText('Рефералы')).toBeTruthy();
  });

  it('marks and expands the active item', () => {
    renderNav('/referrals');
    const referralLink = screen.getByRole('link', { name: 'Рефералы' });
    expect(referralLink.getAttribute('aria-current')).toBe('page');
    expect(referralLink.className).toContain('w-[124px]');
    expect(screen.getByText('Рефералы').className).toContain('whitespace-nowrap');
  });

  it('keeps the floating nav clear of Telegram and browser safe areas', () => {
    const { container } = renderNavWithInsets('/dashboard', {
      isKeyboardOpen: false,
      safeAreaInset: { top: 0, bottom: 34, left: 8, right: 12 },
      contentSafeAreaInset: { top: 0, bottom: 20, left: 4, right: 16 },
    });

    const nav = container.querySelector('nav') as HTMLElement;
    expect(nav.style.bottom).toBe('max(var(--mobile-nav-offset), 34px)');
    expect(nav.style.left).toBe('calc(50% + 0.5 * (8px - 16px))');
  });

  it('hides itself while the keyboard is open', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <PlatformProvider>
          <MobileBottomNav isKeyboardOpen />
        </PlatformProvider>
      </MemoryRouter>,
    );
    const nav = container.firstChild as HTMLElement;
    expect(nav.getAttribute('aria-hidden')).toBe('true');
    // inert убирает ссылки из tab-order — aria-hidden сам по себе этого не делает
    expect(nav.getAttribute('inert')).not.toBeNull();
  });
});
