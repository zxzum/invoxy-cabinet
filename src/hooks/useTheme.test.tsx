// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useTheme } from './useTheme';

describe('useTheme (dark-only)', () => {
  it('pins the theme to dark and disables toggling', () => {
    const { result } = renderHook(() => useTheme());

    expect(result.current.theme).toBe('dark');
    expect(result.current.isDark).toBe(true);
    expect(result.current.isLight).toBe(false);
    expect(result.current.canToggle).toBe(false);

    // no-op вызовы не должны бросать
    result.current.setTheme('light');
    result.current.toggleTheme();
    expect(result.current.theme).toBe('dark');
  });

  it('marks the document as dark', () => {
    renderHook(() => useTheme());
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.classList.contains('light')).toBe(false);
  });
});
