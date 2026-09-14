import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const RUNTIME_ASSETS = [
  'auth-background.png',
  'brand-mark.png',
  'landing-hero.png',
  'landing-shield.png',
] as const;

const TARGET_SOURCE_FILES = [
  './pages/Landing.tsx',
  './pages/Login.tsx',
  './pages/VerifyEmail.tsx',
  './pages/ResetPassword.tsx',
  './pages/TelegramCallback.tsx',
  './pages/AutoLogin.tsx',
  './styles/globals.css',
];

function listFiles(directory: string, prefix = ''): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
    const fullPath = `${directory}/${entry.name}`;
    return entry.isDirectory() ? listFiles(fullPath, relativePath) : [relativePath];
  });
}

describe('migrated visual assets', () => {
  it('keeps only runtime-used assets in the public image tree', () => {
    const imageRoot = fileURLToPath(new URL('../public/images/', import.meta.url));

    expect(listFiles(imageRoot).sort()).toEqual([...RUNTIME_ASSETS].sort());

    for (const asset of RUNTIME_ASSETS) {
      expect(existsSync(new URL(`../public/images/${asset}`, import.meta.url))).toBe(true);
    }
  });

  it('resolves exactly the runtime image references in task-owned source files', () => {
    const references = new Set<string>();

    for (const sourceFile of TARGET_SOURCE_FILES) {
      const source = readFileSync(new URL(sourceFile, import.meta.url), 'utf8');
      for (const match of source.matchAll(/\/images\/([^"')\s?]+)/g)) {
        references.add(match[1]);
      }
    }

    expect([...references].sort()).toEqual([...RUNTIME_ASSETS].sort());
    for (const asset of references) {
      expect(existsSync(new URL(`../public/images/${asset}`, import.meta.url))).toBe(true);
    }
  });
});
