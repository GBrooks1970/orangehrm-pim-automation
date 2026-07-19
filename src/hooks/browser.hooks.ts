import { BeforeAll, Before, AfterAll, setDefaultTimeout } from '@cucumber/cucumber';
import { Cast, engage } from '@serenity-js/core';
import { BrowseTheWebWithPlaywright } from '@serenity-js/playwright';
import { chromium } from 'playwright';
import type { Browser } from 'playwright';
import { OrangeHrm } from '../api/OrangeHrmApiClient';

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
        )
    ));
});

AfterAll(async () => {
    if (browser) {
        await browser.close();
    }
});
