import { useMemo } from 'react';
import { getTrafficZone, type TrafficColorKey } from '../utils/trafficZone';
import { usePalette } from './usePalette';
import type { ThemeColors } from '../types/theme';

const FALLBACKS: Record<TrafficColorKey, string> = {
  accent: '#3b82f6',
  warning: 'rgb(var(--color-urgent-400))',
  error: 'rgb(var(--color-critical-500))',
};

const COLOR_MAP: Record<TrafficColorKey, keyof ThemeColors> = {
  accent: 'accent',
  warning: 'warning',
  error: 'error',
};

export function useTrafficZone(percent: number) {
  // Цвета — из выбранной палитры (она же применена на :root), а не из
  // /branding/colors: иначе индикатор трафика расходился бы с темой страницы.
  const { palette } = usePalette();
  const colors = palette.colors;
  const zone = useMemo(() => getTrafficZone(percent), [percent]);
  const mainHex = useMemo(() => {
    const key = zone.colorKey;
    return colors[COLOR_MAP[key]] || FALLBACKS[key];
  }, [zone.colorKey, colors]);

  return { ...zone, mainHex, colors };
}
