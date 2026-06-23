// Serenity/JS configuration: the reporter crew only. No test logic lives here.
//
// Browser launch and per-scenario actor engagement live in src/hooks/browser.hooks.ts,
// because Cast.where is synchronous and Playwright's launch is async. See
// docs/screenplay-guide.md ("Actor lifecycle") for the reasoning.

import { configure } from '@serenity-js/core';

configure({
  crew: [
    // Writes Serenity JSON artifacts consumed by `npm run test:report`.
    '@serenity-js/core:ArtifactArchiver',
    // Emits structured BDD events for the living-documentation report.
    ['@serenity-js/serenity-bdd', { specDirectory: 'features' }],
    // Console output during the run.
    ['@serenity-js/console-reporter', { theme: 'auto' }],
    // Screenshots are configurable by environment (off | failures | all),
    // captured by the Photographer; they are artifacts, never assertions.
    // Wired in the implementation step alongside src/config/screenshots.ts.
  ],
});
