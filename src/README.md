# src — Screenplay layers

Each folder is one Screenplay responsibility. Keeping them separate means a change in
one rarely forces a change in another.

- `serenity.config.ts` — reporter crew only; no test logic.
- `hooks/` — browser launched once per run (`BeforeAll`); per-scenario state reset and
  actor engagement (`Before`); browser closed once (`AfterAll`).
- `interactions/` — `PageElement` definitions per PIM page area (login, add-employee
  form, employee list, personal-details).
- `tasks/` — composed, intent-named activities (`LogInAsAdmin`, `AddEmployee`,
  `SearchForEmployee`, `EditPersonalDetails`, `DeleteEmployee`).
- `questions/` — state reads (`EmployeeListRows`, `PersonalDetails`,
  `ValidationMessage`).
- `api/` — `OrangeHrmApiClient.ts`: session-cookie auth plus employee seed and verify
  against REST API v2.
- `actors/` — reserved; actor setup is handled via hooks.
- `step-definitions/` — thin glue between Gherkin and Tasks, grouped by feature area.

All folders above are now filled; `actors/` remains empty by design (actor setup is handled
via hooks) and keeps its `.gitkeep` for that reason. See `docs/screenplay-guide.md` and
`docs/implementation-plan.md`.
