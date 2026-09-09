// @vitest-environment jsdom
import { act, cleanup, fireEvent, screen } from '@testing-library/react';
import { render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PlatformProvider } from '@/platform/PlatformProvider';

/**
 * Шит на телефоне: не залезает под шапку Telegram (высота из отступов SDK), даёт место
 * полоске Home и закрывается кнопкой в заголовке, а не только жестом.
 */

vi.mock('react-i18next', async () =>
  (await import('@/components/admin/reachability/testUtils')).i18nMock(),
);
vi.mock('@/hooks/useHeaderHeight', () => ({
  useHeaderHeight: () => ({
    mobile: 168,
    mobileCss: '168px',
    desktop: 56,
    topSafeArea: 104,
    bottomSafeArea: 34,
    isMobileFullscreen: true,
  }),
}));

import { Sheet } from './Sheet';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('Sheet', () => {
  it('скольжение через inline transform, без translate-классов (и в Telegram тоже)', () => {
    // rAF не исполняем: шит остаётся в начальной позиции «за экраном».
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation(() => 1);

    render(
      <PlatformProvider>
        <Sheet isOpen onClose={vi.fn()} title="Сервер">
          <p>тело</p>
        </Sheet>
      </PlatformProvider>,
    );

    const sheet = screen.getByRole('dialog');
    expect(sheet.style.transform).toBe('translateY(100%)');
    expect(sheet.style.transitionProperty).toBe('transform');
    expect(sheet.className).not.toMatch(/translate-y|transition-transform|transition-opacity/);
    const backdrop = document.querySelector('[data-sheet-backdrop]');
    expect(backdrop?.className).toContain('bg-black/65');
    expect(backdrop?.className).toContain('opacity-0');
  });

  it('ограничивает высоту отступом Telegram сверху и добавляет отступ снизу', () => {
    render(
      <PlatformProvider>
        <Sheet isOpen onClose={vi.fn()} title="Сервер">
          <p>тело</p>
        </Sheet>
      </PlatformProvider>,
    );
    const sheet = screen.getByRole('dialog');
    expect(sheet.style.maxHeight).toBe(
      'calc(var(--tg-viewport-stable-height, 100dvh) * 1 - 112px)',
    );
    expect(sheet.style.paddingBottom).toBe('max(env(safe-area-inset-bottom, 0px), 34px)');
  });

  it('въезд детерминирован: кадр в translateY(100%), видимость только после двух rAF', () => {
    const frames: FrameRequestCallback[] = [];
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      frames.push(cb);
      return frames.length;
    });

    render(
      <PlatformProvider>
        <Sheet isOpen onClose={vi.fn()} title="Сервер">
          <p>тело</p>
        </Sheet>
      </PlatformProvider>,
    );

    const sheet = screen.getByRole('dialog');
    expect(sheet.style.transform).toBe('translateY(100%)');
    expect(frames).toHaveLength(1);

    // Первый кадр — монтирование «за экраном», видимость ещё не включена.
    act(() => frames.shift()?.(0));
    expect(sheet.style.transform).toBe('translateY(100%)');

    act(() => frames.shift()?.(0));
    expect(sheet.style.transform).toBe('translateY(0px)');
  });

  it('повторное открытие снова начинается из translateY(100%)', () => {
    vi.useFakeTimers();
    const { rerender } = render(
      <PlatformProvider>
        <Sheet isOpen onClose={vi.fn()} title="Сервер">
          <p>тело</p>
        </Sheet>
      </PlatformProvider>,
    );
    // Закрыли и дождались размонтирования.
    rerender(
      <PlatformProvider>
        <Sheet isOpen={false} onClose={vi.fn()} title="Сервер">
          <p>тело</p>
        </Sheet>
      </PlatformProvider>,
    );
    act(() => vi.advanceTimersByTime(240));
    expect(screen.queryByRole('dialog')).toBeNull();

    rerender(
      <PlatformProvider>
        <Sheet isOpen onClose={vi.fn()} title="Сервер">
          <p>тело</p>
        </Sheet>
      </PlatformProvider>,
    );
    expect(screen.getByRole('dialog').style.transform).toBe('translateY(100%)');
  });

  it('кнопка «Закрыть» зовёт onClose сразу, а выезд и размонтирование — после isOpen=false', () => {
    vi.useFakeTimers();
    const onClose = vi.fn();
    const { rerender } = render(
      <PlatformProvider>
        <Sheet isOpen onClose={onClose} title="Сервер">
          <p>тело</p>
        </Sheet>
      </PlatformProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Закрыть' }));
    expect(onClose).toHaveBeenCalledTimes(1);
    // Шит ещё смонтирован: родитель ещё не перевёл isOpen.
    expect(screen.getByRole('dialog')).toBeTruthy();

    rerender(
      <PlatformProvider>
        <Sheet isOpen={false} onClose={onClose} title="Сервер">
          <p>тело</p>
        </Sheet>
      </PlatformProvider>,
    );
    // Выезд играет: шит уехал вниз, но ещё в DOM.
    expect(screen.getByRole('dialog').style.transform).toBe('translateY(100%)');

    act(() => vi.advanceTimersByTime(240));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
