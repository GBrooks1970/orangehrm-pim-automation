import { setTimeout as pause } from 'node:timers/promises';

export interface ReadinessOptions {
    timeoutMs: number;
    intervalMs: number;
    now?: () => number;
    wait?: (milliseconds: number) => Promise<void>;
}

export interface ReadinessResult<T> {
    attempts: number;
    elapsedMs: number;
    value: T;
}

const errorMessage = (error: unknown): string =>
    error instanceof Error ? error.message : String(error);

/**
 * Poll a readiness signal only after failure and stop at a strict deadline.
 * Injected clock/wait functions keep retry and timeout behaviour deterministic
 * in the lower-level test lane.
 */
export const waitForReadiness = async <T>(
    probe: (remainingMs: number) => Promise<T>,
    options: ReadinessOptions,
): Promise<ReadinessResult<T>> => {
    if (!Number.isFinite(options.timeoutMs) || options.timeoutMs <= 0) {
        throw new Error('Readiness timeout must be a positive number of milliseconds.');
    }
    if (!Number.isFinite(options.intervalMs) || options.intervalMs <= 0) {
        throw new Error('Readiness interval must be a positive number of milliseconds.');
    }

    const now = options.now ?? Date.now;
    const wait = options.wait ?? (milliseconds => pause(milliseconds));
    const startedAt = now();
    const deadline = startedAt + options.timeoutMs;
    let attempts = 0;
    let lastError = 'no probe was attempted';

    while (true) {
        const probeBudgetMs = deadline - now();
        if (probeBudgetMs <= 0) break;

        attempts += 1;
        try {
            const value = await probe(probeBudgetMs);
            return {
                attempts,
                elapsedMs: now() - startedAt,
                value,
            };
        } catch (error) {
            lastError = errorMessage(error);
        }

        const remainingMs = deadline - now();
        if (remainingMs <= 0) {
            throw new Error(
                `OrangeHRM did not become ready within ${options.timeoutMs} ms after ` +
                `${attempts} attempt(s). Last probe: ${lastError}`,
            );
        }

        await wait(Math.min(options.intervalMs, remainingMs));
    }

    throw new Error(
        `OrangeHRM did not become ready within ${options.timeoutMs} ms after ` +
        `${attempts} attempt(s). Last probe: ${lastError}`,
    );
};
