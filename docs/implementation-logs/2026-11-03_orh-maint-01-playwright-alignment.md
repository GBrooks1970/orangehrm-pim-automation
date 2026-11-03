# Serenity 3.47.2 and Playwright 1.63.0 single-core alignment and compatibility guard — 2026-11-03

## Session Summary

Actioned the approved `ORH-MAINT-01` implementation plan (`docs/implementation-plans/2026-11-03_orh-maint-01-playwright-alignment.md`) to repair the default-branch `Type-check` failure (`TS2345` in run `35924973904`). Merging grouped Serenity/JS updates (`3.47.2` in PRs #40 and #41) while `.github/dependabot.yml` still held `playwright >=1.63.0` left `playwright` at `1.62.1` while `@serenity-js/playwright@3.47.2` required peer `playwright-core: ~1.63.0`, producing two incompatible `Browser` type identities (`node_modules/playwright-core@1.63.0` and `node_modules/playwright/node_modules/playwright-core@1.62.1`). Direct `playwright` is now aligned to `1.63.0`, `follow-redirects` is refreshed to `1.16.2` within `axios`'s existing `^1.16.0` range, the Dependabot Playwright hold is advanced to `>=1.64.0`, and a dedicated `scripts/playwright-compatibility.ts` check (covered by 6 unit tests and wired into `npm run test:project-contract`) prevents future split-core updates.

---

## Objectives

1. ✅ Record owner approval of the `ORH-MAINT-01` implementation plan and add `ORH-MAINT-01` to `docs/backlog.md`.
2. ✅ Align direct `playwright` to `1.63.0` alongside the existing `@serenity-js/*@3.47.2` packages and regenerate `package-lock.json` so a single `playwright-core@1.63.0` resolves at root.
3. ✅ Clear the newly published transitive `follow-redirects` High advisory (`GHSA-q3jh-wrc6-jgq8`, `GHSA-8r9p-f939-6h3c`, `GHSA-mrwp-f3q8-3g9p`) within the existing `^1.16.0` range (`1.16.0` → `1.16.2`).
4. ✅ Advance the `.github/dependabot.yml` Playwright compatibility hold from `>=1.63.0` to `>=1.64.0` and document the grouped peer-hold rule in `docs/dependency-policy.md`.
5. ✅ Implement `scripts/playwright-compatibility.ts` and `tests/unit/playwright-compatibility.test.ts` and enforce the check in `scripts/verify-project-contract.ts`.
6. ✅ Verify all static, unit, audit, contract, local Docker readiness, API contract, and 7/7 E2E gates.

---

## Test Results

| Stack | Suite | Before (`main` @ `8158979`) | After (`codex/orangehrm-playwright-alignment`) | Status |
|---|---|---|---|---|
| TypeScript | `npm run typecheck` | ❌ FAIL (`TS2345` at `src/hooks/browser.hooks.ts(80,46)` in run `35924973904`) | 0 errors | ✅ PASS |
| Node 24 | `npm run test:unit` | 26/26 (skipped in CI after `Type-check`) | 32/32 tests (11,349 ms, incl. 6 new compatibility tests) | ✅ PASS |
| npm | `npm audit --audit-level=high` | 1 High (`follow-redirects@1.16.0`) | 0 vulnerabilities (213 packages audited) | ✅ PASS |
| Contract | `npm run test:target-contract` | Skipped in CI after `Type-check` | 1/1 command | ✅ PASS |
| Contract | `npm run test:project-contract` | Did not check Playwright/Serenity peer alignment | 1/1 command (`default=7`, `smoke=1`, 7 CI script calls, 26 Markdown files) | ✅ PASS |
| OrangeHRM | `npm run test:readiness` | Skipped in CI after `Type-check` | Ready in 1 attempt (1,449 ms; 1 employee record probed) | ✅ PASS |
| OrangeHRM API | `npm run test:api-contract` | Skipped in CI after `Type-check` | 1/1 test (1,095 ms; total 4,258 ms) | ✅ PASS |
| Playwright E2E | `npm test` | Skipped in CI after `Type-check` | 7/7 scenarios passed (53.37s test time / 57.55s real time; 241 scenario JSON files retained) | ✅ PASS |

`npm ci` installed 212 packages and audited 213 packages with 0 vulnerabilities on local Node `v24.18.0`. `npm ls playwright playwright-core @serenity-js/playwright` confirmed both consumers share the single root `playwright-core@1.63.0`. Note: local host does not have a Java runtime installed (`java` not on `PATH`), so HTML report rendering via `serenity-bdd run` is verified by the GitHub Actions `e2e` runner (where Java is pre-installed).

---

## Changes Implemented

### Align Playwright 1.63.0 with Serenity/JS 3.47.2 and patch transitive `follow-redirects`

**Files changed:**
- `package.json` — updated direct `playwright` from `1.62.1` to `1.63.0` and registered `tests/unit/playwright-compatibility.test.ts` in `test:unit`.
- `package-lock.json` — regenerated via npm so `node_modules/playwright@1.63.0` and `node_modules/@serenity-js/playwright@3.47.2` deduplicate to a single root `node_modules/playwright-core@1.63.0` (removing the nested `node_modules/playwright/node_modules/playwright-core@1.62.1` entry), and refreshed transitive `follow-redirects` from `1.16.0` to `1.16.2`.

### Enforce single-core Playwright/Serenity peer compatibility in the project contract

**Files changed:**
- `scripts/playwright-compatibility.ts` — new module verifying that all direct `@serenity-js/*` dependencies share one exact version, `playwright` and `@serenity-js/*` lockfile entries match `package.json`, `package-lock.json` resolves exactly one `playwright-core` instance at root `node_modules/playwright-core`, that version satisfies `@serenity-js/playwright`'s `peerDependencies['playwright-core']` range, and `.github/dependabot.yml` holds `playwright` at the next minor (`>=1.64.0`).
- `tests/unit/playwright-compatibility.test.ts` — 6 deterministic unit tests covering the aligned `3.47.2` / `1.63.0` baseline, the captured `1.62.1` / `~1.63.0` split-core failure fixture (must-fail check), out-of-range single core, mismatched direct `@serenity-js/*` versions, stale Dependabot hold floor, and semver peer-range evaluation.
- `scripts/verify-project-contract.ts` — wired `verifyPlaywrightSerenityCompatibility(manifest, lockfile, dependabotYaml)` into `npm run test:project-contract`.

### Update Dependabot hold and dependency policy

**Files changed:**
- `.github/dependabot.yml` — advanced the `playwright` ignore floor from `>=1.63.0` to `>=1.64.0` to match Serenity/JS `3.47.2`'s `~1.63.0` peer requirement.
- `docs/dependency-policy.md` — updated the Serenity/Playwright baseline description to `3.47.2` / `1.63.0` and documented that Dependabot grouping alone does not prevent a split tree if the hold blocks the matching Playwright minor.

---

## Technical Decisions

| Decision | Rationale | Alternatives rejected |
|---|---|---|
| Pin `playwright` to `1.63.0` while keeping `@serenity-js/*` at `3.47.2` | Smallest directly evidenced fix for `main`'s `TS2345` failure; satisfies `@serenity-js/playwright@3.47.2`'s `playwright-core: ~1.63.0` peer and deduplicates `playwright-core`. | Combine with open Dependabot PR #44 (`3.48.0`) before restoring `main`, or roll back Serenity/JS to `3.44.3`. |
| Refresh transitive `follow-redirects` from `1.16.0` to `1.16.2` | `axios@1.20.0` (under `@serenity-js/rest@3.47.2`) already declares `follow-redirects: ^1.16.0`; refreshing within range clears 3 High advisories with zero direct-dependency drift. | Record a High audit exception when a compatible in-range patch (`1.16.2`) is available. |
| Enforce peer range, single `playwright-core`, and Dependabot hold floor in `test:project-contract` | Prevents future Dependabot PRs from passing static checks if `playwright-core` splits or if `.github/dependabot.yml` lags behind `@serenity-js/playwright`'s peer minor. | Hard-code only the `1.62.1` version string without checking lockfile deduplication or peer range satisfaction. |

---

## Documentation Updates

- `docs/backlog.md` — added and closed `ORH-MAINT-01` with failure, resolution, and verification evidence.
- `docs/dependency-policy.md` — updated Serenity/JS `3.47.2` and Playwright `1.63.0` alignment and hold guidance.
- `docs/implementation-plans/2026-11-03_orh-maint-01-playwright-alignment.md` and `docs/implementation-plans/_index.md` — recorded owner approval and implementation outcome.
- `docs/implementation-logs/2026-11-03_orh-maint-01-playwright-alignment.md` — recorded this session log.

---

## Lessons Learned

- A Dependabot `groups` configuration (`serenity-playwright`) still produces a partial, peer-incompatible update when an `ignore` rule (`playwright >=1.63.0`) blocks the matching peer minor from joining the group.
- Pairing a lockfile deduplication check (`node_modules/playwright-core` count === 1) with an explicit check that `.github/dependabot.yml`'s hold floor equals `>=1.<minor + 1>.0` catches both split installations and stale Dependabot holds before browser/Docker steps run.

---

## Recommendations / Next Steps

- [ ] Review and merge the draft PR for `ORH-MAINT-01` after watching the GitHub Actions `e2e` workflow pass (including Java-backed Serenity HTML report generation and Pages upload) — owner: Gary Brooks; High.
- [ ] Rebase or recreate open Dependabot PR #44 (`@serenity-js/*` `3.48.0`) only after `ORH-MAINT-01` merges to `main`, ensuring its peer range and full CI gate pass — owner: repository maintainer; Medium.
- [ ] Publish the companion `orangehrm-pim-automation` v4 session handover note in the portfolio support repository — owner: agent / Gary Brooks; Medium.

---

*Session logged: 2026-11-03. Author: Antigravity.*
