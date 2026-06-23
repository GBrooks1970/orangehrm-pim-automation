# Provisioning the OrangeHRM target (Phase A / Phase B)

The suite asserts against a controllable local OrangeHRM (ADR-0002,
`docs/docker-image-decision.md`). Provisioning is two-phase: **seed once** (Phase A,
one-off), then **restore many** (Phase B, every run).

## Artifacts in version control

| File | Role |
|---|---|
| `db/seed.sql` | `mysqldump` of the installed `orangehrm` database (schema + reference data + the `Admin` user). Restored on first start of an empty MySQL data dir via `/docker-entrypoint-initdb.d`. |
| `provisioning/Conf.php` | The `lib/confs/Conf.php` the installer wrote, pointing OrangeHRM at the `db` service. Mounted into the web container so the app boots **already installed** on any fresh start — including a clean CI runner, where the app volume is empty and the app would otherwise re-run the installer despite a populated database. |

With both mounted (see `docker-compose.yml`), `docker compose up` brings the stack up
installed, with `Admin` / `admin123` working straight to the dashboard. No installer, no
migration.

## Demo parity: why `admin123` needs two adjustments

The public demo uses `Admin` / `admin123`. A vanilla 5.8.1 install will not reproduce that
credential as-is, for two reasons baked into the product:

1. **The installer rejects weak passwords.** Its admin-account step requires an upper- and
   lower-case letter, a digit and a special character, so `admin123` cannot be entered
   during install.
2. **Login enforces password strength.** Even once set, logging in with a weak password
   triggers `auth.password_policy.enforce_password_strength` and redirects to a forced
   "change weak password" screen, walling off PIM.

The public demo simply has that enforcement **off**. To mirror it faithfully, Phase A:

- installs with a compliant password (`Admin@123`),
- rewrites the stored hash to `admin123` (bcrypt), and
- sets `auth.password_policy.enforce_password_strength = 'off'`.

All three are captured in `db/seed.sql`, so every restored run is demo-equivalent. This
changes no test behaviour — the documented `Admin` / `admin123` contract is preserved.

## Phase A — seed once (already done; reproduce only when re-baking)

1. Start an empty stack (comment out the `seed.sql` mount first, or `docker compose down -v`):
   `docker compose up -d`.
2. Drive the web installer (`provisioning/phase-a-install.mjs` automates the Vue wizard):
   - Fresh Installation → accept licence.
   - Database: **Existing Empty Database**, host `db`, port `3306`, name `orangehrm`,
     OrangeHRM DB user `orangehrm` / `orangehrm` (the `db` service grants this user full
     rights on `orangehrm`, so no privileged user is needed).
   - Instance: any organisation name; Admin user `Admin` / `Admin@123`.
   - Run the installation through to "Clean up Install". The migration replays every
     version step and takes several minutes — keep the page open, the wizard drives the
     sequence client-side.
3. Apply demo parity and snapshot:
   ```bash
   HASH=$(docker compose exec -T web php -r 'echo password_hash("admin123", PASSWORD_BCRYPT);')
   docker compose exec -T db mysql -uroot -prootpass orangehrm \
     -e "UPDATE ohrm_user SET user_password='$HASH' WHERE user_name='Admin';
         UPDATE hs_hr_config SET value='off' WHERE name='auth.password_policy.enforce_password_strength';
         DELETE FROM ohrm_enforce_password;"
   docker cp orangehrm-pim-automation-web-1:/var/www/html/lib/confs/Conf.php provisioning/Conf.php
   docker compose exec -T db mysqldump -uroot -prootpass --databases orangehrm \
     --single-transaction --no-tablespaces --default-character-set=utf8mb4 > db/seed.sql
   ```
4. Enable the `seed.sql` and `Conf.php` mounts in `docker-compose.yml` and commit the
   artifacts. Closes backlog #1.

The installer is never part of a test run.

## Phase B — restore many (every run)

`docker compose up` restores `db/seed.sql` into a fresh MySQL data dir and mounts
`Conf.php`, so the app comes up installed and clean. To force a re-restore (the init script
only fires on an empty data dir), recreate the database volume between runs:

```bash
docker compose down -v && docker compose up -d   # cleanest: wipes both volumes, restores seed
```
