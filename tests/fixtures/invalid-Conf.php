<?php

// Test-only negative fixture for CODEX-08. Mounting this file in place of
// provisioning/Conf.php proves Apache reachability is not mistaken for an
// installed, API-ready OrangeHRM application.
throw new RuntimeException('Intentional invalid Conf.php readiness probe');
