# Recommendations

[<- Back to Index](00_CODE_REVIEW_Antigravity_v1_20261105T0856Z.md) | [Next: Architecture Assessment ->](06_ARCHITECTURE_ASSESSMENT.md)

**Reviewer:** AI assistant (Antigravity)

---

## Recommended Refactors

- **Migrate Module Resolution to NodeNext (Risk 1):** Plan an architectural refactor of [tsconfig.json](tsconfig.json) to transition from deprecated `"moduleResolution": "node"` to `"NodeNext"`, replacing legacy `ts-node/register` with modern Node 24 TypeScript loaders (e.g. `tsx` or native Node `--loader`/`--import`).
- **Implement Per-Scenario BrowserContext Isolation (Risk 2):** Upgrade [src/hooks/browser.hooks.ts](src/hooks/browser.hooks.ts) to create and destroy fresh Playwright `BrowserContext` instances per scenario rather than reusing a single browser context, eliminating residual HTTP cache, worker, or permission persistence across runs.
- **Align Page Element Folder Nomenclature with Screenplay Standards (Risk 3):** Rename [src/interactions/](src/interactions/) to `src/ui/` or `src/targets/` to clearly delineate static `PageElement` locator mappings from actionable Actor `Interaction` commands, preserving pedagogical precision.
- **Scope Table Action Buttons to Specific Employee Rows (Risk 5):** Refactor `firstRowEditButton` and `firstRowDeleteButton` in [src/interactions/EmployeeListPage.ts](src/interactions/EmployeeListPage.ts) from positional XPath indices `[1]` to element-scoped locators tethered directly to the targeted employee row (`EmployeeListRows.matching(name)`).
- **Encapsulate Session State for Parallel Readiness (Risk 4):** Refactor `session` in [src/api/OrangeHrmApiClient.ts](src/api/OrangeHrmApiClient.ts) from a module-level global variable into an instantiable session manager or Actor Ability, unblocking future Cucumber parallel worker execution.

---

## Next Steps

- **Add an `npm run verify` Convenience Script:** Define an `npm run verify` script in [package.json](package.json) that aggregates `typecheck`, `test:unit`, `test:target-contract`, and `test:project-contract`, standardising lightweight pre-commit verification per portfolio layout conventions.
- **Track TypeScript 6.x Upgrade Readiness:** Establish an advisory backlog item to monitor upstream `ts-node` and Serenity/JS ESM support, authoring a proof-of-concept branch to lift the Dependabot TypeScript hold.
- **Document Single Browser Context Trade-Off:** Add an explicit section to `docs/architecture.md` detailing the deliberate performance-versus-isolation trade-off of the shared browser context lifecycle.
- **Add Java Version Pre-Flight for Reports:** Introduce a lightweight check script in `npm run test:report` to confirm Java 11+ availability before invoking `@serenity-js/serenity-bdd`, providing clear remediation instructions for developers running locally without Java.

---

## Future Project Ideas

- **Cross-Browser Verification Lane:** Expand CI to run the smoke profile against Playwright WebKit and Firefox alongside Chromium, verifying OrangeHRM's Vue SPA responsive behaviour across rendering engines.
- **Accessibility (a11y) Audit Automation:** Integrate `@serenity-js/axe` or Playwright accessibility scans into the PIM Add Employee journey to validate WCAG 2.1 AA compliance across form controls and error states.
- **Visual Regression Testing:** Introduce Playwright screenshot snapshot comparisons for the complex PIM Employee List and Personal Details pages to detect unexpected CSS or layout regressions during OrangeHRM upgrades.
- **REST API Fuzzing & Boundary Testing:** Expand the lower-level API contract suite to include property-based or boundary-value tests (e.g. max name length, unicode names, special characters) against OrangeHRM REST API v2 endpoints.

---

[<- Back to Index](00_CODE_REVIEW_Antigravity_v1_20261105T0856Z.md) | [Next: Architecture Assessment ->](06_ARCHITECTURE_ASSESSMENT.md)
