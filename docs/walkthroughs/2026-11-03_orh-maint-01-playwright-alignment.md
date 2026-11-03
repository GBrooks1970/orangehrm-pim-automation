# Walkthrough — OrangeHRM Playwright 1.63.0 & Serenity/JS 3.47.2 Alignment (`ORH-MAINT-01`)

## Executive Summary
Actioned the approved `ORH-MAINT-01` implementation plan (Action 2) for `orangehrm-pim-automation` to resolve the `TS2345` `Type-check` failure on `main` (run `35924973904`). Direct `playwright` is now aligned to `1.63.0` alongside `@serenity-js/*@3.47.2` so a single `playwright-core@1.63.0` instance resolves at root, transitive `follow-redirects` is refreshed to `1.16.2` (`0` audit vulnerabilities), the Dependabot Playwright hold is advanced to `>=1.64.0`, and a new compatibility guard in `scripts/playwright-compatibility.ts` (backed by 6 unit tests and wired into `npm run test:project-contract`) prevents future split-core updates. All local gates, the local Docker 7/7 E2E suite, and GitHub Actions CI run [`41695679629`](https://github.com/GBrooks1970/orangehrm-pim-automation/actions/runs/41695679629) on draft [PR #50](https://github.com/GBrooks1970/orangehrm-pim-automation/pull/50) passed in full.

---

## 1. Changes Implemented

### Dependency & Lockfile Alignment
- [package.json](file:///d:/_CLAUDE_COWORK/PROJ001/claude-outputs/test-automation-portfolio/orangehrm-pim-automation/package.json): Updated direct `playwright` from `1.62.1` to `1.63.0` to satisfy `@serenity-js/playwright@3.47.2`'s peer requirement (`playwright-core: ~1.63.0`), and registered `tests/unit/playwright-compatibility.test.ts` in `test:unit`.
- [package-lock.json](file:///d:/_CLAUDE_COWORK/PROJ001/claude-outputs/test-automation-portfolio/orangehrm-pim-automation/package-lock.json): Regenerated via npm so `playwright@1.63.0` and `@serenity-js/playwright@3.47.2` deduplicate to root `node_modules/playwright-core@1.63.0` (eliminating the nested `node_modules/playwright/node_modules/playwright-core@1.62.1` package that caused two conflicting `Browser` type identities). Also refreshed transitive `follow-redirects` from `1.16.0` to `1.16.2` within `axios@1.20.0`'s existing `^1.16.0` range to clear three High advisories (`GHSA-q3jh-wrc6-jgq8`, `GHSA-8r9p-f939-6h3c`, `GHSA-mrwp-f3q8-3g9p`).

### Single-Core Compatibility Guard & Unit Tests
- [playwright-compatibility.ts](file:///d:/_CLAUDE_COWORK/PROJ001/claude-outputs/test-automation-portfolio/orangehrm-pim-automation/scripts/playwright-compatibility.ts): New module exporting [`verifyPlaywrightSerenityCompatibility`](file:///d:/_CLAUDE_COWORK/PROJ001/claude-outputs/test-automation-portfolio/orangehrm-pim-automation/scripts/playwright-compatibility.ts#L74-L216) and [`satisfiesPeerRange`](file:///d:/_CLAUDE_COWORK/PROJ001/claude-outputs/test-automation-portfolio/orangehrm-pim-automation/scripts/playwright-compatibility.ts#L33-L72). Enforces that:
  1. All direct `@serenity-js/*` dependencies in `package.json` share one exact version.
  2. Root and `node_modules/*` entries in `package-lock.json` match `package.json`.
  3. Exactly one `playwright-core` entry exists in `package-lock.json` (at root `node_modules/playwright-core`), with no nested duplicate.
  4. That resolved `playwright-core` version satisfies `@serenity-js/playwright`'s `peerDependencies['playwright-core']` range.
  5. `.github/dependabot.yml` holds `playwright` at the next minor (`>=1.64.0`).
- [playwright-compatibility.test.ts](file:///d:/_CLAUDE_COWORK/PROJ001/claude-outputs/test-automation-portfolio/orangehrm-pim-automation/tests/unit/playwright-compatibility.test.ts): 6 deterministic unit tests covering the aligned `3.47.2` / `1.63.0` fixture, the captured `1.62.1` / `~1.63.0` split-core failure fixture (must-fail check), out-of-range single core, mismatched direct `@serenity-js/*` versions, stale Dependabot hold floor, and semver peer-range evaluation.
- [verify-project-contract.ts](file:///d:/_CLAUDE_COWORK/PROJ001/claude-outputs/test-automation-portfolio/orangehrm-pim-automation/scripts/verify-project-contract.ts): Wired `verifyPlaywrightSerenityCompatibility(manifest, lockfile, dependabotYaml)` into `npm run test:project-contract`.

### Dependabot Hold, Policy & Governance Records
- [dependabot.yml](file:///d:/_CLAUDE_COWORK/PROJ001/claude-outputs/test-automation-portfolio/orangehrm-pim-automation/.github/dependabot.yml): Advanced the `playwright` ignore floor from `>=1.63.0` to `>=1.64.0`.
- [dependency-policy.md](file:///d:/_CLAUDE_COWORK/PROJ001/claude-outputs/test-automation-portfolio/orangehrm-pim-automation/docs/dependency-policy.md): Updated the Serenity/Playwright baseline to `3.47.2` / `1.63.0` and documented that grouped updates must advance `playwright` and its Dependabot hold together whenever `@serenity-js/playwright`'s peer minor moves.
- [backlog.md](file:///d:/_CLAUDE_COWORK/PROJ001/claude-outputs/test-automation-portfolio/orangehrm-pim-automation/docs/backlog.md), [2026-11-03_orh-maint-01-playwright-alignment.md](file:///d:/_CLAUDE_COWORK/PROJ001/claude-outputs/test-automation-portfolio/orangehrm-pim-automation/docs/implementation-plans/2026-11-03_orh-maint-01-playwright-alignment.md), [_index.md](file:///d:/_CLAUDE_COWORK/PROJ001/claude-outputs/test-automation-portfolio/orangehrm-pim-automation/docs/implementation-plans/_index.md), and [2026-11-03_orh-maint-01-playwright-alignment.md (log)](file:///d:/_CLAUDE_COWORK/PROJ001/claude-outputs/test-automation-portfolio/orangehrm-pim-automation/docs/implementation-logs/2026-11-03_orh-maint-01-playwright-alignment.md): Recorded owner approval, closed `ORH-MAINT-01` with full local and CI evidence, and appended the immutable implementation log.

---

## 2. Verification & Test Evidence

### Verification Table

| Command | Quality Gate / Suite | Status | Metrics (Passed/Total) | Duration |
|---|---|---|---|---|
| `npm ci` & `npm ls` | Clean install & single `playwright-core@1.63.0` deduplication | ✅ PASS | 212 packages added, 1 `playwright-core` | 47.0s |
| `npm run typecheck` | TypeScript compiler (`tsc --noEmit`) | ✅ PASS | 0 errors | 2.8s |
| `npm run test:unit` | Node built-in unit test runner | ✅ PASS | 32/32 tests passed (0 failed) | 6.28s |
| `npm audit --audit-level=high` | High/Critical vulnerability gate | ✅ PASS | 0 vulnerabilities (213 packages audited) | 1.9s |
| `npm run test:target-contract` | Loopback-only target safety contract | ✅ PASS | 2/2 profiles verified | 1.8s |
| `npm run test:project-contract` | Project, CI, peer alignment & Markdown link contract | ✅ PASS | `default=7`, `smoke=1`, 7 CI calls, 27 MD files | 8.4s |
| `npm run test:readiness` | Installed OrangeHRM login & authenticated PIM API probe | ✅ PASS | 1/1 attempt | 1.45s |
| `npm run test:api-contract` | Local Docker employee fixture create/reuse/read-back | ✅ PASS | 1/1 contract test | 4.26s |
| `npm test` | Full Screenplay E2E suite against local Docker stack | ✅ PASS | 7/7 scenarios passed | 53.37s (57.55s real) |
| GitHub Actions `e2e` | Remote PR #50 full CI workflow (run [`41695679629`](https://github.com/GBrooks1970/orangehrm-pim-automation/actions/runs/41695679629)) | ✅ PASS | All steps green (7/7 E2E + Serenity HTML + Pages upload) | 2m 55s |

### Reproduction Output Snippets

```text
$ npm ls playwright playwright-core @serenity-js/playwright
orangehrm-pim-automation@0.1.0 D:\_CLAUDE_COWORK\PROJ001\claude-outputs\test-automation-portfolio\orangehrm-pim-automation
+-- @serenity-js/playwright@3.47.2
| `-- playwright-core@1.63.0
`-- playwright@1.63.0
  `-- playwright-core@1.63.0 deduped

$ npm run typecheck
> orangehrm-pim-automation@0.1.0 typecheck
> tsc --noEmit

$ npm run test:unit
✔ aligned Serenity 3.47.2 and Playwright 1.63.0 fixture passes (70.8297ms)
✔ captured Playwright 1.62.1 / Serenity ~1.63.0 split-core fixture is rejected with incompatible paths (19.6964ms)
✔ single resolved playwright-core outside Serenity peer range is rejected (1.5954ms)
✔ mismatched direct @serenity-js/* versions are rejected (13.6353ms)
✔ stale Dependabot Playwright hold floor is rejected (2.9393ms)
✔ satisfiesPeerRange handles tilde, caret, and exact ranges (16.5902ms)
ℹ tests 32 | pass 32 | fail 0 | duration_ms 6280.7889

$ npm audit --audit-level=high
found 0 vulnerabilities

$ npm test
Execution Summary
Add an employee to PIM:      2 successful, 2 total (27s 298ms)
Manage employees in PIM:     3 successful, 3 total (17s 535ms)
PIM add-employee validation: 2 successful, 2 total (8s 538ms)
Total time: 53s 371ms | Real time: 57s 548ms | Scenarios: 7
```

---

## 3. Operational State & Invariants
- **Repository & Branch:** `orangehrm-pim-automation` on branch `codex/orangehrm-playwright-alignment`, clean working tree, pushed to `origin` and tracking `origin/codex/orangehrm-playwright-alignment`.
- **Pull Request & CI:** Draft [PR #50](https://github.com/GBrooks1970/orangehrm-pim-automation/pull/50) open; CI workflow `e2e` run [`41695679629`](https://github.com/GBrooks1970/orangehrm-pim-automation/actions/runs/41695679629) succeeded in 2m 55s.
- **Invariants Preserved:**
  - Docker storage verified on `E:\_DockerData` (222 GB free); local containers stopped cleanly via `docker compose stop --timeout 60` preserving existing volumes.
  - Loopback-only target safety enforced (`http://localhost:8080`); public demo never contacted.
  - TypeScript `>=6.0.0` and `@types/node >=25.0.0` Dependabot holds preserved.
  - All documentation authored in `en-GB`.

---

## 4. Recommended Next Actions
1. **Review and merge Draft PR #50 (Recommended):** Ready for owner review and merge at [PR #50](https://github.com/GBrooks1970/orangehrm-pim-automation/pull/50), plus the companion portfolio-root v4 session handover PR.
2. **Proceed to the next portfolio action plan:** Review and approve one of the remaining proposed plans (`bfx-ws-screenplay` Action 1 / `DEP-02`, `loan-origination-parity` Action 3 / `Risk #3`, `saleor-graphql-automation` Action 4 / `SGR-MAINT-02`, or `bfx-ws-screenplay` Action 5 / `LIVE-01`).
3. **Reassess Dependabot PR #44 after `main` is green:** Once PR #50 merges to `main`, rebase or recreate PR #44 (`@serenity-js/*` `3.48.0`) as a separate reviewed batch if desired.
