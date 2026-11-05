# Risks and Issues

[<- Back to Index](00_CODE_REVIEW_Antigravity_v1_20261105T0856Z.md) | [Next: Project Reviews ->](03_PROJECT_REVIEWS/PROJECT_001_ORANGEHRM_PIM.md)

**Reviewer:** AI assistant (Antigravity)

---

Prioritised list of remaining technical debt, architectural risks, and maintenance observations in `orangehrm-pim-automation`:

---

### Risk 1 (Medium): Deprecated `moduleResolution: "node"` Pinned with TypeScript Hold

- **Risk Description / Explanation:**  
  In [tsconfig.json](tsconfig.json) (line 5), `"moduleResolution": "node"` is configured alongside `"module": "CommonJS"` and `"target": "ES2020"`. The `node` resolution strategy (Node 10 style) is deprecated in modern TypeScript and generates deprecation warnings (`TS5107: 'moduleResolution: node' is deprecated...`) under TypeScript 6.x. As recorded in [docs/dependency-policy.md](docs/dependency-policy.md) (lines 29-49), PR #23 failed early type checking when Dependabot proposed TypeScript 6.0.3. Consequently, [.github/dependabot.yml](.github/dependabot.yml) (lines 14-18) enforces an active ignore hold on `typescript >= 6.0.0`. While this hold successfully protects CI stability today, it defers migration to modern module resolution (`Node16` or `NodeNext`).

- **Evidence Outline:**  
  - [tsconfig.json](tsconfig.json) (lines 4-6):
    ```json
    "module": "CommonJS",
    "moduleResolution": "node",
    "lib": ["ES2020", "DOM"],
    ```
  - [.github/dependabot.yml](.github/dependabot.yml) (lines 14-18):
    ```yaml
          - dependency-name: typescript
            versions:
              - ">=6.0.0"
    ```
  - [docs/dependency-policy.md](docs/dependency-policy.md) (lines 29-49)
  - [scripts/verify-project-contract.ts](scripts/verify-project-contract.ts) (lines 97-101)

- **Impact Analysis:**  
  The toolchain cannot adopt TypeScript 6.x or newer language features. Furthermore, when future versions of TypeScript remove the legacy `node10` module resolution mode entirely, the project will be blocked from upgrading until `ts-node`, Cucumber loaders, and module resolution rules are refactored together.

- **Refactor Recommendation and Strategy:**  
  1. Author a dedicated architectural spike to migrate `tsconfig.json` to `"module": "NodeNext"` and `"moduleResolution": "NodeNext"`.
  2. Transition from legacy `ts-node` invocation (`ts-node/register`) to a modern TypeScript loader compatible with Node 24 and NodeNext (such as `tsx`, `ts-node/esm`, or native Node `--import`).
  3. Validate that Cucumber step-definition discovery (`cucumber.js`), Serenity/JS reporting, and unit test runners (`test:unit`) execute cleanly without deprecation suppressions.

---

### Risk 2 (Medium): Single Playwright Browser Context Lifecycle Limits Cache and Worker Isolation

- **Risk Description / Explanation:**  
  In [src/hooks/browser.hooks.ts](src/hooks/browser.hooks.ts) (lines 28-84), a single Playwright `Browser` instance is launched in `BeforeAll` and shared across all scenarios. In `Before`, scenario isolation is performed by iterating existing browser contexts, clearing `localStorage` and `sessionStorage`, navigating to `about:blank`, and clearing cookies (`context.clearCookies()`). While this successfully resets session cookies and Web Storage, it does not destroy the underlying Playwright `BrowserContext`. As a result, HTTP network cache, service workers, memory caches, and permissions remain persistent across scenario runs.

- **Evidence Outline:**  
  - [src/hooks/browser.hooks.ts](src/hooks/browser.hooks.ts) (lines 47-73):
    ```typescript
    Before(async () => {
        beginScenarioOwnership();

        for (const context of browser.contexts()) {
            for (const page of context.pages()) {
                await page.evaluate(() => {
                    const w = globalThis as unknown as {
                        localStorage?: { clear(): void };
                        sessionStorage?: { clear(): void };
                    };
                    w.localStorage?.clear();
                    w.sessionStorage?.clear();
                }).catch(() => { /* no accessible storage on this page */ });
                await page.goto('about:blank').catch(() => { /* page already closing */ });
            }
            await context.clearCookies();
        }
    ```
  - [src/hooks/browser.hooks.ts](src/hooks/browser.hooks.ts) (lines 22-27) notes the historical rationale regarding browser closure, but does not differentiate browser lifecycle from browser context lifecycle.

- **Impact Analysis:**  
  If OrangeHRM introduces service-worker-based caching, aggressive Cache-Control headers, or IndexedDB storage, residual cache entries could leak across scenarios, causing intermittent non-deterministic assertions.

- **Refactor Recommendation and Strategy:**  
  1. Maintain the single `browser = await chromium.launch(...)` process in `BeforeAll` for execution speed.
  2. Refactor the `Before` hook to create a fresh, isolated `BrowserContext` per scenario (`await browser.newContext()`) and close the context in `After`.
  3. Update `BrowseTheWebWithPlaywright.using(page)` or bind Serenity/JS to the scenario-scoped page, ensuring 100% cryptographic separation of HTTP cache, cookies, workers, and storage without browser relaunch overhead.

---

### Risk 3 (Low): Page Target Locators Stored Under `src/interactions/` Misaligned with Screenplay Terminology

