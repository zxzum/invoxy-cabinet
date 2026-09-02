// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ruLocale from '@/locales/ru.json';
import { PlatformProvider } from '@/platform/PlatformProvider';
import { PaletteSwitcher } from './PaletteSwitcher';

/**
 * Переключатель палитры: клик по кнопке-свотчу открывает шит со списком
 * палитр, выбор строки тут же применяет палитру на <html> (data-palette).
 *
 * Провайдеры: useHaptic (и внутри ResponsiveSheet → Sheet) требует
 * PlatformProvider, а i18n замокан на ru.json — глобальная инициализация
 * src/i18n.ts в граф теста не попадает. jsdom не умеет matchMedia, его
 * спрашивает ResponsiveSheet, выбирая мобильную/десктопную ветку.
 */

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: unknown) =>
      resolveRu(key) ?? (typeof fallback === 'string' ? fallback : key),
    i18n: { language: 'ru', changeLanguage: () => Promise.resolve() },
  }),
  Trans: ({ children }: { children?: unknown }) => children ?? null,
  initReactI18next: { type: '3rdParty', init: () => {} },
}));

function resolveRu(key: string): string | undefined {
  const value = key
    .split('.')
    .reduce<unknown>((node, part) => (node as Record<string, unknown>)?.[part], ruLocale);
  return typeof value === 'string' ? value : undefined;
}

// jsdom не реализует matchMedia; false → мобильная ветка ResponsiveSheet (Sheet).
if (!window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

afterEach(cleanup);

describe('PaletteSwitcher', () => {
  it('opens the sheet and applies a palette on pick', async () => {
    render(
      <PlatformProvider>
        <PaletteSwitcher compact />
      </PlatformProvider>,
    );

    const trigger = screen.getByRole('button', { name: /палитра/i });
    fireEvent.click(trigger);

    // Внутри шита — все 5 палитр
    expect(await screen.findByText('Аврора')).toBeTruthy();
    expect(screen.getByText('Лес')).toBeTruthy();
    expect(screen.getByText('Полночь')).toBeTruthy();
    expect(screen.getByText('Эмбер')).toBeTruthy();
    expect(screen.getByText('Сигнал')).toBeTruthy();

    fireEvent.click(screen.getByText('Аврора'));
    expect(document.documentElement.dataset.palette).toBe('aurora');
  });
});
