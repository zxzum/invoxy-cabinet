import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync(new URL('./globals.css', import.meta.url), 'utf8');

describe('Invoxy visual migration', () => {
  it('keeps the target glass system while exposing landing and auth paint', () => {
    expect(css).toContain('.glass-surface');
    expect(css).toContain('.glass-surface-elevated');
    expect(css).toContain('.glass-surface-accent');
    expect(css).toMatch(/\.glass-surface,[\s\S]*\.card-inset\s*\{[\s\S]*backdrop-filter/);
    expect(css).toContain('.auth-page');
    expect(css).toContain('.landing-page');
    expect(css).toContain('url("/images/auth-background.png")');
    expect(css).toMatch(/\.light\s+\.glass-surface/);
    expect(css).toMatch(/\.light\s+\.glass-surface-elevated/);
  });

  it('preserves both theme variables and reduced-motion ownership', () => {
    expect(css).toContain('--color-dark-950');
    expect(css).toContain('--color-champagne-950');
    expect(css).toContain('@media (prefers-reduced-motion: reduce)');
    expect(css).toContain('--mobile-nav-clearance');
    expect(css).toContain('env(safe-area-inset-bottom');
  });

  it('keeps raised sheet/dialog surfaces explicit', () => {
    const sheet = readFileSync(new URL('../components/ui/Sheet.tsx', import.meta.url), 'utf8');
    const responsiveSheet = readFileSync(
      new URL('../components/ui/ResponsiveSheet.tsx', import.meta.url),
      'utf8',
    );

    expect(sheet).toContain('glass-surface-elevated');
    expect(responsiveSheet).toContain('glass-surface-elevated');
  });
});
