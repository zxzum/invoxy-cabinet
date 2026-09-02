import type { ThemeColors } from '../types/theme';

export type PaletteId = 'signal' | 'ember' | 'aurora' | 'forest' | 'midnight';

export interface Palette {
  id: PaletteId;
  labelRu: string;
  labelEn: string;
  swatch: string;
  colors: ThemeColors;
}

export const PALETTES: Record<PaletteId, Palette> = {
  signal: {
    id: 'signal',
    labelRu: 'Сигнал',
    labelEn: 'Signal',
    swatch: '#22d3ee',
    colors: {
      accent: '#22d3ee',
      darkBackground: '#05080f',
      darkSurface: '#0c141c',
      darkText: '#e8f4f8',
      darkTextSecondary: '#8aa4b0',
      lightBackground: '#d9f4f8',
      lightSurface: '#f3fcfd',
      lightText: '#0b1c22',
      lightTextSecondary: '#3d6a75',
      success: '#34d399',
      warning: '#f59e0b',
      error: '#f43f5e',
    },
  },
  ember: {
    id: 'ember',
    labelRu: 'Эмбер',
    labelEn: 'Ember',
    swatch: '#f97316',
    colors: {
      accent: '#f97316',
      darkBackground: '#0c0704',
      darkSurface: '#1a100a',
      darkText: '#fff4eb',
      darkTextSecondary: '#d6a07a',
      lightBackground: '#ffedd5',
      lightSurface: '#fff7ed',
      lightText: '#7c2d12',
      lightTextSecondary: '#c2410c',
      success: '#22c55e',
      warning: '#f59e0b',
      error: '#ef4444',
    },
  },
  aurora: {
    id: 'aurora',
    labelRu: 'Аврора',
    labelEn: 'Aurora',
    swatch: '#a78bfa',
    colors: {
      accent: '#a78bfa',
      darkBackground: '#080612',
      darkSurface: '#141024',
      darkText: '#f4f0ff',
      darkTextSecondary: '#b7a8d9',
      lightBackground: '#ede9fe',
      lightSurface: '#faf5ff',
      lightText: '#3b0764',
      lightTextSecondary: '#6b21a8',
      success: '#34d399',
      warning: '#f59e0b',
      error: '#f43f5e',
    },
  },
  forest: {
    id: 'forest',
    labelRu: 'Лес',
    labelEn: 'Forest',
    swatch: '#34d399',
    colors: {
      accent: '#34d399',
      darkBackground: '#06110c',
      darkSurface: '#0d1f16',
      darkText: '#ecfdf5',
      darkTextSecondary: '#86efac',
      lightBackground: '#d1fae5',
      lightSurface: '#ecfdf5',
      lightText: '#064e3b',
      lightTextSecondary: '#047857',
      success: '#22c55e',
      warning: '#f59e0b',
      error: '#ef4444',
    },
  },
  midnight: {
    id: 'midnight',
    labelRu: 'Полночь',
    labelEn: 'Midnight',
    swatch: '#60a5fa',
    colors: {
      accent: '#60a5fa',
      darkBackground: '#030712',
      darkSurface: '#0b1220',
      darkText: '#f1f5f9',
      darkTextSecondary: '#94a3b8',
      lightBackground: '#dbeafe',
      lightSurface: '#eff6ff',
      lightText: '#0f172a',
      lightTextSecondary: '#1e40af',
      success: '#22c55e',
      warning: '#f59e0b',
      error: '#ef4444',
    },
  },
};

export const PALETTE_LIST: Palette[] = [
  PALETTES.signal,
  PALETTES.ember,
  PALETTES.aurora,
  PALETTES.forest,
  PALETTES.midnight,
];

export const DEFAULT_PALETTE_ID: PaletteId = 'signal';

export function isPaletteId(value: string | null): value is PaletteId {
  return value !== null && value in PALETTES;
}
