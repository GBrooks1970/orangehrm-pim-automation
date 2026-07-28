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
- Use the Node major declared by `package.json`, `.nvmrc`, and CI. A framework engine-floor change
  must update all three in the same PR.

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
npm audit --audit-level=high
npm run test:target-contract
npm run typecheck
npx cucumber-js --profile default --dry-run
npx cucumber-js --profile smoke --dry-run
```

The pull-request workflow must then pass the clean Docker-backed 7/7 suite, verify non-empty
Serenity JSON, render the living documentation, upload the report artifact, and tear the stack
down successfully.
