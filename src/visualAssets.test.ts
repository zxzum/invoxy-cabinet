import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const ASSETS = [
  'apps/happ.png',
  'apps/incy.png',
  'auth-background.png',
  'brand-mark.png',
  'desktop-shape-1.webp',
  'desktop-shape-2.webp',
  'desktop-shape-3.webp',
  'landing-hero.png',
  'landing-shield.png',
  'profile-balance-bg.webp',
  'promo-group-bg.webp',
  'referral-network-bg.png',
  'referral-robot.webp',
  'shape-1.webp',
  'shape-2.webp',
  'shape-3.webp',
  'shape-4.webp',
  'shape-5.webp',
  'subscription-bg-desktop.webp',
  'subscription-orb.webp',
  'subscription-status-bg.webp',
  'trial-card-bg.png',
  'trial-ribbon.png',
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

describe('migrated visual assets', () => {
  it('copies the approved case-sensitive asset set', () => {
    for (const asset of ASSETS) {
      expect(existsSync(new URL(`../public/images/${asset}`, import.meta.url))).toBe(true);
    }
  });

  it('resolves every migrated image reference in task-owned source files', () => {
    for (const sourceFile of TARGET_SOURCE_FILES) {
      const source = readFileSync(new URL(sourceFile, import.meta.url), 'utf8');
      for (const match of source.matchAll(/\/images\/([^"')\s?]+)/g)) {
        expect(existsSync(new URL(`../public/images/${match[1]}`, import.meta.url))).toBe(true);
      }
    }
  });
});