- **Risk Description / Explanation:**  
  In standard Serenity/JS Screenplay architecture, the directory `interactions/` is designated for classes implementing the `Interaction` interface (commands that an Actor performs on the UI, such as `Click`, `Enter`, `Scroll`). In `orangehrm-pim-automation`, the files in [src/interactions/](src/interactions/) ([AddEmployeePage.ts](src/interactions/AddEmployeePage.ts), [EmployeeListPage.ts](src/interactions/EmployeeListPage.ts), [PersonalDetailsPage.ts](src/interactions/PersonalDetailsPage.ts), [LoginPage.ts](src/interactions/LoginPage.ts), [TopBar.ts](src/interactions/TopBar.ts)) actually define `PageElement` locator mappings and static URL helpers rather than actionable Interactions. Conversely, domain interactions such as `rememberIssuedAccount` are defined inline inside [src/tasks/AddEmployee.ts](src/tasks/AddEmployee.ts) (lines 14-22).

- **Evidence Outline:**  
  - [src/interactions/AddEmployeePage.ts](src/interactions/AddEmployeePage.ts) (lines 15-58): contains `PageElement.located(...)` exports.
  - [src/interactions/TopBar.ts](src/interactions/TopBar.ts) (lines 3-6): contains `PageElement.located(...)` export.
  - [src/tasks/AddEmployee.ts](src/tasks/AddEmployee.ts) (lines 14-22): contains `Interaction.where(...)`.

- **Impact Analysis:**  
  Minor conceptual ambiguity for engineers learning the Screenplay pattern from this reference codebase. Engineers may confuse static Page Element maps with dynamic Actor Interactions.

- **Refactor Recommendation and Strategy:**  
  1. Rename [src/interactions/](src/interactions/) to `src/ui/` or `src/targets/` (e.g. `src/ui/AddEmployeePage.ts`), matching established Serenity/JS portfolio conventions.
  2. Reserve `src/interactions/` for bespoke `Interaction` implementations, such as extracting `rememberIssuedAccount` from `AddEmployee.ts` into a reusable `RecordIssuedAccount` interaction.

---

### Risk 4 (Low): Global In-Memory Session State in `OrangeHrmApiClient` Precludes Concurrent Execution

- **Risk Description / Explanation:**  
  In [src/api/OrangeHrmApiClient.ts](src/api/OrangeHrmApiClient.ts) (line 62), the authenticated administrator session cookie is stored in a module-level variable:
  ```typescript
  let session: Cookie | undefined;
  ```
  All subsequent API helper functions (`systemUsersFor`, `createEmployee`, `deleteOwnedEmployee`, etc.) rely on this shared singleton session state.

- **Evidence Outline:**  
  - [src/api/OrangeHrmApiClient.ts](src/api/OrangeHrmApiClient.ts) (line 62)
  - [src/api/OrangeHrmApiClient.ts](src/api/OrangeHrmApiClient.ts) (lines 68-74, 355-357, 429)

- **Impact Analysis:**  
  While the test suite currently runs serially (`cucumber-js` default concurrency), this shared module-level state prevents parallel execution. If Cucumber parallel workers (`--parallel 2`) or multi-actor authentication flows (e.g. testing concurrent Admin and Employee sessions) are introduced in the future, session tokens would race and overwrite one another.

- **Refactor Recommendation and Strategy:**  
  1. Refactor `OrangeHrmApiClient` to store session state within an instantiable client class or Actor Ability (`CallAnApi` / `ManageOrangeHrmSession`).
  2. Bind the authenticated session directly to the Actor's ability container or scenario context, enabling safe thread-level or worker-level concurrency.

---

### Risk 5 (Low): Fragile Positional Indexing on Result Table Action Buttons in `EmployeeListPage`

- **Risk Description / Explanation:**  
  In [src/interactions/EmployeeListPage.ts](src/interactions/EmployeeListPage.ts) (lines 38-43), the action buttons for editing and deleting employee records use positional XPath index predicates `[1]`:
  ```typescript
  firstRowEditButton: PageElement.located(By.xpath(
      `(//div[contains(@class,'oxd-table-body')]//button[.//i[contains(@class,'bi-pencil-fill')]])[1]`))
      .describedAs('edit (open record) button on the first row'),
  firstRowDeleteButton: PageElement.located(By.xpath(
      `(//div[contains(@class,'oxd-table-body')]//button[.//i[contains(@class,'bi-trash')]])[1]`))
      .describedAs('delete button on the first row'),
  ```
  These locators assume that the desired record is always the first row displayed in the table.

- **Evidence Outline:**  
  - [src/interactions/EmployeeListPage.ts](src/interactions/EmployeeListPage.ts) (lines 38-43)
  - [src/tasks/OpenEmployeeRecord.ts](src/tasks/OpenEmployeeRecord.ts) (line 17)
  - [src/tasks/DeleteEmployee.ts](src/tasks/DeleteEmployee.ts) (line 15)

- **Impact Analysis:**  
  If a search query yields multiple matches before autocomplete filtering completes, or if table re-rendering lags, clicking `[1]` might inadvertently open or delete an unintended employee record rather than the targeted entity.

- **Refactor Recommendation and Strategy:**  
  1. Scope row action buttons to the specific row that matches the employee's unique name, using Serenity's element chaining:
     ```typescript
     editButtonFor: (name: string) =>
         EmployeeListRows.matching(name)
             .find(PageElement.located(By.css('button i.bi-pencil-fill')))
     ```
  2. This guarantees that actions are performed strictly against the intended employee row, regardless of table row count or sorting order.

---

[<- Back to Index](00_CODE_REVIEW_Antigravity_v1_20261105T0856Z.md) | [Next: Project Reviews ->](03_PROJECT_REVIEWS/PROJECT_001_ORANGEHRM_PIM.md)
