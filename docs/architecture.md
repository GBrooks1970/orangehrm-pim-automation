# Architecture

## 1. Overview

- **Purpose:** demonstrate senior test-automation architecture against the OrangeHRM PIM
  add-employee journey, using Spec-Driven Development, BDD, and the Screenplay pattern.
- **SUT:** OrangeHRM Open Source (Starter). PHP back end, Vue.js single-page front end,
  MySQL, REST API v2.
- **Surface under test:** PIM. Add an employee, confirm them in the Employee List, verify an
  issued account's enabled employee association and login, and cover the adjacent search,
  edit, delete, and add-employee validation operations.
- **Stack:** TypeScript + Serenity/JS + Playwright + Cucumber.
- **Test target:** resolved from `BASE_URL` (defaults to `http://localhost:8080`, the local
  Dockerised OrangeHRM). Every executable profile is loopback-only; the shared public demo is
  not a supported execution target while selected setup can write.
- **Entry point:** `npm test`, running Cucumber with `--tags "not @deferred"`.

## 2. Project composition

### Test target (subject application)

OrangeHRM is external to this repository and not owned by it. The suite knows it through:

- **URL:** the `BASE_URL` environment variable.
- **Auth:** an HR administrator session. The seeded local target uses `Admin / admin123` for
  parity with the public demonstration environment. A vanilla install does not create that
  user; on the container it is set by hand in the web installer and captured in the seeded database
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
  state reset and a fresh scenario notepad.
- **API client:** `src/api/OrangeHrmApiClient.ts`, session-cookie auth plus employee seed
  and exact employee/account verification against REST API v2.
- **Scenario support:** `src/support/ScenarioNotes.ts`, typed scenario-owned identities and
  masked credentials shared across Screenplay activities.
- **Config:** `src/serenity.config.ts`, reporter crew only.

### Tooling

| Command | Purpose |
|---|---|
| `npm test` | Run the active suite (excludes `@deferred`) |
| `npm run test:smoke:local` | Run the one-scenario local smoke selection |
| `npm run test:target-contract` | Prove every profile loads the pre-browser loopback guard |
| `npm audit --audit-level=high` | Gate the locked test/report toolchain against High advisories |
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
│   ├── config/
│   │   └── target-safety.ts            # Pure loopback classification + fail-fast guard
│   ├── hooks/
│   │   └── browser.hooks.ts           # Browser once (BeforeAll); state reset + engage (Before)
│   ├── interactions/                  # PageElements: login, top bar, add form, employee list, personal details
│   ├── tasks/                         # Login, employee CRUD/search, and issued-account verification/login
│   ├── questions/                     # Employee list/details, validation messages, current signed-in user
│   ├── api/
│   │   └── OrangeHrmApiClient.ts       # REST API v2 — session auth + employee/account verification
│   ├── support/
│   │   └── ScenarioNotes.ts            # Typed scenario-scoped issued account and employee identity
│   ├── actors/                        # Reserved — actor setup via hooks
│   └── step-definitions/              # Thin Gherkin-to-Task glue
├── docs/
│   ├── adr/                           # Architecture Decision Records (0001–0003)
│   ├── reports/                       # Serenity output (runtime — gitignored)
│   ├── architecture.md                # This file
│   ├── screenplay-guide.md
│   ├── gherkin-style-guide.md
│   ├── qa-strategy.md
│   ├── dependency-policy.md
│   ├── backlog.md
│   └── implementation-plan.md
├── .github/workflows/
│   └── ci.yml                         # Start stack → warm-up → suite → publish report
├── scripts/
│   └── verify-local-target-contract.ts# Static profile/guard contract check
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
5. Once per run: `BeforeAll` rejects a non-loopback `BASE_URL` before it launches Chromium or
   authenticates the API client, then holds the local admin session cookie for seeding.
6. Per scenario: `Before` resets browser state and engages the actor with
   `BrowseTheWebWithPlaywright` plus an empty `TakeNotes` notepad. API setup
   (authentication, seeding) runs through a dedicated module-level client, deliberately
   outside the actor model (ADR-0003).
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
| Issued employee account | Retain the unique username and employee identity per scenario; mask the password; verify the exact enabled admin-API association, then perform a fresh employee login | Creating the employee record alone does not prove that OrangeHRM created a usable account | `ScenarioNotes`, `IssuedAccount`, `CurrentUser` |
| Employee Id auto-fill | Read or override the auto-filled Employee Id deliberately | The form pre-fills the next Id; assertions and the duplicate-id case depend on a known value | `AddEmployee` task |
| Autocomplete search | Wait for the result option to render before selecting | The employee-name search is a debounced async autocomplete | Task-level wait |
| Data setup | Seed employees through REST API v2, not the UI | UI creation is slow and is the behaviour under test elsewhere | ADR-0003 |
| Shared demo non-determinism | Reject every non-loopback execution target before browser/API setup | The public demo is shared and even the smoke Background can conditionally write | ADR-0002, `target-safety.ts` |
| Stable assertion | Assert on employee identity (full name + Employee Id), not transient toasts | The post-save success toast is timing-sensitive and disappears; the record and list row are stable | questions, gherkin-style-guide |

The PIM analogue of the Magento "assert the subtotal, never the grand total" rule is:
assert the persisted record (name and Employee Id on the personal-details page and the list
row), never the transient success toast that flashes after save.

## 6. Known issues and technical debt

The suite has been built to green since 2026-06-23. Open items are tracked in
`docs/backlog.md` (Items #1–#6 and CODEX-01–05 are closed; CODEX-06–11 remain open); the historical build order is
recorded in `docs/implementation-plan.md`. The local image tag and seeded-database path
(backlog #1) that the whole suite asserts against was confirmed during that build.
