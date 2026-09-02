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

function renderNav(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <PlatformProvider>
        <MobileBottomNav isKeyboardOpen={false} />
      </PlatformProvider>
    </MemoryRouter>,
  );
}

describe('MobileBottomNav', () => {
  afterEach(cleanup);

  it('renders four localized items', () => {
    renderNav('/');
    expect(screen.getByText('Главная')).toBeTruthy();
    expect(screen.getByText('Тарифы')).toBeTruthy();
    expect(screen.getByText('Ключи')).toBeTruthy();
    expect(screen.getByText('Профиль')).toBeTruthy();
  });

  it('marks the active item and renders the sliding plate', () => {
    const { container } = renderNav('/connection');
    const keyLink = screen.getByText('Ключи').closest('a');
    expect(keyLink?.getAttribute('aria-current')).toBe('page');
    // Плашка активного таба — единственный data-nav-plate в дереве
    expect(container.querySelectorAll('[data-nav-plate]').length).toBe(1);
  });

  it('hides itself while the keyboard is open', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/']}>
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
