# Backlog

Living record of debt and improvements. Closed items keep their resolution and evidence.

| # | Item | Status | Notes |
|---|---|---|---|
| 1 | Confirm the seeded-database / installer path for `orangehrm/orangehrm:5.8.1` | Closed | Phase A automated (`provisioning/phase-a-install.mjs`) → `db/seed.sql` (committed) + `provisioning/Conf.php`, both mounted in `docker-compose.yml`. A clean `docker compose down -v && up` boots installed with `Admin / admin123` straight to the dashboard, no installer. Demo parity needed two adjustments (hash→`admin123`, `enforce_password_strength=off`); see `db/README.md`. |
| 2 | Confirm REST API v2 employee endpoints and the session-auth + CSRF exchange | Closed | Verified on the live instance: session cookie `_orangehrm`; CSRF `_token` is a Vue `:token` prop on the login page; `POST auth/validate` establishes the session; `POST api/v2/pim/employees` (JSON `{firstName,middleName,lastName,empPicture}`) returns `{data:{empNumber,…}}`. API-created employees have `employeeId:null` unless one is supplied. Implemented in `src/api/OrangeHrmApiClient.ts`. |
| 3 | Build the happy-path Screenplay layer and make `pim-add-employee.feature` pass | Closed | The full Screenplay layer is implemented; all 7 active scenarios pass against the local target (`npm test` → exit 0, deterministic across re-runs). |
| 4 | Decide the smoke-profile target for the read-only search scenario | Closed (2026-07-19) | Widened by code review v1 Risk 1: `smoke` was actually selecting 3 scenarios (search plus both untagged `pim-validation.feature` scenarios), not the 1 every doc claimed, and one of those (duplicate employee id) also performs an API write in its Background — not demo-safe. Resolution: tagged both validation scenarios `@localOnly` (scope decision — validation stays local-only regardless of write status) and the duplicate-id one additionally `@seedsData` (its Background writes via the API); narrowed the `smoke` tag expression to exclude both tags. `smoke --dry-run` now selects exactly 1 scenario. **The original #4 caveat is accepted, not eliminated:** the remaining search scenario's own Background still seeds its employee via the API — pointing smoke at a pre-existing demo record instead was considered and declined as out of scope for that pass. Superseded by CODEX-01/02: `smoke` remains a one-scenario local selection, and the shared hooks reject every non-loopback execution target. |
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
| CODEX-02 | High | Enforce the local-only smoke boundary in profiles and host safety checks | Closed (2026-07-28) | Every profile loads a pre-browser loopback guard; `test:target-contract` verifies the profile wiring and rejects public, remote, and malformed targets; default and smoke dry-runs remain 7 and 1; current target documentation now describes smoke as local-only. |
| CODEX-03 | High | Remove the vulnerable Axios path through an aligned Serenity/JS upgrade | Closed (2026-07-28) | Serenity/JS is aligned at 3.44.1 with Playwright 1.61.1 and Node 24; direct unused `@serenity-js/rest` was removed while report tooling retains 3.44.1 transitively with fixed `axios@1.18.1`; `brace-expansion` patched to 5.0.8; `npm audit` reports zero vulnerabilities. CI enforces the High gate, Dependabot proposes grouped updates, and `dependency-policy.md` defines triage and exception evidence. |
| CODEX-04 | Medium | Enforce TypeScript before browser and Docker setup in CI | Closed (2026-07-29) | `npm run typecheck` runs immediately after `npm ci`, before audit, contract, browser, or Docker work; QA strategy and workflow ordering agree. The TypeScript 7 and Playwright 1.62 merges that had left `main` red were restored to the compatible 5.9.3/1.61.1 lines, with documented Dependabot holds until their runtimes or peer ranges move. |
| CODEX-05 | Medium | Prove that issued employee credentials create a usable account | Closed (2026-07-29) | The actor's scenario-scoped notepad retains the generated username and employee identity while Serenity's `Masked` question redacts the password. The credentials scenario verifies the exact enabled username/employee association through `GET api/v2/admin/users`, clears the admin session, and proves a real employee login by asserting the signed-in employee name. A missing-account probe fails specifically with `Issued account "…" was not created.`; the targeted Docker scenario passes 1/1 and its Serenity evidence contains no raw password. |
| CODEX-06 | Medium | Add a fast lower-level test lane for session and API helper decisions | Closed (2026-07-29) | `npm run test:unit` uses Node's built-in test runner with deterministic fixtures to cover combined/malformed cookie parsing, loopback-only target safety, lookup absence/error decisions, duplicate classification, and exact requested employee identity. The production cookie and fixture helpers use the extracted pure policy seam; CI runs the lane immediately after typecheck and before audit, Playwright, and Docker. |
| CODEX-07 | Medium | Make employee fixture setup fail precisely and verify exact identity | Open | Only an explicitly recognised absence permits create; only the documented duplicate response permits reuse; exact identity is read back; focused lower-level and local API contract tests pass. Depends on CODEX-06. |
| CODEX-08 | Medium | Gate on installed OrangeHRM readiness rather than Apache reachability | Open | A bounded readiness check rejects the installer route and confirms the installed login/API surface; invalid `Conf.php` fails before Cucumber; clean-volume 7/7, report rendering, and CI pass. |
| CODEX-09 | Medium | Pin MySQL and OrangeHRM images to reviewed immutable identities | Open | MySQL is exact-patch pinned and both images use reviewed digests with readable tags/comments; the documented update procedure proves restore, readiness, 7/7, report generation, and CI. Depends on CODEX-08. |
| CODEX-10 | Low | Prevent persistent local runs from accumulating or misidentifying test records | Open | Scenario-owned employee/account identities are captured and safely deleted or asserted exactly; repeated persistent runs neither grow unmanaged data nor pass against an earlier record. Depends on CODEX-05 and CODEX-07. |
| CODEX-11 | Low | Reconcile current guides and add low-cost contract checks | Open | Current guides agree on employee identity, authentication, smoke scope, readiness, image pins, and CI; automated checks cover scenario/smoke counts and declared CI commands. Runs after CODEX-01–10. |

**Outstanding:** 5 — 0 High, 3 Medium, 2 Low. CODEX-01 records the target decision, CODEX-02
supplies its executable enforcement, CODEX-03 closes the reviewed dependency risk, CODEX-04
enforces the static CI gate, CODEX-05 proves issued employee accounts, and CODEX-06 adds the
fast lower-level lane; CODEX-07 is next.
