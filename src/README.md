# src — Screenplay layers

Each folder is one Screenplay responsibility. Keeping them separate means a change in
one rarely forces a change in another.

- `serenity.config.ts` — reporter crew only; no test logic.
- `config/readiness.ts` — bounded retry/deadline policy used by the pre-test installed-app gate.
- `hooks/` — browser launched once per run (`BeforeAll`); per-scenario state reset and
  actor engagement with browsing plus a fresh notepad (`Before`); browser closed once
  (`AfterAll`).
- `interactions/` — `PageElement` definitions per PIM page area (login, add-employee
  form, employee list, personal-details).
- `tasks/` — composed, intent-named activities (`LogInAsAdmin`, `AddEmployee`,
  `IssuedAccount`, `SearchForEmployee`, `EditPersonalDetails`, `DeleteEmployee`).
- `questions/` — state reads (`EmployeeListRows`, `PersonalDetails`,
  `ValidationMessage`, `CurrentUser`).
- `api/` — `OrangeHrmApiClient.ts`: session-cookie auth plus a transport-injected employee
  fixture client that fails precise lookup/validation errors and verifies exact persisted
  identity, plus exact account association verification against REST API v2;
  `OrangeHrmApiPolicy.ts`: pure cookie, auth, duplicate, and identity decisions.
- `support/` — typed scenario-scoped notes for generated account and employee identity.
- `actors/` — reserved; actor setup is handled via hooks.
- `step-definitions/` — thin glue between Gherkin and Tasks, grouped by feature area.

All folders above are now filled; `actors/` remains empty by design (actor setup is handled
via hooks) and keeps its `.gitkeep` for that reason. See `docs/screenplay-guide.md` and
`docs/implementation-plan.md`.
