import assert from 'node:assert/strict';

export interface PackageManifestInput {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
}

export interface LockfilePackageEntry {
    version?: string;
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    peerDependencies?: Record<string, string>;
}

export interface LockfileInput {
    packages?: Record<string, LockfilePackageEntry>;
}

export interface PlaywrightCompatibilityReport {
    serenityVersion: string;
    playwrightVersion: string;
    playwrightCorePeerRange: string;
    resolvedPlaywrightCoreVersions: Array<{ path: string; version: string }>;
}

const EXACT_SEMVER = /^(\d+)\.(\d+)\.(\d+)$/;

const parseSemver = (version: string, label: string): [number, number, number] => {
    const match = version.trim().match(EXACT_SEMVER);
    assert.ok(match, `${label} must be an exact x.y.z version, got "${version}"`);
    return [ Number(match[1]), Number(match[2]), Number(match[3]) ];
};

export const satisfiesPeerRange = (version: string, range: string): boolean => {
    const [ major, minor, patch ] = parseSemver(version, 'Resolved version');
    const trimmed = range.trim();

    const exactMatch = trimmed.match(/^(\d+)\.(\d+)\.(\d+)$/);
    if (exactMatch) {
        return (
            major === Number(exactMatch[1]) &&
            minor === Number(exactMatch[2]) &&
            patch === Number(exactMatch[3])
        );
    }

    const tildeMatch = trimmed.match(/^~(\d+)\.(\d+)\.(\d+)$/);
    if (tildeMatch) {
        return (
            major === Number(tildeMatch[1]) &&
            minor === Number(tildeMatch[2]) &&
            patch >= Number(tildeMatch[3])
        );
    }

    const caretMatch = trimmed.match(/^\^(\d+)\.(\d+)\.(\d+)$/);
    if (caretMatch) {
        const reqMajor = Number(caretMatch[1]);
        const reqMinor = Number(caretMatch[2]);
        const reqPatch = Number(caretMatch[3]);
        if (reqMajor > 0) {
            return (
                major === reqMajor &&
                (minor > reqMinor || (minor === reqMinor && patch >= reqPatch))
            );
        }
        return major === 0 && minor === reqMinor && patch >= reqPatch;
    }

    throw new Error(`Unsupported playwright-core peer range syntax: "${range}"`);
};

