---
version: 1
created: 2026-11-07T00:14Z
project: orangehrm-pim-automation
type: implementation-plan
item: ORH-MAINT-02
status: approved
approved: 2026-11-07, owner instruction to investigate and resolve stated project issues; implementation authorised, merge remains with owner
delivered: not yet
language: en-GB
---

# Implementation plan: ORH-MAINT-02 dependency proposals and truthful report publication

**Goal.** Integrate the three pending dependency proposals on the repaired main baseline, detect incompatible framework peers before TypeScript, and prevent an early failure with no scenario data replacing the published report.

## Evidence gathered before planning

Read-only inspection of main `e5e6342`, handover v4, the backlog and the 6 November root diagnosis confirmed PR #50 is merged and main CI passes. PR #44 still fails with an incompatible Playwright peer; #47 has an old failing run; #48 passed. No project files changed during investigation.

| Finding | Consequence for the plan |
|---|---|
| Published Serenity 3.49.0 metadata requires Playwright core `~1.64.0`, while main pins Playwright 1.63.0 and ignores >=1.64.0 | Move the six direct Serenity pins, Playwright and the hold together |
| Playwright 1.64.1 is a published compatible patch; Cucumber 13.3.0 supports Node 24 and Serenity's peer accepts Cucumber 13 | Use these bounded versions and Node-24 type declarations 24.19.2 |
| Dependency licences remain Apache-2.0 (Serenity/Playwright) and MIT (Cucumber/Node types) | No direct dependency licence change |
| The peer guard runs after typecheck | Expose a standalone fast guard immediately after npm ci |
| Report guard can fail while render/upload/deploy continue | Require report-data success, render success and a successfully uploaded artefact in the deployment chain |

Primary sources: [Serenity compatibility](https://serenity-js.org/releases/), [Serenity 3.49 changes](https://serenity-js.org/blog/serenity-js-3-49/), [Cucumber releases](https://github.com/cucumber/cucumber-js/releases), [GitHub job outputs](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/pass-job-outputs), and npm package metadata queried on 7 November 2026.

## Steps

1. Update package.json and package-lock.json to all six @serenity-js packages 3.49.0, Playwright 1.64.1, Cucumber ^13.3.0 and @types/node 24.19.2. Advance the Playwright Dependabot hold to >=1.65.0. Preserve Node, TypeScript and SUT image contracts.
2. Add a standalone compatibility command and place it before typecheck; keep the project-contract check as a local aggregate.
3. Give the report-data and upload steps identities, gate rendering on valid data, gate upload on successful rendering, and gate main deployment on successful upload through a job output. Keep genuine failed-test reports publishable when they contain scenario data.
4. Add contract checks and negative controls for the workflow publication chain. Update README, dependency policy, QA/architecture descriptions and backlog.
5. Run the documented static, unit, audit, profile and Docker/report gates; record exact results and any limitations in an implementation log and immutable walkthrough.
6. Push a codex/ branch and prepare a draft PR incorporating the three dependency proposals. Preserve the existing PRs for owner review; do not merge or close them.

## Verification

Run npm ci; standalone peer compatibility; typecheck; unit tests including intentionally broken workflow and peer fixtures; HIGH audit; target contract; project contract (default 7, smoke 1). Inspect the lockfile for a single Playwright core. Run installed readiness, API contract and the seven-scenario Docker suite, then render non-empty Serenity evidence. Use clean Docker PR CI as the final Linux acceptance gate. An incompatible peer and unconditional empty-report publication must both fail their negative controls.

## Delivery

Branch: codex/orangehrm-status-resolution-20261107. Owner merges the PR. The parent agent owns shared portfolio handover changes. No automatic closure of Dependabot PRs #44, #47 or #48.

## Decisions put to the owner

The owner requested investigation and resolution of the stated OrangeHRM issues on 7 November. This plan implements that scope using compatible minor/patch versions and the existing report-on-test-failure policy. Merge authority is not implied.

## Outcome

Implemented on the review branch. Local clean installation, compatibility, typecheck, 37 unit tests (including five publication-chain controls), zero-vulnerability audit, target contract and exact 7/1 project contract passed. Docker-backed Linux CI and owner merge remain delivery gates at the time of this record. See the dated implementation log for captured command timings; the shared handover will record the review PR outcome.

### Post-merge outcome, verified 2026-11-08

[PR #52](https://github.com/GBrooks1970/orangehrm-pim-automation/pull/52) merged on 7 November 2026 at 16:46:43 UTC as `9ae80064ed358653fa687ca956cce7debc927bf0`. The original plan and earlier outcome above retain their authorship-time state.

Exact-main [run 42392996933](https://github.com/GBrooks1970/orangehrm-pim-automation/actions/runs/42392996933) passed the full CI sequence: 37 unit tests, zero-vulnerability audit, default=7/smoke=1 contracts, Docker readiness, 1 API contract and 7 E2E scenarios. The e2e job took 160 seconds (16:46:48–16:49:28 UTC); report upload and teardown succeeded. Pages deployment succeeded in 8 seconds (16:49:32–16:49:40 UTC).

At 01:36:56 UTC on 8 November, a fresh download of Pages artifact `13581884440` and the live site's index were identical: 66,107 bytes, SHA-256 `e5f91af8ea003af37d03557a7d4c3d3c4f5baa4b627602627cf305c88e9bfade`. The primary working copy was clean at the merge and no project PRs were open at the pre-repair check. ORH-MAINT-02 is therefore closed in the reconciled backlog. See the [post-merge closure plan](2026-11-08_orh-maint-02-postmerge-closure.md) for this documentation-only follow-up.
