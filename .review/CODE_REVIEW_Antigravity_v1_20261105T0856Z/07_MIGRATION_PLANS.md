# Migration Plans

[<- Back to Index](00_CODE_REVIEW_Antigravity_v1_20261105T0856Z.md) | [Back to Index](00_CODE_REVIEW_Antigravity_v1_20261105T0856Z.md)

**Reviewer:** AI assistant (Antigravity)

---

## Plan 1: Single Source of Truth for Features

- **Maintain Gherkin Specifications as Behavioral Contract:** Treat feature files in `features/` as the sole authority for system behavior, ensuring scenarios describe domain outcomes without UI selector details.
- **Automate Scenario Discovery and Count Validation:** Continue leveraging `scripts/verify-project-contract.ts` to assert that Cucumber dry-runs discover exactly 7 default scenarios and 1 smoke scenario.
- **Maintain Clear Separation of Historical Documentation:** Preserve the historical marker on `docs/implementation-plan.md` to prevent confusion with active architectural specifications.
- **Centralize Tag Taxonomy and Execution Rules:** Document tag semantics (`@changesState`, `@localOnly`, `@seedsData`, `@deferred`) strictly in `features/_manifest.md`.
- **Align Feature Nomenclature Across Portfolio:** Ensure scenario naming and actor interactions adhere to portfolio-wide Screenplay standards.
- **Automate Feature File Link Verification:** Enforce link checking across all specification files to ensure documentation integrity across updates.

---

## Plan 2: Docker Compose for Local Development

- **Preserve Reviewed Architecture Digest Pins:** Keep MySQL 8.0.46 and OrangeHRM 5.8.1 pinned to their immutable `linux/amd64` SHA256 digests in `docker-compose.yml`.
- **Maintain Automated Database Seeding:** Ensure `db/seed.sql` and `provisioning/Conf.php` remain mounted so containers boot directly into an installed state with weak-password enforcement disabled.
- **Enforce Installed Application Readiness:** Retain `scripts/verify-orangehrm-readiness.ts` to confirm HTTP login and authenticated PIM API access before initiating test suites.
- **Provide One-Command Stack Recovery:** Preserve the verified recovery recipe (`docker compose down -v && docker compose up -d --wait`) for rapid volume resets.
- **Support Cross-Platform Execution:** Ensure Docker Compose paths, file mounts, and environment overrides function reliably on Windows, macOS, and Linux developer environments.
- **Plan Periodic Maintenance Audits:** Schedule periodic reviews of container image digests and MySQL patches per `docs/docker-image-decision.md`.

---

## Plan 3: GitHub Actions and Workflow

- **Maintain Strict Multi-Tiered CI Gating:** Preserve the exact sequence of early gates (`npm run typecheck`, `npm run test:unit`, `npm audit --audit-level=high`, `npm run test:target-contract`, `npm run test:project-contract`) before starting Docker.
- **Enforce Playwright-Serenity Single-Core Alignment:** Retain `scripts/playwright-compatibility.ts` within `test:project-contract` to prevent split-peer runtime failures.
- **Guard Living Documentation Generation:** Maintain the artifact check verifying that non-empty `docs/reports/scenario-*.json` files exist before invoking `serenity-bdd run`.
- **Publish HTML Living Reports to GitHub Pages:** Deploy Serenity HTML reports automatically to GitHub Pages from the `main` branch upon successful test completion.
- **Ensure Clean Container Teardown:** Execute `docker compose down -v` under `if: always()` in CI to release runner disk and container resources.
- **Track TypeScript 6 / NodeNext Toolchain Migration:** Design a future CI step to test TypeScript NodeNext compatibility on an experimental branch.

---

## Migration Risks and Rollback

- **TypeScript 6.x Module Resolution Breaking Changes:** Migrating from `"moduleResolution": "node"` to `"NodeNext"` may cause loader incompatibilities with `ts-node`. Rollback strategy: maintain the Dependabot hold on `typescript >= 6.0.0` until an aligned loader replacement (e.g. `tsx`) is thoroughly verified.
- **Browser Context Lifecycle Regression:** Switching from single-context reuse to per-scenario `BrowserContext` instantiation could introduce subtle timing differences in cold SPA renders. Rollback strategy: retain the proven cookie/storage clearing mechanism if context re-creation introduces performance degradation.
- **Docker Image Digest Deprecation:** If upstream image repositories prune older tags, digest pulling may fail. Rollback strategy: local seed dumps and configuration files can be re-targeted to newer evaluated patch digests per `docs/docker-image-decision.md`.
- **Serenity/JS Peer Dependency Shifts:** Future Serenity/JS releases may alter Playwright peer ranges. Rollback strategy: the compatibility script in `scripts/playwright-compatibility.ts` halts CI immediately upon peer mismatch.

---

## Completion Criteria

- [x] All 7 Cucumber scenarios pass deterministically (7/7) against the local containerised target.
- [x] 32 unit tests pass in under 20 seconds, validating target safety, cookie parsing, and compatibility.
- [x] `npm audit --audit-level=high` reports zero vulnerabilities.
- [x] `test:project-contract` passes with exact 7/1 scenario counts and valid documentation links.
- [x] Serenity HTML living documentation renders cleanly and publishes to GitHub Pages.
- [x] All 6 initial backlog items, 13 CODEX remediation items, and ORH-MAINT-01 are marked Closed in `docs/backlog.md`.

---

[<- Back to Index](00_CODE_REVIEW_Antigravity_v1_20261105T0856Z.md) | [Back to Index](00_CODE_REVIEW_Antigravity_v1_20261105T0856Z.md)
