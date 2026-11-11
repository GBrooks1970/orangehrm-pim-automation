---
version: 1
created: 2026-11-08T07:26Z
project: orangehrm-pim-automation
type: implementation-plan
item: ORH-MAINT-03
status: approved
approved: 2026-11-08, owner requested completion of OrangeHRM; bounded failure repair, merge remains owner-controlled
delivered: not yet
language: en-GB
---

# Implementation plan: ORH-MAINT-03 employee-row refresh race

**Goal.** Remove the false absence result exposed by PR #53 CI while preserving the existing employee-name assertion and timeout budget.

## Evidence gathered before planning

Run `42458221152` at `9c4e963` passed all early checks but failed two of seven scenarios waiting for a matching employee row. Both failure screenshots show the expected row present. The question filters a captured collection through sequential per-element text reads. When the search replaces many rows with one, a read for an obsolete row waits for Playwright's element timeout, exhausting the outer assertion's budget.

A local real-Chromium fixture reproduced the same failure: 500 initial rows replaced by the correct row after 100ms; the existing three-second wait failed although native Playwright reported one row with the exact expected text. A delayed row inserted into an initially empty table passed, isolating replacement of a previously populated collection.

## Steps

1. Record this plan before changing implementation.
2. Add browser contract cases in `tests/contract/employee-list-rows.contract.ts` for table replacement, delayed appearance, absent names, split-name false positives and quoted names. Capture failure with the original question.
3. Replace the sequential collection filtering in `src/questions/EmployeeListRows.ts` with a browser-native XPath row selector. Preserve matching both first and last words within the same row and safely quote literal names.
4. Add `test:ui-contract` in `package.json` and CI immediately after Chromium installation, before Docker. Update `scripts/verify-project-contract.ts` to enforce the new ordering. No retry, increased timeout, changed SUT assertion or dependency update.
5. Record ORH-MAINT-03 and verification evidence in the backlog and an immutable walkthrough. Keep ORH-MAINT-02 closed; the new repair remains awaiting exact-main acceptance after owner merge.
6. Run typecheck, existing unit tests, the browser contracts, target/project contracts, and full PR CI. Update PR #53's title and body to describe its final scope. Parent updates the shared handover.

## Verification

The replacement fixture must fail before the fix and pass after it. A row that contains only one name component must remain absent. Quoted names must not alter selector meaning. Local checks and full Docker CI must pass without relaxed assertions or retries.

## Delivery

Continue the isolated `codex/orangehrm-postmerge-closure-20261108` branch and PR #53. This is a bounded correction discovered during the owner's completion request. Owner retains merge authority; primary folders remain untouched.

## Documentation addendum

Update `docs/qa-strategy.md` alongside the new CI command so the documented gate order and local/CI recipes remain accurate. This follows the same bounded repair and does not change acceptance policy.

## Outcome

The four-case real-browser suite reproduced one failure before the fix and passed 4/4 after it (runner 4.783503s). Typecheck, 37 unit tests and the project contract passed in a combined 20.476s. The project contract verifies 34 Markdown files, default=7/smoke=1, and nine ordered CI script calls. The new CI gate precedes Docker; no timeout, assertion, dependency or SUT policy was relaxed. Full PR CI and owner-controlled main acceptance remain separate delivery gates.

Repaired-head [CI run 42458999397](https://github.com/GBrooks1970/orangehrm-pim-automation/actions/runs/42458999397), commit `9b7a3864c6cab7d1d7f738f0df38584ecb9e3dfe`, passed all gates: 37 unit tests, four browser contracts, one API contract and seven E2E scenarios. The job ran 07:29:34–07:31:47 UTC on 8 November (133 seconds); scenario execution summed 25.545s, real time 25.851s. Report rendering, upload and teardown succeeded; Pages deployment was correctly skipped for a PR. Owner merge and exact-main acceptance remain pending.
