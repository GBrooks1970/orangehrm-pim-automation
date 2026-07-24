# Recommendations

[<- Back to Index](00_CODE_REVIEW_CODEX_v1_20260724T0001Z.md) | [Next: Architecture Assessment ->](06_ARCHITECTURE_ASSESSMENT.md)

**Reviewer:** AI assistant (Codex, GPT-5)

## Recommended Refactors

- **P0 - Restore the target boundary:** remove conditional writes from the public-demo profile or
  make the profile local-only, then align every current-state document.
- **P0 - Patch the audit result:** upgrade the Serenity/JS set and lockfile until the vulnerable
  Axios path is removed; run the full report path after the upgrade.
- **P1 - Enforce the contract:** add `npm run typecheck` before browser and Docker setup in CI.
- **P1 - Strengthen truth signals:** verify that login credentials produce a usable account, and
  make fixture helpers fail precisely and verify exact identity.
- **P1 - Add a lower test layer:** unit-test cookie parsing, host safety, response classification,
  and fixture identity; add one local API contract test.

## Next Steps

- Triage Risks 1-6 into the canonical backlog with acceptance criteria and owners.
- Decide the recorded public-smoke question before changing tags, because it affects the external
  target promise.
- Add an installed-app readiness check and pin the MySQL patch/image digest.
- Run the complete registry gate after implementation: typecheck, clean Compose bring-up,
  `npm test`, report rendering, and Pages-content validation.
- Perform one documentation-currency pass after code changes, preserving the historical plan but
  correcting current guides.

## Future Project Ideas

- Add a small mock-server test harness for the session-cookie and employee API client.
- Demonstrate ISTQB boundary analysis with name lengths, Employee Id format limits, or login
  credential decision rules, using Scenario Outlines only where they remain readable.
- Publish a machine-readable run summary with scenario, duration, retry, and failure-category
  trends rather than relying on "zero flake" prose.
- Use automated dependency and Docker-image update PRs with the existing full E2E gate.
- Add scenario-scoped test-data identity and cleanup, allowing safe repeatability without a
  periodic volume reset.

## Suggested Backlog Order

1. Public-demo mutation boundary.
2. High dependency audit finding.
3. CI typecheck and installed-app readiness.
4. Login-account oracle.
5. Fixture error handling plus lower-level tests.
6. Image pinning and documentation currency.
7. Local data cleanup and metrics.

## Recorded Question

Should the public OrangeHRM demo remain supported through a genuinely pre-existing, read-only
fixture, or should the `smoke` profile be local-only until the project controls such a fixture?

---

[<- Previous: Cross-Project Analysis](04_CROSS_PROJECT_ANALYSIS.md) | [Back to Index](00_CODE_REVIEW_CODEX_v1_20260724T0001Z.md) | [Next: Architecture Assessment ->](06_ARCHITECTURE_ASSESSMENT.md)
