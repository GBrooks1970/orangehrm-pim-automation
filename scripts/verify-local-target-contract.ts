import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
    assertLocalExecutionTarget,
    isLocalExecutionTarget,
} from '../src/config/target-safety';

type CucumberProfiles = Record<string, string>;

const profiles = require('../cucumber.js') as CucumberProfiles;
const hooksRequirement = '--require src/hooks/**/*.ts';

assert.deepEqual(
    Object.keys(profiles).sort(),
    [ 'default', 'smoke' ],
    'The target contract must be reviewed when an executable Cucumber profile is added or renamed',
);

for (const [ name, profile ] of Object.entries(profiles)) {
    assert.ok(
        profile.includes(hooksRequirement),
        `Cucumber profile "${name}" must load the hooks that enforce target safety`,
    );
}

const hooksSource = readFileSync(resolve('src/hooks/browser.hooks.ts'), 'utf8');
const guardCall = hooksSource.indexOf('assertLocalExecutionTarget(BASE_URL);');
const browserLaunch = hooksSource.indexOf('chromium.launch(');

assert.ok(guardCall >= 0, 'BeforeAll must call assertLocalExecutionTarget(BASE_URL)');
assert.ok(
    guardCall < browserLaunch,
    'Target safety must be checked before Chromium is launched or API authentication begins',
);

for (const target of [
    'http://localhost:8080',
    'http://127.0.0.1:8080',
    'http://[::1]:8080',
]) {
    assert.equal(isLocalExecutionTarget(target), true, `${target} should be accepted as loopback`);
    assert.doesNotThrow(() => assertLocalExecutionTarget(target));
}

for (const target of [
    'https://opensource-demo.orangehrmlive.com',
    'https://orangehrm.example.test',
    'not-a-url',
]) {
    assert.equal(isLocalExecutionTarget(target), false, `${target} should not be accepted as loopback`);
    assert.throws(
        () => assertLocalExecutionTarget(target),
        /All executable profiles, including smoke, are local-only/,
    );
}

console.log('Local-only target contract verified for every Cucumber profile.');
