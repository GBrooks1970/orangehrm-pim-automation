import assert from 'node:assert/strict';
import test from 'node:test';
import { waitForReadiness } from '../../src/config/readiness';

const fakeTime = () => {
    let current = 0;
    const waits: number[] = [];
    return {
        now: () => current,
        wait: async (milliseconds: number) => {
            waits.push(milliseconds);
            current += milliseconds;
        },
        waits,
    };
};

test('readiness succeeds immediately without an unconditional wait', async () => {
    const clock = fakeTime();
    const result = await waitForReadiness(
        async remainingMs => {
            assert.equal(remainingMs, 100);
            return 1;
        },
        { timeoutMs: 100, intervalMs: 10, now: clock.now, wait: clock.wait },
    );

    assert.deepEqual(result, { attempts: 1, elapsedMs: 0, value: 1 });
    assert.deepEqual(clock.waits, []);
});

test('readiness retries failed probes and passes the shrinking deadline budget', async () => {
    const clock = fakeTime();
    const budgets: number[] = [];
    const result = await waitForReadiness(
        async remainingMs => {
            budgets.push(remainingMs);
            if (budgets.length < 3) throw new Error('still starting');
            return 1;
        },
        { timeoutMs: 100, intervalMs: 10, now: clock.now, wait: clock.wait },
    );

    assert.deepEqual(budgets, [100, 90, 80]);
    assert.deepEqual(clock.waits, [10, 10]);
    assert.deepEqual(result, { attempts: 3, elapsedMs: 20, value: 1 });
});

test('readiness stops at the deadline and reports the last observed state', async () => {
    const clock = fakeTime();

    await assert.rejects(
        waitForReadiness(
            async () => { throw new Error('installer route detected'); },
            { timeoutMs: 25, intervalMs: 10, now: clock.now, wait: clock.wait },
        ),
        /within 25 ms after 3 attempt\(s\).*installer route detected/,
    );
    assert.deepEqual(clock.waits, [10, 10, 5]);
});

test('readiness rejects invalid timeout configuration before probing', async () => {
    await assert.rejects(
        waitForReadiness(async () => 1, { timeoutMs: 0, intervalMs: 10 }),
        /timeout must be a positive number/,
    );
    await assert.rejects(
        waitForReadiness(async () => 1, { timeoutMs: 10, intervalMs: 0 }),
        /interval must be a positive number/,
    );
});
