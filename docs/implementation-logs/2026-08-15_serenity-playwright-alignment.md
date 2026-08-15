# Serenity and Playwright compatibility alignment — 2026-08-15

## Session Summary

The goal was to replace Dependabot PR #36, which upgraded Serenity/JS without its required
Playwright peer and consequently failed TypeScript compilation. The dependency set is now aligned
at Serenity/JS 3.44.3, Playwright and Playwright Core 1.62.1, with compatible Node declarations and
an advanced Dependabot hold. All repository-local dependency gates pass; the clean Docker-backed
suite remains the pull-request CI gate.

---

## Objectives

1. ✅ Replace the incompatible Serenity-only proposal with one peer-aligned dependency change.
2. ✅ Align the Node engine floor, local version declaration, CI runtime and executable contract.
3. ✅ Regenerate and verify a single Playwright Core dependency identity.
4. ✅ Pass every local dependency verification gate before publishing the replacement pull request.

---

## Test Results

| Stack | Suite | Before | After | Status |
|---|---|---|---|---|
| TypeScript | `npm run typecheck` | PR #36: 0/1, TS2345 | 1/1 command | ✅ PASS |
| Node | `npm run test:unit` | Not reached by PR #36 | 26/26 tests | ✅ PASS |
| npm | `npm audit --audit-level=high` | Not reached by PR #36 | 0 vulnerabilities | ✅ PASS |
| Contract | `npm run test:target-contract` | Not reached by PR #36 | 1/1 command | ✅ PASS |
| Contract | `npm run test:project-contract` | 0/1 initial run: legacy Node assertion | 1/1 command; default 7, smoke 1 | ✅ PASS |

`npm ci` installed 212 packages and audited 213 packages successfully on local Node 24.18.0.
`npm ls playwright playwright-core @serenity-js/playwright` confirmed that both direct consumers
deduplicate to the single root `playwright-core@1.62.1`. `git diff --check` also passed.

---

## Changes Implemented

### Align the Serenity/JS and Playwright dependency family

**Files changed:**

- `package.json` — upgraded all six direct Serenity/JS packages from 3.44.1 to 3.44.3 and direct
  Playwright from 1.61.1 to 1.62.1.
- `package-lock.json` — regenerated the resolved framework set so Serenity/JS and Playwright share
  one compatible Playwright Core 1.62.1 installation.

### Align the supported Node runtime declarations

**Files changed:**

- `package.json` — raised the Node 24 engine floor to 24.15.0, matching Serenity/JS 3.44.3.
- `.nvmrc` — pinned the tested CI patch to Node 24.19.0.
- `.github/workflows/ci.yml` — pinned the pull-request and main workflow to Node 24.19.0.
- `scripts/verify-project-contract.ts` — updated the executable assertions for the new engine floor
  and exact local/CI patch.

### Preserve grouped update compatibility

**Files changed:**

- `.github/dependabot.yml` — advanced the Playwright compatibility hold from 1.62 to 1.63 while
  retaining the existing Serenity/JS and Playwright update group.

---

## Technical Decisions

| Decision | Rationale | Alternatives rejected |
|---|---|---|
| Upgrade Serenity/JS and direct Playwright together | `@serenity-js/playwright@3.44.3` peers on `playwright-core~1.62.1`; direct Playwright 1.62.1 supplies the same exact core. | Merge PR #36 unchanged; add a cast; enable `skipLibCheck`; force an override. Each would retain or conceal incompatible browser type identities. |
| Pin local and CI Node to 24.19.0 while declaring `>=24.15.0 <25` | The range expresses the framework floor and supported major; the exact patch keeps developer and CI reproduction deterministic. | Retain broad `24` declarations, which do not prove or reproduce one tested patch. |
| Advance the Playwright hold to 1.63 | It permits the now-compatible 1.62 line while preventing an independent browser-driver move beyond Serenity/JS 3.44.3's peer range. | Remove the hold completely and allow another Serenity/Playwright split proposal. |

No new ADR was required because this applies the dependency-alignment policy already recorded for
CODEX-03 and CODEX-11 rather than changing the project's architecture.

---

## Documentation Updates

- `docs/dependency-policy.md` — recorded the Serenity/Playwright baseline, Node engine floor and
  exact tested patch, and clarified that compatibility holds advance only with aligned proof.
- `docs/implementation-logs/2026-08-15_serenity-playwright-alignment.md` — recorded this maintenance
  change, its failure evidence, decisions and validation results.

---

## Lessons Learned

- A grouped Dependabot proposal is not sufficient proof of peer compatibility when an ignore rule
  excludes one member of the group; inspect the resolved peer tree as well as the PR title.
- Playwright's exported browser types are sensitive to duplicate `playwright-core` identities, so
  `npm ls` is a useful pre-typecheck invariant for Serenity/JS upgrades.
- Runtime alignment is an executable contract: when `.nvmrc` becomes patch-specific, its contract
  assertion must change in the same commit.

---

## Recommendations / Next Steps

- [ ] Review the replacement pull request and require the full Docker 7/7, Serenity report and
  teardown CI evidence before merge — owner: repository maintainer; High; supports closed
  backlog items CODEX-03 and CODEX-11.
- [ ] Close superseded PR #36 with a link to the aligned replacement — owner: Codex; High; no new
  backlog item required because this is completion of the current maintenance change.
- [ ] Correct the portfolio registry's stale OrangeHRM "Node 20" note in a separate support-repo
  change — owner: portfolio maintainer; Low; project backlog remains unchanged.

---

*Session logged: 2026-08-15. Author: Codex.*
