# Architecture Assessment

[<- Back to Index](00_CODE_REVIEW_CODEX_v1_20260724T0001Z.md) | [Next: Migration Plans ->](07_MIGRATION_PLANS.md)

**Reviewer:** AI assistant (Codex, GPT-5)

## Test Pyramid

- The suite has seven browser E2E scenarios and no unit, component, or API-only tests.
- API setup reduces UI setup cost but does not itself create a lower test layer.
- Pure cookie parsing, host policy, and response classification are strong unit-test candidates.
- One Docker-backed API contract layer would distinguish SUT/API drift from UI failure.
- Add lower layers before expanding the E2E count; the current seven cover the intended journey
  proportionately.

## SOLID Principles

### Single Responsibility

- Strong: Tasks express activities, Questions read state, element maps hold selectors, hooks own
  lifecycle, and the API client owns setup transport.
- Weakness: `OrangeHrmApiClient.ts` combines URL policy, credential resolution, cookie parsing,
  login exchange, employee lookup, creation, and error classification.

### Open/Closed

- Page-area maps and intent Tasks localise most SUT changes.
- String-switch field mapping and hard-coded fixture methods require edits for each new validation
  field or API fixture.
- Small typed response classifiers would make extension safer without introducing a framework.

### Liskov Substitution

- N/A - The repository defines no meaningful subtype hierarchy or interchangeable implementation
  contract.

### Interface Segregation

- Task factories and Questions expose small, purpose-specific APIs.
- `OrangeHrm` is a broad object with shared global session state; callers cannot depend on a
  smaller injected capability.

### Dependency Inversion

- High-level Tasks depend on Serenity abstractions rather than Playwright pages directly.
- The API client depends directly on global `fetch`, process environment, and a module-global
  session, making isolated testing difficult.
- Injecting a transport and credential/session provider would improve testability, but a full
  dependency-injection container would violate KISS.

## KISS

- The feature set is intentionally small and the folder structure is easy to navigate.
- Direct Task factories are clearer than custom framework abstractions.
- ADRs explain the one unusual choice: setup outside the actor model.
- Repeated documentation of counts and gates is the main avoidable complexity because it creates
  drift.

## YAGNI

- No speculative fixture application or custom runner is present.
- The reserved empty `actors/` directory adds negligible noise and is documented.
- The direct `@serenity-js/rest` dependency appears unused by source and should be reassessed,
  though report tooling still brings it transitively.
- Do not add more browser scenarios solely to demonstrate patterns; close the existing assurance
  gaps first.

## REST and OpenAPI

- OrangeHRM's API is external and no OpenAPI contract is held in this repository, so API design
  governance is N/A.
- The client uses REST endpoints appropriately for fast preconditions.
- Runtime response validation is absent; TypeScript assertions do not protect against wire-format
  drift.
- Authentication is coupled to HTML token and cookie layout, which should be covered by
  deterministic parser and contract tests.
- Exact error semantics, especially duplicate Employee Id, should be validated rather than
  inferred from all 422 responses.

## ISTQB Strategies

- Use-case testing is the dominant technique and fits the portfolio journey.
- Equivalence partitioning is visible in valid add versus missing-last-name and duplicate-id
  invalid partitions.
- Boundary value analysis is not demonstrated for name length, Employee Id length/format, or
  credential rules.
- A decision table could clarify login-details combinations: enabled/disabled status, unique
  username, password validity, and resulting account behaviour.
- Risk-based prioritisation is documented, but the public-demo write and missing CI typecheck
  show that stated controls must be traced to executable enforcement.

## Runtime Lifecycle, Isolation, and Waits

- Chromium is launched once and closed once, reducing suite overhead.
- Browser cookies and storage are cleared before each scenario.
- Database identity is shared across scenarios and persistent local runs; CI volume teardown
  restores run isolation.
- Waits poll observable UI state with bounded ceilings; no suite hard waits were found.
- Fixed-name and first-match selection can validate stale local records, so exact created identity
  should replace name-only correlation.

## Pedagogical Comments

- Comments usually explain OrangeHRM or Serenity-specific reasons, not syntax.
- ADRs connect decisions to concrete implementation and trade-offs.
- The bad-to-good Gherkin example is useful for mid-level engineers.
- Contradictory current-state statements should be corrected promptly because teaching accuracy is
  part of the product.
- The next pedagogical improvement should be a small example of testing the fixture client below
  the UI layer.

## Pedagogical Value

Overall pedagogical value is high. The repository explains architecture in a way a reviewer can
trace. Its next maturity step is not more prose; it is automated evidence that the stated gates,
target safety, and lower-level contracts remain true.

---

[<- Previous: Recommendations](05_RECOMMENDATIONS.md) | [Back to Index](00_CODE_REVIEW_CODEX_v1_20260724T0001Z.md) | [Next: Migration Plans ->](07_MIGRATION_PLANS.md)
