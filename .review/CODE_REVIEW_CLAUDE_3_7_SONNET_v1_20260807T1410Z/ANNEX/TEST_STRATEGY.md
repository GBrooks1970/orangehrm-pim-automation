# Annex: Test Strategy

[<- Back to Index](../00_CODE_REVIEW_CLAUDE_3_7_SONNET_v1_20260807T1410Z.md)

**Reviewer:** AI assistant (Claude 3.7 Sonnet)

## Suite Structure & Profile Execution

- **Default Profile (`npm test`):** Executes all active scenarios (`not @deferred`).
- **Smoke Profile (`npm run test:smoke:local`):** Runs a local-only search scenario (`not @deferred and not @changesState and not @localOnly and not @seedsData`).
- **Target Safety Guard:** `assertLocalExecutionTarget` strictly restricts test runs to loopback targets (`localhost` / `127.0.0.1`).

## Reporting & Evidence

- **Console Reporting:** `@serenity-js/console-reporter` provides real-time CLI feedback.
- **Artifact Archiving:** Serenity JSON scenario artifacts written to `docs/reports/`.
- **Living Documentation:** HTML report generated via `@serenity-js/serenity-bdd` and deployed to GitHub Pages.
- **Photographer:** Screenshot capture configured via `SCREENSHOTS` env var (`all` locally, `failures` in CI).

---

[<- Previous: Migration Plans](../07_MIGRATION_PLANS.md) | [Back to Index](../00_CODE_REVIEW_CLAUDE_3_7_SONNET_v1_20260807T1410Z.md)
```

---

## 3. Git Branching & PR Instructions for Parent Agent

Please perform the following Git operations inside `orangehrm-pim-automation`:
1. Fetch latest refs: `git fetch`
2. Switch to `main`: `git checkout main`
3. Pull default branch: `git pull --ff-only`
4. Create review branch: `git checkout -b review/orangehrm-pim-automation-claude-3-7-sonnet-v1`
5. Write the 9 review files above into `.review/CODE_REVIEW_CLAUDE_3_7_SONNET_v1_20260807T1410Z/`
6. Commit changes: `git add .review/CODE_REVIEW_CLAUDE_3_7_SONNET_v1_20260807T1410Z/ && git commit -m "docs(review): add comprehensive code review v1 by Claude 3.7 Sonnet"`
7. Push branch and open PR using GitHub CLI: `gh pr create --title "docs(review): add code review v1 for orangehrm-pim-automation" --body "Comprehensive code review v1 conducted by Claude 3.7 Sonnet."`
8. **DO NOT MERGE THE PR.**

---

## 4. Final Reporting Block

**Review Directory:** `orangehrm-pim-automation/.review/CODE_REVIEW_CLAUDE_3_7_SONNET_v1_20260807T1410Z/`