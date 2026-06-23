# Backlog

Living record of debt and improvements. Closed items keep their resolution and evidence.

| # | Item | Status | Notes |
|---|---|---|---|
| 1 | Confirm the seeded-database / installer path for `orangehrm/orangehrm:5.8.1` | Open | Image tag chosen (see `docs/docker-image-decision.md`). Remaining work: the official image runs the web installer on first boot, so confirm an automated route to a known admin credential and a clean starting state (scripted install or a committed DB snapshot). Blocks reliable CI. |
| 2 | Confirm REST API v2 employee endpoints and the session-auth + CSRF exchange | Open | `OrangeHrm.authenticate()` and the `an employee exists` seed depend on it. Capture the exact endpoint, payload and token handling from a live instance. |
| 3 | Build the happy-path Screenplay layer and make `pim-add-employee.feature` pass | Open | First green scenario. See implementation-plan step 3. |
| 4 | Decide the smoke-profile target for the read-only search scenario | Open | The shared demo has no guaranteed seeded employee; either point smoke at a known demo record or accept that search needs the local target. |
| 5 | Wire screenshots (`SCREENSHOTS=off\|failures\|all`) via the Photographer | Open | Local default `all`, CI default `failures`. |
| 6 | Publish living documentation to GitHub Pages | Open | `ci.yml` has the skeleton; confirm the Pages source and the report path. |

No items are closed yet; this is a fresh scaffold.
