# Dependency and audit policy

This repository contains test automation rather than production application code, but its
dependencies execute locally and in CI, authenticate to the test target, process network data,
and generate public reports. Test-tooling findings therefore require evidence-based handling;
they are not dismissed solely because the packages are development dependencies.

## Update policy

- Dependabot checks npm and GitHub Actions dependencies weekly. It groups Serenity/JS and
  Playwright proposals because their framework and peer versions must move together.
- Dependency PRs are never auto-merged. Review the changelog, engine and peer ranges, lockfile
  diff, licence implications, and advisory paths before accepting an update.
- Keep every direct `@serenity-js/*` package on one exact version. Pin Playwright to the version
  required by `@serenity-js/playwright` rather than updating the browser driver independently.
- Use the Node range declared by `package.json` and the tested patch declared by `.nvmrc` and CI.
  A framework engine-floor change must update all three in the same PR. Serenity/JS 3.44.3
  requires Node 24.15.0 or newer on the repository's Node 24 line; local and CI execution use
  Node 24.19.0.
- Dependabot holds TypeScript below 6 while `ts-node` 10.9.2 and the CommonJS configuration remain
  incompatible, `@types/node` on the Node 24 line, and Playwright on the 1.62 line required by
  Serenity/JS 3.44.3. Remove or advance a hold only in the aligned toolchain PR that proves the
  replacement runtime/compiler or Serenity peer range through the full verification below.

### TypeScript compatibility hold

Dependabot PR [#23](https://github.com/GBrooks1970/orangehrm-pim-automation/pull/23)
proposed TypeScript 6.0.3. Its CI run
[30411439521](https://github.com/GBrooks1970/orangehrm-pim-automation/actions/runs/30411439521)
failed in the early `npm run typecheck` gate with TS5107: this configuration's
`moduleResolution: "node"` resolves to deprecated `node10`, which TypeScript 6 requires callers
to migrate and TypeScript 7 will remove. The failure occurred before browser installation or
Docker, so it is a compiler/runtime compatibility result rather than an E2E failure.

Do not accept the suggested `ignoreDeprecations: "6.0"` as the fix: it would suppress the
migration signal while retaining a resolution mode scheduled to stop functioning. Release the
`>=6.0.0` Dependabot hold only in one aligned toolchain change that:

1. upgrades or replaces the `ts-node` 10/CommonJS execution path with a loader/runtime that
   explicitly supports the target TypeScript major;
2. migrates `module` and `moduleResolution` together to a supported pairing without a suppression;
3. keeps Cucumber step/hook discovery and Serenity reporting operational under Node 24; and
4. passes typecheck, unit/target/project contracts, exact 7/1 dry-run discovery, the clean Docker
   7/7 suite, non-empty Serenity report generation/upload, teardown, and live PR CI.

## Audit policy

Run `npm audit --audit-level=high` after every lockfile change and in CI. Critical and High
findings block a commit unless the repository records a temporary exception containing:

1. the advisory and complete dependency path;
2. why the affected code is or is not reachable in this test/report workflow;
3. compensating controls and an owner;
4. an expiry or next-review date; and
5. a backlog item for removal.

Moderate and Low findings are triaged rather than ignored. Fix them in the same change when a
compatible patch is available; otherwise record their dependency path and planned update in the
backlog. `npm audit --json` is the evidence source when an aggregate finding needs inspection.

## Verification for dependency changes

Before merge, run:

```bash
npm ci
npm run typecheck
npm run test:unit
npm audit --audit-level=high
npm run test:target-contract
npm run test:project-contract
```

`test:project-contract` executes both dry-run profiles and enforces the exact 7/1 scenario counts,
so the standalone dry-run commands need not be repeated in this recipe.

The pull-request workflow must then pass the clean Docker-backed 7/7 suite, verify non-empty
Serenity JSON, render the living documentation, upload the report artifact, and tear the stack
down successfully.
