# ADR-0002: Provision a local Docker target rather than test the shared demo

**Status:** Accepted

## Context

OrangeHRM offers a public demo at `https://opensource-demo.orangehrmlive.com`. It is
convenient but shared by everyone, periodically reset, and not guaranteed to accept writes.
The PIM journey creates, edits and deletes employees, so it needs a target whose state the
suite controls. A non-deterministic target produces a flaky suite, which defeats the headline
claim.

## Decision

Provision OrangeHRM locally with Docker (`docker-compose.yml`: the official
`orangehrm/orangehrm` image plus MySQL), resolved through `BASE_URL`. State-changing scenarios
run only against this target. The public demo is retained as a read-only smoke target for the
search scenario via the `smoke` profile.

## Trade-off

A local stack adds provisioning cost: an image tag to pin, an install or seed path, and a
slower cold boot in CI. The payoff is determinism and the freedom to create and delete data
without disturbing a shared environment. For a purely read-only demonstration the shared demo
would suffice, but this journey is not read-only.

## Concrete example

`<to fill once implemented: the pinned image tag and the seeded starting state the suite
asserts against>`
