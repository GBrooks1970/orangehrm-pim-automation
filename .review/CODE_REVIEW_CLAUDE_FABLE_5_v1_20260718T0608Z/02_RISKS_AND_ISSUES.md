# Risks and Issues

[<- Back to Index](00_CODE_REVIEW_CLAUDE_FABLE_5_v1_20260718T0608Z.md) | [Next: Project Reviews ->](03_PROJECT_REVIEWS/PROJECT_001_orangehrm-pim-automation.md)

**Reviewer:** AI assistant (Claude Fable 5)

Numbered high to low. No HIGH-severity findings: nothing here breaks the suite against its
default local target.

## 1. MEDIUM - The `smoke` profile selects 3 scenarios, not the documented 1, and is not demo-safe

**Risk description.** Every document that describes the smoke subset says it contains only
the read-only search scenario. The profile's tag expression actually selects three
scenarios, and one of them attempts an API write in its Background - so `smoke` is neither
the documented subset nor safe against the shared public demo it exists for.

**Evidence.**

- [cucumber.js](../../cucumber.js) (line 20): `smoke` = `not @deferred and not @changesState`.
- `npx cucumber-js --profile smoke --dry-run` run for this review: **3 scenarios** selected -
  the search scenario plus both scenarios in
  [pim-validation.feature](../../features/pim-validation.feature), which carries no tags
  (lines 9-18).
- [features/_manifest.md](../../features/_manifest.md) (lines 16-19): "Only the read-only
  search scenario qualifies".
- [docs/qa-strategy.md](../../docs/qa-strategy.md) (lines 22-23): "the read-only search
  scenario, the safe subset against the shared public demo".
- [docs/implementation-logs/2026-06-23_build-to-green.md](../../docs/implementation-logs/2026-06-23_build-to-green.md)
  (lines 169-171): calls search "the lone non-`@changesState` scenario".
- The duplicate-id scenario's Background step `an employee with employee id "0001" exists`
  unconditionally POSTs to `api/v2/pim/employees`
  ([OrangeHrmApiClient.ts](../../src/api/OrangeHrmApiClient.ts) (lines 201-220)) - an API
  write attempt against whatever host `BASE_URL` names. (Against the standard seed it
  collides with the admin's `0001` and is treated as success, but that is incidental, and
  against the demo it is still a write attempt.) Backlog #4 already records the equivalent
  problem for the search Background's seeding
  ([docs/backlog.md](../../docs/backlog.md) (line 10)) but does not mention the validation
  scenarios at all.

**Impact.** Anyone running `npx cucumber-js --profile smoke` against
`https://opensource-demo.orangehrmlive.com` (exactly what the profile is documented for)
runs two undocumented scenarios, sends a write to a shared instance, and depends on
non-deterministic demo state for the duplicate-id assertion. The documentation's scenario
arithmetic is also simply wrong, which erodes trust in otherwise careful docs. This is the
same defect class as the Magento reference's C-01 finding (smoke profile silently wider than
documented).

**Remediation.** Decide the intent, then make tags, profile, and docs agree. Two coherent
options: (a) restrict the profile to genuinely demo-safe scenarios - e.g. tag the validation
feature's scenarios (`@localOnly`, or tag the duplicate-id one `@seedsData`) and extend the
smoke expression to exclude them, leaving search (with backlog #4's caveat) as the sole
member; or (b) keep the 3-scenario subset, rename/redescribe it as a local quick profile,
and stop claiming demo-safety. Either way update `_manifest.md`, `qa-strategy.md`, and
backlog #4 (which should be widened to cover the validation Background, or closed by the
same change). **Unattended-run note:** this choice belongs to the project owner; recorded
here rather than asked interactively. Option (a) matches the stated intent of ADR-0002 and
is the reviewer's recommendation.

## 2. MEDIUM - `CallAnApi` is engaged but never used; ADR-0003 and the guide claim otherwise

**Risk description.** The actor is given the `CallAnApi` ability every scenario, and the
project documentation states that seeding happens through it. In reality every API call in
the suite goes through bare Node `fetch` in a module-level client, outside the Screenplay
model entirely. The ability is dead weight and the documentation misstates the architecture.

