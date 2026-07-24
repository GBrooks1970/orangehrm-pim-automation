# Risks and Issues

[<- Back to Index](00_CODE_REVIEW_CODEX_v1_20260724T0001Z.md) | [Next: Project Review ->](03_PROJECT_REVIEWS/PROJECT_001_ORANGEHRM_PIM_AUTOMATION.md)

**Reviewer:** AI assistant (Codex, GPT-5)

## 1. HIGH - The public-demo smoke scenario is not read-only

**Risk description.** The repository calls the public OrangeHRM demo a read-only, demo-safe smoke
target, but the only selected smoke scenario has a Background that can create an employee through
REST API v2.

**Evidence.**

- [architecture.md](../../docs/architecture.md) (lines 12-15) describes the public demo as a
  "read-only smoke target only".
- [cucumber.js](../../cucumber.js) (lines 22-24) excludes `@changesState`, `@localOnly`, and
  `@seedsData`, leaving the untagged search scenario.
- [pim-employee-management.feature](../../features/pim-employee-management.feature) (lines 6-12)
  runs `an employee "Odis Adalwin" exists` before the selected search scenario.
- [background.steps.ts](../../src/step-definitions/background.steps.ts) (lines 18-20) delegates
  that step to `OrangeHrm.ensureEmployeeExists`.
- [OrangeHrmApiClient.ts](../../src/api/OrangeHrmApiClient.ts) (lines 178-191) performs a lookup
  and calls `createEmployee` when the name is absent. The create path POSTs to
  `api/v2/pim/employees` at lines 142-168.
- [backlog.md](../../docs/backlog.md) (line 10) explicitly accepts this caveat while still closing
  Item 4. The caveat is disclosed, but its risk is not removed.
- Local `npx cucumber-js --profile smoke --dry-run` confirmed that this is the sole selected
  scenario.

**Impact.** A reviewer who follows the documented target model can mutate a shared third-party
service, leave test data behind, and depend on credentials for an environment the project does not
control. That is a behavioural and reputational boundary failure. It also makes "read-only smoke"
non-deterministic: whether the run writes depends on current shared data.

**Refactor recommendation and strategy.**

1. Until a stable external fixture exists, tag the search scenario `@seedsData` or `@localOnly`
   and treat `smoke` as a local profile.
2. If public-demo coverage is retained, remove the setup step and query a deliberately
   pre-existing, externally owned record without any create fallback.
3. Add a small static contract check that the public-target profile selects only scenarios whose
   Backgrounds are non-mutating.
4. Update architecture, QA strategy, manifest, README, and backlog wording together.

**Acceptance signal.** A public-target smoke dry-run selects only scenarios whose executed setup
cannot call a write endpoint, and all target documentation says the same thing.

## 2. HIGH - The locked dependency tree has a current high-severity advisory

**Risk description.** `npm audit --json` exits 1 and reports three vulnerable packages: one high
and two moderate. The high path is `axios@1.16.0`, used through Serenity/JS REST and report tooling.

**Evidence.**

- [package-lock.json](../../package-lock.json) (lines 542-575) locks
  `@serenity-js/rest@3.43.2` and `@serenity-js/serenity-bdd@3.43.2`, each depending on
  `axios@1.16.0`.
- [package-lock.json](../../package-lock.json) (lines 771-775) locks the dev dependency itself.
- The 2026-07-24 audit reported ten Axios advisories aggregated into the vulnerable Axios entry,
  including high advisory `GHSA-gcfj-64vw-6mp9`; fixes were reported as available.
- Registry queries during review reported `axios@1.18.1` and Serenity/JS `3.44.1` as current.

**Impact.** The affected packages are development/test tooling, which reduces direct production
exposure, but they execute in local and CI environments and process network and report data.
Leaving a fixable high audit result also weakens portfolio security claims and makes a future
audit gate immediately red.

**Refactor recommendation and strategy.**

1. Upgrade the Serenity/JS packages as one aligned set and refresh the lockfile so the vulnerable
   Axios version is removed.
2. Re-run `npm audit`, TypeScript, both dry-runs, the Docker-backed suite, and report generation.
3. Remove the direct `@serenity-js/rest` declaration if source and tooling do not require it
   after the aligned upgrade.
4. Add a scheduled dependency update mechanism and a documented audit policy that distinguishes
   actionable findings from accepted test-tooling risk.

**Acceptance signal.** `npm audit` is green or every remaining finding has a current, explicit,
evidence-backed exception.

## 3. MEDIUM - CI does not run the advertised TypeScript gate

**Risk description.** The registry and QA strategy define `npx tsc --noEmit` as the static gate,
but the workflow installs dependencies and moves directly to browser and Docker setup.

