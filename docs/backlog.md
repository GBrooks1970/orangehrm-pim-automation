# Backlog

Living record of debt and improvements. Closed items keep their resolution and evidence.

| # | Item | Status | Notes |
|---|---|---|---|
| 1 | Confirm the seeded-database / installer path for `orangehrm/orangehrm:5.8.1` | Closed | Phase A automated (`provisioning/phase-a-install.mjs`) → `db/seed.sql` (committed) + `provisioning/Conf.php`, both mounted in `docker-compose.yml`. A clean `docker compose down -v && up` boots installed with `Admin / admin123` straight to the dashboard, no installer. Demo parity needed two adjustments (hash→`admin123`, `enforce_password_strength=off`); see `db/README.md`. |
| 2 | Confirm REST API v2 employee endpoints and the session-auth + CSRF exchange | Closed | Verified on the live instance: session cookie `_orangehrm`; CSRF `_token` is a Vue `:token` prop on the login page; `POST auth/validate` establishes the session; `POST api/v2/pim/employees` (JSON `{firstName,middleName,lastName,empPicture}`) returns `{data:{empNumber,…}}`. API-created employees have `employeeId:null` unless one is supplied. Implemented in `src/api/OrangeHrmApiClient.ts`. |
| 3 | Build the happy-path Screenplay layer and make `pim-add-employee.feature` pass | Open | First green scenario. See implementation-plan step 3. |
| 4 | Decide the smoke-profile target for the read-only search scenario | Open | The shared demo has no guaranteed seeded employee; either point smoke at a known demo record or accept that search needs the local target. |
| 5 | Wire screenshots (`SCREENSHOTS=off\|failures\|all`) via the Photographer | Open | Local default `all`, CI default `failures`. |
| 6 | Publish living documentation to GitHub Pages | Open | `ci.yml` has the skeleton; confirm the Pages source and the report path. |

No items are closed yet; this is a fresh scaffold.
