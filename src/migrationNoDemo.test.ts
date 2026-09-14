import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const migratedRuntimeFiles = [
  './App.tsx',
  './pages/Landing.tsx',
  './pages/Login.tsx',
  './pages/Dashboard.tsx',
  './pages/Subscriptions.tsx',
  './pages/Subscription.tsx',
  './pages/SubscriptionPurchase.tsx',
  './pages/Connection.tsx',
  './pages/Profile.tsx',
  './pages/Balance.tsx',
  './pages/SavedCards.tsx',
  './pages/Referral.tsx',
  './pages/Support.tsx',
  './pages/Info.tsx',
  './pages/News.tsx',
  './pages/Polls.tsx',
  './pages/Contests.tsx',
  './pages/Wheel.tsx',
  './components/layout/AppShell/AppShell.tsx',
  './components/layout/AppShell/AppHeader.tsx',
  './components/payment/TariffPaymentSheet.tsx',
];

const FORBIDDEN_RUNTIME_MARKERS: readonly [string, RegExp][] = [
  ['demo route', /\/demo\b/],
  ['DemoEntry', /\bDemoEntry\b/],
  ['invoxy_demo', /\binvoxy_demo\b/],
  ['fallback tariffs', /\bFALLBACK_PLANS\b/],
  ['demo subscription identifiers', /\bdemoSubscriptions?\b|Travel LTE|750 ГБ/],
  ['fixed sample tariffs', /\b(?:120|200|400)\s*₽/],
  ['fixed sample balances', /\b(?:2490|2\s*490)\s*₽?/],
  ['unconfigured support link', /t\.me\/invoxyvpn/],
  ['fallback invoxy_bot link', /\binvoxy_bot\b/],
];

describe('migrated runtime demo markers', () => {
  it('contains no source demo data or unconfigured external bot fallback', () => {
    const violations = migratedRuntimeFiles.flatMap((file) => {
      const source = readFileSync(new URL(file, import.meta.url), 'utf8');
      return FORBIDDEN_RUNTIME_MARKERS.filter(([, marker]) => marker.test(source)).map(
        ([name]) => `${file}: ${name}`,
      );
    });

    expect(violations).toEqual([]);
  });
});
