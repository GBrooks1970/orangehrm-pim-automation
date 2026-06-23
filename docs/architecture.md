# Architecture

## 1. Overview

- **Purpose:** demonstrate senior test-automation architecture against the OrangeHRM PIM
  add-employee journey, using Spec-Driven Development, BDD, and the Screenplay pattern.
- **SUT:** OrangeHRM Open Source (Starter). PHP back end, Vue.js single-page front end,
  MySQL, REST API v2.
- **Surface under test:** PIM. Add an employee, confirm them in the Employee List, and the
  adjacent search, edit and delete operations plus add-employee validation.
- **Stack:** TypeScript + Serenity/JS + Playwright + Cucumber.
- **Test target:** resolved from `BASE_URL` (defaults to `http://localhost:8080`, the local
  Dockerised OrangeHRM). The public demo at `https://opensource-demo.orangehrmlive.com` is a
  read-only smoke target only.
- **Entry point:** `npm test`, running Cucumber with `--tags "not @deferred"`.

## 2. Project composition

### Test target (subject application)

OrangeHRM is external to this repository and not owned by it. The suite knows it through:

- **URL:** the `BASE_URL` environment variable.
- **Auth:** an HR administrator session. On the demo this is `Admin / admin123`. A vanilla
  install does not create that user; on the container it is set by hand in the web installer
  (use `Admin / admin123` to mirror the demo) and then captured in the seeded database
  snapshot. See `docs/docker-image-decision.md`.
- **Front end:** a Vue single-page application. Navigation and form steps re-render
  asynchronously from REST API v2 calls, so every transition waits on element state, never
  on a timer.
- **Setup data:** existing employees needed by the search, edit and delete scenarios are
  seeded through the API in the Background, not created by clicking through the form.

### Test runtime

Organised by Screenplay layer, one folder each:

- **Feature files:** `features/**/*.feature`, the specification, committed first.
- **Step definitions:** `src/step-definitions/`, thin glue between Gherkin and Tasks.
- **Interactions:** `src/interactions/`, `PageElement` definitions per PIM page area.
- **Tasks:** `src/tasks/`, composed, intent-named activities.
- **Questions:** `src/questions/`, state reads.
- **Hooks:** `src/hooks/browser.hooks.ts`, browser launched once per run; per-scenario
  state reset.
- **API client:** `src/api/OrangeHrmApiClient.ts`, session-cookie auth plus employee seed
  and verify against REST API v2.
- **Config:** `src/serenity.config.ts`, reporter crew only.

### Tooling

| Command | Purpose |
|---|---|
| `npm test` | Run the active suite (excludes `@deferred`) |
| `npx tsc --noEmit` | TypeScript type check |
| `HEADLESS=false npm test` | Run with a visible browser for debugging |
| `npm run test:report` | Generate the Serenity living-documentation report |

## 3. Folder map

```
orangehrm-pim-automation/
├── features/                          # Gherkin specifications — committed before implementation (SDD)
│   ├── _manifest.md
│   ├── pim-add-employee.feature       # Happy path: add employee → appears in list
│   ├── pim-employee-management.feature# Search, update nationality, delete
│   └── pim-validation.feature         # Missing last name; duplicate employee id
├── src/
│   ├── serenity.config.ts             # Reporter crew (no test logic)
│   ├── hooks/
│   │   └── browser.hooks.ts           # Browser once (BeforeAll); state reset + engage (Before)
│   ├── interactions/                  # PageElements: LoginPage, AddEmployeePage, EmployeeListPage, PersonalDetailsPage
│   ├── tasks/                         # LogInAsAdmin, AddEmployee, SearchForEmployee, EditPersonalDetails, DeleteEmployee
│   ├── questions/                     # EmployeeListRows, PersonalDetails, ValidationMessage
│   ├── api/
│   │   └── OrangeHrmApiClient.ts       # REST API v2 — session auth + employee seed/verify
│   ├── actors/                        # Reserved — actor setup via hooks
│   └── step-definitions/              # Thin Gherkin-to-Task glue
├── docs/
│   ├── adr/                           # Architecture Decision Records (0001–0003)
│   ├── reports/                       # Serenity output (runtime — gitignored)
│   ├── architecture.md                # This file
│   ├── screenplay-guide.md
│   ├── gherkin-style-guide.md
│   ├── qa-strategy.md
│   ├── backlog.md
│   └── implementation-plan.md
├── .github/workflows/
│   └── ci.yml                         # Start stack → warm-up → suite → publish report
├── docker-compose.yml                 # Local OrangeHRM + MySQL stack
├── cucumber.js                        # Cucumber profile — paths, tags, format, ts-node
├── tsconfig.json
├── package.json
└── .gitignore
```

