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
