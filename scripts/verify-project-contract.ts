import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, extname, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

interface PackageManifest {
    engines?: { node?: string };
    scripts?: Record<string, string>;
}

const read = (path: string): string => readFileSync(resolve(path), 'utf8');
const manifest = JSON.parse(read('package.json')) as PackageManifest;
const scripts = manifest.scripts ?? {};
const workflow = read('.github/workflows/ci.yml');

const scenarioCountFor = (profile: string): number => {
    const cucumber = resolve('node_modules/@cucumber/cucumber/bin/cucumber.js');
    const result = spawnSync(
        process.execPath,
        [ cucumber, '--profile', profile, '--dry-run', '--format', 'summary' ],
        { encoding: 'utf8' },
    );
    const output = `${result.stdout ?? ''}\n${result.stderr ?? ''}`;
    assert.equal(
        result.status,
        0,
        `Cucumber ${profile} dry-run failed:\n${output}`,
    );
    const match = output.match(/^(\d+) scenarios?\b/m);
    assert.ok(match, `Cucumber ${profile} dry-run did not report a scenario count:\n${output}`);
    return Number(match[1]);
};

assert.equal(scenarioCountFor('default'), 7, 'The active-suite contract is exactly seven scenarios');
assert.equal(scenarioCountFor('smoke'), 1, 'The local-smoke contract is exactly one scenario');

const declaredScriptCalls = [ ...workflow.matchAll(/\bnpm run ([\w:-]+)/g) ]
    .map(match => match[1]);
for (const script of declaredScriptCalls) {
    assert.ok(scripts[script], `CI calls undeclared package script "${script}"`);
}
assert.ok(scripts.test, 'CI calls npm test, so package.json must declare the test script');
assert.equal(
    scripts['test:report'],
    'serenity-bdd run --source ./docs/reports --features ./features',
    'The report command must read the committed report path and feature specifications',
);

const orderedCiCommands = [
    'npm ci',
    'npm run typecheck',
    'npm run test:unit',
    'npm audit --audit-level=high',
    'npm run test:target-contract',
    'npm run test:project-contract',
    'npx playwright install --with-deps chromium',
    'docker compose up -d --wait',
    'npm run test:readiness',
    'npm run test:api-contract',
    'npm test',
    'npm run test:report',
    'docker compose down -v',
];
let previousIndex = -1;
for (const command of orderedCiCommands) {
    const index = workflow.indexOf(command);
    assert.ok(index >= 0, `CI must declare "${command}"`);
    assert.ok(index > previousIndex, `CI command "${command}" is out of contract order`);
    previousIndex = index;
}

assert.match(workflow, /actions\/setup-node@v7[\s\S]*?node-version:\s*24/);
assert.equal(read('.nvmrc').trim(), '24');
assert.equal(manifest.engines?.node, '>=24 <25');
assert.match(workflow, /find docs\/reports -name 'scenario-\*\.json'/);
assert.match(workflow, /path:\s*target\/site\/serenity/);

const compose = read('docker-compose.yml');
const imageDecision = read('docs/docker-image-decision.md');
for (const pattern of [
    /mysql:8\.0\.46@(sha256:[a-f0-9]{64})/,
    /orangehrm\/orangehrm:5\.8\.1@(sha256:[a-f0-9]{64})/,
]) {
    const match = compose.match(pattern);
    assert.ok(match, `Compose is missing reviewed image pattern ${pattern}`);
    assert.ok(imageDecision.includes(match[1]), `Image decision is missing Compose digest ${match[1]}`);
}
assert.match(
    read('.github/dependabot.yml'),
    /dependency-name:\s*typescript[\s\S]*?versions:\s*\n\s*- ">=6\.0\.0"/,
    'Dependabot must hold unsupported TypeScript 6.x and newer releases',
);
assert.match(read('docs/dependency-policy.md'), /TS5107:[\s\S]*moduleResolution: "node"/);
assert.match(read('docs/dependency-policy.md'), /Release the\s+`>=6\.0\.0` Dependabot hold only/);
assert.match(
    read('docs/implementation-plan.md'),
    /Retained[\s\S]*as a historical record of the original plan, not a description of current state\./,
);

const markdownFiles = (directory: string): string[] => readdirSync(directory, { withFileTypes: true })
    .flatMap(entry => {
        const path = resolve(directory, entry.name);
        if (entry.isDirectory()) return markdownFiles(path);
        return extname(entry.name).toLowerCase() === '.md' ? [ path ] : [];
    });

const markdownFilesToCheck = readdirSync(resolve('.'), { withFileTypes: true }).flatMap(entry => {
    const path = resolve(entry.name);
    if (entry.isFile() && extname(entry.name).toLowerCase() === '.md') return [ path ];
    if (entry.isDirectory() && [ 'db', 'docs', 'features', 'provisioning', 'src' ].includes(entry.name)) {
        return markdownFiles(path);
    }
    return [];
});

for (const file of markdownFilesToCheck) {
    const markdown = readFileSync(file, 'utf8');
    for (const match of markdown.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
        const target = match[1].trim().replace(/^<|>$/g, '');
        if (/^(?:[a-z]+:|#)/i.test(target)) continue;
        const pathOnly = target.split('#', 1)[0];
        assert.ok(
            existsSync(resolve(dirname(file), decodeURIComponent(pathOnly))),
            `${file} contains a broken relative link: ${target}`,
        );
    }
}

console.log(
    `Project contract verified: default=7, smoke=1, ${declaredScriptCalls.length} CI script calls, ` +
    `ordered gates, Node/images/report paths, historical-plan marker, and ${markdownFilesToCheck.length} Markdown files.`,
);
