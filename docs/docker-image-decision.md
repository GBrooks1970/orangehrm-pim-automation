# Docker image decision

The suite asserts against a controllable OrangeHRM target (ADR-0002). This note records which
image was chosen to provide it, the alternatives weighed, and why.

## Chosen compatibility baseline and immutable identities

The suite deliberately retains the OrangeHRM 5.8.1 application and its seeded schema, paired
with the latest exact patch on the repository's MySQL 8.0 compatibility line. On 29 July 2026,
both references were resolved and executed as Linux/amd64, the GitHub-hosted runner architecture:

| Service | Readable tag in Compose | Immutable Linux/amd64 manifest | Reviewed source and evidence |
|---|---|---|---|
| Database | `mysql:8.0.46` | `sha256:62fb722c78b24245ddff1796a0fcee4a49cc5b87e0aaaf20c92d1da9e0a2497b` | [Docker Official Image tags](https://hub.docker.com/_/mysql/tags?name=8.0.46); manifest annotation points to [`docker-library/mysql` revision `7cf11d5`](https://github.com/docker-library/mysql/tree/7cf11d5360282effadb347353d5f82339506b106/8.0); the pulled binary reports `MySQL Community Server 8.0.46` on `x86_64`. |
| Application | `orangehrm/orangehrm:5.8.1` | `sha256:5eb278acc6280c9a3144b2868230abe48b5bc5892fe00d07c7ec3028e86638e7` | [OrangeHRM Docker Hub tag](https://hub.docker.com/r/orangehrm/orangehrm/tags?name=5.8.1) and [upstream 5.8.1 release](https://github.com/orangehrm/orangehrm/releases/tag/v5.8.1); the pulled image reports Linux/amd64 and PHP 8.3.30. |

Compose keeps each readable tag beside its reviewed manifest digest and declares
`platform: linux/amd64`. The digest controls the bytes; the tag communicates the intended
version to reviewers. A tag move cannot change a run, and a future image review becomes a
visible repository diff.

### Why this one

- **It is the version the journey targets.** OrangeHRM 5.x is the Vue single-page application
  with REST API v2 and `/web/index.php/...` routes. The scaffold's architecture (async waits,
  API-driven setup) assumes exactly that. The 4.x and 3.x images are a different application.
- **It preserves the reviewed functional baseline.** The seed, login contract, REST API v2
  helpers, and all seven journeys were built against 5.8.1. Moving the SUT is a deliberate
  compatibility exercise, not an incidental consequence of pulling a mutable tag.
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
  MySQL (or MariaDB) container hosts the data. `docker-compose.yml` pairs it with the reviewed
  MySQL 8.0.46 Linux/amd64 manifest.
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
  change underneath it without notice. Rejected for determinism; compatibility moves require
  an explicit reviewed tag-and-digest diff and the complete update procedure below.

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
  exists. It is retained only as a visual/reference environment, not an executable automation
  target: every profile is loopback-only because even the smoke Background can conditionally write.

## Provisioning and seeding flow

Two containers always run together: the official app image (which holds no database) and a
separate MySQL container. The installer does not create the database container; MySQL is
already running with an empty `orangehrm` database, and the installer writes the schema and the
admin user into it. The design has two phases so that the per-run path is automated and
deterministic.

### Phase A — seed once (one-time)

1. `docker compose up`: the app image and an empty MySQL start together.
2. Drive the web installer against the `db` service (automated by
   `provisioning/phase-a-install.mjs`). The installer **rejects weak passwords**, so the
   admin account is created with a compliant password (`Admin@123`), not `admin123`.
3. The installer writes the schema and the `Admin` user into MySQL, and `lib/confs/Conf.php`
   into the app. The app is now installed.
4. Apply **demo parity** so `Admin / admin123` works exactly as on the public demo: rewrite
   the stored admin hash to `admin123`, and set
   `auth.password_policy.enforce_password_strength = off` (otherwise login redirects to a
   forced weak-password change). Then capture `provisioning/Conf.php` and `mysqldump` the
   database to `db/seed.sql`. Full commands in `db/README.md`.

This happens once. The installer is never part of a test run. The captured `Conf.php` is what
lets the app boot already installed on a fresh start (a clean CI runner has an empty app
volume and would otherwise re-run the installer despite a populated database).

### Phase B — run many (every run, automated)

1. `docker compose up --wait`: MySQL starts and restores `seed.sql`; Compose proves database and
   Apache transport health, not application installation.
2. `npm run test:readiness` polls to a strict deadline, rejects any installer redirect, completes
   the `Admin / admin123` login exchange, and requires a valid authenticated PIM API response.
3. Only after readiness passes, warm the cold pages. The suite then authenticates, seeds its
   per-test employees through REST API v2, and drives PIM
   through the UI.
4. Tear down: discard the database so the next run restores the same `seed.sql` and starts from
   the same known state.

For a negative proof, set `ORANGEHRM_CONF_PATH=./tests/fixtures/invalid-Conf.php`, recreate the
web service, and run the readiness command with a short timeout. Apache still becomes healthy,
but readiness fails on the login surface before warm-up or Cucumber. Restore the default mount
and recreate `web` afterwards.

The MySQL service restores `seed.sql` by mounting it into `/docker-entrypoint-initdb.d/`, which
the official MySQL image runs on first start of an empty data directory. Keep the database on an
ephemeral volume (or recreate it per run) so the init script fires each time.

This mirrors the Magento reference's bake-then-run pattern: do the slow install once, snapshot
it, and restore the snapshot on every run.

## Reviewing an image update

Never edit a tag or digest in isolation. A reviewer updating either service must:

1. Select an exact patch from the image's upstream release information and Docker Hub page.
   For OrangeHRM, also confirm the supported PHP/MySQL range and assess whether the committed
   seed and `Conf.php` need re-baking.
2. Resolve the Linux/amd64 manifest from the registry, for example:

   ```bash
   docker buildx imagetools inspect mysql:<exact-patch>
   docker buildx imagetools inspect orangehrm/orangehrm:<exact-patch>
   ```

   Record the full architecture manifest digest, upstream source/revision where exposed, review
   date, and readable tag in this document and next to the Compose reference.
3. Pull the exact `tag@sha256:...` reference, inspect its OS/architecture, and execute a version
   command where the image provides one. Confirm `docker compose config --quiet` resolves the
   paired readable tag, digest, and `linux/amd64` platform.
4. Recreate **only this project's** stack and volumes so an older persistent layer cannot mask
   incompatibility:

   ```bash
   docker compose down -v
   docker compose pull
   docker compose up -d --wait
   BASE_URL=http://localhost:8080 npm run test:readiness
   BASE_URL=http://localhost:8080 npm run test:api-contract
   npm test
   npm run test:report
   docker compose down -v
   ```

5. Require the restored seed, installed-state readiness, API contract, 7/7 active suite,
   Serenity render/content, teardown, and PR CI to pass. Record exact versions, manifests,
   runner architecture, test counts, and report evidence in the PR and backlog outcome.

If any compatibility gate fails, restore the last reviewed pair rather than changing the seed,
application, or test expectations opportunistically. A SUT/schema migration is separate work.

## Decision

Pin the reviewed Linux/amd64 manifests for MySQL 8.0.46 and OrangeHRM 5.8.1 for deterministic,
reviewable runs. Provision them with the two-phase flow above: install once to produce
`seed.sql`, then restore that dump on every run. If maintaining the dump proves awkward, the
fallback is to build from the repository `Dockerfile` with the seeded database baked in, which
closes the gap at the cost of owning a small bake step.