**Evidence.**

- [browser.hooks.ts](../../src/hooks/browser.hooks.ts) (line 65): `CallAnApi.at(BASE_URL)`
  granted to the actor. `grep -rn "CallAnApi" src/` shows no other use.
- [OrangeHrmApiClient.ts](../../src/api/OrangeHrmApiClient.ts) (lines 88, 103, 152, 181,
  203): all auth/seed traffic uses global `fetch` with hand-built `Cookie` headers.
- [docs/adr/0003-api-driven-setup.md](../../docs/adr/0003-api-driven-setup.md) (lines
  14-15): "Seed prerequisite employees through OrangeHRM REST API v2, behind the `CallAnApi`
  ability."
- [docs/screenplay-guide.md](../../docs/screenplay-guide.md) (line 50): the Abilities table
  gives `CallAnApi` the role "Authenticate and seed employees via REST API v2".
- [docs/architecture.md](../../docs/architecture.md) (line 110): runtime sequence says the
  actor is engaged with both abilities (true, but the second is never exercised).

**Impact.** Architectural fidelity: the repo teaches Screenplay, and a reviewer who traces
the seeding path finds the pattern bypassed where the docs claim it is used. Practically,
the seeding also escapes Serenity's reporting (API setup steps are invisible in the living
documentation, where `CallAnApi` interactions would be recorded), and the unused ability
adds a false affordance for future contributors.

**Remediation.** Pick one of two honest states: (a) route seeding through the ability -
e.g. a `SeedEmployee` Task using `@serenity-js/rest`'s `Send.a(PostRequest.to(...))` with
the session cookie header, invoked from the Background steps via `actorCalled('User')` -
which also surfaces setup in the report; or (b) remove `CallAnApi` from the cast and correct
ADR-0003, the screenplay guide, and architecture.md to describe the module-level client
honestly (a defensible design - setup deliberately outside the acting model - but it must be
described as such). Option (a) is the better portfolio showcase; option (b) is a
30-minute docs fix.

## 3. MEDIUM - 5 moderate npm audit advisories in the @cucumber chain; no audit gate in CI

**Risk description.** `npm audit` (run 2026-07-18 for this review) reports 5 moderate
advisories, all one root cause: `uuid < 11.1.1` (GHSA-w5hq-g745-h8pq, missing buffer bounds
check) reached via `@cucumber/messages` / `@cucumber/gherkin` / `@cucumber/gherkin-utils`
under `@cucumber/cucumber@11`. The fix npm proposes is `@cucumber/cucumber@12.9.0`, a major
bump. All affected packages are devDependencies; nothing ships to production.

**Evidence.**

- `npm audit` output (this review): "5 moderate severity vulnerabilities"; fix available via
  `npm audit fix --force` installing `@cucumber/cucumber@12.9.0` (breaking change).
- [package.json](../../package.json) (line 14): `"@cucumber/cucumber": "^11.0.0"`.
- [ci.yml](../../.github/workflows/ci.yml): no audit step in the workflow.

**Impact.** Low direct exploitability (dev-only, test-runner-internal `uuid` usage), but the
portfolio has twice seen this pattern become a visible Dependabot flag on the public repo
(hand-baked HBSP-09 precedent, where an equivalent dev-chain audit finding was fixed via a
major test-runner bump). Left alone it will surface as public-facing security noise on a
repository whose purpose is to look professionally maintained.

**Remediation.** Schedule a `@cucumber/cucumber` v11 -> v12 major bump as a backlog item;
verify `@serenity-js/cucumber@3.43`'s peer-range compatibility with cucumber 12 first (the
Serenity adapter is the coupling point - if its current peer range excludes 12, record that
and pin the expectation to the next Serenity release instead). Do not use
`npm audit fix --force` blind. Optionally add a non-blocking `npm audit` report step to CI
for visibility. Never treat the advisory as exploitable in CI context; it is hygiene.

## 4. LOW - Stale "fresh scaffold" narrative and API-name drift across five docs

