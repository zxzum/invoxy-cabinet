// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useTheme } from './useTheme';

vi.mock('../api/themeColors', () => ({
  themeColorsApi: {
    getEnabledThemes: vi.fn().mockResolvedValue({ dark: true, light: true }),
  },
}));

describe('useTheme', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = '';
  });

  it('defaults to dark and allows switching to light', async () => {
    const { result } = renderHook(() => useTheme());

    expect(result.current.theme).toBe('dark');
    expect(result.current.isDark).toBe(true);
    expect(result.current.isLight).toBe(false);
    await waitFor(() => expect(result.current.canToggle).toBe(true));

    act(() => result.current.toggleTheme());
    expect(result.current.theme).toBe('light');
    act(() => result.current.setTheme('dark'));
    expect(result.current.theme).toBe('dark');
  });

  it('marks the document as dark', () => {
    renderHook(() => useTheme());
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.classList.contains('light')).toBe(false);
  });
});
