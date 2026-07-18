# Architecture Assessment

[<- Back to Index](00_CODE_REVIEW_CLAUDE_FABLE_5_v1_20260718T0608Z.md) | [Next: Migration Plans ->](07_MIGRATION_PLANS.md)

**Reviewer:** AI assistant (Claude Fable 5)

## Test Pyramid

- The suite is deliberately all-E2E (7 UI scenarios, API used only for setup) - defensible
  for a project whose stated purpose is a non-flaky E2E journey, but there is no unit tier.
- Pure logic exists that could carry cheap unit tests: `parseSetCookies`
  ([OrangeHrmApiClient.ts](../../src/api/OrangeHrmApiClient.ts) (lines 54-63)),
  `targetIsLocalhost` (lines 44-51), `webUrl` ([serenity.config.ts](../../src/serenity.config.ts)
  (lines 19-20)), and `EmployeeListRows.matching`'s name-splitting.
- Recommendation: a handful of Vitest tests over those helpers would demonstrate pyramid
  awareness at near-zero cost. Marked as an enhancement, not a defect.

## SOLID Principles

- **SRP:** strong. One responsibility per file/folder; config holds no test logic; Questions
  never write; Interactions never act.
- **OCP:** good. New scenarios compose existing Tasks; adding a page area adds an Interaction
  without touching others.
- **LSP:** N/A - no inheritance hierarchies; composition throughout.
- **ISP:** good. Abilities are granular; the only smell is granting `CallAnApi` where it is
  unused (Risk 2), a violation more of YAGNI than ISP.
- **DIP:** good. Steps depend on Task abstractions, not on Playwright; the Playwright
  dependency is inverted behind Serenity's `BrowseTheWebWithPlaywright` ability.

## KISS

- The suite favours clarity: linear Tasks, explicit waits, no clever abstraction. The API
  client's dual-regex CSRF token extraction (input attribute or Vue prop,
  [OrangeHrmApiClient.ts](../../src/api/OrangeHrmApiClient.ts) (lines 92-93)) is the most
  complex line and is justified by the documented no-JS-curl reality.
- No premature framework or config indirection; the one avoidable complexity is the
  documentation surface, not the code.

## YAGNI

- Mostly disciplined. Two speculative affordances: the unused `CallAnApi` ability (Risk 2)
  and the reserved-but-empty `src/actors/` folder with its lingering `.gitkeep` (Risk 4).
- The `smoke` profile is arguably YAGNI-adjacent - it exists for a shared-demo run that
  backlog #4 says is not actually safe; either make it work (Risk 1 option a) or drop it.

## REST + OpenAPI

- The API interaction is correct REST-over-HTTP (session cookie, CSRF token on writes,
  JSON bodies, status-code-aware error handling). No OpenAPI document is consumed because
  OrangeHRM OSS ships none - recorded as an environmental constraint. See the Cross-Cutting
  Analysis API section.

## ISTQB Strategies

- **Equivalence partitioning / positive-negative:** both add-employee happy paths (with and
  without login) plus two negative cases (missing last name, duplicate id) show valid vs
  invalid partitioning.
- **State transition:** create -> appears in list; update -> persisted value; delete ->
  absent-from-list are genuine state-transition assertions on settled state.
- **Boundary/decision-table:** not exercised (e.g. name-length limits, required-field
  combinations) - a reasonable scope boundary for a journey suite, worth naming as a
  conscious limit rather than a gap.
- The "assert persisted state, not the transient toast" rule is applied consistently and is
  the suite's clearest test-design principle.

## Pedagogical Comments

- Exemplary. Comments explain *why* at the point of risk: browser lifecycle, selector-engine
  limitations, below-fold `isPresent`-then-`Click`, CSRF-prop-not-input, idempotent seeding.
- The bad-to-good Gherkin refactor and the three example-bearing ADRs make the repo teachable
  without running it.
- The one caveat: some prose has drifted from the code (Risk 4), so a learner cross-checking
  the screenplay guide against `src/` meets stale API names - fixing that restores full
  teaching trust.

---

[<- Previous: Recommendations](05_RECOMMENDATIONS.md) | [Back to Index](00_CODE_REVIEW_CLAUDE_FABLE_5_v1_20260718T0608Z.md) | [Next: Migration Plans ->](07_MIGRATION_PLANS.md)