**Risk description.** The project was built to green on 2026-06-23, but several documents
still speak as if the implementation does not exist, and the screenplay guide names APIs
that were never shipped under those names.

**Evidence.**

- [docs/architecture.md](../../docs/architecture.md) (line 139): "This is a fresh scaffold."
- [docs/qa-strategy.md](../../docs/qa-strategy.md) (line 98): "Nothing else is open at
  scaffold stage."
- [src/README.md](../../src/README.md) (lines 13-14, 20-21): names a `PersonalDetailsName`
  question (actual: `PersonalDetails` in
  [PersonalDetails.ts](../../src/questions/PersonalDetails.ts)) and says "The folders carry
  `.gitkeep` until the implementation step fills them" - they are filled; the `.gitkeep`
  files linger.
- [docs/adr/README.md](../../docs/adr/README.md) (lines 12-13): "Each ADR carries a
  concrete-example marker to be filled" - all three ADRs already carry filled examples.
- [docs/screenplay-guide.md](../../docs/screenplay-guide.md) (line 69):
  `SearchForEmployee.byName(name)` (actual: `.selecting` / `.byNameText` in
  [SearchForEmployee.ts](../../src/tasks/SearchForEmployee.ts)); (line 100):
  `EmployeeListPage.firstResultRow` (actual: `firstAutocompleteOption` /
  `autocompleteDropdown` in
  [EmployeeListPage.ts](../../src/interactions/EmployeeListPage.ts)); (line 100) shows a
  10 s ceiling where the code uses 15 s throughout.
- [docs/implementation-plan.md](../../docs/implementation-plan.md) (lines 9-11): "Not in
  place: any implementation" - defensible as a historical plan, but it is written in the
  present tense with no completion note, unlike the backlog.
- [package.json](../../package.json) (line 26): the `"//"` comment still calls the versions
  "indicative scaffolding pins" although they are installed and locked.

