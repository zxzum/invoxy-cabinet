import { useCallback, useEffect, useRef, useState } from 'react';
import { type EnabledThemes, DEFAULT_ENABLED_THEMES } from '../types/theme';
import { themeColorsApi } from '../api/themeColors';
import { STORAGE_KEYS } from '../config/constants';
import { safeLocal } from '../utils/safeStorage';

export type Theme = 'dark' | 'light';

const THEME_KEY = STORAGE_KEYS.THEME;
const ENABLED_THEMES_KEY = STORAGE_KEYS.ENABLED_THEMES;
const ENABLED_THEMES_CHANGED_EVENT = 'enabledThemesChanged';
const THEME_CHANGED_EVENT = 'themeChanged';

async function fetchEnabledThemes(): Promise<EnabledThemes> {
  try {
    const data = await themeColorsApi.getEnabledThemes();
    safeLocal.setJson(ENABLED_THEMES_KEY, data);
    return data.dark || data.light ? data : DEFAULT_ENABLED_THEMES;
  } catch {
    return getCachedEnabledThemes();
  }
}

function getCachedEnabledThemes(): EnabledThemes {
  const cached = safeLocal.getJson<EnabledThemes>(ENABLED_THEMES_KEY, DEFAULT_ENABLED_THEMES);
  return cached.dark || cached.light ? cached : DEFAULT_ENABLED_THEMES;
}

function fallbackTheme(enabledThemes: EnabledThemes): Theme {
  return enabledThemes.dark ? 'dark' : 'light';
}

export function useTheme() {
  const [enabledThemes, setEnabledThemes] = useState<EnabledThemes>(getCachedEnabledThemes);
  const [isLoading, setIsLoading] = useState(true);
  const [theme, setThemeState] = useState<Theme>(() => {
    const enabled = getCachedEnabledThemes();
    const stored = safeLocal.getItem(THEME_KEY);
    return stored === 'light' && enabled.light
      ? 'light'
      : stored === 'dark' && enabled.dark
        ? 'dark'
        : fallbackTheme(enabled);
  });

  const themeRef = useRef(theme);
  themeRef.current = theme;

  useEffect(() => {
    fetchEnabledThemes().then((data) => {
      setEnabledThemes(data);
      setIsLoading(false);
      if (!data[themeRef.current]) setThemeState(fallbackTheme(data));
    });
  }, []);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== ENABLED_THEMES_KEY || !event.newValue) return;
      try {
        const data = JSON.parse(event.newValue) as EnabledThemes;
        setEnabledThemes(data);
        if (!data[theme]) setThemeState(fallbackTheme(data));
      } catch {
        // Ignore malformed cross-tab settings.
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [theme]);

  useEffect(() => {
    const onEnabledThemesChange = (event: CustomEvent<EnabledThemes>) => {
      const data = event.detail;
      setEnabledThemes(data);
      if (!data[theme]) setThemeState(fallbackTheme(data));
    };
    window.addEventListener(ENABLED_THEMES_CHANGED_EVENT, onEnabledThemesChange as EventListener);
    return () =>
      window.removeEventListener(
        ENABLED_THEMES_CHANGED_EVENT,
        onEnabledThemesChange as EventListener,
      );
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('light', theme === 'light');
    root.classList.toggle('dark', theme === 'dark');
    safeLocal.setItem(THEME_KEY, theme);
    window.dispatchEvent(new CustomEvent(THEME_CHANGED_EVENT, { detail: theme }));
  }, [theme]);

  useEffect(() => {
    const onThemeChange = (event: CustomEvent<Theme>) => setThemeState(event.detail);
    window.addEventListener(THEME_CHANGED_EVENT, onThemeChange as EventListener);
    return () => window.removeEventListener(THEME_CHANGED_EVENT, onThemeChange as EventListener);
  }, []);

  const setTheme = useCallback(
    (next: Theme) => {
      if (enabledThemes[next]) setThemeState(next);
    },
    [enabledThemes],
  );

  const toggleTheme = useCallback(() => {
    setThemeState((current) => {
      const next = current === 'dark' ? 'light' : 'dark';
      return enabledThemes[next] ? next : current;
    });
  }, [enabledThemes]);

  const refreshEnabledThemes = useCallback(() => {
    fetchEnabledThemes().then((data) => {
      setEnabledThemes(data);
      if (!data[theme]) setThemeState(fallbackTheme(data));
    });
  }, [theme]);

  return {
    theme,
    setTheme,
    toggleTheme,
    isDark: theme === 'dark',
    isLight: theme === 'light',
    enabledThemes,
    canToggle: !isLoading && enabledThemes.dark && enabledThemes.light,
    isLoading,
    refreshEnabledThemes,
  };
}

export function updateEnabledThemesCache(themes: EnabledThemes) {
  safeLocal.setJson(ENABLED_THEMES_KEY, themes);
  window.dispatchEvent(new CustomEvent(ENABLED_THEMES_CHANGED_EVENT, { detail: themes }));
}
