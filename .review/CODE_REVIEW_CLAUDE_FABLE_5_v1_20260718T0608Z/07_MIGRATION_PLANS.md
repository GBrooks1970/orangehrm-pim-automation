# Migration Plans

[<- Back to Index](00_CODE_REVIEW_CLAUDE_FABLE_5_v1_20260718T0608Z.md)

**Reviewer:** AI assistant (Claude Fable 5)

Scaled to what this single repo actually contains. The template's three canonical plans map
here as: (1) single source of truth for the smoke subset, (2) the already-delivered Docker
local-development story, (3) the CI/CD workflow. Where a plan is already complete, it is
recorded as such rather than invented.

## Plan 1 - Single source of truth for the smoke subset (the one real reconciliation)

- **Problem:** the `smoke` profile expression (`not @deferred and not @changesState`,
  [cucumber.js](../../cucumber.js) (line 20)) selects 3 scenarios; three documents claim it
  selects 1 and is demo-safe. This is the repo's one genuine spec-vs-implementation split.
- **Step 1:** decide the intended contract - "demo-safe read-only subset" (recommended) vs
  "local quick subset". Record the decision in backlog #4.
- **Step 2:** for the recommended path, add a discriminating tag to the validation feature
  (e.g. `@localOnly`, since its Background seeds via API) and change the smoke expression to
  `not @deferred and not @changesState and not @localOnly`.
- **Step 3:** re-run `npx cucumber-js --profile smoke --dry-run` and assert exactly the
  intended scenario set (1 for the recommended path).
- **Step 4:** update `_manifest.md`, `qa-strategy.md`, and the implementation log's
  "lone non-@changesState scenario" phrasing to match.
- **Step 5:** close or rewrite backlog #4 to reflect the resolved state (its current text
  covers only the search Background, not the validation ones).
- **Step 6:** as a guard, consider a tiny CI check that fails if the smoke dry-run count
  diverges from the documented number - cheap protection against re-drift.

## Plan 2 - Docker Compose for local development (already delivered; hardening only)

- **Status:** complete and strong. `docker-compose.yml` provisions app + MySQL from
  committed `db/seed.sql` + `provisioning/Conf.php`; `docker compose up` boots installed.
  This plan is a record of what exists plus small hardening, not a migration to do.
- **Delivered:** two-phase seed-once/restore-many design; healthchecks on both services;
  the `Conf.php` insight (seed DB alone is insufficient on a clean runner); LF normalisation
  for Linux-consumed artefacts; demo-parity credential workaround captured in the seed.
- **Harden 1:** pin the `mysql:8.0` image to a digest or patch (currently a floating minor)
  for the same determinism argument the docker-image-decision note makes for the app image.
- **Harden 2:** document `docker compose down -v && up -d` as the periodic local reset in
  the README (today it lives only in `db/README.md`), addressing the run-data accumulation
  in Risk 5.
- **Harden 3:** consider a `.env.example` documenting `DB_ROOT_PASSWORD` / `DB_PASSWORD` /
  `BASE_URL` / `HEADLESS` / `SCREENSHOTS` overrides in one place.
- **Revisit trigger:** if maintaining `seed.sql` becomes awkward, the documented fallback
  (build from the repo Dockerfile with the seed baked in) is the next step - already weighed
  in `docs/docker-image-decision.md`.

## Plan 3 - GitHub Actions / CI-CD (working; polish and visibility)

- **Status:** functional. The `e2e` workflow provisions, warms, runs, guards report content,
  renders living docs, and deploys to Pages on `main` even on failure (deliberate).
- **Polish 1 (Risk 7):** add `concurrency: { group: pages, cancel-in-progress: false }` to
  `deploy-pages` to avoid racing deployments on rapid `main` pushes.
- **Polish 2 (Risk 7):** guard the `Upload Pages artifact` step on a successful report
  render so a failed `test:report` does not add a confusing second red step on a missing
  directory.
- **Polish 3 (Risk 7):** set `timeout-minutes: 30` on the `e2e` job so a wedged compose
  bring-up cannot hold the runner for the 6-hour default.
- **Polish 4 (Risk 3):** add a non-blocking `npm audit --audit-level=high` report step for
  visibility, and schedule the `@cucumber/cucumber` v11 -> v12 bump (verify the
  `@serenity-js/cucumber` peer range first).
- **Visibility (Risk 4 / Cross-Cutting):** add the CI badge and a link to the published
  living documentation to the README - the implementation plan already anticipates the badge
  and it is the repo's best evidence.
- **Reproducibility:** local E2E reproduction is well documented (qa-strategy execution
  recipes); the static and dry-run gates run anywhere without Docker, which is what enabled
  this review's validation on a machine that did not stand up the SUT.

---

[<- Previous: Architecture Assessment](06_ARCHITECTURE_ASSESSMENT.md) | [Back to Index](00_CODE_REVIEW_CLAUDE_FABLE_5_v1_20260718T0608Z.md)
