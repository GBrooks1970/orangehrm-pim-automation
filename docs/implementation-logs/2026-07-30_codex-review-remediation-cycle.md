# CODEX review remediation cycle — 2026-07-30

## Session Summary

Completed the CODEX review v1 remediation cycle recorded as CODEX-01–13 in
`docs/backlog.md`. The work hardened public-target safety, dependency and CI policy, fixture
identity, issued-account proof, application readiness, container provenance, persistent-run
cleanup, and executable project contracts. Delivery PRs #11–13, #21–22, and #24–31 are merged
through `5b50b58`, while the incompatible TypeScript 6 proposal #23 is closed; the post-merge
`main` run 30577342224 passed E2E and deployed the living documentation, leaving zero open
backlog items.

---

## Objectives

1. ✅ Resolve every accepted CODEX review v1 finding in dependency order.
2. ✅ Prove employee and account behaviour against exact scenario-owned identities.
3. ✅ Make local-target, readiness, dependency, image, documentation, and CI assumptions executable.
4. ✅ Reconcile the canonical backlog and current-state guides to the delivered system.
5. ✅ Validate the final state locally and on the merged default branch.

---

## Test Results

| Stack | Suite | Before | After | Status |
|---|---|---|---|---|
| Node 24 / TypeScript | Type-check | Existing gate; not ordered first in CI | No diagnostics; ordered immediately after `npm ci` | ✅ PASS |
| Node 24 | Deterministic lower-level tests | No dedicated lane | 26/26 in the final local run and `main` run 30577342224 | ✅ PASS |
| npm | High-severity audit | Vulnerable Axios path identified by CODEX-03 | 0 vulnerabilities in the final local and `main` runs | ✅ PASS |
| Cucumber | Target/project contracts | No executable cross-document contract | Local-only profiles verified; exact default/smoke discovery 7/1 | ✅ PASS |
| OrangeHRM API | Employee fixture contract | No thin live contract | 1/1 locally and on `main`; exact fixture self-cleaned | ✅ PASS |
| OrangeHRM / Playwright | Full Screenplay E2E | 7/7 at reviewed baseline | 7/7 locally and on merged `main` | ✅ PASS |
| Persistent MySQL | Post-suite ownership baseline | Cleanup was not scenario-owned | Returned to 5 employees and 2 enabled users after the final local run | ✅ PASS |
| Serenity | Living documentation | Existing seven-scenario report | 231 retained local results rendered; seven fresh CI JSON files uploaded and Pages deployed | ✅ PASS |

