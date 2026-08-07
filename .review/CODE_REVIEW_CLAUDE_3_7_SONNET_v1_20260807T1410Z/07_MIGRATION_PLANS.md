# Migration Plans

[<- Back to Index](00_CODE_REVIEW_CLAUDE_3_7_SONNET_v1_20260807T1410Z.md) | [Next: Annex: Test Strategy ->](ANNEX/TEST_STRATEGY.md)

**Reviewer:** AI assistant (Claude 3.7 Sonnet)

Actionable migration plans for future maintenance:

## 1. Single Source of Truth for Feature Fixtures & Seed Data

- **Goal:** Maintain deterministic database state and clean fixture seeding across local and CI environments.
- **Current State:** Database seeded via `db/seed.sql` mounted in `docker-compose.yml`; API seeding creates unique scenario-owned employees.
- **Migration Steps:**
  1. Continue maintaining `db/seed.sql` as the baseline seed for local Docker instances.
  2. Maintain scenario-owned employee ID collision resistance in `OrangeHrmApiClient.ts`.
  3. Verify cleanup completeness via `After` hook scenario ownership tracking.

## 2. Docker Compose Infrastructure & Healthcheck Optimization

- **Goal:** Ensure fast, reliable SUT startup and readiness verification in CI and local dev.
- **Current State:** Compose file pins MySQL 8.0.46 and OrangeHRM 5.8.1 by immutable SHA-256 digests. `verify-orangehrm-readiness.ts` polls installed login readiness.
- **Migration Steps:**
  1. Maintain SHA-256 image digest pinning in `docker-compose.yml`.
  2. Retain installed readiness polling prior to executing Cucumber scenario suites.

## 3. CI/CD Pipeline & TypeScript Module Resolution Migration

- **Goal:** Migrate TypeScript module resolution to enable unblocking TypeScript 6.x upgrades.
- **Current State:** Dependabot hold configured on `typescript >= 6.0.0` due to `"moduleResolution": "node"`.
- **Migration Steps:**
  1. Update `tsconfig.json` to `"moduleResolution": "Node16"` or `"NodeNext"`.
  2. Verify `ts-node/register` compatibility in `package.json` scripts (`test:unit`, `test:api-contract`).
  3. Validate full static type checking (`npm run typecheck`) and E2E execution.
  4. Remove TypeScript 6.x ignore rule from `.github/dependabot.yml` and `docs/dependency-policy.md`.

---

[<- Previous: Architecture Assessment](06_ARCHITECTURE_ASSESSMENT.md) | [Back to Index](00_CODE_REVIEW_CLAUDE_3_7_SONNET_v1_20260807T1410Z.md) | [Next: Annex: Test Strategy ->](ANNEX/TEST_STRATEGY.md)
```

---