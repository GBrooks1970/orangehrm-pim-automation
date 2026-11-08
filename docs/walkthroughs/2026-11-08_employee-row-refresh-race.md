---
version: 1
created: 2026-11-08T07:27Z
project: orangehrm-pim-automation
type: walkthrough
language: en-GB
---

# Walkthrough: employee-row refresh race

## Changes and cause

Completion checks for the documentation closure exposed an existing timing defect. PR #53 run `42458221152` at `9c4e963` passed early checks, but two of seven E2E scenarios timed out waiting for employee rows. The screenshots in Pages artifact `13607843753` show those exact rows present.

`EmployeeListRows.matching` captured a collection, then read each row's text sequentially. A search refresh could reduce that collection to one row while an indexed read still waited for a removed row. The browser read exhausted the outer presence wait even though the requested employee was present.

The question now uses a native XPath selector, resolving both name components against the current DOM in one query. Quoted names are encoded as XPath literals. Assertion semantics, timeouts, dependencies and SUT configuration are unchanged. Four browser contract tests run immediately after Chromium installation in CI, before Docker; the project contract enforces their ordering.

## Captured verification

Evidence directory: `C:/Users/brook/.codex/tmp/orangehrm-evidence-20261108`.

- Failed CI: e2e job **210 seconds**, **5/7 successful scenarios**, **2 failures**. The live main site was not deployed by this PR run.
- Local negative control: a populated table with 500 rows replaced by one correct row after 100ms failed the original question's bounded wait. An initially empty table with delayed insertion passed.
- The committed four-case browser contract suite failed before the fix and passed **4/4** after it, **0 skipped**, runner duration **4.783503s** (`row-contract-before.log`, `row-contract-after.log`). It covers populated refresh, delayed appearance, split-name/outside-result false positives and quoted names.

The isolated branch continues PR #53. Full checks and Linux Docker acceptance are recorded in the PR and the next shared handover. ORH-MAINT-02 remains closed against its earlier merged-main publication evidence; ORH-MAINT-03 remains pending owner merge and exact-main acceptance. No local Docker was started.

## Repaired-head CI outcome

[Run 42458999397](https://github.com/GBrooks1970/orangehrm-pim-automation/actions/runs/42458999397) at `9b7a3864c6cab7d1d7f738f0df38584ecb9e3dfe` passed on 8 November. The e2e job ran 07:29:34–07:31:47 UTC (**133 seconds**), with **37/37 unit tests**, **4/4 browser contracts**, **1/1 API contract** and **7/7 E2E scenarios**. Scenario time summed **25.545s**, real **25.851s**. Report rendering, upload and teardown passed; deployment was correctly skipped for this PR. Raw results: `pr53-fixed-run.json` and `pr53-fixed.log` in the evidence directory above.
