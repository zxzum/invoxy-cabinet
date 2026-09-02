import { useEffect } from 'react';
import type { EnabledThemes } from '../types/theme';
import { safeLocal } from '../utils/safeStorage';
import { STORAGE_KEYS } from '../config/constants';

export type Theme = 'dark' | 'light';

const THEME_KEY = STORAGE_KEYS.THEME;

/**
 * Кабинет тёмный всегда: единственный инструмент кастомизации — палитры
 * (PaletteSwitcher). Форма возврата хука сохранена исторически, чтобы не
 * трогать потребителей (isDark и т.д.); значение прибито к 'dark'.
 */
export function useTheme() {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light');
    root.classList.add('dark');
    safeLocal.setItem(THEME_KEY, 'dark');
  }, []);

  return {
    theme: 'dark' as Theme,
    setTheme: (_next: Theme) => {},
    toggleTheme: () => {},
    isDark: true,
    isLight: false,
    enabledThemes: { dark: true, light: false } as EnabledThemes,
    canToggle: false,
    isLoading: false,
    refreshEnabledThemes: () => {},
  };
}

// Кэш включённых тем остаётся: админка (настройки тем) обновляет его через
// updateEnabledThemesCache; пользовательский UI эти значения больше не читает.
const ENABLED_THEMES_KEY = STORAGE_KEYS.ENABLED_THEMES;
const ENABLED_THEMES_CHANGED_EVENT = 'enabledThemesChanged';

export function updateEnabledThemesCache(themes: EnabledThemes) {
  safeLocal.setJson(ENABLED_THEMES_KEY, themes);
  window.dispatchEvent(new CustomEvent(ENABLED_THEMES_CHANGED_EVENT, { detail: themes }));
}
