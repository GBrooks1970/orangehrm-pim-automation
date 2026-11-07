import { readFileSync } from 'node:fs';
import { verifyPlaywrightSerenityCompatibility } from './playwright-compatibility';

const report = verifyPlaywrightSerenityCompatibility(
    JSON.parse(readFileSync('package.json', 'utf8')),
    JSON.parse(readFileSync('package-lock.json', 'utf8')),
    readFileSync('.github/dependabot.yml', 'utf8'),
);
console.log(`Serenity/JS ${report.serenityVersion} and Playwright ${report.playwrightVersion} compatibility verified: single core satisfies ${report.playwrightCorePeerRange}.`);
