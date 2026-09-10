import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('liquid glass surfaces', () => {
  it('defines one three-variant glass system and maps legacy surfaces', () => {
    const css = readFileSync(new URL('./globals.css', import.meta.url), 'utf8');

    expect(css).toContain('.glass-surface');
    expect(css).toContain('.glass-surface-elevated');
    expect(css).toContain('.glass-surface-accent');
    expect(css).toMatch(/\.bento-card,[\s\S]*backdrop-filter/);
    expect(css).not.toMatch(/\.card-inset[^}]*background:\s*rgb\(/);
  });

  it('keeps shared declarations in the component layer for modifiers', () => {
    const css = readFileSync(new URL('./globals.css', import.meta.url), 'utf8');

    expect(css).toMatch(/@layer components \{\s*\/\* One three-variant system/);
    expect(css).toContain('.card-inset.card-selected');
    expect(css).toMatch(
      /\.card-inset\.card-selected,\s*\.card-inset\.card-selected:hover\s*\{\s*@apply border-accent-500 bg-accent-500\/10;\s*\}/,
    );
    expect(css).toContain('.card-interactive.card-selected');
  });

  it('uses explicit elevation classes for active sheet and dialog surfaces', () => {
    const css = readFileSync(new URL('./globals.css', import.meta.url), 'utf8');
    const sheet = readFileSync(new URL('../components/ui/Sheet.tsx', import.meta.url), 'utf8');
    const responsiveSheet = readFileSync(
      new URL('../components/ui/ResponsiveSheet.tsx', import.meta.url),
      'utf8',
    );

    expect(css).not.toContain('[role="dialog"]');
    expect(sheet).toContain('glass-surface-elevated');
    expect(sheet).toContain('sheet-content');
    expect(responsiveSheet).toContain('glass-surface-elevated');
    expect(responsiveSheet).toContain('dialog-content');
  });
});