export const verifyPlaywrightSerenityCompatibility = (
    manifest: PackageManifestInput,
    lockfile: LockfileInput,
    dependabotYaml?: string,
): PlaywrightCompatibilityReport => {
    const declaredDeps: Record<string, string> = {
        ...(manifest.dependencies ?? {}),
        ...(manifest.devDependencies ?? {}),
    };

    const directSerenityEntries = Object.entries(declaredDeps)
        .filter(([ name ]) => name.startsWith('@serenity-js/'))
        .sort(([ a ], [ b ]) => a.localeCompare(b));

    assert.ok(
        directSerenityEntries.length > 0,
        'package.json must declare direct @serenity-js/* dependencies',
    );

    for (const [ name, version ] of directSerenityEntries) {
        parseSemver(version, `package.json ${name}`);
    }

    const uniqueSerenityVersions = [ ...new Set(directSerenityEntries.map(([, version ]) => version)) ];
    assert.equal(
        uniqueSerenityVersions.length,
        1,
        `Direct @serenity-js/* versions in package.json must all agree, found: ${directSerenityEntries
            .map(([ name, version ]) => `${name}@${version}`)
            .join(', ')}`,
    );
    const serenityVersion = uniqueSerenityVersions[0];

    const declaredPlaywright = declaredDeps.playwright;
    assert.ok(declaredPlaywright, 'package.json must declare direct "playwright" dependency');
    const [ , pwMinor ] = parseSemver(declaredPlaywright, 'package.json playwright');

    const packages = lockfile.packages ?? {};
    const rootLock = packages[''];
    assert.ok(rootLock, 'package-lock.json is missing the root "" package entry');

    const rootLockDeps: Record<string, string> = {
        ...(rootLock.dependencies ?? {}),
        ...(rootLock.devDependencies ?? {}),
    } as Record<string, string>;

    for (const [ name, version ] of directSerenityEntries) {
        assert.equal(
            rootLockDeps[name],
            version,
            `package-lock.json root dependency ${name} (${rootLockDeps[name] ?? 'missing'}) does not match package.json (${version})`,
        );
        const lockedPkg = packages[`node_modules/${name}`];
        assert.ok(lockedPkg?.version, `package-lock.json is missing node_modules/${name}`);
        assert.equal(
            lockedPkg.version,
            version,
            `Locked node_modules/${name}@${lockedPkg.version} does not match declared ${name}@${version}`,
        );
    }

    assert.equal(
        rootLockDeps.playwright,
        declaredPlaywright,
        `package-lock.json root dependency playwright (${rootLockDeps.playwright ?? 'missing'}) does not match package.json (${declaredPlaywright})`,
    );

    const lockedPlaywright = packages['node_modules/playwright'];
    assert.ok(lockedPlaywright?.version, 'package-lock.json is missing node_modules/playwright');
    assert.equal(
        lockedPlaywright.version,
        declaredPlaywright,
        `Locked node_modules/playwright@${lockedPlaywright.version} does not match declared playwright@${declaredPlaywright}`,
    );

    const lockedSerenityPlaywright = packages['node_modules/@serenity-js/playwright'];
    assert.ok(
        lockedSerenityPlaywright,
        'package-lock.json is missing node_modules/@serenity-js/playwright',
    );
    const peerRange = lockedSerenityPlaywright.peerDependencies?.['playwright-core'];
    assert.ok(
        peerRange,
        'node_modules/@serenity-js/playwright is missing peerDependencies["playwright-core"]',
    );

    const resolvedCoreEntries = Object.entries(packages)
        .filter(([ pkgPath ]) => pkgPath === 'node_modules/playwright-core' || pkgPath.endsWith('/node_modules/playwright-core'))
        .map(([ pkgPath, entry ]) => {
            assert.ok(entry.version, `${pkgPath} in package-lock.json is missing a version`);
            return { path: pkgPath, version: entry.version };
        });

    assert.ok(
        resolvedCoreEntries.length > 0,
        'package-lock.json must resolve node_modules/playwright-core',
    );

    const uniqueCoreVersions = [ ...new Set(resolvedCoreEntries.map(entry => entry.version)) ];
    assert.equal(
        uniqueCoreVersions.length,
        1,
        `Multiple or nested playwright-core versions resolved in package-lock.json (${resolvedCoreEntries
            .map(entry => `${entry.path}@${entry.version}`)
            .join(', ')}) for @serenity-js/playwright peer "${peerRange}"`,
    );
    assert.equal(
        resolvedCoreEntries.length,
        1,
        `Expected a single root node_modules/playwright-core entry, found: ${resolvedCoreEntries
            .map(entry => `${entry.path}@${entry.version}`)
            .join(', ')}`,
    );
    assert.equal(
        resolvedCoreEntries[0].path,
        'node_modules/playwright-core',
        `playwright-core must resolve at root node_modules/playwright-core, found ${resolvedCoreEntries[0].path}`,
    );

    const resolvedCoreVersion = resolvedCoreEntries[0].version;
    const playwrightCoreDep = lockedPlaywright.dependencies?.['playwright-core'];
    assert.equal(
        playwrightCoreDep,
        resolvedCoreVersion,
        `node_modules/playwright dependencies["playwright-core"] (${playwrightCoreDep ?? 'missing'}) must match resolved playwright-core@${resolvedCoreVersion}`,
    );

    assert.ok(
        satisfiesPeerRange(resolvedCoreVersion, peerRange),
        `Resolved playwright-core@${resolvedCoreVersion} (from playwright@${declaredPlaywright}) does not satisfy @serenity-js/playwright@${serenityVersion} peer requirement "playwright-core: ${peerRange}"`,
    );

    if (dependabotYaml !== undefined) {
        const expectedHoldFloor = `>=1.${pwMinor + 1}.0`;
        const holdPattern = new RegExp(
            `dependency-name:\\s*playwright[\\s\\S]*?versions:\\s*\\n\\s*-\\s*"${expectedHoldFloor.replace(/\./g, '\\.')}"`,
        );
        assert.match(
            dependabotYaml,
            holdPattern,
            `.github/dependabot.yml must hold playwright at "${expectedHoldFloor}" to match the installed ~1.${pwMinor}.0 peer line`,
        );
    }

    return {
        serenityVersion,
        playwrightVersion: declaredPlaywright,
        playwrightCorePeerRange: peerRange,
        resolvedPlaywrightCoreVersions: resolvedCoreEntries,
    };
};
