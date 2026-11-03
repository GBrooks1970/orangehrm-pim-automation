import assert from 'node:assert/strict';
import test from 'node:test';
import {
    satisfiesPeerRange,
    verifyPlaywrightSerenityCompatibility,
    type LockfileInput,
    type PackageManifestInput,
} from '../../scripts/playwright-compatibility';

const alignedManifest: PackageManifestInput = {
    devDependencies: {
        '@serenity-js/console-reporter': '3.47.2',
        '@serenity-js/core': '3.47.2',
        '@serenity-js/cucumber': '3.47.2',
        '@serenity-js/playwright': '3.47.2',
        '@serenity-js/serenity-bdd': '3.47.2',
        '@serenity-js/web': '3.47.2',
        playwright: '1.63.0',
    },
};

const alignedLockfile: LockfileInput = {
    packages: {
        '': {
            devDependencies: {
                '@serenity-js/console-reporter': '3.47.2',
                '@serenity-js/core': '3.47.2',
                '@serenity-js/cucumber': '3.47.2',
                '@serenity-js/playwright': '3.47.2',
                '@serenity-js/serenity-bdd': '3.47.2',
                '@serenity-js/web': '3.47.2',
                playwright: '1.63.0',
            },
        },
        'node_modules/@serenity-js/console-reporter': { version: '3.47.2' },
        'node_modules/@serenity-js/core': { version: '3.47.2' },
        'node_modules/@serenity-js/cucumber': { version: '3.47.2' },
        'node_modules/@serenity-js/playwright': {
            version: '3.47.2',
            peerDependencies: { 'playwright-core': '~1.63.0' },
        },
        'node_modules/@serenity-js/serenity-bdd': { version: '3.47.2' },
        'node_modules/@serenity-js/web': { version: '3.47.2' },
        'node_modules/playwright': {
            version: '1.63.0',
            dependencies: { 'playwright-core': '1.63.0' },
        },
        'node_modules/playwright-core': {
            version: '1.63.0',
        },
    },
};

const alignedDependabot = `
      - dependency-name: playwright
        versions:
          - ">=1.64.0"
`;

test('aligned Serenity 3.47.2 and Playwright 1.63.0 fixture passes', () => {
    const report = verifyPlaywrightSerenityCompatibility(
        alignedManifest,
        alignedLockfile,
        alignedDependabot,
    );
    assert.deepEqual(report, {
        serenityVersion: '3.47.2',
        playwrightVersion: '1.63.0',
        playwrightCorePeerRange: '~1.63.0',
        resolvedPlaywrightCoreVersions: [
            { path: 'node_modules/playwright-core', version: '1.63.0' },
        ],
    });
});

test('captured Playwright 1.62.1 / Serenity ~1.63.0 split-core fixture is rejected with incompatible paths', () => {
    const splitManifest: PackageManifestInput = {
        devDependencies: {
            ...alignedManifest.devDependencies,
            playwright: '1.62.1',
        },
    };
    const splitLockfile: LockfileInput = {
        packages: {
            ...alignedLockfile.packages,
            '': {
                devDependencies: {
                    ...alignedManifest.devDependencies,
                    playwright: '1.62.1',
                },
            },
            'node_modules/playwright': {
                version: '1.62.1',
                dependencies: { 'playwright-core': '1.62.1' },
            },
            'node_modules/playwright-core': {
                version: '1.63.0',
            },
            'node_modules/playwright/node_modules/playwright-core': {
                version: '1.62.1',
            },
        },
    };

    assert.throws(
        () => verifyPlaywrightSerenityCompatibility(splitManifest, splitLockfile),
        /Multiple or nested playwright-core versions resolved in package-lock\.json \(node_modules\/playwright-core@1\.63\.0, node_modules\/playwright\/node_modules\/playwright-core@1\.62\.1\)/,
    );
});

test('single resolved playwright-core outside Serenity peer range is rejected', () => {
    const outOfRangeManifest: PackageManifestInput = {
        devDependencies: {
            ...alignedManifest.devDependencies,
            playwright: '1.62.1',
        },
    };
    const outOfRangeLockfile: LockfileInput = {
        packages: {
            ...alignedLockfile.packages,
            '': {
                devDependencies: {
                    ...alignedManifest.devDependencies,
                    playwright: '1.62.1',
                },
            },
            'node_modules/playwright': {
                version: '1.62.1',
                dependencies: { 'playwright-core': '1.62.1' },
            },
            'node_modules/playwright-core': {
                version: '1.62.1',
            },
        },
    };

    assert.throws(
        () => verifyPlaywrightSerenityCompatibility(outOfRangeManifest, outOfRangeLockfile),
        /Resolved playwright-core@1\.62\.1 \(from playwright@1\.62\.1\) does not satisfy @serenity-js\/playwright@3\.47\.2 peer requirement "playwright-core: ~1\.63\.0"/,
    );
});

test('mismatched direct @serenity-js/* versions are rejected', () => {
    const mismatchedSerenityManifest: PackageManifestInput = {
        devDependencies: {
            ...alignedManifest.devDependencies,
            '@serenity-js/web': '3.48.0',
        },
    };

    assert.throws(
        () => verifyPlaywrightSerenityCompatibility(mismatchedSerenityManifest, alignedLockfile),
        /Direct @serenity-js\/\* versions in package\.json must all agree/,
    );
});

test('stale Dependabot Playwright hold floor is rejected', () => {
    const staleDependabot = `
      - dependency-name: playwright
        versions:
          - ">=1.63.0"
`;
    assert.throws(
        () => verifyPlaywrightSerenityCompatibility(alignedManifest, alignedLockfile, staleDependabot),
        /\.github\/dependabot\.yml must hold playwright at ">=1\.64\.0"/,
    );
});

test('satisfiesPeerRange handles tilde, caret, and exact ranges', () => {
    assert.equal(satisfiesPeerRange('1.63.0', '~1.63.0'), true);
    assert.equal(satisfiesPeerRange('1.63.4', '~1.63.0'), true);
    assert.equal(satisfiesPeerRange('1.62.1', '~1.63.0'), false);
    assert.equal(satisfiesPeerRange('1.64.0', '~1.63.0'), false);
    assert.equal(satisfiesPeerRange('1.63.0', '^1.63.0'), true);
    assert.equal(satisfiesPeerRange('1.64.0', '^1.63.0'), true);
    assert.equal(satisfiesPeerRange('2.0.0', '^1.63.0'), false);
    assert.equal(satisfiesPeerRange('1.63.0', '1.63.0'), true);
    assert.equal(satisfiesPeerRange('1.63.1', '1.63.0'), false);
});
