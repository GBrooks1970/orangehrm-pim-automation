# ADR-0003: Set up test data through REST API v2, not the UI

**Status:** Accepted

## Context

The management and validation scenarios need employees to already exist (to search, edit,
delete, or collide an Employee Id against). Creating those through the add-employee form would
be slow, would couple every scenario to the very form some of them are meant to test, and
would make failures ambiguous: a search failure could be a search bug or a setup bug.

## Decision

Seed prerequisite employees through OrangeHRM REST API v2, behind the `CallAnApi` ability. The
API client authenticates once per run with the admin session cookie (the Open Source edition
has no static bearer token) and POSTs employees for the Background `an employee exists` step.
The behaviours under test (add, search, edit, delete) still drive the UI.

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
(`ensureEmployeeExists` POSTing to `api/v2/pim/employees`, backing the `an employee "X" exists`
Background step) and is injected into the browser by `LogInAsAdmin`, so scenarios start
authenticated without re-driving the login form. The add, search, edit and delete behaviours
still exercise the UI.
