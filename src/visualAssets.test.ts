import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const LUNA_ASSETS = [
  'subscription-bg-desktop.webp',
  'subscription-orb.webp',
  'trial-card-bg.png',
  'trial-ribbon.png',
  'referral-network-bg.png',
  'apps/happ.png',
  'apps/incy.png',
] as const;

const RUNTIME_ASSETS = [
  'auth-background.png',
  'brand-mark.png',
  'landing-hero.png',
  'landing-shield.png',
  ...LUNA_ASSETS,
] as const;

const LUNA_SOURCE_SHA256: Record<(typeof LUNA_ASSETS)[number], string> = {
  'subscription-bg-desktop.webp':
    '7834283926ccff1e9b28b2d40016fa6a5a9e29099e95ab96aa2fa5f70d978fdc',
  'subscription-orb.webp': '8deb20279d7944c7ff58ce41923560347e853cab7ffb462b28ca1808201d6ac7',
  'trial-card-bg.png': 'bbe183143a818bae92f52e12a8766266b4f31706903cda651e809a1a2ca100cd',
  'trial-ribbon.png': '12ff1303620ecc5f0c3ad6f6008798500321ff2d79bd461d027710306d4e5e1b',
  'referral-network-bg.png': 'ee30617e55f2d75fc56de5e4ec7a56c7a521d5aa31b58ce6c1e7db41fe51de9b',
  'apps/happ.png': 'fb6d72b89ad0a72dd0fcc99f4d98543016e0d8c084cde3933ed581b22bf1bd3f',
  'apps/incy.png': '729a2c7cf04ca2f194f958550f38bfe18099a6f8d5a041552f6dbd935c7904eb',
};

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

  it('copies Luna dashboard assets byte-for-byte from InvoxyStart', () => {
    const targetRoot = new URL('../public/images/', import.meta.url);

    for (const asset of LUNA_ASSETS) {
      const digest = createHash('sha256')
        .update(readFileSync(new URL(asset, targetRoot)))
        .digest('hex');

      expect(digest).toBe(LUNA_SOURCE_SHA256[asset]);
    }
  });

  it('keeps the Luna dashboard contract scoped to its wrapper', () => {
    const source = readFileSync(new URL('./styles/globals.css', import.meta.url), 'utf8');
    const start = source.indexOf('/* Luna dashboard contract */');
    const end = source.indexOf('/* End Luna dashboard contract */', start);
    const lunaCss = start >= 0 && end > start ? source.slice(start, end) : '';

    expect(lunaCss).toContain('.luna-dashboard');
    expect(lunaCss).toContain('.luna-dashboard .glass-panel');
    expect(lunaCss).toContain('.luna-dashboard .glass-control');
    expect(lunaCss).toContain('.luna-dashboard .motion-card');
    expect(lunaCss).toContain('.luna-dashboard .button-lift');
    expect(lunaCss).not.toMatch(
      /^\s*(?:html|body|:root|\.auth-page|\.landing-page|\.glass-panel|\.glass-control|\.motion-card|\.button-lift)\b/m,
    );
  });

  it('keeps Luna dashboard motion opt-out scoped and explicit', () => {
    const source = readFileSync(new URL('./styles/globals.css', import.meta.url), 'utf8');
    const start = source.indexOf('/* Luna dashboard contract */');
    const end = source.indexOf('/* End Luna dashboard contract */', start);
    const lunaCss = start >= 0 && end > start ? source.slice(start, end) : '';

    expect(lunaCss).toContain('@media (prefers-reduced-motion: reduce)');
    expect(lunaCss).toMatch(/\.luna-dashboard \.(?:motion-card|button-lift)/);
    expect(lunaCss).toContain('animation: none !important');
    expect(lunaCss).toContain('transition: none !important');
  });
});
