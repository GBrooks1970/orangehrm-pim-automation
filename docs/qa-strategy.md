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
| `pim-add-employee.feature` | 2 | Add an employee, with and without login credentials | `@changesState` | Active |
| `pim-employee-management.feature` | 3 | Search (read-only), update nationality, delete | `@changesState` on update and delete | Active |
| `pim-validation.feature` | 2 | Missing last name; duplicate employee id | `@localOnly` on both; `@seedsData` also on the duplicate-id scenario | Active |

**Active scenarios:** 7. **Deferred:** 0.
**Smoke subset** (`smoke` profile, `not @deferred and not @changesState and not @localOnly and
not @seedsData`): exactly 1 scenario — the read-only search scenario, the safe subset against
the shared public demo.

## 3. Automation gates

1. **TypeScript type check:** `npx tsc --noEmit`, zero errors.
2. **Active suite:** `npm test` (`--tags "not @deferred"`), all pass.
3. **Living-documentation report:** `npm run test:report`, no generation errors.

The `e2e` workflow enforces these on every push to `main` and every pull request, against the
local Dockerised OrangeHRM.

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
| High | Shared-demo non-determinism | The public demo is shared, periodically reset, and may reject writes | State-changing scenarios run against the local Docker target only |
| Medium | Login session coupling | An expired or unshared session breaks both UI and API setup | Authenticate once per run; reset browser state per scenario |
| Medium | Autocomplete debounce | Asserting before the debounced search renders gives a false negative | Wait on the result row before asserting |
| Medium | Employee Id uniqueness | The duplicate-id case is meaningless if the seeded id did not take | Seed the exact id via API and verify before the UI step |
| Low | Record vs toast | Asserting on the fading success toast races the UI | Assert on the persisted record and list row |

### Settled-state assertions

The Employee List can briefly lag a create or delete. Assert what the list settles to: where
needed, reload the list and poll for the row to appear or disappear, rather than trusting the
first render after the mutation.

## 6. Execution recipes

### Local developer loop

```bash
npm install
npm test                                   # full active suite
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

Tracked in `docs/backlog.md`. The first is pinning the local image tag and the seeded-database
path, because the suite asserts against that target. Nothing else is open at scaffold stage.
