# Screenplay guide

This covers the Serenity/JS Screenplay implementation for the PIM suite over Playwright and
Cucumber. The rationale for Screenplay over Page Objects is ADR-0001; for Serenity/JS over a
hand-rolled pattern, ADR-0001 and the framework choice in the implementation plan.

## Actor lifecycle

**Location:** `src/hooks/browser.hooks.ts`

The actor is created on the first `actorCalled('User')` in a scenario. The browser is
launched once for the whole run in `BeforeAll`. A `Before` hook resets browser state
(cookies and storage) and engages the actor; `AfterAll` closes the browser.

```typescript
// src/hooks/browser.hooks.ts
let browser: Browser;

BeforeAll(async () => {
    browser = await chromium.launch({ headless: process.env.HEADLESS !== 'false' });
    await OrangeHrm.authenticate();   // admin session cookie, once per run (ADR-0003)
});

Before(async () => {
    // reset cookies + storage on the reused context so login and search state
    // do not leak across scenarios
    engage(Cast.where(actor =>
        actor.whoCan(
            BrowseTheWebWithPlaywright.using(browser),
        )
    ));
});

AfterAll(async () => { await browser.close(); });
```

**Do not launch the browser per scenario.** Launching in `Before` and closing in `After`
leaves only the first scenario passing; the rest fail at first navigation with a
closed-browser error. Launch once, close once.

**Why hooks, not `configure({ actors })`:** `Cast.where` is synchronous and
`chromium.launch()` is async, so the launch lives in `BeforeAll` and engagement in `Before`.

## Abilities

| Ability | Package | Role |
|---|---|---|
| `BrowseTheWebWithPlaywright` | `@serenity-js/playwright` | Drive the PIM UI |

The actor is only ever given the browsing ability. API setup (authentication and seeding) runs
through a dedicated module-level client (`src/api/OrangeHrmApiClient.ts`), deliberately outside
the Screenplay actor model — see [ADR-0003](adr/0003-api-driven-setup.md) for the rationale.
OrangeHRM's REST API v2 authenticates with the logged-in session cookie (and a CSRF token
on writes); the Open Source edition has no static bearer token. So `OrangeHrm.authenticate()`
performs the login exchange once in `BeforeAll`, captures the session cookie, and reuses it
for seed and verify calls. The Background step `Given an employee "X" exists` POSTs to the
employee endpoint; `the employee should appear in the employee list` is a UI assertion, not
an API one, because that is the behaviour under test.

## Interactions, Tasks and Questions

Page elements are `PageElement` objects in `src/interactions/`, one file per area
(`LoginPage`, `AddEmployeePage`, `EmployeeListPage`, `PersonalDetailsPage`). Keeping selectors
here, out of the feature files, means an OrangeHRM restyle changes one Interaction.

| Task | Description |
|---|---|
| `LogInAsAdmin.now()` | UI login, used where login itself matters; most scenarios get the session via the API ability |
| `AddEmployee.named(first, last)` | Open Add Employee, fill the name, save; optionally toggle login details |
| `SearchForEmployee.byName(name)` | Enter the employee-list filter, wait for the debounced result |
| `EditPersonalDetails.setNationality(value)` | Open the record, set nationality, save |
| `DeleteEmployee.named(name)` | Select the row, confirm deletion |

| Question | Returns | Assertion pattern |
|---|---|---|
| `EmployeeListRows.matching(name)` | The matching list rows | `isPresent()` / `not(isPresent())` |
| `PersonalDetails.name()` | The name on the record | `equals("Aurora Vega")` |
| `PersonalDetails.nationality()` | The selected nationality | `equals("British")` |
| `ValidationMessage.forField(field)` | The field's error text | `includes("Required")` |

Assert on the persisted record and the list row, never on the post-save success toast, which
fades on a timer and races the assertion.

## Vue-specific async patterns

**Wait on state, never on the clock.** Every route or form transition waits for the next
element before proceeding. Never use `page.waitForTimeout`; never rely on Serenity's bare
`Wait.until` default ceiling, which a cold SPA exceeds.

```typescript
Click.on(AddEmployeePage.saveButton),
Wait.upTo(Duration.ofSeconds(15))
    .until(PersonalDetailsPage.nameHeading, isVisible()),  // SPA routes to the record
```

**Debounced autocomplete.** The employee-name filter is a debounced async lookup; wait for
the option to render before asserting or selecting:

```typescript
Enter.theValue(name).into(EmployeeListPage.nameFilter),
Wait.upTo(Duration.ofSeconds(10)).until(EmployeeListPage.firstResultRow, isVisible()),
```

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Timeout on the add-employee form | `BASE_URL` unreachable, or the SPA still booting | Confirm the stack is up; cold renders need the explicit `Wait.upTo` ceilings |
| Only the first scenario passes | Browser launched/closed per scenario | Launch once in `BeforeAll`, close in `AfterAll` |
| Search returns nothing | Asserting before the debounced lookup rendered | Wait for the result row before asserting |
| Duplicate-id scenario passes wrongly | The seeded employee id did not actually take | Confirm the API seed set the exact Employee Id the scenario reuses |
| Assertion races a vanishing toast | Asserting on the success toast | Assert on the list row or the record instead |
