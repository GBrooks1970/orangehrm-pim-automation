# Risks and Issues

[<- Back to Index](00_CODE_REVIEW_CLAUDE_3_7_SONNET_v1_20260807T1410Z.md) | [Next: Project Review ->](03_PROJECT_REVIEWS/PROJECT_001_ORANGEHRM_PIM_AUTOMATION.md)

**Reviewer:** AI assistant (Claude 3.7 Sonnet)

Prioritised list of remaining technical debt and maintenance risks in `orangehrm-pim-automation`:

### Risk 1 (Medium): Single Playwright Browser Context Reuse Across Scenarios

- **Description:** Scenarios reuse a single Playwright browser context initialized in `BeforeAll`. Per-scenario isolation in `Before` clears web storage (`localStorage`/`sessionStorage`) and browser cookies, but memory/HTTP cache and service worker state persist within the shared context.
- **Evidence:** [src/hooks/browser.hooks.ts](src/hooks/browser.hooks.ts) (lines 47-73)
- **Impact:** Potential subtle flakiness if future OrangeHRM features rely on HTTP aggressive caching or service worker state across scenario boundaries.
- **Refactor Recommendation:** Document this intentional performance-versus-isolation trade-off explicitly in `docs/screenplay-guide.md`, or transition to per-scenario context creation (`browser.newContext()`) if caching issues arise.

### Risk 2 (Low): Deprecated `moduleResolution: "node"` Pinned with TypeScript Hold

- **Description:** `tsconfig.json` uses `"moduleResolution": "node"`, which triggers TS5107 deprecation warnings under TypeScript 6.x. Item `CODEX-13` added a Dependabot hold ignoring `typescript >= 6.0.0`.
- **Evidence:** [tsconfig.json](tsconfig.json) (line 7), [docs/dependency-policy.md](docs/dependency-policy.md) (lines 45-60), [docs/backlog.md](docs/backlog.md) (lines 40-41)
- **Impact:** Project cannot upgrade to TypeScript 6.x until module resolution is migrated to `"Node16"` / `"NodeNext"`.
- **Refactor Recommendation:** Plan a dedicated refactoring task to update `tsconfig.json` module resolution and `ts-node` loader configuration to support NodeNext ESM/CJS resolution rules.

### Risk 3 (Low): Hardcoded Local Admin Credential Fallbacks in API Client

- **Description:** `OrangeHrm.authenticate` falls back to `Admin` / `admin123` credentials when environment variables are absent and `isLocalExecutionTarget(BASE_URL)` resolves to true.
- **Evidence:** [src/api/OrangeHrmApiClient.ts](src/api/OrangeHrmApiClient.ts) (lines 358-368)
- **Impact:** Low risk due to loopback enforcement, but default credential strings remain present in client source code.
- **Refactor Recommendation:** Encapsulate default credential logic into a centralized configuration module with explicit warning logs when fallback credentials are applied.

### Risk 4 (Low): Java 11 JRE/JDK Runtime Requirement for Living Report Generation

- **Description:** `npm run test:report` invokes `@serenity-js/serenity-bdd`, which requires a local Java 11+ runtime to compile HTML reports from JSON scenario output.
- **Evidence:** [package.json](package.json) (line 18), [.github/workflows/ci.yml](.github/workflows/ci.yml) (lines 97-101)
- **Impact:** Local developers without Java installed will experience CLI report generation failures despite passing npm test gates.
- **Refactor Recommendation:** Add a pre-check script to verify `java -version` availability before executing `serenity-bdd run`, providing clear diagnostic output if Java is missing.

### Risk 5 (Low): Elevated Cucumber Step Timeout Ceiling (60 Seconds)

- **Description:** `setDefaultTimeout(60 * 1000)` configures a 60-second step ceiling to account for cold SPA rendering and multi-step waits.
- **Evidence:** [src/hooks/browser.hooks.ts](src/hooks/browser.hooks.ts) (line 20)
- **Impact:** In the event of genuine UI failures, diagnostic feedback is delayed by up to 60 seconds per failing step.
- **Refactor Recommendation:** Optimize SPA warming in local test execution so the default step timeout can be safely reduced to 30 seconds.

---

[<- Previous: Executive Summary](01_EXECUTIVE_SUMMARY.md) | [Back to Index](00_CODE_REVIEW_CLAUDE_3_7_SONNET_v1_20260807T1410Z.md) | [Next: Project Review ->](03_PROJECT_REVIEWS/PROJECT_001_ORANGEHRM_PIM_AUTOMATION.md)
```

---