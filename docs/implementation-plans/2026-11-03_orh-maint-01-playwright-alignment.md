---
version: 1
created: 2026-11-03T10:54Z
project: orangehrm-pim-automation
type: implementation-plan
item: ORH-MAINT-01
status: implemented
approved: 2026-11-03
delivered: 2026-11-03 (PR #50 CI run 41695679629 green; awaiting owner merge)
language: en-GB
---

# Implementation plan: Action 2 — restore aligned Playwright and Serenity types

**Goal.** Repair the proven default-branch TypeScript failure by aligning Playwright with the current Serenity peer requirement, then prove the existing local-only seven-scenario suite and reports still work. Add a focused compatibility guard so a future grouped update cannot silently recreate the split dependency tree.

## Evidence gathered before planning

Read-only investigation on 3 November 2026 used the local backlog, latest handover v3, dependency policy, shared plan template, GitHub workflow inventory, main/PR manifests and lockfiles, CI logs and `npm view playwright@1.63.0 version dependencies engines --json`. No checkout refresh, dependency install, test run, Docker action or source edit was performed. Only this plan, its index and the first-use template copy are written. No nested AGENTS.md was found; portfolio AGENTS.md applies.

| Finding | Consequence for the plan |
|---|---|
| Local clean main is `4a5534a20ac5dac030eaae07a389c942b2da6c4c`; GitHub main is `44c3907504622fa8c2e9e02197effef5f5b5ced2` | Implement from refreshed remote main after approval; local package versions are stale |
| Current workflow inventory identifies active `e2e`, ID `301002266`, at `.github/workflows/ci.yml` | Use the workflow ID/path, not the guessed `e2e.yml` |
| Latest default-branch e2e [run 35924973904](https://github.com/GBrooks1970/orangehrm-pim-automation/actions/runs/35924973904), 23 September, fails `Type-check` at `src/hooks/browser.hooks.ts(80,46)` with TS2345 | This is a package/type identity incompatibility; browser installation and Docker steps were skipped, so no browser-image failure is established |
| Remote main pins all six direct Serenity packages to `3.47.2`, Playwright to `1.62.1`, TypeScript to `5.9.3`; its lock records Serenity Playwright peer `playwright-core: ~1.63.0` | Align the Playwright package to the required minor; keep the existing TypeScript hold |
| Main lock contains root `playwright-core@1.63.0`; `playwright@1.62.1` requires its own `playwright-core@1.62.1` | Two Browser type identities cause TS2345; the log names both paths and missing `ariaSnapshotJSON` |
| The Dependabot hold excludes Playwright `>=1.63.0` and still describes Serenity `3.44.3` | The previously valid hold became stale when Serenity advanced; revise the hold and policy with the alignment |
| [PR #44](https://github.com/GBrooks1970/orangehrm-pim-automation/pull/44), head `196a5e1b821b85ea01e845d617c0a6dd51301f21`, updates six Serenity packages from `3.47.2` to `3.48.0` but keeps Playwright `1.62.1` | Merging it unchanged is not a fix. Its [run 36635258662](https://github.com/GBrooks1970/orangehrm-pim-automation/actions/runs/36635258662) fails with the same TS2345 and missing property |
| Registry metadata confirms `playwright@1.63.0` depends exactly on `playwright-core@1.63.0` and supports Node `>=20` | Exact `1.63.0` is the smallest evidenced compatible candidate for the current Node 24 / Serenity baseline |
| CI uses `npx playwright install --with-deps chromium` after static gates; there is no Playwright container image pin | Retain browser installation from the aligned package; changing the OrangeHRM/MySQL image pins is unrelated |
| `npm ci` passed before typecheck; audit, unit and E2E steps were skipped. Report-data check then failed because no suite ran, while report rendering and Pages deployment succeeded | Do not equate the deployed report with a successful suite. Fresh audit and all downstream gates remain unknown until implementation |
| Backlog says zero outstanding, and v3's healthy/no-open-PR narrative dates from July | Record a new bounded maintenance item after approval and supersede stale session status after delivery |

### Suggested solutions

| Option | Assessment |
|---|---|
| **Recommended: keep Serenity 3.47.2; pin Playwright 1.63.0; regenerate lock and repair hold** | Smallest directly evidenced correction; separates restoration of main from the optional Serenity upgrade |
| Upgrade to Serenity 3.48.0 plus Playwright 1.63.0 together | Peer ranges support this candidate, but PR #44 adds changes beyond restoring the baseline. Evaluate separately after main is green, or obtain explicit approval for the broader batch |
| Roll back Serenity to a release supporting Playwright 1.62.1 | Could restore compatibility but reverses merged dependency improvements and needs independent audit/compatibility review; not preferred |
| Cast Browser types, use `skipLibCheck`, force peer resolution, or suppress typecheck | Reject: hides the incompatible dependency tree and weakens the existing gate |

## Steps

1. After owner approval, recheck remote main, PR #44 and advisory state. Fetch safely and create `codex/orangehrm-playwright-alignment` from current main, preserving unrelated work and these planning files. Confirm the actual versions still match this plan; if the required minor or scope changed, revise the plan before implementation.
2. Specification first: add proposed **ORH-MAINT-01** to `docs/backlog.md` with the failure/run/peer evidence, scope and acceptance criteria. Keep original closed CODEX entries intact. Specify that Playwright's exact locked core version must satisfy Serenity Playwright's installed peer range, direct Serenity versions must agree, and only one resolved core version may serve the suite.
3. Update `package.json` to exact `playwright: "1.63.0"`, retaining all six direct Serenity packages at `3.47.2`, Node `>=24.15.0 <25`, tested Node `24.19.0`, TypeScript `5.9.3`, and existing Cucumber/type packages. Regenerate `package-lock.json` with the repository's supported npm/Node tooling; review every changed dependency. Do not use forced installs or broad `npm audit fix --force`.
4. In `.github/dependabot.yml`, advance the Playwright compatibility hold from `>=1.63.0` to `>=1.64.0` and document the current `~1.63.0` Serenity peer. Retain the TypeScript `>=6.0.0` and Node types `>=25.0.0` holds. Explain in `docs/dependency-policy.md` that any Serenity peer-minor change must advance Playwright and its hold in the same reviewed batch; grouping alone does not guarantee alignment.
5. Extend `scripts/verify-project-contract.ts` with a focused check of manifest/lock dependency compatibility and single resolved Playwright-core version. Prefer the existing contract and existing dependencies rather than adding a new runtime service. Check the installed peer requirement instead of merely hard-coding the known failing version pair. If a helper is extracted, use `scripts/playwright-compatibility.ts` and add deterministic fixtures in `tests/unit/playwright-compatibility.test.ts`; add that file to `test:unit`. Keep existing exact 7/1 discovery and workflow-order checks. Add no new external package solely for this check; if robust range evaluation requires one, return with the trade-off for approval.
6. Run the verification below, including a deliberately mismatched dependency fixture. Refresh the audit. If the High gate exposes unrelated current findings, record precise paths and a separate proposed remediation; do not weaken the threshold or silently broaden into a framework overhaul. Do not claim full repair until the agreed gates pass.
7. Update `docs/dependency-policy.md`, the new backlog item and any current version-specific claims found by a bounded search. Preserve historical logs, ADRs and the original `docs/implementation-plan.md`. Write a new immutable implementation log and a separate portfolio-root v4 Markdown/generated-HTML handover after actual delivery; capture exact CI, test and audit outcomes.
8. Leave PR #44 unmerged and unchanged in this task. After the baseline repair merges, rebase/refresh its proposed set and assess its own audit and full gates before a separate owner decision. PRs #47 and #48 are also outside this change.

## Verification

- Capture the original main failure as the red baseline: run 35924973904, `Type-check`, TS2345. A local re-execution of the broken graph is optional only in an isolated temporary checkout; never mutate the user's current installation to manufacture a negative case.
- `npm ci`; inspect `npm ls playwright playwright-core @serenity-js/playwright` and the lock: intended Playwright/core `1.63.0`, Serenity `3.47.2`, one compatible core version, no invalid peer resolution.
- `npm run typecheck`, `npm run test:unit`, `npm audit --audit-level=high` (retain JSON evidence), `npm run test:target-contract`, `npm run test:project-contract`. The latter must still prove exactly seven default and one smoke scenario.
- **Must-fail check:** feed the focused compatibility check the captured Playwright `1.62.1` / Serenity core peer `~1.63.0` split fixture; it must reject it and name the incompatible dependency paths. The aligned fixture must pass. A mismatched direct Serenity version fixture must also fail. Record actual counts/results; these checks are planned, not run during investigation.
- Install Chromium from the local aligned CLI, then exercise the existing CI order: pinned local Docker stack, installed readiness, API fixture contract, all seven active E2E scenarios, non-empty Serenity JSON, report generation and artifact upload, successful teardown. Use only the loopback target; never the shared public demo.
- Any local Docker operation must first verify its data/storage against `E:\_DockerData`; use an isolated Compose project and avoid deleting an existing user's volumes. A clean CI job supplies the clean-volume gate. Preserve local volumes with `docker compose stop --timeout 60` when appropriate; destructive resets need explicit scope.
- Require green PR CI and exact-main CI after owner merge. A green static check or report deployment alone is insufficient. Confirm both current main functionality and report evidence, then update backlog/log/handover and clean only merged task branches.

**Uncertainty and stop conditions.** The dependency graph and both observed compiler failures are confirmed. The proposed aligned graph has not been installed or tested here, fresh audit results are unknown, and no Docker or browser validation was performed. If a new audit blocker or runtime regression requires a broader Serenity/Node/TypeScript migration, revise scope and obtain approval before proceeding.

## Delivery

**Publication authorisation (2026-11-03).** The owner authorised committing, pushing and merging these planning documents through PRs. This authorises documentation publication only; the implementation plan remains proposed and its execution still awaits approval. Earlier statements about no commits or PRs describe the investigation stage.

Only this plan, `_index.md` and the first-use template copy are produced now; no implementation, commit, push or PR is authorised by this planning request. Proposed implementation branch: `codex/orangehrm-playwright-alignment`; publish a scoped draft project PR after checks. The owner reviews and merges. Follow the separate portfolio-root branch/PR flow for v4 handover records. Retain the approved body and append actual outcome rather than rewriting the plan retrospectively.

**Non-goals:** new application features; changes to OrangeHRM/MySQL images or seed data; public-demo enablement; TypeScript migration; Cucumber/Node-types PRs; blanket dependency upgrades; automatic merge of PR #44; redesigning report deployment on failed builds.

## Decisions put to the owner

| Decision | Options | Recommended | Owner's answer |
|---|---|---|---|
| Remediation scope | Minimal current-Serenity alignment / combined PR44 upgrade / defer | Current Serenity 3.47.2 plus Playwright 1.63.0, with compatibility guard and hold repair | Approved (2026-11-03): Current Serenity 3.47.2 plus Playwright 1.63.0, with compatibility guard and hold repair |
| PR #44 | Merge unchanged / reassess after baseline repair / include explicitly | Reassess after baseline is green; unchanged proposal is proven failing | Approved (2026-11-03): Reassess after baseline is green |
| Unexpected audit blockers | Broaden automatically / return with evidence and revised scope | Return with precise findings and proposed follow-up | Approved (2026-11-03): Return with precise findings and proposed follow-up |
| Publication | Draft PR then owner merge / direct main | Draft PR, owner merge; separate support handover PR | Approved (2026-11-03): Draft PR, owner merge; separate support handover PR |

## Outcome

Implemented on 3 November 2026 on branch `codex/orangehrm-playwright-alignment`:
- Added `ORH-MAINT-01` to `docs/backlog.md`, pinned `playwright` to `1.63.0` alongside `@serenity-js/*@3.47.2`, and regenerated `package-lock.json` so both packages resolve to a single root `playwright-core@1.63.0`.
- Refreshed transitive `follow-redirects` from `1.16.0` to `1.16.2` within `axios@1.20.0`'s existing `^1.16.0` range, clearing 3 High advisories (`GHSA-q3jh-wrc6-jgq8`, `GHSA-8r9p-f939-6h3c`, `GHSA-mrwp-f3q8-3g9p`) so `npm audit --audit-level=high` exits 0 with 0 vulnerabilities.
- Advanced `.github/dependabot.yml` Playwright hold from `>=1.63.0` to `>=1.64.0` and updated `docs/dependency-policy.md`.
- Added `scripts/playwright-compatibility.ts` and `tests/unit/playwright-compatibility.test.ts` (6 unit tests including the captured `1.62.1` / `~1.63.0` split-core must-fail check) and wired the check into `scripts/verify-project-contract.ts`.
- Verified clean `npm ci`, `npm run typecheck` (0 errors), `npm run test:unit` (32/32 pass), `npm audit --audit-level=high` (0 vulnerabilities), `npm run test:target-contract`, `npm run test:project-contract` (`default=7`, `smoke=1`, 26 Markdown files), and against the local Docker stack on `E:\_DockerData`: `npm run test:readiness` (1,449 ms), `npm run test:api-contract` (1/1), and `npm test` (7/7 scenarios passing in 53.37s).
- Published draft [PR #50](https://github.com/GBrooks1970/orangehrm-pim-automation/pull/50); GitHub Actions `e2e` run [`41695679629`](https://github.com/GBrooks1970/orangehrm-pim-automation/actions/runs/41695679629) passed in 2m55s across all steps (including clean-volume Docker 7/7, Serenity HTML report rendering, Pages artifact upload, and teardown). Logged in `docs/implementation-logs/2026-11-03_orh-maint-01-playwright-alignment.md`.
