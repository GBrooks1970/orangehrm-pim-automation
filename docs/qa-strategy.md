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
   for session-cookie parsing, loopback safety, API response/duplicate classification, exact
   requested fixture identity, scenario ownership/conflict handling, and bounded readiness
   retry/deadline behaviour; run before browser download or Docker startup.
3. **Dependency audit:** `npm audit --audit-level=high`, no unaccepted High or Critical finding.
4. **Target contract:** `npm run test:target-contract`, every profile loads the pre-browser
   loopback guard and representative remote/malformed targets are rejected.
5. **Installed-application readiness:** `npm run test:readiness`, a bounded state poll that rejects
   installer redirects and requires both the installed login exchange and authenticated PIM API.
6. **Local employee API contract:** `npm run test:api-contract`, against the running Docker target;
   creates/reuses one unique fixture, proves its exact Employee Id/name/`empNumber` read-back, and
   deletes that exact owned record before returning.
7. **Active suite:** `npm test` (`--tags "not @deferred"`), all pass.
8. **Living-documentation report:** `npm run test:report`, no generation errors.

The `e2e` workflow enforces the TypeScript, lower-level, High-severity audit, target-contract,
installed-readiness, local API contract, active-suite, and report gates on every push to `main`
and every pull request against local Dockerised OrangeHRM.
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
| High | Shared-demo mutation/non-determinism | The public demo is shared, and even the smoke Background creates then removes a scenario-owned employee | Every profile is loopback-only; a pre-browser guard and static contract test reject remote targets |
| Medium | Login session coupling | An expired or unshared session breaks both UI and API setup | Authenticate once per run; reset browser state per scenario |
| Medium | False-ready container | Apache can answer while OrangeHRM serves the installer or cannot reach its configured database | Keep Compose health transport-only, then require a bounded installed-login plus authenticated-API probe before warm-up/tests |
| Medium | Issued-account false positive | Employee creation succeeds but the requested login account is absent, disabled, linked to another employee, or unusable | Retain the generated username in scenario notes, verify the exact enabled association through the admin API, then clear the admin session and sign in as the employee; mask the password in all activities |
| Medium | Autocomplete debounce | Asserting before the debounced search renders gives a false negative | Wait on the result row before asserting |
| Medium | Employee Id uniqueness | The duplicate-id case is meaningless if the seeded id did not take | Seed the exact id via API and verify before the UI step |
| Medium | Fixture API ambiguity | Lookup/auth failures or unrelated validation errors can masquerade as an absent/duplicate fixture | Fail non-OK lookup immediately; accept only the parsed 5.8.1 duplicate signature; read back exact identity |
| Low | Persistent-volume record leakage | Stable fixture names accumulate or let later scenarios pass against earlier records | Allocate unique physical identities per scenario; capture exact employee/user ids; ownership-check deletion; prove counts stay at baseline across repeated runs |
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
BASE_URL=http://localhost:8080 npm run test:readiness     # bounded installed-app gate
BASE_URL=http://localhost:8080 npm run test:api-contract  # requires the local stack
npm test                                   # full active suite
npm run test:smoke:local                   # one-scenario local smoke selection
HEADLESS=false npm test                    # visible browser
npx cucumber-js --profile default features/pim-add-employee.feature
npx tsc --noEmit
npm run test:report
```

Run the API contract and active suite twice against the same persistent volume when changing
ownership or cleanup. Employee and enabled-user counts must return to their pre-run baseline after
each pass. `docker compose down -v` remains the recovery path for records left by an interrupted
process; it is not required between healthy runs.

### CI

```bash
# 1. Start the stack; block on DB and Apache transport health
docker compose up -d --wait

# 2. Reject installer/broken Conf.php and prove authenticated API readiness
BASE_URL=http://localhost:8080 npm run test:readiness

# 3. Warm up the cold SPA outside any assertion
curl -sf http://localhost:8080/web/index.php/auth/login -o /dev/null

# 4. Run the active suite against the local target
BASE_URL=http://localhost:8080 npm test

# 5. Render the report and publish (main only)
npm run test:report
```

## 7. Open improvements

Tracked in `docs/backlog.md` — Items #1–#6 and CODEX-01–10 are closed; CODEX-11 remains open.
The local image tag and seeded-database path the suite asserts against (backlog #1) was confirmed
during the 2026-06-23 build.
