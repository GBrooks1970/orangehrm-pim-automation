# Feature manifest

The feature files are the specification for the OrangeHRM PIM section journey. They are
committed before the step definitions and Tasks that satisfy them (SDD). Each scenario is
declarative: it states intent, not UI mechanics, and never mentions time. Setup is arranged
through the dedicated REST API client in the Background; the behaviour under test drives the UI.

| Feature file | Scenarios | Scope | Tags |
|---|---|---|---|
| `pim-add-employee.feature` | 2 | Happy path: add an employee and confirm in the list; the credentials variant also verifies the enabled username/employee association and a real employee login | `@changesState` on both (they create records) |
| `pim-employee-management.feature` | 3 | Find by name (read-only), update nationality, delete | `@changesState` on update and delete |
| `pim-validation.feature` | 2 | Reject a missing last name; reject a duplicate employee id backed by an exact API-verified fixture | `@localOnly` on both; `@seedsData` also on the duplicate-id scenario (its Background writes via the API) |

**Active scenarios:** 7. **Deferred:** 0.

**Local smoke subset** (`smoke` profile): scenarios that are neither quarantined, state-changing
(`@changesState`), confined to the local target (`@localOnly`), nor Background-seeded via an
API write (`@seedsData`). Exactly **1 scenario** qualifies — employee search. Its feature
Background creates a unique employee through the API and the `After` hook removes that exact
scenario-owned record, so the profile is local-only despite the read-only UI query. Every
profile loads a fail-fast loopback guard;
the shared public demo is not an executable target. The two `pim-validation.feature` scenarios
remain outside this narrower local selection.

No PIM behaviour is blocked on an unavailable fixture, so there is no `@deferred` scenario in
this suite. The PIM negative paths are reachable with valid inputs and scenario-owned local data.
