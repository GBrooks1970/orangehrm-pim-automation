# Implementation plan

This plan takes the scaffold to a green PIM suite without re-deriving any decision. Execute
the steps in order. Every new capability is two commits: the spec on its own, then the
implementation that references the scenario it satisfies.

## Current state

In place: repository structure, the three PIM feature specifications, the four project docs,
three ADRs, the CI and docker-compose skeletons, and the empty Screenplay layers under
`src/` (`.gitkeep`). Not in place: any implementation. The specs are committed first; the
SDD ordering is correct by construction.

## Settled decisions

- **Stack:** TypeScript + Serenity/JS + Playwright + Cucumber (the methodology reference).
- **SDD rule:** feature files are the specification, committed before the code that satisfies
  them.
- **Setup through the API, assertion through the UI:** employees are seeded via REST API v2;
  the add, search, edit and delete behaviours drive the UI.
- **Generic actor:** `actorCalled('User')` with first-person Gherkin.
- **Stable assertion:** assert the persisted record and the list row, never the success toast.
- See ADR-0001 (Screenplay over Page Objects), ADR-0002 (local Docker target over the shared
  demo), ADR-0003 (API-driven setup).

## Step-by-step next actions

1. **Seed the target once (Phase A).** The image is pinned to `orangehrm/orangehrm:5.8.1`
   (see `docs/docker-image-decision.md`). Stand up `docker compose up`, run the web installer,
   set the admin account to `Admin / admin123` to mirror the demo, then `mysqldump` the
   populated database to `db/seed.sql` and commit it. Uncomment the seed mount in
   `docker-compose.yml` so every later run (Phase B) comes up already installed. This closes
   backlog #1 and #2, because everything downstream asserts against this target.
2. **Initialise the project.** Install the stack from `package.json`, wire `cucumber.js` to
   discover `features/` and `src/step-definitions/`. Commit the project setup on its own (no
   test logic).
3. **Build the happy-path Screenplay layer first.** Abilities (`BrowseTheWebWithPlaywright`,
   `CallAnApi`), the hooks (browser once in `BeforeAll`, state reset in `Before`), the
   Interactions for the login, add-employee and personal-details pages, the `AddEmployee`
   Task, and the `EmployeeListRows` and `PersonalDetails` Questions. Make
   `pim-add-employee.feature` pass before widening. Commit referencing the scenario.
4. **Implement the API client.** `OrangeHrmApiClient.ts`: the session-auth exchange and the
   employee seed and verify calls backing the Background `an employee exists` step.
5. **Widen to management and validation**, spec-then-code in turn: `SearchForEmployee`,
   `EditPersonalDetails`, `DeleteEmployee`, then the `ValidationMessage` Question and the
   duplicate-id seed for the validation feature.
6. **Finalise CI and living docs.** Confirm the warm-up URLs, run the active suite against the
   local target in `ci.yml`, and wire the Pages publish (backlog #6). Add the screenshot
   config (backlog #5).

## OrangeHRM-specific traps to handle

- **Vue SPA async render:** wait on element state at every route and form transition; no hard
  waits. The default `Wait.until` ceiling is too short for a cold SPA.
- **Login gate and session coupling:** authenticate once per run; the session cookie also
  authorises the API client. Reset browser state per scenario.
- **Autocomplete debounce:** wait for the search result row before asserting or selecting.
- **Employee Id uniqueness:** seed the exact id the duplicate-id scenario reuses, and verify
  it took before the UI step.
- **Shared-demo non-determinism:** run state-changing scenarios against the local target only.

## Definition of done for the scaffold

- [x] Repository structure created; empty layers carry `.gitkeep`.
- [x] Four project docs instantiated for OrangeHRM PIM.
- [x] Feature specs written for the in-scope families, declarative, following the style guide.
- [x] `gherkin-style-guide.md` carries a bad-to-good refactor of the add-employee journey.
- [x] Three ADRs written.
- [x] CI skeleton present, shaped to local Docker provisioning.
- [x] `docs/implementation-plan.md` written and actionable.
- [x] No hard waits, no UI mechanics, and no toast-only assertions in the feature files.
- [x] Two commits exist (specs first, then scaffold), done at repository initialisation on a
      native filesystem. The history then continues spec-first: project setup, Phase A
      provisioning, then one implementation commit per feature.

## Longer-term: portfolio-credibility checklist

- [x] Commit history shows specs before implementation, kept that way.
- [x] ADRs justify Screenplay-over-POM, the local target, and API setup, each with a concrete
      example now that the code exists (see `docs/adr/000{1,2,3}`).
- [~] Green CI badge on a non-flaky PIM E2E suite. The suite is green and deterministic locally
      (`npm test` → 7/7, re-run stable); `ci.yml` is wired to run it on the local target. The
      badge appears after the first push to a GitHub remote.
- [~] Living documentation published and clickable. `npm run test:report` renders the Serenity
      HTML; `ci.yml` deploys it to GitHub Pages from `main`. Published once pushed.
- [x] Style guide carries the bad-to-good refactor (done).
- [ ] A quarantine demonstration: no scenario is flaky today, so none is quarantined. The
      mechanism is in place — the `default` and `smoke` profiles already exclude `@deferred`.
