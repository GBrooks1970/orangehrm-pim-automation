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
- **SUT:** OrangeHRM Open Source (Starter), provisioned locally via Docker; the public
  demo at `https://opensource-demo.orangehrmlive.com` serves as a read-only smoke target.
- **Node.js:** 20 or newer (matches CI and `@types/node`).

## Run instructions

```bash
npm install

# Run the full active suite (excludes quarantined scenarios)
npm test

# Visible browser, for debugging
HEADLESS=false npm test

# Type check only
npx tsc --noEmit

# Generate the Serenity living-documentation report from the last run
npm run test:report
```

The suite resolves its target from `BASE_URL` (defaults to `http://localhost:8080`, the
local Dockerised OrangeHRM). See `docs/architecture.md` for the full picture and
`docs/implementation-plan.md` for the historical build order (the suite has been green since
2026-06-23).

**Periodic local reset.** A long-lived local Docker volume accumulates state across runs
(created/edited/deleted employees). Reset to the seeded baseline with:

```bash
docker compose down -v && docker compose up -d   # wipes both volumes, restores seed
```

See `db/README.md` for the full provisioning detail.

## Status

Implemented and green. All 7 active scenarios pass against the local Dockerised target
(`npm test` → 7/7, deterministic across re-runs), covering add-employee (with and without
login details), search, update nationality, delete, and the missing-last-name and duplicate-id
validations. Provisioning is automated (`docker compose up` restores the seeded target and
boots installed); CI runs the suite and publishes the Serenity living documentation. See
`docs/implementation-plan.md` and `db/README.md`.

## Licence

[GNU General Public License v3.0 or later](LICENSE) — © 2026 Gary Brooks.

The repository includes OrangeHRM-derived provisioning artifacts under the same GPL-or-later
terms. Their upstream attribution, provenance, and local modification boundary are recorded in
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). Container images and installed dependencies
remain subject to their respective licence terms.
