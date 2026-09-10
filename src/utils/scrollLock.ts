/**
 * Общая блокировка прокрутки страницы под модалками и шитами.
 *
 * Скроллер документа — <html> (у него overflow-x: hidden, поэтому overflow
 * body на вьюпорт не прокидывается): блокировать надо оба, иначе страница
 * продолжает крутиться под открытым диалогом.
 *
 * На десктопе достаточно overflow: hidden — позиция скролла сохраняется сама.
 * Фиксация body (position: fixed) там вредна: она убирает документ из потока,
 * скролл сбрасывается в 0, и sticky-сайдбар (.ix-sidebar) теряет своё
 * смещение — уезжает за верх экрана при открытии любой модалки. Фиксация
 * остаётся для тач-устройств: iOS и Telegram WebView игнорируют overflow —
 * только fixed реально останавливает прокрутку под шитом.
 *
 * Блокировки складываются по счётчику: вложенные вызовы (модалка поверх шита)
 * не снимают чужую блокировку раньше времени.
 */

const DESKTOP_QUERY = '(min-width: 1024px) and (pointer: fine)';

interface LockState {
  scrollY: number;
  fixed: boolean;
  prev: {
    bodyOverflow: string;
    bodyPosition: string;
    bodyTop: string;
    bodyLeft: string;
    bodyRight: string;
    htmlOverflow: string;
  };
}

let lockCount = 0;
let state: LockState | null = null;

function isDesktop(): boolean {
  // jsdom (тесты) не реализует matchMedia — там считаем окружение тачевым и
  // идём по пути fixed, как шиты делали всегда.
  return typeof window.matchMedia === 'function' && window.matchMedia(DESKTOP_QUERY).matches;
}

/**
 * Заблокировать прокрутку страницы. Возвращает функцию разблокировки;
 * вызывать ровно один раз (эффектный cleanup подходит).
 */
export function lockBodyScroll(): () => void {
  if (lockCount === 0) {
    const { body, documentElement: html } = document;
    const scrollY = window.scrollY;
    const fixed = !isDesktop();
    state = {
      scrollY,
      fixed,
      prev: {
        bodyOverflow: body.style.overflow,
        bodyPosition: body.style.position,
        bodyTop: body.style.top,
        bodyLeft: body.style.left,
        bodyRight: body.style.right,
        htmlOverflow: html.style.overflow,
      },
    };

    body.style.overflow = 'hidden';
    html.style.overflow = 'hidden';
    if (fixed) {
      body.style.position = 'fixed';
      body.style.top = `-${scrollY}px`;
      // Растягиваем через left/right, а не width: 100% — у body в globals.css
      // width: 100vw, и inline-100% на движках с классическим скроллбаром
      // делал бы страницу уже на ширину скроллбара («сжатый» контент).
      body.style.left = '0';
      body.style.right = '0';
    }
  }
  lockCount += 1;

  let released = false;
  return () => {
    if (released) return;
    released = true;
    lockCount = Math.max(0, lockCount - 1);
    if (lockCount > 0 || !state) return;

    const { body, documentElement: html } = document;
    const { prev, fixed, scrollY } = state;
    state = null;
    body.style.overflow = prev.bodyOverflow;
    html.style.overflow = prev.htmlOverflow;
    if (fixed) {
      body.style.position = prev.bodyPosition;
      body.style.top = prev.bodyTop;
      body.style.left = prev.bodyLeft;
      body.style.right = prev.bodyRight;
      window.scrollTo(0, scrollY);
    }
  };
}
