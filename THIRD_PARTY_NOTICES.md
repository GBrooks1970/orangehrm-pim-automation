# Third-party notices

This repository is distributed under the GNU General Public License v3.0 or later. It
contains the following OrangeHRM-derived provisioning artifacts; their existing rights and
attributions are preserved.

## OrangeHRM Open Source 5.8.1

- **Upstream project:** [OrangeHRM](https://github.com/orangehrm/orangehrm)
- **Upstream licence:** [GNU General Public License v3.0 or later](https://github.com/orangehrm/orangehrm/blob/5.8.1/LICENSE)
- **Copyright notice:** Copyright © 2006 OrangeHRM Inc.
- **Files in this repository:** `provisioning/Conf.php` and `db/seed.sql`

`provisioning/Conf.php` was produced by the OrangeHRM installer and retains the upstream
copyright and GPL notice in its file header. On 23 June 2026 its database connection values
were captured for this repository's local Docker Compose services.

`db/seed.sql` is a database dump from an installed OrangeHRM 5.8.1 instance. It includes
OrangeHRM schema and reference data. On 23 June 2026 the local administrator credential and
password-policy settings were changed to reproduce the public demo's documented test contract.
The generation and modification procedure is recorded in `db/README.md`.

The original test automation, provisioning scripts, and documentation added by this repository
are released under `GPL-3.0-or-later` at repository level. OrangeHRM names and marks remain the
property of their respective owners.

## Referenced external software

The Docker Compose configuration downloads OrangeHRM and MySQL container images at runtime;
the repository does not redistribute those images. Likewise, npm dependencies are installed
from their package sources and retain their own licence terms.
