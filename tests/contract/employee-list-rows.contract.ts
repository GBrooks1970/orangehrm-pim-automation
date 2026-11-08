import { after, before, test } from 'node:test';
import { Actor, actorCalled, configure, Duration, Wait } from '@serenity-js/core';
import { Ensure, isPresent, not } from '@serenity-js/assertions';
import { BrowseTheWebWithPlaywright } from '@serenity-js/playwright';
import { Browser, chromium, Page } from 'playwright';
import { EmployeeListRows } from '../../src/questions/EmployeeListRows';

let browser: Browser;
before(async () => {
    configure({ crew: [] });
    browser = await chromium.launch({ headless: true });
});
after(async () => { await browser?.close(); });

async function withPage(name: string, check: (page: Page, actor: Actor) => Promise<void>) {
    const context = await browser.newContext();
    try {
        const page = await context.newPage();
        page.setDefaultTimeout(3_000);
        const actor = actorCalled(name).whoCan(BrowseTheWebWithPlaywright.usingPage(page));
        await check(page, actor);
    } finally {
        await context.close();
    }
}

test('finds the employee when a populated table is replaced during the assertion', async () => {
    await withPage('Table refresh', async (page, actor) => {
        await page.setContent('<div class="oxd-table-body">' +
            Array.from({ length: 500 }, (_, i) => `<div class="oxd-table-row">Other ${i}</div>`).join('') + '</div>');
        await page.evaluate(() => {
            setTimeout(() => {
                document.querySelector('.oxd-table-body')!.innerHTML =
                    '<div class="oxd-table-row"><div>Aurora</div><div>VegaF911F7</div></div>';
            }, 100);
        });
        await actor.attemptsTo(Wait.upTo(Duration.ofSeconds(1)).until(
            EmployeeListRows.matching('Aurora VegaF911F7'), isPresent(),
        ));
    });
});

test('finds an employee inserted into an initially empty table', async () => {
    await withPage('Delayed employee', async (page, actor) => {
        await page.setContent('<div class="oxd-table-body"></div>');
        await page.evaluate(() => {
            setTimeout(() => {
                document.querySelector('.oxd-table-body')!.innerHTML =
                    '<div class="oxd-table-row">Odis Adalwin04689F</div>';
            }, 100);
        });
        await actor.attemptsTo(Wait.upTo(Duration.ofSeconds(1)).until(
            EmployeeListRows.matching('Odis Adalwin04689F'), isPresent(),
        ));
    });
});

test('requires both name components in the same row and ignores names outside the results', async () => {
    await withPage('Absent employee', async (page, actor) => {
        await page.setContent('<p>Aurora VegaF911F7</p><div class="oxd-table-body">' +
            '<div class="oxd-table-row">Aurora Other</div><div class="oxd-table-row">Other VegaF911F7</div></div>');
        await actor.attemptsTo(Ensure.that(EmployeeListRows.matching('Aurora VegaF911F7'), not(isPresent())));
    });
});

test('matches literal names containing apostrophes and double quotes', async () => {
    await withPage('Quoted employee', async (page, actor) => {
        await page.setContent('<div class="oxd-table-body"><div class="oxd-table-row"></div></div>');
        const name = `D'Arcy O'"Neil`;
        await page.locator('.oxd-table-row').evaluate((row, value) => { row.textContent = value; }, name);
        await actor.attemptsTo(Ensure.that(EmployeeListRows.matching(name), isPresent()));
    });
});
