import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const LUNA_ASSETS = [
  'subscription-bg-desktop.webp',
  'subscription-orb.webp',
  'trial-card-bg.webp',
  'trial-ribbon.webp',
  'referral-network-bg.webp',
  'apps/happ.png',
  'apps/incy.png',
] as const;

const MIGRATED_ASSETS = [
  'auth-background.png',
  'brand-mark.png',
  'landing-hero.png',
  'landing-shield.png',
  'desktop-shape-1.webp',
  'desktop-shape-2.webp',
  'desktop-shape-3.webp',
  'profile-balance-bg.webp',
  'promo-group-bg.webp',
  'referral-robot.webp',
  'shape-1.webp',
  'shape-2.webp',
  'shape-3.webp',
  'shape-4.webp',
  'shape-5.webp',
  'subscription-status-bg.webp',
  'trial-gift.png',
  'trial-ribbon-compact.webp',
  'apps/invoxy.png',
  ...LUNA_ASSETS,
] as const;

const WIRED_RUNTIME_ASSETS = [
  'brand-mark.png',
  'landing-hero.png',
  'landing-shield.png',
  'desktop-shape-1.webp',
  'desktop-shape-2.webp',
  'profile-balance-bg.webp',
  'promo-group-bg.webp',
  'referral-robot.webp',
  ...LUNA_ASSETS,
] as const;

const LUNA_SOURCE_SHA256: Record<(typeof LUNA_ASSETS)[number], string> = {
  'subscription-bg-desktop.webp':
    '7834283926ccff1e9b28b2d40016fa6a5a9e29099e95ab96aa2fa5f70d978fdc',
  'subscription-orb.webp': '8deb20279d7944c7ff58ce41923560347e853cab7ffb462b28ca1808201d6ac7',
  'trial-card-bg.webp': 'c10839e56c67ca9c8a872af94033e49859c8b70f3f83b04885b546063a270088',
  'trial-ribbon.webp': '8e6fe988879a633108364136477929a62204eda5bddd3e0e1205edbcc6490dcc',
  'referral-network-bg.webp': '87568ac98816bbef6f194f57a2ef4c45b30fb151a97ebdfb3654d9b59fa4569a',
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
  './pages/Profile.tsx',
  './pages/Referral.tsx',
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
  it('keeps the migrated source assets in the public image tree', () => {
    const imageRoot = fileURLToPath(new URL('../public/images/', import.meta.url));

    expect(listFiles(imageRoot).sort()).toEqual([...MIGRATED_ASSETS].sort());

    for (const asset of MIGRATED_ASSETS) {
      expect(existsSync(new URL(`../public/images/${asset}`, import.meta.url))).toBe(true);
    }
  });

  it('resolves exactly the wired runtime image references in task-owned source files', () => {
    const references = new Set<string>();

    for (const sourceFile of TARGET_SOURCE_FILES) {
      const source = readFileSync(new URL(sourceFile, import.meta.url), 'utf8');
      for (const match of source.matchAll(/\/images\/([^"')\s?]+)/g)) {
        references.add(match[1]);
      }
    }

    expect([...references].sort()).toEqual([...WIRED_RUNTIME_ASSETS].sort());
    for (const asset of references) {
      expect(existsSync(new URL(`../public/images/${asset}`, import.meta.url))).toBe(true);
    }
  });

  // Re-encoded to WebP at display resolution (the PNG originals were ~1.5 MB each).
  it('pins the Luna dashboard assets byte-for-byte', () => {
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
