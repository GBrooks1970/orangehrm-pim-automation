# Backlog

Living record of debt and improvements. Closed items keep their resolution and evidence.

| # | Item | Status | Notes |
|---|---|---|---|
| 1 | Confirm the seeded-database / installer path for `orangehrm/orangehrm:5.8.1` | Closed | Phase A automated (`provisioning/phase-a-install.mjs`) → `db/seed.sql` (committed) + `provisioning/Conf.php`, both mounted in `docker-compose.yml`. A clean `docker compose down -v && up` boots installed with `Admin / admin123` straight to the dashboard, no installer. Demo parity needed two adjustments (hash→`admin123`, `enforce_password_strength=off`); see `db/README.md`. |
| 2 | Confirm REST API v2 employee endpoints and the session-auth + CSRF exchange | Closed | Verified on the live instance: session cookie `_orangehrm`; CSRF `_token` is a Vue `:token` prop on the login page; `POST auth/validate` establishes the session; `POST api/v2/pim/employees` (JSON `{firstName,middleName,lastName,empPicture}`) returns `{data:{empNumber,…}}`. API-created employees have `employeeId:null` unless one is supplied. Implemented in `src/api/OrangeHrmApiClient.ts`. |
| 3 | Build the happy-path Screenplay layer and make `pim-add-employee.feature` pass | Closed | The full Screenplay layer is implemented; all 7 active scenarios pass against the local target (`npm test` → exit 0, deterministic across re-runs). |
| 4 | Decide the smoke-profile target for the read-only search scenario | Closed (2026-07-19) | Widened by code review v1 Risk 1: `smoke` was actually selecting 3 scenarios (search plus both untagged `pim-validation.feature` scenarios), not the 1 every doc claimed, and one of those (duplicate employee id) also performs an API write in its Background — not demo-safe. Resolution: tagged both validation scenarios `@localOnly` (scope decision — validation stays local-only regardless of write status) and the duplicate-id one additionally `@seedsData` (its Background writes via the API); narrowed the `smoke` tag expression to exclude both tags. `smoke --dry-run` now selects exactly 1 scenario. **The original #4 caveat is accepted, not eliminated:** the remaining search scenario's own Background still seeds its employee via the API — pointing smoke at a pre-existing demo record instead was considered and declined as out of scope for this pass (would need a stable, externally-owned fixture on the public demo); `default` continues to run everything against the local target regardless. |
| 5 | Wire screenshots (`SCREENSHOTS=off\|failures\|all`) via the Photographer | Closed | `src/config/screenshots.ts` adds the Photographer as an optional crew member; default `all` locally, `failures` in CI, overridable by `SCREENSHOTS`. |
| 6 | Publish living documentation to GitHub Pages | Closed | `npm run test:report` renders the Serenity HTML from the JSON in `docs/reports/` to `target/site/serenity/`; `ci.yml` guards for non-empty report data, uploads that path and deploys it to Pages from `main` (Java 11+ is pre-installed on the runner). |

Items #1–#6 remain closed.

## CODEX review v1 remediation

- **Added:** 2026-07-28
- **Source:** `.review/CODE_REVIEW_CODEX_v1_20260724T0001Z/`, reviewed against functional baseline
  `ea15003` and merged through PR #10 as `c000375`.
- **Decision:** Until a stable, owner-approved, externally owned fixture exists, every executable
  profile is local-only when its selected scenario or Background can write. The shared public demo
  must not be an executable target under that condition; see
  [ADR-0002](adr/0002-local-docker-target-over-shared-demo.md).

| ID | Priority | Item | Status | Acceptance and dependency |
|---|---|---|---|---|
| CODEX-01 | High | Record the public-smoke target as local-only until a genuinely read-only fixture exists | Closed (2026-07-28) | ADR-0002 prohibits executing against the shared public demo while selected setup can write and defines the fixture, no-write, contract-test, and documentation gates for restoring support. |
| CODEX-02 | High | Enforce the local-only smoke boundary in profiles and host safety checks | Open | Tags/profile naming and a fail-fast host guard prevent public-target mutation; a static contract test proves the boundary; scenario counts and current documentation agree. Depends on CODEX-01. |
| CODEX-03 | High | Remove the vulnerable Axios path through an aligned Serenity/JS upgrade | Open | The aligned Serenity/JS set removes the reviewed `axios@1.16.0` advisory path; no unaccepted High audit finding remains; typecheck, both dry-runs, clean Docker 7/7, report generation/content, and CI pass. |
| CODEX-04 | Medium | Enforce TypeScript before browser and Docker setup in CI | Open | `npm run typecheck` runs immediately after `npm ci`; workflow ordering and QA claims agree; workflow syntax and live CI pass. |
| CODEX-05 | Medium | Prove that issued employee credentials create a usable account | Open | Scenario-scoped data retains the username without reporting the password; supported API/admin verification and an account-specific login outcome fail when account creation is broken. |
| CODEX-06 | Medium | Add a fast lower-level test lane for session and API helper decisions | Open | Deterministic, SUT-independent tests cover cookie parsing, target-host safety, response classification, duplicate classification, and exact fixture identity; the lane runs before Docker E2E in CI. |
| CODEX-07 | Medium | Make employee fixture setup fail precisely and verify exact identity | Open | Only an explicitly recognised absence permits create; only the documented duplicate response permits reuse; exact identity is read back; focused lower-level and local API contract tests pass. Depends on CODEX-06. |
| CODEX-08 | Medium | Gate on installed OrangeHRM readiness rather than Apache reachability | Open | A bounded readiness check rejects the installer route and confirms the installed login/API surface; invalid `Conf.php` fails before Cucumber; clean-volume 7/7, report rendering, and CI pass. |
| CODEX-09 | Medium | Pin MySQL and OrangeHRM images to reviewed immutable identities | Open | MySQL is exact-patch pinned and both images use reviewed digests with readable tags/comments; the documented update procedure proves restore, readiness, 7/7, report generation, and CI. Depends on CODEX-08. |
| CODEX-10 | Low | Prevent persistent local runs from accumulating or misidentifying test records | Open | Scenario-owned employee/account identities are captured and safely deleted or asserted exactly; repeated persistent runs neither grow unmanaged data nor pass against an earlier record. Depends on CODEX-05 and CODEX-07. |
| CODEX-11 | Low | Reconcile current guides and add low-cost contract checks | Open | Current guides agree on employee identity, authentication, smoke scope, readiness, image pins, and CI; automated checks cover scenario/smoke counts and declared CI commands. Runs after CODEX-01–10. |

**Outstanding:** 10 — 2 High, 6 Medium, 2 Low. CODEX-01 is closed by the recorded decision;
CODEX-02 is the next item and supplies its executable enforcement.