**Evidence.**

- [package.json](../../package.json) (lines 10-13) exposes `typecheck`.
- [qa-strategy.md](../../docs/qa-strategy.md) (lines 26-33) lists TypeScript as gate 1 and states
  that the `e2e` workflow enforces all listed gates.
- [ci.yml](../../.github/workflows/ci.yml) (lines 31-58) runs `npm ci`, Playwright installation,
  Docker start, warm-up, and `npm test`; there is no `tsc` or `npm run typecheck` step.
- Local `npx tsc --noEmit` passed, so this is a gate-wiring finding rather than a current type
  defect.

**Impact.** A pull request can merge code that fails the repository-wide TypeScript contract,
particularly an unimported new source file that `ts-node` does not encounter during the E2E run.
The workflow also spends time downloading a browser and starting Docker before discovering errors
that a cheap static step could catch.

**Refactor recommendation and strategy.**

1. Add `npm run typecheck` immediately after `npm ci`.
2. Keep it before browser installation and Docker start for fail-fast feedback.
3. Consider a separate static job if parallel feedback is valuable, while retaining the registry
   gate wording.
4. Correct the QA strategy only if the gate is deliberately not meant to be enforced.

**Acceptance signal.** A deliberately introduced type error fails a pull request before Docker
starts, and workflow/documentation/registry agree.

## 4. MEDIUM - The login-credentials scenario does not prove account creation

**Risk description.** The scenario's distinctive behaviour is creating login credentials, but its
only outcome assertion is that the employee appears in the list.

**Evidence.**

- [pim-add-employee.feature](../../features/pim-add-employee.feature) (lines 15-18) names "with
  login credentials" but has no authentication or system-user outcome.
- [AddEmployee.ts](../../src/tasks/AddEmployee.ts) (lines 29-44) generates a unique username with
  `Date.now()`, supplies a fixed password, saves, and waits only for the personal-details heading.
- [add-employee.steps.ts](../../src/step-definitions/add-employee.steps.ts) (lines 18-30) executes
  the task and then checks only for the employee row.
- There is no Question or scenario context that retains the generated username for verification.

**Impact.** The scenario can pass if the employee record is created but the login account is
missing, disabled, associated incorrectly, or unusable. It therefore provides almost the same
assurance as the preceding happy path while claiming a wider journey.

**Refactor recommendation and strategy.**

1. Generate and retain the username in scenario-scoped test data rather than hiding it inside the
   Task.
2. Verify the user association through the supported API or admin UI, then prove a real login if
   that behaviour is in scope.
3. Assert status and username, not the fixed password value in reports.
4. Keep the scenario business-readable: for example, "Then the employee should be able to sign in
   with the issued account".

**Acceptance signal.** Breaking account creation while preserving employee creation makes this
scenario fail for the account-specific reason.

## 5. MEDIUM - Fixture error handling can produce ambiguous or false preconditions

**Risk description.** The API helper treats some infrastructure and validation failures as if the
fixture were proven, and no lower-level tests exercise those branches.

**Evidence.**

- [OrangeHrmApiClient.ts](../../src/api/OrangeHrmApiClient.ts) (lines 178-191) falls through to a
  create when the lookup response is not OK, rather than reporting the lookup failure.
- [OrangeHrmApiClient.ts](../../src/api/OrangeHrmApiClient.ts) (lines 201-219) accepts every HTTP
  422 as "the id already exists", regardless of response body, and never reads the employee back.
- [qa-strategy.md](../../docs/qa-strategy.md) (lines 52-59) says the exact Employee Id is seeded
  and verified before the UI step; the implementation does not perform that verification.
- Repository mapping found no unit or component test files. All executable verification is in
  seven Docker-backed UI scenarios.

**Impact.** Authentication, permission, schema, or server-validation changes can be misclassified.
Failures then surface later as UI symptoms, undermining ADR-0003's goal of unambiguous fixture
failures. The branches most in need of deterministic testing require the heaviest environment to
exercise them today.

**Refactor recommendation and strategy.**

1. Throw immediately on a non-OK lookup unless the response is an explicitly handled absence.
2. Accept a duplicate only when status and a parsed error code/message identify the uniqueness
   constraint; do not treat all 422 responses as equivalent.
3. Read back the exact Employee Id before returning success.
4. Extract cookie parsing and response classification into pure functions and unit-test boundary
   cases.
5. Add a thin API contract test against the local Docker target, below the UI layer.

**Acceptance signal.** Tests cover lookup failure, malformed cookies, authentication rejection,
the expected duplicate response, an unrelated 422, successful create, and exact-id verification.

## 6. MEDIUM - The Docker readiness and image strategy are less deterministic than claimed

