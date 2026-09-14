// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { PlatformProvider } from '@/platform/PlatformProvider';
import { MobileBottomNav } from './MobileBottomNav';

/**
 * Навбар на мобильных: четыре локализованных пункта, активный помечен
 * aria-current и несёт единственную скользящую плашку (data-nav-plate),
 * при открытой клавиатуре навбар скрывается aria-hidden.
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
    expect(screen.getByText('Главная')).toBeTruthy();
    expect(screen.getByText('Тарифы')).toBeTruthy();
    expect(screen.getByText('Подключение')).toBeTruthy();
    expect(screen.getByText('Профиль')).toBeTruthy();
  });

  it('links the first item to the authenticated dashboard', () => {
    renderNav('/dashboard');

    expect(screen.getByRole('link', { name: 'Главная' }).getAttribute('href')).toBe('/dashboard');
  });

  it('keeps referrals out of the compact bottom menu', () => {
    renderNav('/referral');
    expect(screen.queryByText('Рефералы')).toBeNull();
  });

  it('marks the active item and renders the sliding plate', () => {
    const { container } = renderNav('/connection');
    const connectionLink = screen.getByText('Подключение').closest('a');
    expect(connectionLink?.getAttribute('aria-current')).toBe('page');
    expect(connectionLink?.className).toContain('min-w-0');
    expect(screen.getByText('Подключение').className).toContain('whitespace-nowrap');
    // Плашка активного таба — единственный data-nav-plate в дереве
    expect(container.querySelectorAll('[data-nav-plate]').length).toBe(1);
    expect(container.querySelector('nav > div > [data-nav-plate]')).toBeTruthy();
    expect(connectionLink?.querySelector('[data-nav-plate]')).toBeNull();
  });

  it('keeps the floating nav clear of Telegram and browser safe areas', () => {
    const { container } = renderNavWithInsets('/dashboard', {
      isKeyboardOpen: false,
      safeAreaInset: { top: 0, bottom: 34, left: 8, right: 12 },
      contentSafeAreaInset: { top: 0, bottom: 20, left: 4, right: 16 },
    });

    const nav = container.querySelector('nav') as HTMLElement;
    expect(nav.style.bottom).toBe('max(var(--mobile-nav-offset), 34px)');
    expect(nav.style.left).toBe('max(0.75rem, 8px)');
    expect(nav.style.right).toBe('max(0.75rem, 16px)');
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
