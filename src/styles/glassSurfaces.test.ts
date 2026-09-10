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
    expect(css).toContain('.card-interactive.card-selected');
  });

  it('does not elevate every role dialog as a glass surface', () => {
    const css = readFileSync(new URL('./globals.css', import.meta.url), 'utf8');

    expect(css).not.toContain('[role="dialog"]');
  });
});
