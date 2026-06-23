# Build to green: provisioning, Screenplay suite, CI — 2026-06-23

## Session summary

Starting from the completed specification phase (the feature files plus the project docs,
ADRs, CI and docker-compose skeletons, and empty `src/` layers), this session took the
scaffold all the way to a green PIM suite against a live, locally-provisioned OrangeHRM. It
established the specs-first git history, provisioned the Dockerised target end-to-end (Phase
A → committed `db/seed.sql` + `provisioning/Conf.php`), implemented the full Screenplay layer
for all three feature files, and finalised CI and the living-documentation pipeline. **All 7
active scenarios pass** against the local target (`npm test` → exit 0, deterministic across
re-runs) and `npx tsc --noEmit` is clean. The repository was published to GitHub and `main`
pushed.

---

## Objectives

1. ✅ Establish the specs-first git history on a native filesystem (commit 1 = `features/` only)
2. ✅ Initialise the Serenity/JS project — working reporter config, screenshot crew, locked deps
3. ✅ Phase A — drive the OrangeHRM web installer, achieve `Admin/admin123` demo parity, snapshot `db/seed.sql`
4. ✅ Phase B — make the app boot already installed on any fresh start (capture `provisioning/Conf.php`)
5. ✅ Verify REST API v2 — session-cookie auth, employee seeding (closes backlog #2)
6. ✅ Implement the happy-path Screenplay layer — `pim-add-employee.feature` passes
7. ✅ Implement the API client — `OrangeHrmApiClient` (auth + idempotent seed)
8. ✅ Widen to management — search, update nationality, delete (`pim-employee-management.feature`)
9. ✅ Widen to validation — missing last name, duplicate id (`pim-validation.feature`)
10. ✅ Finalise CI — provision-from-seed, run suite, render and deploy living docs
11. ✅ Fill the ADR concrete-example markers with real artifacts
12. ✅ Publish to GitHub and push `main`

---

## Test results

| Check | Result |
|---|---|
| `npx tsc --noEmit` | ✅ Zero errors |
| `npm test` (default profile, `not @deferred`) | ✅ 7/7 scenarios pass, exit 0 |
| Re-run without restoring the DB | ✅ Still 7/7 (idempotent seed + presence-based assertions) |
| Phase B clean restart (`docker compose down -v && up`) | ✅ App boots installed; `Admin/admin123` → dashboard, no installer |

Active scenarios: **7** (add ×2, management ×3, validation ×2). Deferred: **0**.

---

## Git history (SDD evidence)

```
cad278f  Add feature specifications …              ← commit 1: features/ ONLY
eef93de  Scaffold repository structure, docs, ADRs and CI skeleton
8cda4c4  Initialise Serenity/JS project …
d680138  Provision OrangeHRM target: Phase A seed …
102a233  Enforce LF line endings …
ac23c90  Implement the add-employee happy path (pim-add-employee.feature)
2132bb0  Implement employee management … (pim-employee-management.feature)
b228594  Implement add-employee validation … (pim-validation.feature)
6d2da5b  Finalise CI, living documentation and docs
```

The first commit contains only `features/`; each implementation commit names the scenario it
satisfies. Published to `https://github.com/GBrooks1970/orangehrm-pim-automation`.

---

## Phase A — provisioning and the `Admin/admin123` demo-parity workaround

The single most involved part of the build. The official `orangehrm/orangehrm:5.8.1` image is
the PHP/Apache app only; on first boot it serves a Vue web-installer wizard (driving
`/installer/api/...`), and the schema migration replays every version step (several minutes —
the wizard orchestrates the sequence client-side, so the page must be held open).

**The contract the docs require — `Admin/admin123` — cannot be produced as written**, for two
product reasons discovered against the live instance:

1. The installer's admin-account step **rejects weak passwords** (needs upper + lower + digit +
   special), so `admin123` cannot be entered during install.
2. Even once set, login **enforces password strength**
   (`auth.password_policy.enforce_password_strength`, stored in `hs_hr_config`), redirecting to
   a forced "change weak password" screen that walls off PIM. The public demo simply has this
   enforcement **off**.

**Resolution (faithful to the demo, changes no test behaviour):** install with a compliant
password (`Admin@123`), then (a) rewrite `ohrm_user.user_password` to a bcrypt of `admin123`
(`php -r 'echo password_hash("admin123", PASSWORD_BCRYPT)'` in the web container), (b) set the
enforcement config `off`, and (c) clear `ohrm_enforce_password`. All three are captured in
`db/seed.sql`, so every restored run is demo-equivalent. Documented in `db/README.md` and
`docs/docker-image-decision.md`; closes backlog #1.

