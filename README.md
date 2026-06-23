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
`docs/implementation-plan.md` for the build order from this scaffold to a green suite.

## Status

Scaffold. Feature specifications and project documents are in place; the Screenplay
implementation is the next step. See `docs/implementation-plan.md`.