The final local run used Node 24 and the pinned, healthy MySQL 8.0.46 / OrangeHRM 5.8.1 stack.
The definitive post-merge evidence is GitHub Actions run
[30577342224](https://github.com/GBrooks1970/orangehrm-pim-automation/actions/runs/30577342224):
the E2E job passed in 2m26s, uploaded a 3,092,262-byte Pages artifact, tore the stack down, and the
deployment job passed in 16s.

---

## Changes Implemented

### Local-only execution boundary and dependency safety

**Files changed:**

- `docs/adr/0002-local-docker-target-over-shared-demo.md`, `cucumber.js`,
  `src/config/target-safety.ts`, and `scripts/verify-local-target-contract.ts` — prohibit every
  executable profile from targeting the shared public demo while selected setup can write.
- `package.json` and `package-lock.json` — align Serenity/JS, Playwright, Cucumber, Node types, and
  patched transitive dependencies; remove the unused direct REST package.
- `.github/dependabot.yml` and `docs/dependency-policy.md` — group compatible updates and hold
  unsupported Playwright, Node declarations, and TypeScript `>=6.0.0` proposals with explicit
  evidence and release conditions.

### Exact employee and issued-account evidence

**Files changed:**

- `src/api/OrangeHrmApiClient.ts`, `src/api/OrangeHrmApiPolicy.ts`, and
  `tests/contract/employee-fixture.contract.ts` — distinguish absence, authentication, duplicate,
  and transport failures; require exact Employee Id/name/`empNumber` read-back.
- `src/support/ScenarioNotes.ts`, `src/support/ScenarioOwnership.ts`, step definitions, and hooks —
  generate collision-resistant physical identities, retain exact records, and delete only
  scenario-owned employees and accounts.
- `src/tasks/IssuedAccount.ts`, `src/interactions/TopBar.ts`, and `src/questions/CurrentUser.ts` —
  verify the enabled employee/user association and prove a real sign-in without exposing the
  generated password in Serenity evidence.
- `tests/unit/api-policy.test.ts`, `tests/unit/employee-fixture-client.test.ts`, and
  `tests/unit/scenario-ownership.test.ts` — provide deterministic coverage of the extracted policy
  and ownership decisions.

### Installed readiness and immutable infrastructure

**Files changed:**

- `scripts/verify-orangehrm-readiness.ts`, `src/config/readiness.ts`, and
  `tests/unit/readiness.test.ts` — reject installer/error states, authenticate, and prove the PIM
  API before browser execution using a strict deadline without an unconditional sleep.
- `docker-compose.yml` and `docs/docker-image-decision.md` — pin reviewed Linux/amd64 identities
  for MySQL 8.0.46 and OrangeHRM 5.8.1 and record the mandatory upgrade proof.
- `tests/fixtures/invalid-Conf.php` — preserve the negative proof that an Apache-healthy but
  uninstalled/broken application fails at readiness.

### Fail-fast CI and executable project documentation

**Files changed:**

- `.github/workflows/ci.yml`, `.nvmrc`, and `package.json` — standardise Node 24, move type-checking
  ahead of browser/Docker setup, run lower-level and live contracts, and use current action
  runtimes.
- `scripts/verify-project-contract.ts` — execute exact 7/1 dry-run discovery and validate declared
  CI commands, gate ordering, Node/image/report paths, the historical-plan marker, relative links,
  and the TypeScript compatibility hold.
- `README.md`, `db/README.md`, current guides, and feature manifests — align prose with exact
  identity, cookie-injected admin authentication, local-only smoke mutation, installed readiness,
  immutable images, cleanup, and CI behaviour.
- `docs/backlog.md` — record CODEX-01–13 as closed with evidence and an outstanding count of zero.

---

## Technical Decisions

| Decision | Rationale | Alternatives rejected |
|---|---|---|
| Keep all executable profiles loopback-only until an owner-approved read-only fixture exists | Every current selected path can seed data; the shared public instance is not an owned test target | Continuing to label the search scenario “public-demo safe” while its Background writes |
| Treat exact record identity and scenario ownership as first-class test state | Names and prior records are insufficient evidence and can cause false passes or destructive cleanup | Searching the first matching row; globally deleting records by readable name |
| Separate transport health from installed-application readiness | Apache can be healthy while OrangeHRM is on the installer route or its configuration is broken | A fixed sleep; relying on Compose HTTP health alone |
| Pin readable container tags to reviewed immutable Linux/amd64 manifests | Image changes must be visible diffs and repeatable on CI architecture | Floating tags; digest-only references without human-readable provenance |
| Hold TypeScript at 5.x until one aligned execution-path migration proves TypeScript 6+ | TypeScript 6.0.3 fails the current `ts-node` 10/CommonJS path with TS5107 before E2E begins | Adding `ignoreDeprecations: "6.0"`; allowing repeated incompatible Dependabot PRs |

The local-only target decision is structural and already lives in ADR-0002. Container provenance
and TypeScript release policy already live in their dedicated decision/policy documents, so this
log creates no additional ADR.

---

## Documentation Updates

- `README.md` — current Node, target, setup, validation, cleanup, and reporting instructions.
- `db/README.md` — persistent database reset and ownership guidance.
- `docs/adr/0002-local-docker-target-over-shared-demo.md` — local-only decision and restoration gates.
- `docs/adr/0003-api-driven-setup.md` — accurate module-level API client design.
- `docs/architecture.md` — current authentication, fixture, ownership, readiness, and backlog state.
- `docs/backlog.md` — CODEX-01–13 statuses, evidence, and zero-outstanding summary.
- `docs/dependency-policy.md` — grouped update, audit, compatibility-hold, and release policy.
- `docs/docker-image-decision.md` — immutable image provenance and update process.
- `docs/gherkin-style-guide.md` — physical versus readable scenario identity guidance.
- `docs/implementation-plan.md` — retained explicitly as historical rather than current state.
- `docs/qa-strategy.md` — test lanes, exact counts, local-only boundary, and current backlog status.
- `docs/screenplay-guide.md` — current abilities, notes, identity, and cleanup flow.
- `features/_manifest.md` — current feature tags and execution scope.
- `src/README.md` — current source layout and responsibilities.
- `docs/templates/implementation-log.template.md` — added from the portfolio canonical template
  because the project did not yet carry the required local copy.
- `docs/implementation-logs/2026-07-30_codex-review-remediation-cycle.md` — this immutable cycle
  record.

---

## Lessons Learned

- Enforce a claimed safety boundary by executing the real profile selection and classifying its
  target before browser/API setup; matching prose and tag expressions are not sufficient proof.
- A healthy container is not evidence of an installed application. Readiness must verify the
  first authenticated capability the suite needs and must fail on the installer/error surface.
- Generated names make parallel runs collision-resistant only when assertions and teardown retain
  the exact returned identifiers. Ownership must be captured at creation time and matched before
  deletion.
- Dependency automation needs compatibility boundaries as code. Record the observed failure and
  the evidence required to remove a hold, otherwise the same known-bad major repeatedly consumes
  review and CI time.
- Validate dependency proposals sequentially. Merging incompatible TypeScript 7 and Playwright
  1.62 proposals together temporarily made `main` red and obscured which compatibility boundary
  had failed; CODEX-04 restored the supported set and moved type-checking early.

---

## Recommendations / Next Steps

- [x] Keep CODEX-01–13 closed; `docs/backlog.md` records zero outstanding required work. — HIGH
- [ ] Lift the CODEX-13 TypeScript hold only when every release condition in
  `docs/dependency-policy.md` is satisfied by one aligned migration. — LOW / future maintenance
- [ ] Run a new evidence-based code review before deriving another implementation cycle; do not
  manufacture required work from the closed backlog. — LOW / portfolio owner

---

*Session logged: 2026-07-30. Author: Codex, directed by Gary Brooks.*
