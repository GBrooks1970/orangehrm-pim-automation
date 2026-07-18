# Project Review: orangehrm-pim-automation

[<- Back to Index](../00_CODE_REVIEW_CLAUDE_FABLE_5_v1_20260718T0608Z.md) | [Next: Cross-Project Analysis ->](../04_CROSS_PROJECT_ANALYSIS.md)

**Reviewer:** AI assistant (Claude Fable 5)

Single-repository review: this is the only project file, per the template's customisation
notes.

## Snapshot

- **Stack:** TypeScript (strict), Serenity/JS 3.43, Playwright 1.60.0 (exact pin), Cucumber 11.
- **Scope:** OrangeHRM 5.8.1 PIM add-employee journey plus adjacent search/edit/delete and
  form validation. 7 active scenarios, 0 deferred (confirmed by dry-run for this review).
- **Backlog state:** items 1-3, 5, 6 closed with evidence; #4 open as a deliberate,
  non-blocking design choice ([docs/backlog.md](../../../docs/backlog.md)).
- **Gates (registry):** static `npx tsc --noEmit` (run for this review - PASS); E2E
  `docker compose up -d --wait` + `npm test` (not run here - heavyweight infrastructure;
  see the index's Validation Performed note).

## Assessment

- **Architecture and pattern fidelity.** The Screenplay decomposition is textbook and the
  right size for the journey: 6 Tasks, 4 Interaction files, 3 Questions, 4 step-definition
  files, one hooks file, one API client. Tasks compose (e.g.
  [DeleteEmployee.ts](../../../src/tasks/DeleteEmployee.ts) reuses
  `SearchForEmployee.selecting`), Interactions carry no behaviour, Questions carry no
  writes. The single fidelity gap is the engaged-but-unused `CallAnApi` ability (Risk 2) -
  the seeding path is a module-level `fetch` client, which the docs misdescribe as
  ability-backed.
- **Runtime lifecycle and isolation.** Launch-once/close-once browser in
  `BeforeAll`/`AfterAll` with per-scenario state reset in `Before`
  ([browser.hooks.ts](../../../src/hooks/browser.hooks.ts) (lines 46-68)): storage cleared
  on-origin, in-flight requests parked on `about:blank`, cookies cleared last - a correct
  reset order for Serenity's single reused context, with the closed-browser trap documented
  at the point of temptation (lines 16-21). Step timeout (60 s) is set explicitly above the
  15 s wait ceilings with the arithmetic explained (lines 10-14).
- **Waits and synchronisation.** Uniform `Wait.upTo(15s).until(element, state)` at every SPA
  transition; `isPresent()` (not `isVisible()`) deliberately chosen for below-fold elements
  that auto-scrolling `Click` will reach ([EditPersonalDetails.ts](../../../src/tasks/EditPersonalDetails.ts)
  (lines 8-12)); debounced autocomplete handled by waiting on the suggestion (exists-path)
  or the settled dropdown (absence-path) in
  [SearchForEmployee.ts](../../../src/tasks/SearchForEmployee.ts). Zero hard waits in the
  suite; the only `waitForTimeout` calls live in the one-off Phase A installer script,
  which is explicitly not part of a run.
- **Data setup and auth assumptions.** Session-cookie + CSRF login exchange implemented
  once per run with cookie-rotation handling and a redirect-based failure check
  ([OrangeHrmApiClient.ts](../../../src/api/OrangeHrmApiClient.ts) (lines 88-124));
  default `Admin/admin123` credentials are refused for non-localhost targets (lines 73-84) -
  a genuinely good safety property. Seeding is idempotent by lookup
  (`ensureEmployeeExists`) and by treating a uniqueness clash as success
  (`ensureEmployeeWithId`), which is what lets a per-scenario Background re-run safely.
- **Executable specification quality.** The three feature files are declarative, first-person,
  time-free, and consistent with the style guide the repo itself publishes; the
  bad-to-good refactor in [gherkin-style-guide.md](../../../docs/gherkin-style-guide.md) is
  the best single teaching artefact in the repo. Weakness: the tag vocabulary
  (`@changesState`, `@deferred`) does not distinguish UI-write from API-seeded-Background
  scenarios, which is the root of the smoke-profile drift (Risk 1).
- **CI and provisioning.** The workflow provisions the full SUT from committed artefacts
  (`db/seed.sql` + `provisioning/Conf.php`), warms the cold SPA outside any assertion, runs
  the suite, guards against publishing an empty-shell report (a lesson inherited from the
  Magento project, applied here from day one), and deploys living documentation to Pages
  even on failure - deliberately, so a broken build stays inspectable. Gaps are polish-level
  (Risk 7): no Pages concurrency group, an unconditional artifact upload, no job timeout.
- **Documentation.** Unusually complete for the repo's size - four project docs, three
  example-bearing ADRs, a docker-image decision note with alternatives, a two-phase
  provisioning runbook, two implementation logs, and full licence provenance. The cost of
  that breadth is the drift catalogued in Risk 4: stale scaffold-era prose and a screenplay
  guide whose API names no longer match the code.
- **Strengths worth naming:** the `Admin/admin123` demo-parity workaround (hash rewrite +
  `enforce_password_strength=off`, captured in the seed); the `Conf.php` insight that a
  seeded database alone is insufficient on a clean runner; LF normalisation with recorded
  reasoning; exact `playwright@1.60.0` pin to dedupe against Serenity's peer range.

---

[<- Previous: Risks and Issues](../02_RISKS_AND_ISSUES.md) | [Back to Index](../00_CODE_REVIEW_CLAUDE_FABLE_5_v1_20260718T0608Z.md) | [Next: Cross-Project Analysis ->](../04_CROSS_PROJECT_ANALYSIS.md)