PIM needs no injected test fixture: its negative paths are reachable with ordinary inputs,
so there is no analogue to the Magento decline module.

## 4. Runtime sequence

What happens when `npm test` runs:

1. Cucumber discovers `features/**/*.feature`, skipping `@deferred` (none currently).
2. `ts-node/register` compiles TypeScript on the fly.
3. `src/serenity.config.ts` configures the reporter crew.
4. `src/hooks/browser.hooks.ts` registers `BeforeAll`, `Before`, `AfterAll`.
5. Once per run: `BeforeAll` launches Chromium and authenticates the API client, holding
   the admin session cookie for seeding.
6. Per scenario: `Before` resets browser state and engages the actor with
   `BrowseTheWebWithPlaywright` and `CallAnApi`.
7. Cucumber matches steps to `src/step-definitions/`.
8. Step definitions call `actorCalled('User').attemptsTo(Task...)` or
   `Ensure.that(Question, matcher)`.
9. Tasks decompose to Interactions against Playwright.
10. `Wait.upTo(...).until(element, isVisible())` guards every async Vue transition; the
    default ceiling is too short for a cold SPA, so it is set explicitly.
11. Once per run: `AfterAll` closes the browser.
12. The ArtifactArchiver writes Serenity JSON to `docs/reports/`; `npm run test:report`
    renders the HTML living documentation, published by CI.

## 5. SUT-specific constraints

| Area | Constraint | Reason | Decision |
|---|---|---|---|
| Vue SPA async render | Wait on element state at every step and route transition; no hard waits | The PIM screens re-render asynchronously from REST API v2 calls | ADR-0001, screenplay-guide |
| Login gate | Every scenario starts authenticated | PIM is behind login; the session cookie also authorises the API client | `LogInAsAdmin` / API auth in `BeforeAll` |
| Employee Id auto-fill | Read or override the auto-filled Employee Id deliberately | The form pre-fills the next Id; assertions and the duplicate-id case depend on a known value | `AddEmployee` task |
| Autocomplete search | Wait for the result option to render before selecting | The employee-name search is a debounced async autocomplete | Task-level wait |
| Data setup | Seed employees through REST API v2, not the UI | UI creation is slow and is the behaviour under test elsewhere | ADR-0003 |
| Shared demo non-determinism | Provision a local Docker target for state-changing runs | The public demo is shared, periodically reset, and may reject writes | ADR-0002 |
| Stable assertion | Assert on employee identity (full name + Employee Id), not transient toasts | The post-save success toast is timing-sensitive and disappears; the record and list row are stable | questions, gherkin-style-guide |

The PIM analogue of the Magento "assert the subtotal, never the grand total" rule is:
assert the persisted record (name and Employee Id on the personal-details page and the list
row), never the transient success toast that flashes after save.

## 6. Known issues and technical debt

This is a fresh scaffold. Open items are tracked in `docs/backlog.md`; the build order from
here is in `docs/implementation-plan.md`. The one decision to confirm early is the local
image tag and seeded-database path (backlog #1), because the whole suite asserts against
that target.
