# OrangeHRM PIM Automation

End-to-end test automation for the OrangeHRM **PIM** module, built to demonstrate
senior test-automation architecture against a real section journey using Spec-Driven
Development (SDD), BDD, and the Screenplay pattern.

The journey under test is **adding an employee in PIM**: create a new employee, confirm
they appear in the Employee List, and exercise the adjacent search, edit and delete
operations plus the form's validation rules.

## Why this journey

PIM is the heart of OrangeHRM. Adding an employee touches the parts that make a UI suite
flaky if handled naively: a Vue single-page front-end that re-renders asynchronously from
a REST API, a multi-section form, an autocomplete search, and list state that updates out
of band. It is a fair test of architecture, not just of clicking.

## Stack

- **Language:** TypeScript
- **Screenplay framework:** Serenity/JS
- **UI driver:** Playwright
- **BDD runner:** Cucumber
- **SUT:** OrangeHRM Open Source (Starter), provisioned locally via Docker. Every executable
  profile is loopback-only; the shared public demo is reference material, not a test target.
- **Node.js:** 24.x (matches Serenity/JS, CI, `.nvmrc`, and `@types/node`).

## Run instructions

```bash
npm install

# Run the full active suite (excludes quarantined scenarios)
npm test

# Run the fast SUT-independent API-policy and target-safety tests
npm run test:unit

# With the local stack running, verify employee create/reuse/read-back semantics
BASE_URL=http://localhost:8080 npm run test:api-contract

# Prove the installed login and authenticated PIM API are ready
BASE_URL=http://localhost:8080 npm run test:readiness

# Run the narrower one-scenario smoke selection against the local target
npm run test:smoke:local

# Verify that every profile loads the loopback guard
npm run test:target-contract

# Audit the locked development/test toolchain
npm audit --audit-level=high

# Visible browser, for debugging
HEADLESS=false npm test

# Type check only
npx tsc --noEmit

# Generate the Serenity living-documentation report from the last run
npm run test:report
```

The suite resolves its target from `BASE_URL` (defaults to `http://localhost:8080`, the
local Dockerised OrangeHRM). A fail-fast hook rejects public, shared, malformed, and other
non-loopback targets before launching Chromium or authenticating. The smoke profile remains
local-only because its selected search scenario can create a missing employee in its Background.
See `docs/architecture.md` for the full picture and
`docs/implementation-plan.md` for the historical build order (the suite has been green since
2026-06-23).

**Periodic local reset.** A long-lived local Docker volume accumulates state across runs
(created/edited/deleted employees). Reset to the seeded baseline with:

```bash
docker compose down -v && docker compose up -d --wait   # wipes both volumes, restores seed
BASE_URL=http://localhost:8080 npm run test:readiness   # proves installed app, not just Apache
```

See `db/README.md` for the full provisioning detail and
`docs/dependency-policy.md` for dependency/audit handling.

## Status

Implemented and green. All 7 active scenarios pass against the local Dockerised target
(`npm test` → 7/7, deterministic across re-runs), covering add-employee (with and without
login details), search, update nationality, delete, and the missing-last-name and duplicate-id
validations. Provisioning is automated (`docker compose up` restores the seeded target and
boots installed); CI runs the fast lower-level lane before browser/Docker setup, then requires
the bounded installed-login/authenticated-API readiness gate before warm-up, the employee fixture
contract, or Cucumber. It then publishes the Serenity living documentation. See
`docs/implementation-plan.md` and `db/README.md`.

## Licence

[GNU General Public License v3.0 or later](LICENSE) — © 2026 Gary Brooks.

The repository includes OrangeHRM-derived provisioning artifacts under the same GPL-or-later
terms. Their upstream attribution, provenance, and local modification boundary are recorded in
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). Container images and installed dependencies
remain subject to their respective licence terms.
