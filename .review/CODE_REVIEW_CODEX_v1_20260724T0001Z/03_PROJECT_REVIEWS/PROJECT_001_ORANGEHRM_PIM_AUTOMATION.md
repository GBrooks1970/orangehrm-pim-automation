# Project 001: OrangeHRM PIM Automation

[<- Back to Index](../00_CODE_REVIEW_CODEX_v1_20260724T0001Z.md) | [Next: Cross-Project Analysis ->](../04_CROSS_PROJECT_ANALYSIS.md)

**Reviewer:** AI assistant (Codex, GPT-5)

## Project Purpose and Stack

The repository demonstrates a stateful OrangeHRM PIM journey with TypeScript,
Serenity/JS Screenplay, Playwright, Cucumber, REST-assisted fixture setup, a Dockerised
OrangeHRM/MySQL target, and Serenity living documentation. [README.md](../../../README.md)
(lines 1-26) states that intent clearly and matches [package.json](../../../package.json)
(lines 1-27).

## Review Summary

- **Architecture and patterns:** Tasks, Questions, page-area element maps, hooks, and step glue
  are separated cleanly. ADR-0001 and ADR-0003 explain the non-obvious choices. The module-level
  API client is a deliberate exception to actor abilities, not accidental pattern drift.
- **Code quality:** Intent names and diagnostic errors are strong, and state-based waits handle
  the Vue SPA well. The weakest logic is fixture response classification and identity tracking,
  where broad fallbacks can hide the original cause.
- **Test coverage and approach:** Seven use-case scenarios cover add, search, edit, delete, and
  two validation paths. There are no deferred scenarios, but also no unit/component tests for the
  deterministic API/session logic and no true read-only public smoke.
- **Runtime lifecycle and isolation:** One browser per run with scenario-level cookie/storage
  reset is efficient. CI resets Docker volumes after every job. Local database records persist
  unless the documented manual reset is used.
- **Data and authentication:** Non-local targets require explicit admin credentials, a valuable
  safety guard. The shared-demo profile nevertheless performs conditional fixture creation, and
  the login-account scenario does not prove the account outcome.
- **CI and reporting:** The pipeline is readable, uses least-privilege Pages permissions, guards
  report data, tears down volumes, and has five recent green `main` runs. It omits type checking
  and relies on a web-server healthcheck that does not prove installation.
- **Documentation and portfolio value:** Documentation depth is a major strength, as are the GPL
  and provenance records. A few current-state contradictions should be corrected because this
  repository is explicitly pedagogical.

## Executable Specification Assessment

The features are declarative and business-readable. They avoid selectors, timings, and technical
REST language. Shared steps use a compact vocabulary, and the default dry-run proved all seven
scenarios are bound.

Coverage is use-case centred:

- Two add-employee scenarios.
- Search, nationality update, and deletion.
- Missing required last name and duplicate Employee Id.

There are zero `@deferred` scenarios and no quarantined coverage. The backlog's "zero deferred"
claim matches the repository. The main gap is not quantity but oracle quality: "with login
credentials" does not assert the credentials, and the smoke tag describes a conditional write as
read-only.

## Screenplay Fidelity

- Tasks describe user intent and compose Serenity/JS interactions.
- Questions hold stable state reads.
- Element maps centralise selectors by page area.
- Step definitions are generally thin and reusable.
- The actor has one browsing ability; REST setup is intentionally placed in a dedicated client,
  as [ADR-0003](../../../docs/adr/0003-api-driven-setup.md) (lines 12-29) explains.

The main SOLID weakness is testability around the module-global API session and global `fetch`.
Injecting transport and session storage would make response handling testable without weakening
the simple public Task API.

## Synchronisation and Stability

The reviewed runtime code uses explicit Serenity waits with 15-second ceilings and no hard sleeps.
Autocomplete, below-the-fold actions, route changes, persisted nationality, and deletion settling
all receive specific state checks.

The one-off installer script uses clock waits, but it is outside the test run and clearly labelled
as Phase A tooling. That is an acceptable trade-off, not evidence of E2E flakiness.

Stability evidence is qualified:

- Local dry-runs proved binding only.
- The latest five remote `main` workflow runs were successful.
- The backlog reports deterministic 7/7 local reruns.
- Docker and E2E were not executed locally in this review.

## CI, Caching, Images, Secrets, and Reproducibility

- `actions/setup-node` uses the npm cache and `npm ci`; the lockfile is v3 and the installed tree
  is valid.
- Node 20 is aligned across `engines` and CI.
- Chromium and OS dependencies are installed explicitly.
- Docker volumes are destroyed in `if: always()` cleanup.
- Pages upload is guarded on successful render, and Pages deployment has write permissions only
  in the deployment job.
- The workflow does not run the declared typecheck.
- Major-version action references and image tags are mutable; `mysql:8.0` is the most material
  reproducibility gap.
- No committed private-key/token patterns or suspicious secret filenames were found. The
  `Admin/admin123` and database defaults are intentionally local demo fixtures, not production
  secrets; the non-local credential guard prevents implicit reuse.

## Dependency, Security, and Licence Pass

- `npm ls --depth=0` passed.
- `npm audit --json` failed with one high and two moderate vulnerable packages via
  `axios@1.16.0`; fixes are available.
- `npm outdated --json` reported Playwright 1.61.1, plus newer major lines for Node types and
  TypeScript. The Node-types major is intentionally aligned to the Node 20 runtime; upgrades
  should remain compatibility-led.
- All 218 dependency entries in the lockfile declare licence metadata: predominantly MIT,
  Apache-2.0, ISC, and other permissive licences.
- Repository licence signals agree: [package.json](../../../package.json) (line 5),
  [LICENSE](../../../LICENSE) (line 1), [README.md](../../../README.md) (lines 69-76), and
  [THIRD_PARTY_NOTICES.md](../../../THIRD_PARTY_NOTICES.md) (lines 1-31) consistently describe
  GPL-3.0-or-later and OrangeHRM-derived artefacts.
- The committed SQL seed contains test identity and captured installer telemetry, not production
  data. Its provenance and modification boundary are documented.

## Documentation Alignment

The backlog correctly records all six historical items as closed and discloses the remaining
smoke caveat. Feature counts, tags, licence, Node floor, reset guidance, and report publishing
mostly align.

Current contradictions remain:

- "Read-only" public smoke can write.
- QA strategy says CI enforces type checking, but CI does not.
- Guides claim Employee Id assertion, but the suite asserts name/list state.
- `LogInAsAdmin` is described once as UI login, but injects a session cookie.
- The Docker decision still calls closed backlog Item 1 open.

## Overall Project Rating

**Strong portfolio architecture with material follow-up required.** The repository already
demonstrates senior reasoning in target control, Screenplay composition, async handling, ADRs,
and legal provenance. Addressing the high dependency issue and the public-target contract, then
closing the CI/oracle/lower-level-test gaps, would make its claims as strong as its design.

---

[<- Previous: Risks and Issues](../02_RISKS_AND_ISSUES.md) | [Back to Index](../00_CODE_REVIEW_CODEX_v1_20260724T0001Z.md) | [Next: Cross-Project Analysis ->](../04_CROSS_PROJECT_ANALYSIS.md)
