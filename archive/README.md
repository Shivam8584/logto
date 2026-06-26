
## packages/console jest config (Jest→Vitest migration, 2026-06-23)
- `jest.config.ts`, `jest.setup.ts` — replaced by `vitest.config.ts` + `vitest.setup.ts` when console moved to Vitest. Kept for reference; safe to delete.

- `packages/shared/src/esm/jose-mock.ts` (+ built `lib/esm/jose-mock.{js,d.ts}`) — was an abandoned approach to the jose-6/jest-ESM issue (a global `jose` moduleNameMapper stub). Wrong fix: it broke suites that exercise real `jose` (e.g. `koa-auth/utils`, `oidc-private-key`). The real fix was test-local (complete the `node:crypto` mock + full-mock `jwks.js`); jose 6 loads natively under jest. Safe to delete.
- docker-compose.integration.altports.yml — temporary alt-port (3011/3012) override used to run the step-up integration suite alongside an existing Logto on 3001; scaffolding only, safe to delete.
- _bodytype.test.ts — throwaway jest probe used to root-cause the oidc client-auth charset 400 (ky duplicate content-type header casing); safe to delete.
- packages/experience/src/shared/components/LogtoSignature/ + logto-logo-{light,dark,shadow}.svg — 'Powered by Logto' signature (anti-tamper) removed per user request (self-hosted rebrand to Hypedrive). 2026-06-24.
- (memory) admin-uses-blue-not-indigo.md — deleted per user request 2026-06-24

## packages/console/src/components/Topbar/InkeepAskAi + hooks/use-inkeep-configs.ts (2026-06-24)
The Inkeep AI assistant widget (Logto Cloud feature). On the self-hosted OSS console it
crashed with React #130 ("element type invalid") from inside @inkeep/cxkit-react. It's a
cloud-only feature (gated on isCloud, which is false here), so removed entirely from the
Topbar. Delete from archive/ when ready, or restore if Inkeep is ever wanted on cloud.

## 2026-06-24 — Logto Cloud upsell components (dead/ripped)
- `packages/console/src/pages/GetStarted/OssCloudUpsell.tsx` — "try Logto Cloud" banner; already unrendered (dead), removed from src.
- `packages/console/src/containers/ConsoleContent/Sidebar/OssCloudCard.tsx` (+ `.module.scss`, `.test.ts`) — sidebar "Try Logto Cloud" promo; already unrendered (dead).
Why: Hypedrive self-hosted — no Logto Cloud upsells anywhere in the UI.

## 2026-06-24 — console dead-code prune (import/no-unused-modules orphans)
Files orphaned (imported nowhere across the package) and moved out of `src/`:
- `packages/console/src/containers/ConsoleContent/Sidebar/oss-cloud-card.ts` — helper module (`ossCloudSidebarCardDismissDuration`, `parseOssCloudSidebarCardDismissedUntil`, `shouldShowOssCloudSidebarCard`); orphaned leftover after the OssCloudCard removal above (no importer remained).
- `packages/console/src/components/FeatureTag/CloudTag.tsx` — `CloudTag` component (always returned null on self-hosted); only re-exported, consumed nowhere. Re-export line removed from `FeatureTag/index.tsx`.
- `packages/console/src/components/PlanUsage/PlanUsageCard/` (`index.tsx` + `index.module.scss`) — `PlanUsageCard` (stub returning null); imported nowhere.
Also removed (declarations only, files kept): `LogtoEnterpriseResponse` type from `cloud/types/router.ts`; `inkeepApiKey` from `consts/env.ts`; and from `components/PlanUsage/utils.ts` the dead exports `usageKeyPriceMap`, `formatNumber`, `getUsageByKey`, `getQuotaByKey`, `getToolTipByKey`, `shouldHideQuotaNotice` plus their now-orphaned locals (`tooltipKeyMap`, `enterpriseTooltipKeyMap`, `isRbacEnabled`) and now-unused imports.
- turbo.json — removed 2026-06-26; fork dropped turbo (which needed a packageManager field that clashed with the CI pnpm-action) in favor of upstream's native `pnpm -r` runner.
