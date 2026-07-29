# QA strategy

## 1. Objectives

1. Demonstrate a non-flaky, API-setup plus UI-assertion E2E suite against the OrangeHRM PIM
   add-employee journey, the most stateful surface a new starter touches.
2. Show that the BDD feature files are a specification first and a harness second, evidenced
   by specs committed before step definitions.
3. Document and mitigate the OrangeHRM-specific traps: Vue SPA async rendering, the login
   gate, autocomplete debounce, and shared-demo non-determinism.
4. Produce living documentation a reviewer can read without running the suite.

## 2. Test inventory

| Feature file | Scenarios | Scope | Tags | CI status |
|---|---|---|---|---|
| `pim-add-employee.feature` | 2 | Add an employee; the credentials variant verifies the enabled account association and signs in as that employee | `@changesState` | Active |
| `pim-employee-management.feature` | 3 | Search (read-only UI query with API-seeded setup), update nationality, delete | `@changesState` on update and delete | Active |
| `pim-validation.feature` | 2 | Missing last name; duplicate employee id | `@localOnly` on both; `@seedsData` also on the duplicate-id scenario | Active |

**Active scenarios:** 7. **Deferred:** 0.
**Local smoke subset** (`smoke` profile, `not @deferred and not @changesState and not @localOnly
and not @seedsData`): exactly 1 scenario — employee search. Its feature Background can
conditionally create the employee through the API, so the profile is local-only despite the
read-only UI query. A fail-fast hook rejects every non-loopback target before browser/API setup.

## 3. Automation gates

1. **TypeScript type check:** `npm run typecheck`, zero errors, run immediately after dependency
   installation so static defects fail before browser download or Docker startup.
2. **Lower-level policy tests:** `npm run test:unit`, deterministic and SUT-independent coverage
   for session-cookie parsing, loopback safety, API response/duplicate classification, and exact
   requested fixture identity; run before browser download or Docker startup.
3. **Dependency audit:** `npm audit --audit-level=high`, no unaccepted High or Critical finding.
4. **Target contract:** `npm run test:target-contract`, every profile loads the pre-browser
   loopback guard and representative remote/malformed targets are rejected.
5. **Local employee API contract:** `npm run test:api-contract`, against the running Docker target;
   creates or reuses one stable fixture and proves its exact Employee Id/name/`empNumber` read-back.
6. **Active suite:** `npm test` (`--tags "not @deferred"`), all pass.
7. **Living-documentation report:** `npm run test:report`, no generation errors.

The `e2e` workflow enforces the TypeScript, lower-level, High-severity audit, target-contract,
local API contract, active-suite, and report gates on every push to `main` and every pull request
against local Dockerised OrangeHRM.
The cheap TypeScript and lower-level gates run immediately after `npm ci`, before browser or
Docker setup.

## 4. Metrics and reporting

- **Run artifacts:** Serenity JSON to `docs/reports/` via ArtifactArchiver.
- **Living documentation:** `npm run test:report` to HTML; CI publishes to GitHub Pages on
  green `main`.
- **Flake monitoring:** `@deferred` quarantines anything not yet runnable (none today). A
  scenario that starts flaking is tagged and annotated with the trigger rather than left to
  fail intermittently.
- **Baseline:** all active scenarios pass on every local run; zero tolerance for intermittent
  failures.

Screenshots are configurable by environment (`SCREENSHOTS=off|failures|all`), captured by the
Photographer crew member. They are artifacts, not assertions: a capture failure is logged and
never fails a step.

## 5. Risk-based focus

| Tier | Area | Risk | Mitigation |
|---|---|---|---|
| High | Vue SPA async render | Steps fire before the SPA re-renders, causing element-not-found or stale-element errors | Explicit `Wait.until(element, isVisible())` at every transition; zero hard waits |
| High | Shared-demo mutation/non-determinism | The public demo is shared, and even the smoke Background can create a missing employee | Every profile is loopback-only; a pre-browser guard and static contract test reject remote targets |
| Medium | Login session coupling | An expired or unshared session breaks both UI and API setup | Authenticate once per run; reset browser state per scenario |
| Medium | Issued-account false positive | Employee creation succeeds but the requested login account is absent, disabled, linked to another employee, or unusable | Retain the generated username in scenario notes, verify the exact enabled association through the admin API, then clear the admin session and sign in as the employee; mask the password in all activities |
| Medium | Autocomplete debounce | Asserting before the debounced search renders gives a false negative | Wait on the result row before asserting |
| Medium | Employee Id uniqueness | The duplicate-id case is meaningless if the seeded id did not take | Seed the exact id via API and verify before the UI step |
| Medium | Fixture API ambiguity | Lookup/auth failures or unrelated validation errors can masquerade as an absent/duplicate fixture | Fail non-OK lookup immediately; accept only the parsed 5.8.1 duplicate signature; read back exact identity |
| Low | Record vs toast | Asserting on the fading success toast races the UI | Assert on the persisted record and list row |

### Settled-state assertions

The Employee List can briefly lag a create or delete. Assert what the list settles to: where
needed, reload the list and poll for the row to appear or disappear, rather than trusting the
first render after the mutation.

## 6. Execution recipes

### Local developer loop

```bash
npm install
npm run test:unit                           # fast; no SUT or browser required
npm run test:target-contract                 # no SUT; verifies every profile's loopback guard
BASE_URL=http://localhost:8080 npm run test:api-contract  # requires the local stack
npm test                                   # full active suite
npm run test:smoke:local                   # one-scenario local smoke selection
HEADLESS=false npm test                    # visible browser
npx cucumber-js --profile default features/pim-add-employee.feature
npx tsc --noEmit
npm run test:report
```

### CI

```bash
# 1. Start the stack; block on healthchecks (DB up, web installer done)
docker compose up -d --wait

# 2. Smoke-check and warm up the cold SPA outside any assertion
curl -sf http://localhost:8080/web/index.php/auth/login -o /dev/null

# 3. Run the active suite against the local target
BASE_URL=http://localhost:8080 npm test

# 4. Render the report and publish (main only)
npm run test:report
```

## 7. Open improvements

Tracked in `docs/backlog.md` — Items #1–#6 and CODEX-01–07 are closed; CODEX-08–11 remain open.
The local image tag and seeded-database path the suite asserts against (backlog #1) was confirmed
during the 2026-06-23 build.
