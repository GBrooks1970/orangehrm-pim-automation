# ADR-0002: Provision a local Docker target rather than test the shared demo

**Status:** Accepted

## Context

OrangeHRM offers a public demo at `https://opensource-demo.orangehrmlive.com`. It is
convenient but shared by everyone, periodically reset, and not guaranteed to accept writes.
The PIM journey creates, edits and deletes employees, so it needs a target whose state the
suite controls. A non-deterministic target produces a flaky suite, which defeats the headline
claim. The nominally read-only search scenario also has an API-driven Background that creates
its employee when the record is absent, so selecting that scenario does not provide a genuinely
read-only public-demo path.

## Decision

Provision OrangeHRM locally with Docker (`docker-compose.yml`: the official
`orangehrm/orangehrm` image plus MySQL), resolved through `BASE_URL`. State-changing scenarios
and every executable profile, including `smoke`, run only against this local target while any
selected scenario or Background can write. The shared public demo is not a supported executable
target under that condition. Here, `smoke` describes a narrow scenario selection, not permission
to point the suite at a third-party environment.

Public-demo support can be restored only when all of these conditions are met:

1. The owner approves a stable, externally owned fixture that the suite does not create, update,
   or delete.
2. The selected public-target scenario has no conditional create fallback or other write-capable
   setup path.
3. An automated contract check proves that every scenario selected for the public target, including
   its Background, cannot call a write endpoint.
4. The README, architecture, QA strategy, feature manifest, Cucumber configuration, and backlog
   all describe the restored boundary consistently.

The shared Cucumber hooks enforce this decision before Chromium launch or API authentication, and
the SUT-independent target-contract check proves every profile loads that guard. Contributors must
not combine the public demo URL with any executable profile.

## Trade-off

A local stack adds provisioning cost: image and database lifecycle management, an install or seed
path, and a slower cold boot in CI. The payoff is determinism and the freedom to create and delete
data without disturbing a shared environment. The project gives up a zero-install public smoke run
until it can prove a genuinely read-only fixture and execution path.

## Concrete example

`docker-compose.yml` pins `orangehrm/orangehrm:5.8.1` and mounts `db/seed.sql` plus
`provisioning/Conf.php`, so `docker compose up` restores a known starting state — installed,
with `Admin / admin123` reaching the dashboard (weak-password enforcement off, mirroring the
public demo) and one baseline employee. The suite then seeds its own per-scenario employees
through the API and drives PIM against this controllable target. See `db/README.md` for the
seed-once / restore-many flow. The search scenario's `an employee exists` Background uses that
same API client and can create data, which is why its `smoke` selection remains local-only.