The DB step uses **"Existing Empty Database"** (compose pre-creates the empty `orangehrm` DB
and grants the `orangehrm`/`orangehrm` app user full rights on it, so no privileged DB user is
needed). `provisioning/phase-a-install.mjs` automates the wizard for reproducibility.

## Phase B — boot installed anywhere (the `Conf.php` insight)

The installer writes **both** DB content (captured by `seed.sql`) **and** `lib/confs/Conf.php`
(the DB-connection config that marks the app installed). `seed.sql` alone is insufficient: on a
fresh start with an empty app volume — notably a clean CI runner — the app would re-run the
installer despite a populated database. So `Conf.php` is captured to `provisioning/Conf.php`
and mounted into the web container alongside the `seed.sql` mount. Validated: `docker compose
down -v && up` boots installed, `Admin/admin123` reaches the dashboard, the baseline employee
(id `0001`) and `enforce=off` are present. (`cryptokeys/` was empty bar an `.htaccess` — OAuth
keys live in the DB, so only `Conf.php` is needed.)

---

## REST API v2 (closes backlog #2)

Verified against the live instance and implemented in `src/api/OrangeHrmApiClient.ts`:

- Session cookie is **`_orangehrm`** (path `/web`).
- The CSRF `_token` is a Vue **`:token="&quot;…&quot;"` prop** on the login page, **not** a
  hidden input in the raw HTML (a no-JS `curl` only sees the prop).
- `GET auth/login` → parse token + cookie → `POST auth/validate` (form-encoded) → 302 to the
  dashboard establishes the session.
- `POST api/v2/pim/employees` (JSON `{firstName, middleName, lastName, empPicture}`) → 200
  `{data:{empNumber,…}}`. **API-created employees get `employeeId: null`** unless one is
  supplied (the UI auto-fills `0002`, `0003`, …).

The same session cookie is **reused to log the browser in** (injected via Serenity `Cookie.set`,
which needs `domain` + `path`, not `path` alone) — honouring ADR-0003's "login is arranged
through the API ability" rather than re-driving the login form per scenario.

---

## Screenplay layer and the selector lessons

Built over Serenity/JS + Playwright with one folder per responsibility. The OrangeHRM Vue SPA
forced several empirically-found patterns, each captured in code comments:

- **Serenity's CSS engine does not match `:has()`** → row-action icons are addressed by
  By.xpath predicate (`//button[.//i[contains(@class,'bi-pencil-fill')]]`).
- **`contains(@class,'oxd-select-text')` also matches `oxd-select-text-input`** (substring) →
  the nationality dropdown uses an exact class-token xpath.
- **Below-the-fold elements never satisfy `isVisible()`** (the 720px viewport). The row-action
  icons (y≈706) and the nationality option (~30th of 194, y≈1560) are waited on with
  `isPresent()` then **clicked** — Serenity's `Click` auto-scrolls into view.
- **The Employee Name filter is a debounced autocomplete** → `SearchForEmployee.selecting()`
  waits for the suggestion and selects it; the absence check (`byNameText`) waits for the
  dropdown to settle then searches the typed text.
- **A per-scenario Background re-seeds**, so the seed is **idempotent** (`ensureEmployeeExists`
  looks up before creating) — otherwise "Odis Adalwin" piles up across the management feature,
  breaking the delete assertion and pushing rows below the fold.

Assertions follow the methodology: the persisted record (name heading, list row, saved
nationality) and the field-level validation errors — never the transient success toast.

Two dependency adjustments were needed to compile/run: pin `playwright@1.60.0` (dedupe
`playwright-core` against `@serenity-js/playwright`'s `~1.60.0` peer) and add
`@serenity-js/console-reporter`.

---

## CI and living documentation

`.github/workflows/ci.yml` now: installs deps + Playwright Chromium, `docker compose up --wait`
(restores the seed and boots installed), warms the cold SPA, runs the suite against the local
target, **guards for non-empty Serenity JSON**, renders the HTML report to
`target/site/serenity` (Java 11+ is pre-installed on `ubuntu-latest`), and a `deploy-pages` job
publishes it to GitHub Pages from `main`. The `test:report` npm script was corrected to the
proper `--source ./docs/reports --features ./features` form. The local HTML report could not be
rendered here (no JRE), but the JSON pipeline is proven (77 scenario JSON files produced) and
the report renders in CI.

---

## Open items

- **Backlog #4 (deliberate, non-blocking):** the lone non-`@changesState` scenario (search)
  still seeds its employee via the API in the Background, so the `smoke` profile is not purely
  read-only against the shared demo. The `default` profile covers everything locally.
- No scenario is flaky, so none is quarantined; the `@deferred` mechanism is in place and unused.
