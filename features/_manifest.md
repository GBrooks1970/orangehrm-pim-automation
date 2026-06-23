# Feature manifest

The feature files are the specification for the OrangeHRM PIM section journey. They are
committed before the step definitions and Tasks that satisfy them (SDD). Each scenario is
declarative: it states intent, not UI mechanics, and never mentions time. Setup is arranged
through the REST API ability in the Background; the behaviour under test drives the UI.

| Feature file | Scenarios | Scope | Tags |
|---|---|---|---|
| `pim-add-employee.feature` | 2 | Happy path: add an employee, with and without login credentials; confirm in the list | `@changesState` on both (they create records) |
| `pim-employee-management.feature` | 3 | Find by name (read-only), update nationality, delete | `@changesState` on update and delete |
| `pim-validation.feature` | 2 | Reject a missing last name; reject a duplicate employee id | none |

**Active scenarios:** 7. **Deferred:** 0.

**Smoke subset** (`smoke` profile): scenarios that are neither quarantined nor
state-changing. Only the read-only search scenario qualifies, which is the safe subset to
run against the shared public demo. Everything that creates, edits or deletes a record runs
against the local Dockerised target only.

No PIM behaviour here needs a controllable test fixture, so there is no `@deferred`
scenario in this suite. That is a difference from the Magento reference, where a forced
payment decline required an injected module. PIM's negative paths are reachable with valid
inputs alone.
