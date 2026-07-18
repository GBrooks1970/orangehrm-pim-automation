# Cross-Cutting Analysis

[<- Back to Index](00_CODE_REVIEW_CLAUDE_FABLE_5_v1_20260718T0608Z.md) | [Next: Recommendations ->](05_RECOMMENDATIONS.md)

**Reviewer:** AI assistant (Claude Fable 5)

Single-repository review: per the template's customisation notes, this section analyses
cross-cutting concerns *within* the repo - specification vs implementation vs
infrastructure vs CI vs documentation - and marks template areas that do not apply.

## Tool-Agnostic Tests

- The Gherkin layer is fully tool-agnostic: no selector, URL, wait, or Serenity concept
  appears in any feature file; the same specifications could drive another stack unchanged.
- The glue is thin and mechanical (each step is one `attemptsTo` call), so the
  tool-specific surface is concentrated in `src/tasks`, `src/interactions` and the hooks -
  the right place for it.
- The API client is plain `fetch` + TypeScript with no framework dependency, so the seeding
  layer is portable too (ironically, a side benefit of the Risk 2 fidelity gap).

## Code-Agnostic Tests

- Scenario identity lives in business data ("Aurora Vega", nationality "British",
  employee id "0001"), not in implementation detail; assertions name persisted facts.
- The one leak of implementation reality into the spec is tagging: `@changesState` encodes
  a runtime-safety property, but incompletely (Background API writes are untagged), which is
  Risk 1's root cause.
- First-person generic-actor phrasing (`actorCalled('User')`) keeps scenarios independent of
  any cast design.

## Single Source of Truth

- `docs/backlog.md` is the accurate, evidence-bearing project state and matches the repo
  everywhere it was checked (items 1-3, 5, 6 verified against code and CI config for this
  review).
- The scenario-count truth (7 active / 0 deferred) is consistent across manifest,
  qa-strategy, README, backlog and the dry-run - good.
- The smoke-subset truth has *three* claimants (manifest, qa-strategy, implementation log)
  all disagreeing with the executable definition in `cucumber.js` - the profile expression
  is the de facto source of truth and the prose has drifted (Risk 1).
- `BASE_URL` and the `/web/index.php` prefix are centralised in
  [serenity.config.ts](../../src/serenity.config.ts) (`webUrl()`), so the target contract
  has exactly one home - well done.

## API Contract Compliance

- The suite consumes OrangeHRM REST API v2 as-observed (documented endpoint shapes in the
  client's JSDoc and backlog #2) rather than against a published OpenAPI document; OrangeHRM
  OSS does not ship one, so this is recorded as an environmental constraint, not a defect.
- Error handling distinguishes uniqueness conflicts (422 / "already exists") from real
  failures ([OrangeHrmApiClient.ts](../../src/api/OrangeHrmApiClient.ts) (lines 211-219)),
  which is the minimum contract awareness the seeding needs.
- N/A beyond this - the repo owns no API of its own to hold to REST/OpenAPI standards.

## Screenplay Parity

- Within the repo, the pattern is applied uniformly across all four feature areas; no
  page-object backsliding anywhere.
- Parity break: the documented ability set (browse + API) does not match the exercised
  ability set (browse only) - Risk 2.
- Against the portfolio's other Screenplay projects (per their registry rows), this repo
  follows the same conventions (Tasks/Questions/Interactions foldering, `Wait.upTo`
  ceilings, single stdout formatter), so a portfolio reader moves between repos without
  relearning.

## Batch File Design

- N/A - the repo ships no batch/shell scripts; automation entry points are npm scripts,
  `docker compose`, and one Node installer script (`provisioning/phase-a-install.mjs`),
  each documented where used.

## Documentation Alignment

- Backlog: aligned with the code (verified). README status: aligned. Feature manifest
  scenario counts: aligned.
- Misaligned (Risk 4): architecture.md and qa-strategy.md scaffold-era closing sections,
  src/README.md (names and `.gitkeep` claim), adr/README.md (marker claim),
  screenplay-guide.md (API names, element names, wait ceiling), package.json scaffolding
  comment.
- Misaligned (Risk 1): all three smoke-subset descriptions vs `cucumber.js`.
- The README omits a CI badge and a link to the published living documentation
  (gbrooks1970.github.io/orangehrm-pim-automation), although the implementation plan's
  credibility checklist anticipates the badge - a small discoverability gap for the repo's
  best evidence.

## Logging Alignment

- Reporting is coherent end-to-end: one stdout formatter (`@serenity-js/cucumber`),
  ArtifactArchiver to `docs/reports/`, ConsoleReporter for humans, Photographer as an
  optional crew member gated by `SCREENSHOTS`/CI ([screenshots.ts](../../src/config/screenshots.ts)).
- The empty-report guard in CI (scenario JSON count check) operationalises the portfolio's
  "verify report CONTENT" lesson - alignment with hard-won practice, not just convention.
- Gap: API seeding happens outside Serenity, so setup activity is absent from the living
  documentation (consequence of Risk 2).

## Test Coverage Metrics

- 7 E2E scenarios covering: create (2 variants), read/search (1), update (1), delete (1),
  and negative validation (2) - full CRUD plus two ISTQB-recognisable negative cases over
  the declared journey.
- 0 deferred/quarantined scenarios; the quarantine mechanism (`@deferred`) exists and is
  unused, and the docs say so honestly.
- No unit or integration tier exists (pure-logic candidates like `parseSetCookies` are
  untested below E2E) - see the Architecture Assessment's Test Pyramid section.

---

[<- Previous: Project Reviews](03_PROJECT_REVIEWS/PROJECT_001_orangehrm-pim-automation.md) | [Back to Index](00_CODE_REVIEW_CLAUDE_FABLE_5_v1_20260718T0608Z.md) | [Next: Recommendations ->](05_RECOMMENDATIONS.md)
