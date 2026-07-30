import { BeforeAll, Before, After, AfterAll, setDefaultTimeout } from '@cucumber/cucumber';
import { Cast, engage, TakeNotes } from '@serenity-js/core';
import { BrowseTheWebWithPlaywright } from '@serenity-js/playwright';
import { chromium } from 'playwright';
import type { Browser } from 'playwright';
import { OrangeHrm } from '../api/OrangeHrmApiClient';
import { assertLocalExecutionTarget } from '../config/target-safety';
import { BASE_URL } from '../serenity.config';
import { ScenarioNotes } from '../support/ScenarioNotes';
import {
    beginScenarioOwnership,
    endScenarioOwnership,
    scenarioOwnership,
} from '../support/ScenarioOwnership';

// Cucumber's default per-step timeout is 5 s. An OrangeHRM PIM step combines
// network latency with several Vue re-renders against a cold SPA, which can
// legitimately exceed that — and individual Serenity `Wait.upTo(...)` ceilings in
// the Tasks already run to 15 s. The step ceiling must sit comfortably above them.
setDefaultTimeout(60 * 1000);

// The browser is launched ONCE for the whole run and kept open; each scenario
// gets a freshly reset state (see Before). Do NOT move the launch into `Before`
// and close it in `After`: launching/closing per scenario leaves scenarios 2+
// bound to a closed browser, so only the first passes and the rest fail at first
// navigation with "Target page, context or browser has been closed". See
// docs/screenplay-guide.md ("Actor lifecycle"). Launch once, close once.
let browser: Browser;

BeforeAll(async () => {
    // Fail before starting Chromium or authenticating the API client. Every current
    // profile is local-only because selected setup can write (ADR-0002).
    assertLocalExecutionTarget(BASE_URL);

    browser = await chromium.launch({
        headless: (process.env.HEADLESS ?? 'true') === 'true',
    });

    // Resolve the admin session ONCE for the whole run (ADR-0003). OrangeHRM's
    // Open Source edition has no static bearer token: the REST API v2 authorises
    // with the logged-in session cookie. The same cookie is reused both to seed
    // employees via the API and to log the browser in without re-driving the
    // login form every scenario (see LogInAsAdmin).
    await OrangeHrm.authenticate();
});

// Per-scenario isolation. OrangeHRM keys the session on a cookie and the Vue app
// caches employee-list state, so state surviving into the next scenario can leak
// (a search filter or a just-deleted row). Serenity/JS reuses a SINGLE Playwright
// context for the run with this `using(browser)` wiring, so rather than recreate
// it we RESET it: clear web storage while still on the app origin, park on
// about:blank to abort in-flight requests, then clear cookies last.
//
// Cast.where is synchronous in Serenity/JS v3, so engagement stays in Before
// (per scenario) while the async launch lives in BeforeAll (once).
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

    // API seeding runs through OrangeHrmApiClient's own fetch-based client (see
    // src/api/OrangeHrmApiClient.ts), not through the Screenplay model — see
    // docs/adr/0003-api-driven-setup.md for the deliberate rationale. The actor
    // is only ever given the browsing ability.
    engage(Cast.where(actor =>
        actor.whoCan(
            BrowseTheWebWithPlaywright.using(browser),
            TakeNotes.usingAnEmptyNotepad<ScenarioNotes>(),
        )
    ));
});

// Delete only identities captured as created by this scenario. Exact pre-delete
// read-back prevents a stale/misbound empNumber from deleting someone else's
// record; a management scenario that already deleted its employee is verified as
// absent. Cleanup runs after failures too and reports every cleanup problem.
After(async () => {
    const ownership = scenarioOwnership();
    const failures: string[] = [];

    for (const employee of ownership.ownedEmployees().reverse()) {
        try {
            await OrangeHrm.deleteOwnedEmployee(employee);
        } catch (error) {
            failures.push(error instanceof Error ? error.message : String(error));
        }
    }

    for (const user of ownership.ownedUsers()) {
        try {
            await OrangeHrm.verifyOwnedUserInactive(user);
        } catch (error) {
            failures.push(error instanceof Error ? error.message : String(error));
        }
    }

    endScenarioOwnership();
    if (failures.length > 0) {
        throw new Error(`Scenario-owned cleanup failed:\n- ${failures.join('\n- ')}`);
    }
});

AfterAll(async () => {
    if (browser) {
        await browser.close();
    }
});
