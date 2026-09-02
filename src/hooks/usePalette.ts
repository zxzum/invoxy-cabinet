import { useCallback, useEffect, useState } from 'react';
import { applyThemeColors } from './useThemeColors';
import { DEFAULT_PALETTE_ID, PALETTES, isPaletteId, type PaletteId } from '../config/palettes';
import { hexToRgb } from '../utils/colorConversion';
import { safeLocal } from '../utils/safeStorage';
import { STORAGE_KEYS } from '../config/constants';

const PALETTE_CHANGED = 'invoxy-palette-changed';

function loadPaletteId(): PaletteId {
  const stored = safeLocal.getItem(STORAGE_KEYS.PALETTE);
  return isPaletteId(stored) ? stored : DEFAULT_PALETTE_ID;
}

let paletteFadeTimer: number | undefined;

export function applyPaletteVars(id: PaletteId, animate = false): void {
  const root = document.documentElement;
  if (animate) {
    // Кроссфейд цветов: класс вешаем на переход, снимаем по таймеру
    // (см. html.palette-fade в globals.css). Повторный выбор до истечения
    // таймера сбрасывает его, чтобы класс не «залип».
    root.classList.add('palette-fade');
    if (paletteFadeTimer !== undefined) window.clearTimeout(paletteFadeTimer);
    paletteFadeTimer = window.setTimeout(() => {
      root.classList.remove('palette-fade');
      paletteFadeTimer = undefined;
    }, 500);
  }
  const palette = PALETTES[id];
  applyThemeColors(palette.colors);
  root.dataset.palette = id;
  const accent = hexToRgb(palette.colors.accent);
  root.style.setProperty('--ix-accent-rgb', `${accent.r}, ${accent.g}, ${accent.b}`);
  root.style.setProperty('--ix-glow', `rgba(${accent.r}, ${accent.g}, ${accent.b}, 0.38)`);
}

export function usePalette() {
  const [paletteId, setPaletteId] = useState<PaletteId>(loadPaletteId);

  useEffect(() => {
    applyPaletteVars(paletteId);
  }, [paletteId]);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEYS.PALETTE && isPaletteId(event.newValue)) {
        setPaletteId(event.newValue);
      }
    };
    const onLocal = (event: Event) => {
      const id = (event as CustomEvent<PaletteId>).detail;
      if (isPaletteId(id)) setPaletteId(id);
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener(PALETTE_CHANGED, onLocal);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(PALETTE_CHANGED, onLocal);
    };
  }, []);

  const setPalette = useCallback((id: PaletteId) => {
    safeLocal.setItem(STORAGE_KEYS.PALETTE, id);
    setPaletteId(id);
    applyPaletteVars(id, true);
    window.dispatchEvent(new CustomEvent(PALETTE_CHANGED, { detail: id }));
  }, []);

  return {
    paletteId,
    palette: PALETTES[paletteId],
    setPalette,
  };
}
