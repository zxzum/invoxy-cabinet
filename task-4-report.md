# Task 4 report

Repository: `cabinet`  
Branch: `feature/ui-overhaul`  
Base: `47600cd0`

## RED

Ran the required focused suite before the production changes:

```text
rtk npx vitest run src/pages/Dashboard.test.tsx src/pages/Subscriptions.test.tsx src/pages/Connection.test.tsx src/components/layout/AppShell/AppShell.test.tsx src/components/layout/AppShell/MobileBottomNav.test.tsx src/components/layout/AppShell/mobileNavRoutes.test.ts src/components/dashboard/subscriptionCardExpiredRenew.test.tsx
```

The baseline was 7 test files, 39 tests, with 9 failures. The failures covered the old `/` dashboard links/mobile route contract and the new dashboard/subscriptions error-state assertions.

## GREEN

The same focused command now passes: 7 test files, 42 tests passed.

Additional gates:

- `rtk npm run type-check` — passed.
- `rtk npx biome lint src/pages/Dashboard.test.tsx src/pages/Subscriptions.test.tsx src/pages/Connection.test.tsx` — passed.
- `rtk git diff --check` — passed.

The implementation keeps the existing `subscriptionApi` calls and `['subscriptions-list']` query key, adds target-owned retry states without domain fallbacks, moves authenticated shell home navigation to `/dashboard`, applies shared glass variants to the shell and target cards, and preserves connection URL/QR behavior for both HAPP and INCY links.

## Changed files

- `src/components/dashboard/SubscriptionCardExpired.tsx`
- `src/components/dashboard/subscriptionCardExpiredRenew.test.tsx`
- `src/components/layout/AppShell/AppHeader.tsx`
- `src/components/layout/AppShell/AppShell.test.tsx`
- `src/components/layout/AppShell/AppShell.tsx`
- `src/components/layout/AppShell/MobileBottomNav.test.tsx`
- `src/components/layout/AppShell/MobileBottomNav.tsx`
- `src/components/layout/AppShell/mobileNavRoutes.test.ts`
- `src/components/layout/AppShell/mobileNavRoutes.ts`
- `src/pages/Connection.test.tsx`
- `src/pages/Connection.tsx`
- `src/pages/ConnectionQR.tsx`
- `src/pages/Dashboard.test.tsx`
- `src/pages/Dashboard.tsx`
- `src/pages/RenewSubscription.tsx`
- `src/pages/Subscription.tsx`
- `src/pages/Subscriptions.test.tsx`
- `src/pages/Subscriptions.tsx`
- `task-4-report.md`

The source-only paths `SubscriptionCard.tsx`, `WelcomeCards.tsx`, and `QuickConnect.tsx` do not exist in this target checkout. They were not created or copied: the target already owns real-data equivalents, and copying the source versions would introduce the prohibited demo/fixed business values.

## Commit

This report is included in the final Task 4 commit. The exact SHA is returned in the final handoff.

## Self-review

- No dependencies, bot files, deploy files, or unrelated tracked files were changed.
- Pre-existing untracked `.codegraph/`, `AGENTS.md`, and `CLAUDE.md` were preserved and excluded from staging.
- No source demo branches, fake subscriptions, or fixed balance/price sentinels were introduced; `Dashboard.test.tsx` checks the Task 4 production paths for those sentinels.
- Full browser/dev-server QA was deferred as authorized; no browser setup was started.
- A full Biome check still reports unrelated pre-existing diagnostics outside the changed hunks in `AppShell.tsx`, `SubscriptionCardExpired.tsx`, and `Subscription.tsx`; focused tests, type-check, changed test lint, and diff checks are green.

## Fix round 1 — reviewer coverage

### RED

Added reviewer-directed coverage first, then ran the focused suite. The first test-only run exposed missing test-harness support for the real components: `initReactI18next`, `i18n.language`, jsdom `matchMedia`, and `scrollTo`. These were corrected in test setup only; no production defect was exposed and no production file was changed.

### GREEN

Focused command:

```text
rtk npx vitest run src/pages/Dashboard.test.tsx src/pages/Subscriptions.test.tsx src/pages/Connection.test.tsx src/components/layout/AppShell/AppHeader.test.tsx src/components/layout/AppShell/AppShell.test.tsx src/components/layout/AppShell/MobileBottomNav.test.tsx src/components/layout/AppShell/mobileNavRoutes.test.ts src/components/dashboard/subscriptionCardExpiredRenew.test.tsx
```

Result: 8 test files passed, 50 tests passed.

Additional gates:

- `rtk npm run type-check` — passed.
- `rtk npm run lint` — passed with 266 warnings and 101 informational diagnostics, with no lint errors.
- `rtk npm run build` — passed; Vite emitted only the existing large-chunk warning.
- Focused Biome lint for the four changed/new test files — passed.
- `rtk git diff --check` — passed.

### Reviewer coverage added

- `Dashboard.test.tsx` and `Subscriptions.test.tsx` now render the real changed subscription cards and assert API-backed tariff, traffic, renewal, expired-card, and real device-limit-sheet behavior.
- `Connection.test.tsx` now exercises page-level `getConnectionLink`, HAPP/INCY selection, hide-link behavior, and web/Telegram deep-link guards through the real page and installation guide.
- `AppHeader.test.tsx` directly covers the changed dashboard logo link and mobile menu dashboard link.
- The hardcoded-value scan now includes `SubscriptionPurchase` and its direct purchase components.

### Browser evidence

The Browser plugin was unavailable, so the approved Playwright fallback was used after the focused tests and build gates. Screenshots were captured outside the repository:

- Desktop: `/tmp/invoxy-task4-desktop.png` at `1440x900`.
- Mobile: `/tmp/invoxy-task4-mobile.png` at `375x812`.

Both visits to `http://127.0.0.1:5173/dashboard` redirected to `/login` because no authenticated browser session or backend configuration was supplied. The login shell was nonblank and had no framework error overlay; the mobile `Login with Email` interaction revealed the Email field. The browser console recorded repeated API 500 responses from the unauthenticated/unconfigured local environment. Authenticated dashboard, subscriptions, and connection browser flows therefore remain unverified and are explicitly not claimed here.

### Fix-round files

- `src/pages/Dashboard.test.tsx`
- `src/pages/Subscriptions.test.tsx`
- `src/pages/Connection.test.tsx`
- `src/components/layout/AppShell/AppHeader.test.tsx`
- `task-4-report.md`

No production files, dependencies, bot/deploy files, or unrelated work were changed. Pre-existing untracked `.codegraph/`, `AGENTS.md`, and `CLAUDE.md` were preserved and excluded from staging.

### Self-review

- The real component paths are rendered rather than mocked away for the requested card/page behaviors.
- API/query contracts and existing component APIs were reused; no demo business values or new dependencies were added.
- The test-only jsdom shims support the real responsive sheet without changing runtime behavior.
- Browser evidence is limited to the reachable unauthenticated shell because credentials/backend configuration were unavailable.
- Fix-round commit SHA is recorded in the final handoff after the explicit file-only commit.
