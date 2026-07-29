import { OrangeHrm } from '../src/api/OrangeHrmApiClient';
import { assertLocalExecutionTarget } from '../src/config/target-safety';
import { waitForReadiness } from '../src/config/readiness';
import { BASE_URL } from '../src/serenity.config';

const positiveMilliseconds = (name: string, fallback: number): number => {
    const raw = process.env[name];
    if (raw === undefined) return fallback;

    const value = Number(raw);
    if (!Number.isFinite(value) || value <= 0) {
        throw new Error(`${name} must be a positive number of milliseconds; received "${raw}".`);
    }
    return value;
};

const main = async (): Promise<void> => {
    assertLocalExecutionTarget(BASE_URL);

    const result = await waitForReadiness(
        async remainingMs => {
            const signal = AbortSignal.timeout(Math.max(1, Math.floor(remainingMs)));
            await OrangeHrm.authenticate(signal);
            return OrangeHrm.verifyEmployeeApiReady(signal);
        },
        {
            timeoutMs: positiveMilliseconds('ORANGEHRM_READINESS_TIMEOUT_MS', 120_000),
            intervalMs: positiveMilliseconds('ORANGEHRM_READINESS_INTERVAL_MS', 2_000),
        },
    );

    console.log(
        `Installed OrangeHRM login and authenticated PIM API ready after ` +
        `${result.attempts} attempt(s) in ${result.elapsedMs} ms ` +
        `(probe returned ${result.value} employee record(s)).`,
    );
};

main().catch(error => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
});
