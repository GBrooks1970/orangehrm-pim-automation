# Migration Plans

[<- Back to Index](00_CODE_REVIEW_CODEX_v1_20260724T0001Z.md) | [Next: Index ->](00_CODE_REVIEW_CODEX_v1_20260724T0001Z.md)

**Reviewer:** AI assistant (Codex, GPT-5)

## Plan 1: Single Source of Truth for Features

- Keep Gherkin as the executable behaviour source and `docs/backlog.md` as status source.
- Decide whether public smoke is local-only or uses a genuinely pre-existing external fixture.
- Encode that decision in tags and a profile contract test before editing prose.
- Generate or validate scenario counts and tag inventories from Cucumber dry-run output.
- Link README, manifest, architecture, and QA strategy to the generated inventory rather than
  manually restating mutable counts.
- Correct Employee Id and login-flow claims, leaving the clearly labelled historical
  implementation plan unchanged.
- Gate the migration with default and smoke dry-runs plus a documentation link/check pass.

## Plan 2: Docker Compose for Local Development

- Add an installed-application readiness probe that rejects the installer and confirms the
  expected OrangeHRM login surface.
- Make `docker compose up -d --wait` depend on that probe, or run a dedicated readiness script
  before all tests.
- Pin MySQL to an exact compatible patch and record image digests for OrangeHRM and MySQL.
- Add automated image update PRs so pins do not become abandoned.
- Introduce scenario-scoped created-record tracking and cleanup, while retaining
  `docker compose down -v` as full reset.
- Validate from a clean volume: bring-up, authentication, exact seed identity, seven scenarios,
  report render, and teardown.
- Document Windows and POSIX command equivalents where shell syntax differs.

## Plan 3: GitHub Actions and Workflow

- Add `npm run typecheck` directly after `npm ci` for fast failure.
- Keep the Docker E2E lane on Node 20 and the lockfile-backed npm cache.
- Add installed-app readiness before warm-up and remove any warm-up tolerance that hides an
  unexpected target state.
- Upgrade Serenity/JS and Axios, then add an audit policy or scheduled dependency job.
- Preserve report generation on test failure, but gate Pages deployment on a confirmed current
  report artifact and make the intended red-build publication policy explicit.
- Pin third-party actions by commit SHA if the repository adopts a strict supply-chain policy.
- Validate the workflow on a pull request, inspect the report artifact, and deploy only from an
  authorised `main` run; do not merge review-only branches automatically.

## Migration Risks and Rollback

- A true read-only smoke fixture may not be stable on the shared demo; the safe rollback is to
  disable the public profile, not restore conditional writes.
- Serenity/JS upgrades must remain aligned across all packages to avoid peer-dependency and report
  drift.
- Digest pinning can be platform-specific; record the intended runner architecture and update
  deliberately.
- Stronger readiness checks can expose existing provisioning timing assumptions. Treat that as
  useful evidence and tune bounded retries, not unconditional sleeps.
- Fixture cleanup must use captured identity so it cannot delete an unrelated shared record.

## Completion Criteria

- Public-target execution is provably non-mutating or no longer supported.
- `npm audit` has no unaccepted high finding.
- CI runs typecheck before Docker and detects an uninstalled target before E2E.
- The login-credentials journey proves a usable account-specific outcome.
- Fixture error branches have lower-level tests and exact-id verification.
- Current docs, backlog, registry, workflow, and executable profiles agree.

---

[<- Previous: Architecture Assessment](06_ARCHITECTURE_ASSESSMENT.md) | [Back to Index](00_CODE_REVIEW_CODEX_v1_20260724T0001Z.md) | [Next: Index ->](00_CODE_REVIEW_CODEX_v1_20260724T0001Z.md)
