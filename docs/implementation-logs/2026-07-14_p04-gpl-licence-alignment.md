# P-04 GPL licence alignment — 2026-07-14

## Session summary

Implemented portfolio backlog P-04 decision D-08 after explicit owner approval. The repository
now has the canonical GNU GPL version 3 terms, an explicit `GPL-3.0-or-later` election in its
machine-readable and public metadata, and a documented provenance boundary for its
OrangeHRM-derived provisioning artifacts. No application or test behaviour changed.

---

## Objectives

1. ✅ Apply the owner-approved GPL v3-or-later terms at repository level.
2. ✅ Replace the deprecated/ambiguous `GPL-3.0` package signal with `GPL-3.0-or-later`.
3. ✅ Preserve OrangeHRM attribution and record the provenance and modifications of derived files.
4. ✅ Verify legal-file consistency and the store-independent TypeScript/Cucumber wiring.
5. ⏸️ Let the normal pull-request workflow validate the Docker-restored database and full E2E suite.

---

## Test results

| Validation | Result | Status |
|---|---|---|
| Canonical GPL text comparison | `LICENSE` exactly matches GitHub's canonical GPL-3.0 template after newline normalisation | ✅ PASS |
| Package/lock root licence metadata | Both resolve to `GPL-3.0-or-later` | ✅ PASS |
| `npm run typecheck -- --pretty false` | No diagnostics | ✅ PASS |
| `npx cucumber-js --profile default --dry-run` | 7/7 scenarios discovered; execution intentionally skipped | ✅ PASS |
| `npm pack --dry-run --json` | `LICENSE`, README, and third-party notices are included | ✅ PASS |
| Docker-backed E2E | Deferred to the existing PR workflow because the SQL change is comments only and CI owns clean-stack validation | ⏸️ CI |

---

## Changes implemented

### Canonical terms and metadata

- `LICENSE` — canonical GNU General Public License version 3 text.
- `package.json` and `package-lock.json` — explicit `GPL-3.0-or-later` SPDX identifier.
- `README.md` — public licence statement, copyright, attribution link, and external-software boundary.

### Upstream provenance and modification notices

- `THIRD_PARTY_NOTICES.md` — records OrangeHRM 5.8.1 provenance, upstream licence/copyright,
  locally held artifacts, and the boundary around images and installed dependencies.
- `provisioning/Conf.php` — preserves the existing OrangeHRM notice and now records the date and
  purpose of the local Docker configuration change.
- `db/seed.sql` — records its OrangeHRM origin, generation/modification date, local demo-parity
  changes, and the detailed procedure in `db/README.md`.

---

## Technical decisions

| Decision | Rationale | Alternatives rejected |
|---|---|---|
| Licence the repository as `GPL-3.0-or-later` | Implements approved D-08 and matches the existing OrangeHRM header's “version 3 or later” grant | A permissive repository licence without a compatibility review; retaining ambiguous `GPL-3.0` metadata |
| Keep the unmodified GPLv3 legal text in `LICENSE` and state “or later” separately | GPL's canonical terms must not be edited; the package metadata, README, and upstream header make the version election explicit | Altering the licence text to insert repository-specific wording |
| Treat both captured provisioning artifacts conservatively as OrangeHRM-derived | `Conf.php` is installer-produced source and the SQL dump contains upstream schema/reference material | Describing the database snapshot as wholly original project data |
| Add dated notices without regenerating either artifact | Meets the modification-evidence need while leaving the proven deterministic target intact | Re-baking the environment for a legal-metadata-only change |

No ADR is required: this is an owner-approved legal/distribution decision recorded at portfolio
level, not a runtime architecture decision.

---

## Recommendations / next steps

- [ ] Merge the owning-repository PR after its Docker-backed E2E workflow is green. — HIGH
- [ ] After merge, verify GitHub detects the default-branch licence. — HIGH
- [ ] Update the portfolio P-04 matrix/backlog evidence when the cross-repository tranche closes. — MEDIUM

---

*Session logged: 2026-07-14. Author: Codex, directed by Gary Brooks.*
