---
version: 1
created: 2026-11-08T01:39Z
project: orangehrm-pim-automation
type: implementation-plan
item: ORH-MAINT-02
status: approved
approved: 2026-11-08, owner instruction to investigate and resolve stated project issues and continue; bounded documentation repair authorised, merge remains with owner
delivered: not yet
language: en-GB
---

# Implementation plan: ORH-MAINT-02 post-merge closure

**Goal.** Reconcile the canonical maintenance status with the merged repair and verified main publication.

## Evidence gathered before planning

Read-only inspection on 8 November 2026 found primary `main` clean at `9ae80064ed358653fa687ca956cce7debc927bf0`, matching the GitHub default head. Handover v5 predates the merge. No project files changed during investigation.

| Finding | Consequence for the plan |
|---|---|
| PR #52 merged on 7 November at 16:46:43 UTC, but the backlog and plan index still say owner merge pending | Close ORH-MAINT-02 and correct the current outstanding count |
| Exact-main e2e run 42392996933 passed all steps and deployed Pages | Cite the main run, preserving the distinction from earlier PR validation |
| A fresh artifact download and live fetch on 8 November at 01:36:56 UTC returned identical 66,107-byte index files | Record the artifact identity and SHA-256 as publication evidence |
| No project PRs remain open | Replace the old outstanding dependency-PR wording with a dated current observation |

## Steps

1. Record this plan and add its row to `docs/implementation-plans/_index.md` before the status repair.
2. Change `docs/backlog.md` to close ORH-MAINT-02 with the merged PR, exact-main CI and live-publication evidence; set the outstanding count to zero.
3. Update the original ORH-MAINT-02 row in the plan index and append a dated post-merge outcome to `docs/implementation-plans/2026-11-07_orh-maint-02-dependencies-and-report-gates.md`. Preserve its original plan and earlier outcome.
4. Add `docs/walkthroughs/2026-11-08_orh-maint-02-postmerge-closure.md` with exact checks and publication evidence. Leave shared handovers and registry files to the parent coordinator.
5. Validate in this isolated clone, review the exact diff and prepare a draft PR. Runtime code, dependency pins, workflow gates and SUT configuration remain outside this repair.

## Verification

Run clean `npm ci`, `npm run typecheck` and `npm run test:project-contract` for the documentation and unchanged framework contract. The latter executes the real default and smoke discovery counts (7 and 1) and checks relative Markdown links. Assert that current backlog/index status has no pending-merge claim and reports zero outstanding. The existing unit suite contains deliberately invalid publication and peer fixtures; rerun it to retain those negative controls. Use the existing exact-main Docker evidence and the new PR's full workflow for Linux acceptance; do not provision local Docker for a documentation correction. Run `git diff --check` and `git diff --cached --check` before commit.

## Delivery

Branch: `codex/orangehrm-postmerge-closure-20261108`. Prepare a draft project PR; the owner authorises any merge. The primary working copy and old review clone remain untouched. The parent coordinates any shared handover refresh separately.

## Decisions put to the owner

The owner's investigate-and-resolve instruction and subsequent continue authorise this bounded status correction. No architectural or dependency decision is required. Merge authority remains with the owner.

## Outcome

The canonical backlog and original plan index now record the merged, published repair and zero outstanding items. The original implementation plan has a dated appended outcome; its approved body is preserved. Fresh installation (207 packages, zero vulnerabilities), typecheck, 37 unit tests and project contract (default=7, smoke=1) passed. The [walkthrough](../walkthroughs/2026-11-08_orh-maint-02-postmerge-closure.md) records timings and exact-main publication evidence. Commit, draft-PR publication and owner merge remain pending at this record's authorship; no runtime or dependency change was needed.
