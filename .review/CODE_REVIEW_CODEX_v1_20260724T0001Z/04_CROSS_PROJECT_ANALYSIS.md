# Cross-Project Analysis

[<- Back to Index](00_CODE_REVIEW_CODEX_v1_20260724T0001Z.md) | [Next: Recommendations ->](05_RECOMMENDATIONS.md)

**Reviewer:** AI assistant (Codex, GPT-5)

This is a single-repository review. "Cross-project" analysis compares the specifications,
Screenplay suite, REST fixture client, Docker SUT, CI/reporting, and documentation inside the
repository.

## Tool-Agnostic Tests

- Gherkin states HR-administrator outcomes and could drive another UI framework.
- Tags encode execution policy, but the policy currently depends on manually classifying setup
  mutation.
- Scenario meaning is portable; Tasks, Questions, waits, and reporters are Serenity/JS-specific.
- A framework migration would preserve features but require new glue and element abstractions.

## Code-Agnostic Tests

- The feature vocabulary is independent of TypeScript and Playwright.
- REST setup details remain outside Gherkin, preserving specification readability.
- Scenario data is embedded in feature examples rather than a language-specific fixture file.
- The account-verification gap is specification-level and would follow any implementation until
  the Then outcome is strengthened.

## Single Source of Truth

- Feature files are the executable behaviour source; the manifest, QA strategy, architecture,
  README, and backlog repeat counts and target rules.
- Dry-runs confirm seven default scenarios and one smoke scenario, matching the current inventory.
- Repeated "read-only smoke" and Employee Id claims have drifted from executable behaviour.
- A generated inventory or CI assertion would reduce manual count and tag-policy drift.

## API Contract Compliance

- The repository consumes, but does not own, OrangeHRM REST API v2; no OpenAPI document is
  committed.
- Request bodies and response shapes are represented by small TypeScript interfaces, but runtime
  JSON is trusted through type assertions.
- Authentication parses HTML and cookies manually, which is necessarily coupled to OrangeHRM's
  login implementation.
- HTTP failure classification is too broad around lookup failure and 422 responses.
- A local API contract test and runtime schema checks would provide proportionate assurance.

## Screenplay Parity

- N/A - The repository has one Serenity/JS Screenplay implementation, so there is no second
  implementation against which parity can be measured.
- Within that implementation, Tasks, Questions, Interactions, and actor ability usage are
  consistent.
- The dedicated REST client is an ADR-backed boundary rather than an unexplained Screenplay
  exception.

## Batch File Design

- N/A - The repository ships no batch or PowerShell automation layer.
- Docker Compose, npm scripts, and GitHub Actions are the relevant orchestration surfaces and are
  assessed under CI and migration planning.

## Documentation Alignment

- ADRs are concise, accepted, and connected to concrete source examples.
- The backlog preserves closure evidence and openly records the smoke caveat.
- Current-state guides overclaim typecheck enforcement, public-target safety, and Employee Id
  assertions.
- The implementation plan is explicitly labelled historical, so its stale checklist is less
  harmful than contradictions in current guides.

## Logging Alignment

- Serenity's console reporter and artifact archiver provide one coherent execution narrative.
- API errors include operation, target identity, HTTP status, and response text.
- There is no structured redaction policy, but credentials are not interpolated into errors.
- API setup is outside the actor narrative, so fixture operations are less visible in living
  documentation than UI interactions.
- Focused fixture logging or report notes would improve diagnosis without adding a bespoke
  logging framework.

## Test Coverage Metrics

- Seven active E2E scenarios across three feature files.
- Zero deferred or quarantined scenarios.
- One smoke-selected scenario, but it is not truly read-only.
- No unit, component, API-only, or code-coverage layer.
- Five latest queried `main` workflow runs were green; no automated rolling flake metric is
  published.

## CI and Infrastructure Alignment

- Local and CI both resolve the SUT through `BASE_URL` and the same Compose definition.
- CI starts a clean stack and tears volumes down; the README permits persistent local state and
  documents periodic reset.
- Registry and QA documentation require type checking, while CI omits it.
- Compose health proves web-server response, not installed-app readiness.
- Pages publishing is live and guarded by current-run report data on a clean CI checkout.

---

[<- Previous: Project Review](03_PROJECT_REVIEWS/PROJECT_001_ORANGEHRM_PIM_AUTOMATION.md) | [Back to Index](00_CODE_REVIEW_CODEX_v1_20260724T0001Z.md) | [Next: Recommendations ->](05_RECOMMENDATIONS.md)
