# Backlog

Living record of debt and improvements. Closed items keep their resolution and evidence.

| # | Item | Status | Notes |
|---|---|---|---|
| 1 | Confirm the seeded-database / installer path for `orangehrm/orangehrm:5.8.1` | Closed | Phase A automated (`provisioning/phase-a-install.mjs`) → `db/seed.sql` (committed) + `provisioning/Conf.php`, both mounted in `docker-compose.yml`. A clean `docker compose down -v && up` boots installed with `Admin / admin123` straight to the dashboard, no installer. Demo parity needed two adjustments (hash→`admin123`, `enforce_password_strength=off`); see `db/README.md`. |
| 2 | Confirm REST API v2 employee endpoints and the session-auth + CSRF exchange | Closed | Verified on the live instance: session cookie `_orangehrm`; CSRF `_token` is a Vue `:token` prop on the login page; `POST auth/validate` establishes the session; `POST api/v2/pim/employees` (JSON `{firstName,middleName,lastName,empPicture}`) returns `{data:{empNumber,…}}`. API-created employees have `employeeId:null` unless one is supplied. Implemented in `src/api/OrangeHrmApiClient.ts`. |
| 3 | Build the happy-path Screenplay layer and make `pim-add-employee.feature` pass | Closed | The full Screenplay layer is implemented; all 7 active scenarios pass against the local target (`npm test` → exit 0, deterministic across re-runs). |
| 4 | Decide the smoke-profile target for the read-only search scenario | Open | The one non-`@changesState` scenario (search) still seeds its employee through the API in the Background, so the `smoke` profile is not purely read-only against the shared demo (which may also reject API writes). Either point smoke at a known pre-existing demo record, or accept that search needs the local target. Not blocking — the `default` profile runs everything locally. |
| 5 | Wire screenshots (`SCREENSHOTS=off\|failures\|all`) via the Photographer | Closed | `src/config/screenshots.ts` adds the Photographer as an optional crew member; default `all` locally, `failures` in CI, overridable by `SCREENSHOTS`. |
| 6 | Publish living documentation to GitHub Pages | Closed | `npm run test:report` renders the Serenity HTML from the JSON in `docs/reports/` to `target/site/serenity/`; `ci.yml` guards for non-empty report data, uploads that path and deploys it to Pages from `main` (Java 11+ is pre-installed on the runner). |

Items 1–3, 5 and 6 are closed; #4 remains a deliberate, non-blocking design choice.