**Risk description.** The Compose gate proves that Apache responds, not that OrangeHRM is installed
and ready, while the database image floats across the MySQL 8.0 line.

**Evidence.**

- [docker-compose.yml](../../docker-compose.yml) (lines 57-63) explicitly says the healthcheck does
  not confirm installation and uses `curl -sf` against `/`, which accepts a redirect to the
  installer.
- [ci.yml](../../.github/workflows/ci.yml) (lines 39-51) treats `docker compose up -d --wait` as a
  restored, installed target; the warm-up request also accepts 3xx responses.
- [docker-compose.yml](../../docker-compose.yml) (line 18) uses `mysql:8.0`, a moving patch tag.
- [docker-image-decision.md](../../docs/docker-image-decision.md) (lines 24-25) presents pinning as
  the foundation of determinism, but only the application version is patch-pinned and neither
  image is digest-pinned.

**Impact.** A missing or invalid `Conf.php` can pass the bring-up gate and fail only during the
suite, increasing diagnosis time. A future MySQL 8.0 image change can alter restore or runtime
behaviour without a repository diff.

**Refactor recommendation and strategy.**

1. Add an installed-app readiness check that rejects the installer route and confirms an expected
   login-page or API response.
2. Make that check the service healthcheck or an explicit CI gate immediately after Compose.
3. Pin MySQL to an exact supported patch and, where operationally practical, pin both image
   digests.
4. Use automated dependency/image update PRs so deterministic pins remain maintainable.

**Acceptance signal.** Removing the mounted `Conf.php` makes the bring-up gate fail before tests,
and image changes appear as reviewed repository diffs.

## 7. LOW - Current documentation still contains contradictory implementation claims

**Risk description.** Several guides are individually strong but disagree with the live code or
backlog on important details.

**Evidence.**

- [gherkin-style-guide.md](../../docs/gherkin-style-guide.md) (lines 19-23) and
  [architecture.md](../../docs/architecture.md) (lines 132-136) claim the suite asserts Employee
  Id, but no Question or step asserts it.
- [screenplay-guide.md](../../docs/screenplay-guide.md) (line 68) describes
  `LogInAsAdmin.now()` as UI login; [LogInAsAdmin.ts](../../src/tasks/LogInAsAdmin.ts) (lines
  14-26) injects the API-authenticated cookie.
- [docker-image-decision.md](../../docs/docker-image-decision.md) (lines 37-43) still calls
  provisioning backlog Item 1 open; [backlog.md](../../docs/backlog.md) (line 7) closes it.
- The CI/typecheck and read-only-smoke contradictions are covered in Risks 1 and 3.

**Impact.** These conflicts force a reviewer to re-derive the truth from code and weaken the
portfolio's teaching purpose. They also make future review findings look like implementation
defects when some are stale prose.

**Refactor recommendation and strategy.**

1. Correct current-state guides while leaving the explicitly historical implementation plan
   intact.
2. Link repeated inventory and gate claims back to one canonical source where possible.
3. Add low-cost documentation checks for scenario counts, smoke selection, and declared CI
   commands.

**Acceptance signal.** Searching for "read-only", "Employee Id", "UI login", "type check", and
"open item" produces no current-state contradiction.

## 8. LOW - Persistent local runs accumulate employee and user data

**Risk description.** Browser state is reset per scenario, but created employees and accounts are
not deleted after add scenarios.

**Evidence.**

- [AddEmployee.ts](../../src/tasks/AddEmployee.ts) (lines 18-45) creates fixed-name employees on
  each run; only the login username is made unique.
- [browser.hooks.ts](../../src/hooks/browser.hooks.ts) (lines 35-68) clears browser storage and
  cookies, not database state.
- [README.md](../../README.md) (lines 51-58) documents a periodic destructive volume reset,
  acknowledging accumulation.

**Impact.** Long-lived local targets can contain duplicate names and an increasing user table.
First-row selectors can then validate a prior record instead of the newly created one. CI avoids
this through `docker compose down -v`.

**Refactor recommendation and strategy.** Use scenario-unique employee identity and capture the
created `empNumber`, or delete created data in teardown. Keep the documented volume reset as a
recovery tool, not the primary isolation mechanism.

**Acceptance signal.** Repeated local runs do not increase persistent test records, or every
assertion is tied to the exact record created by its scenario.

---

[<- Previous: Executive Summary](01_EXECUTIVE_SUMMARY.md) | [Back to Index](00_CODE_REVIEW_CODEX_v1_20260724T0001Z.md) | [Next: Project Review ->](03_PROJECT_REVIEWS/PROJECT_001_ORANGEHRM_PIM_AUTOMATION.md)
