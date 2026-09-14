// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import fa from '../locales/fa.json';
import en from '../locales/en.json';
import ru from '../locales/ru.json';
import zh from '../locales/zh.json';
import Landing from './Landing';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
  }),
}));

beforeEach(() => {
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

function renderLanding() {
  return render(
    <MemoryRouter>
      <Landing />
    </MemoryRouter>,
  );
}

const LANDING_KEYS = [
  'landing.featureFastTitle',
  'landing.featureFastText',
  'landing.featureSimpleTitle',
  'landing.featureSimpleText',
  'landing.featureFreedomTitle',
  'landing.featureFreedomText',
  'landing.stepOneLabel',
  'landing.stepOneTitle',
  'landing.stepOneText',
  'landing.stepTwoLabel',
  'landing.stepTwoTitle',
  'landing.stepTwoText',
  'landing.stepThreeLabel',
  'landing.stepThreeTitle',
  'landing.stepThreeText',
  'landing.openTelegram',
  'landing.home',
  'landing.navFeatures',
  'landing.navSecurity',
  'landing.navStart',
  'landing.eyebrow',
  'landing.heroTitle',
  'landing.heroTitleAccent',
  'landing.heroText',
  'landing.register',
  'landing.promiseSimple',
  'landing.promiseReadable',
  'landing.promiseControl',
  'landing.heroImageAlt',
  'landing.statusLabel',
  'landing.statusProtected',
  'landing.readyLabel',
  'landing.readyText',
  'landing.tileSecure',
  'landing.tileSimple',
  'landing.tileControl',
  'landing.featuresEyebrow',
  'landing.featuresTitle',
  'landing.featuresTitleMuted',
  'landing.shieldAlt',
  'landing.shieldCaption',
  'landing.stepsEyebrow',
  'landing.stepsTitle',
  'landing.stepsText',
  'landing.encryption',
  'landing.ctaEyebrow',
  'landing.ctaTitle',
  'landing.ctaTitleAccent',
  'landing.ctaText',
  'landing.openCabinet',
  'landing.footer',
  'landing.telegramSupport',
] as const;

const locales = { ru, en, zh, fa } as const;
const SHARED_LANDING_KEYS = new Set([
  'landing.stepOneLabel',
  'landing.stepTwoLabel',
  'landing.stepThreeLabel',
]);

function translationValue(locale: typeof ru | typeof en | typeof zh | typeof fa, key: string) {
  return key
    .split('.')
    .slice(1)
    .reduce<unknown>((value, part) => (value as Record<string, unknown>)?.[part], locale.landing);
}

describe('Landing', () => {
  it('uses configured branding and the configured Telegram CTA', () => {
    vi.stubEnv('VITE_APP_NAME', 'Configured Cabinet');
    vi.stubEnv('VITE_TELEGRAM_BOT_USERNAME', 'configured_bot');

    renderLanding();

    expect(screen.getAllByText('Configured Cabinet').length).toBeGreaterThan(0);
    expect(screen.getByRole('img', { name: 'Configured Cabinet' })).toBeTruthy();
    expect(
      screen
        .getAllByRole('link', { name: /telegram/i })
        .some((link) => link.getAttribute('href') === 'https://t.me/configured_bot'),
    ).toBe(true);
  });

  it('omits the direct Telegram CTA when no username is configured', () => {
    vi.stubEnv('VITE_APP_NAME', 'Configured Cabinet');
    vi.stubEnv('VITE_TELEGRAM_BOT_USERNAME', '');

    renderLanding();

    expect(screen.queryAllByRole('link', { name: /telegram/i })).toHaveLength(0);
  });

  it('does not render static business data or a fixed Telegram domain', () => {
    renderLanding();

    expect(screen.queryByText(/120 ₽|200 ₽|400 ₽|350 ГБ|750 ГБ|1000 ГБ/)).toBeNull();
  });

  it('restores source section navigation anchors', () => {
    renderLanding();

    expect(screen.getByRole('link', { name: 'landing.navFeatures' }).getAttribute('href')).toBe(
      '#features',
    );
    expect(screen.getByRole('link', { name: 'landing.navSecurity' }).getAttribute('href')).toBe(
      '#security',
    );
    expect(screen.getByRole('link', { name: 'landing.navStart' }).getAttribute('href')).toBe(
      '#start',
    );
  });

  it('has complete non-Russian landing copy in every supported locale', () => {
    const russian = locales.ru;

    for (const [localeName, locale] of Object.entries(locales)) {
      for (const key of LANDING_KEYS) {
        const value = translationValue(locale, key);
        expect(value, `${localeName}.${key}`).toEqual(expect.any(String));
        expect((value as string).trim(), `${localeName}.${key}`).not.toBe('');

        if (localeName !== 'ru' && !SHARED_LANDING_KEYS.has(key)) {
          expect(value, `${localeName}.${key} should not fall back to Russian`).not.toBe(
            translationValue(russian, key),
          );
        }
      }
    }
  });

  it('does not rely on inline fallbacks for landing copy', () => {
    const source = readFileSync('src/pages/Landing.tsx', 'utf8');

    expect(source).not.toMatch(/t\(\s*["']landing\.[^"']+["']\s*,/);
  });
});
