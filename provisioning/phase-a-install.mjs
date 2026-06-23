// Phase A installer automation (one-off). Drives the OrangeHRM 5.8.1 web-installer
// Vue wizard end-to-end so the database can be snapshotted to db/seed.sql. This is
// NOT part of a test run — see db/README.md for the full Phase A procedure,
// including the post-install demo-parity steps (rewrite the admin hash to admin123
// and switch password-strength enforcement off).
//
// Usage (against an empty stack — comment out the seed.sql mount or `down -v` first):
//   docker compose up -d
//   node provisioning/phase-a-install.mjs
// then apply the demo-parity SQL and mysqldump as documented in db/README.md.
//
// The installation step replays every schema migration and takes several minutes;
// the wizard drives that sequence client-side, so the page is held open until the
// "Clean up Install" button appears.

import { chromium } from 'playwright';

const BASE = process.env.BASE_URL ?? 'http://localhost:8080';
const ADMIN_INSTALL_PASSWORD = 'Admin@123'; // installer rejects weak passwords; patched to admin123 afterwards

const browser = await chromium.launch();
const page = await browser.newPage();
const wait = (ms = 1800) => page.waitForTimeout(ms);
const clickButton = async (name) => {
    await page.getByRole('button', { name, exact: true }).first().click();
    await wait(2600);
};
const fillByLabel = async (label, value) => {
    const groups = page.locator('.oxd-input-group');
    for (let i = 0; i < await groups.count(); i++) {
        const group = groups.nth(i);
        const text = (await group.locator('label').first().innerText().catch(() => '')).replace(/[*\s]+/g, ' ').trim();
        if (text === label) { await group.locator('input').first().fill(value); return; }
    }
    throw new Error(`Installer field not found: "${label}"`);
};
const selectDropdown = async (label, option) => {
    const groups = page.locator('.oxd-input-group, .oxd-form-row');
    for (let i = 0; i < await groups.count(); i++) {
        const group = groups.nth(i);
        const text = (await group.locator('label').first().innerText().catch(() => '')).replace(/[*\s]+/g, ' ').trim();
        if (text === label) {
            await group.locator('.oxd-select-text').click(); await wait(700);
            await page.locator('.oxd-select-dropdown .oxd-select-option', { hasText: option }).first().click(); await wait(500);
            return;
        }
    }
    throw new Error(`Installer dropdown not found: "${label}"`);
};

await page.goto(`${BASE}/installer/index.php/welcome`, { waitUntil: 'networkidle' });
await clickButton('Next');                                   // Fresh Installation (default) -> Licence
await page.locator('input[type=checkbox]').first().click({ force: true }); await wait(500);
await clickButton('Next');                                   // -> Database Configuration
await page.getByText('Existing Empty Database').click(); await wait(700);
await fillByLabel('Database Host Name', 'db');
await fillByLabel('Database Host Port', '3306');
await fillByLabel('Database Name', 'orangehrm');
await fillByLabel('OrangeHRM Database Username', 'orangehrm');
await fillByLabel('OrangeHRM Database User Password', 'orangehrm');
await clickButton('Next');                                   // -> System Check
await clickButton('Next');                                   // -> Instance Creation
await fillByLabel('Organization Name', 'Portfolio QA Ltd');
await selectDropdown('Country', 'United States');
await clickButton('Next');                                   // -> Admin User Creation
await page.getByPlaceholder(/First Name/i).fill('HR');
await page.getByPlaceholder(/Last Name/i).fill('Admin');
await fillByLabel('Email', 'admin@portfolio.local');
await fillByLabel('Admin Username', 'Admin');
await fillByLabel('Password', ADMIN_INSTALL_PASSWORD);
await fillByLabel('Confirm Password', ADMIN_INSTALL_PASSWORD);
await clickButton('Next');                                   // -> Confirmation
await clickButton('Install');                               // run the installation

// Hold open until the migration sequence finishes and "Clean up Install" appears.
const cleanup = page.getByRole('button', { name: 'Clean up Install', exact: true });
await cleanup.waitFor({ state: 'visible', timeout: 15 * 60 * 1000 });
await cleanup.click();

// Confirm the app is now installed (login page serves 200 instead of redirecting to the installer).
for (let i = 0; i < 40; i++) {
    await wait(3000);
    const status = await page.evaluate(async () => {
        try { return (await fetch('/web/index.php/auth/login', { redirect: 'manual' })).status; } catch { return 0; }
    });
    if (status === 200) { console.log('OrangeHRM installed. Now apply the demo-parity SQL and snapshot (see db/README.md).'); break; }
}
await browser.close();
