const loopbackHosts = new Set([
    'localhost',
    '127.0.0.1',
    '::1',
    '[::1]',
]);

/** Whether an OrangeHRM base URL resolves to this machine's loopback interface. */
export const isLocalExecutionTarget = (baseUrl: string): boolean => {
    try {
        return loopbackHosts.has(new URL(baseUrl).hostname.toLowerCase());
    } catch {
        return false;
    }
};

/**
 * Enforce ADR-0002 before a browser or authenticated API session is created.
 *
 * Every current scenario can authenticate as an administrator, and the local-smoke
 * selection includes a Background with a conditional employee create. Credentials
 * therefore never make a shared or remote target safe to execute against.
 */
export const assertLocalExecutionTarget = (baseUrl: string): void => {
    if (isLocalExecutionTarget(baseUrl)) return;

    throw new Error(
        `Refusing to run OrangeHRM automation against non-loopback BASE_URL "${baseUrl}". ` +
        `All executable profiles, including smoke, are local-only because selected setup ` +
        `can write. Start the Docker target and use http://localhost:8080 (ADR-0002).`,
    );
};
