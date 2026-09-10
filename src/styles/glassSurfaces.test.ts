import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('liquid glass surfaces', () => {
  it('defines one three-variant glass system and maps legacy surfaces', () => {
    const css = readFileSync(new URL('./globals.css', import.meta.url), 'utf8');

    expect(css).toContain('.glass-surface');
    expect(css).toContain('.glass-surface-elevated');
    expect(css).toContain('.glass-surface-accent');
    expect(css).toMatch(/\.glass-surface,[\s\S]*\.card-inset\s*\{[\s\S]*backdrop-filter/);
    expect(css).not.toMatch(/\.glass-surface-elevated,\s*\.card-inset,/);
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

  it('keeps the elevated nav override and tariff row anatomy explicit', () => {
    const css = readFileSync(new URL('./globals.css', import.meta.url), 'utf8');
    const nav = readFileSync(
      new URL('../components/layout/AppShell/MobileBottomNav.tsx', import.meta.url),
      'utf8',
    );
    const tariffGrid = readFileSync(
      new URL('../components/subscription/purchase/TariffPickerGrid.tsx', import.meta.url),
      'utf8',
    );

    expect(css).toContain('.ix-island:not(.glass-surface-elevated)');
    expect(nav).toContain("'ix-island glass-surface-elevated'");
    expect(nav).toContain("style={{ bottom: 'var(--mobile-nav-offset)' }}");
    expect(css).toContain('grid-template-rows: minmax(7rem, 1fr) auto auto auto;');
    expect(tariffGrid).toMatch(
      /data-tariff-features[\s\S]*?className="flex flex-wrap items-start content-start gap-2"/,
    );
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