**Impact.** Each instance is trivial; together they are the portfolio's recurring
documentation-drift theme (seen in all four earlier projects' reviews) and this repo's main
credibility leak: a hiring reviewer who cross-checks the guide against the code finds three
mismatches in one file.

**Remediation.** One short docs pass: update the stale status sentences, correct the
screenplay guide's table and snippet to the real names and ceilings, fix `src/README.md`,
reword `adr/README.md` to past tense, add a one-line "completed 2026-06-23" banner to the
implementation plan, drop the stale package.json comment, and delete the now-redundant
`.gitkeep` files in populated `src/` folders (`git ls-files` shows seven).

## 5. LOW - Run data accumulates on a persistent local target

**Risk description.** The two add-employee scenarios create "Aurora Vega" and "Marcus Hale"
unconditionally on every run, and usernames are uniquified with `Date.now()`. CI wipes the
stack (`docker compose down -v`), but a developer's long-lived local volume accumulates
duplicate employees and login accounts across runs.

**Evidence.**

- [AddEmployee.ts](../../src/tasks/AddEmployee.ts) (lines 20-27, 39): unconditional creates;
  `Date.now()`-suffixed usernames.
- [EmployeeListRows.ts](../../src/questions/EmployeeListRows.ts) (lines 13-17): assertions
  take `.first()`, deliberately tolerating duplicates.
- [ci.yml](../../.github/workflows/ci.yml) (lines 82-84): teardown with `-v` in CI only.
- The implementation log (lines 40) shows a re-run without restore staying green - so the
  suite is *proven* tolerant, which is the mitigation.

**Impact.** No assertion breaks (the idempotent seed and `.first()` matching were designed
for exactly this), but a local target drifts from the seeded baseline over time: employee
lists grow, the delete scenario's search-then-first-row pattern relies on the autocomplete
binding to a single exact employee, and debugging screenshots show crowded lists. Mild,
known, and partially documented.

**Remediation.** Document `docker compose down -v && up -d` as the recommended periodic
local reset in the README run instructions (it exists today only in
[db/README.md](../../db/README.md) (line 75) as a re-restore note), or add cleanup of the
created employees to the add scenarios' teardown via the API client. The docs-only option is
proportionate.

## 6. LOW - No `engines` declaration despite a hard Node 18+ requirement

**Risk description.** The API client depends on global `fetch` (Node >= 18); CI pins Node 20
([ci.yml](../../.github/workflows/ci.yml) (line 27)), but [package.json](../../package.json)
declares no `engines`, so a Node 16 user fails at runtime with an unhelpful
`fetch is not defined` mid-hook rather than at install time.

**Evidence.** `fetch` calls at [OrangeHrmApiClient.ts](../../src/api/OrangeHrmApiClient.ts)
(lines 88, 103, 152, 181, 203); no `engines` field in [package.json](../../package.json);
`@types/node@^20` (line 21) implies the intent.

**Impact.** Confusing first-run failure for anyone on an old Node; same finding class as
hand-baked HBSP-10 (resolved there by declaring a Node 20 floor).

**Remediation.** Add `"engines": { "node": ">=20" }` to match CI and `@types/node`, and
state the floor in the README run instructions.

## 7. LOW - CI polish: Pages deploy race, unconditional artifact upload, no timeouts

**Risk description.** Three small workflow robustness gaps.

**Evidence and impact.**

- [ci.yml](../../.github/workflows/ci.yml) (lines 88-101): `deploy-pages` has no
  `concurrency` group; two pushes to `main` in quick succession can race deployments
  (GitHub's own Pages starter workflows set `concurrency: pages`). Publishing even on a
  failed run is deliberate and documented (lines 86-87) - not a finding.
- (lines 76-79): `Upload Pages artifact` runs `if: always()`; if `npm run test:report`
  failed, the upload fails on a missing `target/site/serenity`, adding a second red step
  that obscures the first failure. Guarding on the report step's outcome would keep the
  failure signal clean.
- No `timeout-minutes` on the `e2e` job: a wedged `docker compose up --wait` or a hung
  suite consumes the runner for GitHub's default 6 hours.

**Remediation.** Add `concurrency: { group: pages, cancel-in-progress: false }` to the
deploy job, condition the upload on the report render having succeeded (or `hashFiles` on
the output dir), and set `timeout-minutes: 30` on `e2e`. All three are one-line changes.

## 8. LOW - Minor assertion and selector brittleness (accepted trade-offs, worth recording)

**Risk description.** A handful of deliberate implementation choices carry small fragility
that should stay on the record rather than surprise a future maintainer.

**Evidence.**

- [validation.steps.ts](../../src/step-definitions/validation.steps.ts) (lines 38-42)
  asserts the literal text "already exists"; an OrangeHRM copy change breaks it (the
  companion "Required" assertion (line 34) has the same property). Field-level scoping is
  good; the literal text is the contract being tested, so this is acceptable - but a
  language/locale change on the SUT will fail the suite.
- [AddEmployeePage.ts](../../src/interactions/AddEmployeePage.ts) (line 31): the
  `createLoginDetailsToggle` is located by bare `.oxd-switch-input` - the only
  class-only, non-label-anchored selector among the form's elements; a second switch on the
  page would bind wrongly.
- [EmployeeListRows.ts](../../src/questions/EmployeeListRows.ts) (lines 13-16): first/last
  token `includes` matching means "Ann Lee" would match a row for "Annabel Leeson"; with
  API-bound exact search preceding it, this is theoretical today.
- [LogInAsAdmin.ts](../../src/tasks/LogInAsAdmin.ts) (lines 23-26): cookie injection
  hard-codes `path: '/web'`; correct for OrangeHRM 5.x, but version-coupled.

**Impact.** None today; each is the kind of latent coupling that costs an hour when the SUT
moves. Listed for the record, not for action.

**Remediation.** No change required. If the suite is ever pointed at a non-English or newer
OrangeHRM, start here.

---

[<- Previous: Executive Summary](01_EXECUTIVE_SUMMARY.md) | [Back to Index](00_CODE_REVIEW_CLAUDE_FABLE_5_v1_20260718T0608Z.md) | [Next: Project Reviews ->](03_PROJECT_REVIEWS/PROJECT_001_orangehrm-pim-automation.md)
