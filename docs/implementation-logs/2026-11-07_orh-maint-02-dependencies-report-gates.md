# ORH-MAINT-02: aligned dependency proposals and report publication gates

Date: 7 November 2026. Baseline: e5e6342. Branch: codex/orangehrm-status-resolution-20261107.

## Change and decisions

The Serenity proposal required a new Playwright peer line while Dependabot's ignore rule held that minor back. All six Serenity pins now use 3.49.0 with Playwright 1.64.1 and a >=1.65.0 hold; Cucumber 13.3.0 and Node-24 types 24.19.2 are integrated in the same reviewed dependency set. Node >=24.15.0 <25, CI Node24.19.0, TypeScript and the SUT image identities are unchanged.

The existing peer guard now runs immediately after installation, before compilation. A report-data failure previously left always-running render/upload/deploy stages able to publish an empty report. The workflow now gates each stage on its predecessor's successful evidence, including an uploaded-report job output. Reports containing genuine failed-test data remain publishable.

Five negative/positive workflow-contract tests protect empty-data, render-failure, forged-upload and unconditional-deployment cases. The checker normalises CRLF before reading step boundaries so Windows and Linux exercise the same contract.

## Captured local verification

| Command | Result | Wall time |
|---|---|---:|
| npm ci | 207 packages added, 208 audited; zero vulnerabilities | 22s (npm output) |
| npm run test:compatibility | Serenity3.49.0 / Playwright1.64.1; one core satisfying ~1.64.0 | 5.577s |
| npm run typecheck | exit0 | 12.388s |
| npm run test:unit | 37 passed, 0 failed; runner duration21347.6204ms | 27.887s |
| npm audit --audit-level=high | found0 vulnerabilities; exit0 | 6.727s |
| npm run test:target-contract | every profile's local-only contract verified | 9.046s |
| npm run test:project-contract | default7, smoke1, 8 CI script calls, ordered gates, 28 Markdown files | 35.543s |

The project-contract Markdown count precedes this evidence document and walkthrough; its final pre-commit run checks their links too. Full clean-volume Docker readiness/API/E2E7/7, report render, upload and teardown are delegated to the existing Linux PR workflow. They are not claimed as local results.

Raw local logs: C:/Users/brook/.codex/tmp/status-evidence-20261107/orange-*.log.

## Publication boundary

This record describes implementation and local validation before review-PR execution. PR checks and the new shared handover record the subsequent CI result. Main remains at e5e6342 until the owner merges. Dependabot PRs44,47,48 remain open for owner disposition; no automatic merge or closure was performed.
