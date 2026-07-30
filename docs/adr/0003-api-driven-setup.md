# ADR-0003: Set up test data through REST API v2, not the UI

**Status:** Accepted

## Context

The management and validation scenarios need employees to already exist (to search, edit,
delete, or collide an Employee Id against). Creating those through the add-employee form would
be slow, would couple every scenario to the very form some of them are meant to test, and
would make failures ambiguous: a search failure could be a search bug or a setup bug.

## Decision

Seed prerequisite employees through OrangeHRM REST API v2, via a dedicated module-level client
(`src/api/OrangeHrmApiClient.ts`), deliberately outside the Screenplay actor model — not behind
a `CallAnApi` ability. The client authenticates once per run with the admin session cookie (the
Open Source edition has no static bearer token) and POSTs a uniquely named employee for each
Background `an employee exists` step. Every API- or UI-created record is read back, matched to its
exact Employee Id/name/`empNumber`, and registered as owned by that scenario. An `After` hook
matches the captured identity again before deleting it; records already removed through the UI are
accepted as absent, and captured user ids must no longer be enabled. The behaviours under test
(add, search, edit, delete) still drive the UI. Setup and teardown deliberately sit outside the
acting model because lifecycle hooks must use them whether or not an actor activity succeeds.
Keeping the authentication, creation, verification, and cleanup boundary in one plain client
avoids threading an API ability through the browser-focused acting model.

## Trade-off

API setup means understanding the REST endpoints and the session-plus-CSRF exchange, which is
more upfront work than clicking the form. It also risks drifting from the UI path if the API
and UI validate differently. The payoff is fast, reliable setup and unambiguous failures: when
a UI scenario fails, it is the UI behaviour at fault, not the fixture.

## Concrete example

`src/api/OrangeHrmApiClient.ts` runs the session-cookie login exchange once
(`OrangeHrm.authenticate()` in the `BeforeAll` hook): it reads the CSRF `_token` from the
login page, POSTs it with the credentials to `auth/validate`, and keeps the resulting
`_orangehrm` session cookie. That cookie both authorises the seed calls
(`createEmployee` POSTing to `api/v2/pim/employees`, backing the `an employee "X" exists`
Background step), exact read-back, and ownership-checked cleanup. It is also injected into the
browser by `LogInAsAdmin`, so scenarios start authenticated without re-driving the login form.
`ScenarioOwnership` turns readable logical Gherkin values into collision-resistant physical names
and Employee Ids, and stores the exact returned `empNumber` and issued user id. The add, search,
edit and delete behaviours still exercise the UI.
