# Docker image decision

The suite asserts against a controllable OrangeHRM target (ADR-0002). This note records which
image was chosen to provide it, the alternatives weighed, and why.

## Chosen: `orangehrm/orangehrm:5.8.1`

The official OrangeHRM image, pinned to the current stable Open Source release.

As of 6 April 2026 the `5.8.1` tag and `latest` share the same digest
(`sha256:5eb278ac…`), so this is the newest published build; pinning the exact patch keeps
runs deterministic when `latest` later moves. It pairs with an external `mysql:8.0` service in
`docker-compose.yml`.

### Why this one

- **It is the version the journey targets.** OrangeHRM 5.x is the Vue single-page application
  with REST API v2 and `/web/index.php/...` routes. The scaffold's architecture (async waits,
  API-driven setup) assumes exactly that. The 4.x and 3.x images are a different application.
- **It matches the reference points.** The live demo and the current GitHub release are both
  5.8.1, so the local target mirrors what a reviewer sees on the public demo.
- **It is the official image.** Published by OrangeHRM, tracking their releases, GPL-licensed,
  no third-party repackaging to trust.
- **Determinism.** Pinning `5.8.1` rather than `latest` fixes the version under test, which is
  the whole point of provisioning a controllable target.

### What it costs

These two points are confirmed from the image's
[Dockerfile](https://github.com/orangehrm/orangehrm/blob/main/Dockerfile)
(`FROM php:8.3-apache-bookworm`, unzips OrangeHRM 5.8.1, installs `pdo_mysql`, ends with
`VOLUME ["/var/www/html"]` and no custom entrypoint).

- **The database is a separate image.** The official image is the PHP/Apache application only
  (around 195 MB) with the `pdo_mysql` client extension; it bundles no database. A separate
  MySQL (or MariaDB) container hosts the data. `docker-compose.yml` pairs it with `mysql:8.0`.
- **No unattended install, and the admin user is not auto-created.** The Dockerfile adds no
  entrypoint and the image does not read database environment variables. On first boot the app
  serves the web installer wizard, where the database connection and the admin account are
  entered by hand. A vanilla install does **not** create the demo's `Admin / admin123` user;
  that credential is seeded only on the public demo. To match it, set `Admin / admin123` during
  the installer, then snapshot the resulting database and restore that dump in CI for a known
  starting state. This is the one open item (backlog #1).

## Alternatives considered

### `orangehrm/orangehrm:latest`

- **Pro:** always the newest build; nothing to bump.
- **Con:** a moving tag. A portfolio suite that claims to be non-flaky cannot have its SUT
  change underneath it without notice. Rejected for determinism. Today it equals `5.8.1`
  anyway, so pinning loses nothing now and protects against drift later.

### Older official tags (`5.7`, `5.6.x`, down to `5.0`)

- **Pro:** still 5.x, so the Vue SPA and REST API v2 hold; useful if a regression in `5.8.1`
  needed isolating.
- **Con:** older than the live demo and the current release, so the local target would drift
  from what a reviewer sees. No reason to start behind. Held in reserve only.

### 4.x / 3.x official tags (`4.10.1`, `3.3.3`)

- **Pro:** none for this project.
- **Con:** a different application. The 4.x and earlier line uses the legacy Symfony/YUI front
  end and `/index.php/...` routes, with no REST API v2. Choosing one would invalidate the
  `SUT_FRONTEND` and `API_AUTH` inputs and the whole async-wait and API-setup design.
  Rejected.

### Build from the repository `Dockerfile`

- **Pro:** full control; the natural place to bake a pre-seeded database and a fixed admin
  credential, which would close the installer gap cleanly.
- **Con:** more to build and maintain, slower cold start, and a bake pipeline to own. Worth
  revisiting if the installer automation proves awkward; for a scaffold, the published image is
  the faster path to a green suite.

### Third-party images (for example a Bitnami-style packaging)

- **Pro:** such images historically offered env-var-driven, non-interactive installs, which
  would remove the first-boot installer friction.
- **Con:** provenance and lifecycle are outside OrangeHRM's control, and the availability and
  licensing of third-party HR-app images have been in flux. Not worth the supply-chain
  uncertainty when the official image is current and maintained. Verify availability before
  relying on any such image.

### The public demo, no container

- **Pro:** zero provisioning.
- **Con:** shared, periodically reset, and not guaranteed to accept writes; the reason ADR-0002
  exists. Retained only as a read-only smoke target, never for state-changing scenarios.

## Provisioning and seeding flow

Two containers always run together: the official app image (which holds no database) and a
separate MySQL container. The installer does not create the database container; MySQL is
already running with an empty `orangehrm` database, and the installer writes the schema and the
admin user into it. The design has two phases so that the per-run path is automated and
deterministic.

### Phase A — seed once (one-time, manual)

1. `docker compose up`: the app image and an empty MySQL start together.
2. Open the app; it serves the web installer. Point it at the `db` service and create the admin
   account as `Admin / admin123` to mirror the public demo.
3. The installer writes the schema and the `Admin` user into MySQL. The app is now installed.
4. Dump the populated database (`mysqldump`) to `seed.sql` and commit it to the repository.

This happens once. The installer is never part of a test run.

### Phase B — run many (every run, automated)

1. `docker compose up`: MySQL starts and restores `seed.sql`, so it comes up already populated.
2. The app boots already installed, with `Admin / admin123` available. Warm up the cold pages.
3. The suite authenticates, seeds its per-test employees through REST API v2, and drives PIM
   through the UI.
4. Tear down: discard the database so the next run restores the same `seed.sql` and starts from
   the same known state.

The MySQL service restores `seed.sql` by mounting it into `/docker-entrypoint-initdb.d/`, which
the official MySQL image runs on first start of an empty data directory. Keep the database on an
ephemeral volume (or recreate it per run) so the init script fires each time.

This mirrors the Magento reference's bake-then-run pattern: do the slow install once, snapshot
it, and restore the snapshot on every run.

## Decision

Pin `orangehrm/orangehrm:5.8.1` now for determinism and parity with the demo. Provision it with
the two-phase flow above: install once to produce `seed.sql`, then restore that dump on every
run. If maintaining the dump proves awkward, the fallback is to build from the repository
`Dockerfile` with the seeded database baked in, which closes the gap at the cost of owning a
small bake step.
