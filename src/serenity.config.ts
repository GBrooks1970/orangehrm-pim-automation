// Serenity/JS configuration: the reporter crew only. No test logic lives here.
//
// Browser launch and per-scenario actor engagement live in src/hooks/browser.hooks.ts,
// because Cast.where is synchronous and Playwright's launch is async. See
// docs/screenplay-guide.md ("Actor lifecycle") for the reasoning.

import { ArtifactArchiver, configure } from '@serenity-js/core';
import createSerenityBDDReporter from '@serenity-js/serenity-bdd';
import { ConsoleReporter } from '@serenity-js/console-reporter';
import { photographer } from './config/screenshots';

// The test target. Defaults to the local Dockerised OrangeHRM (ADR-0002); the
// public demo at opensource-demo.orangehrmlive.com is a read-only smoke target
// only. OrangeHRM serves its app under /web/index.php — keep BASE_URL the bare
// origin and build routes with `webUrl()` so the prefix lives in one place.
export const BASE_URL = process.env.BASE_URL ?? 'http://localhost:8080';

/** Build a full OrangeHRM URL from an app-relative path (e.g. 'pim/addEmployee'). */
export const webUrl = (path: string): string =>
    `${BASE_URL}/web/index.php/${path.replace(/^\/+/, '')}`;

// Screenshots are added as an optional crew member: present when enabled
// (default ON locally, `failures` in CI), absent otherwise so the crew is
// byte-for-byte the no-screenshots baseline. The Photographer is a crew member,
// NOT a Cucumber formatter, so it cannot collide with the "@serenity-js/cucumber
// is the sole stdout formatter" rule.
const photo = photographer();

configure({
    crew: [
        ArtifactArchiver.storingArtifactsAt('./docs/reports'),
        createSerenityBDDReporter(),
        ConsoleReporter.withDefaultColourSupport(),
        ...(photo ? [photo] : []),
    ],
});
