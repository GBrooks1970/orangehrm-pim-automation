import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test from 'node:test';
import { OrangeHrm } from '../../src/api/OrangeHrmApiClient';
import { BASE_URL } from '../../src/serenity.config';
import { isLocalExecutionTarget } from '../../src/config/target-safety';

test('local API creates or reuses and reads back one exact Employee Id fixture', async () => {
    assert.equal(
        isLocalExecutionTarget(BASE_URL),
        true,
        `The API contract test is local-only; received ${BASE_URL}`,
    );

    await OrangeHrm.authenticate();

    const suffix = randomUUID().replace(/-/g, '').slice(0, 7).toUpperCase();
    const requested = {
        employeeId: `C10${suffix}`,
        firstName: 'Codex',
        lastName: `Contract${suffix.slice(0, 6)}`,
    };
    const first = await OrangeHrm.ensureEmployeeWithId(
        requested.employeeId,
        requested.firstName,
        requested.lastName,
    );

    try {
        const second = await OrangeHrm.ensureEmployeeWithId(
            requested.employeeId,
            requested.firstName,
            requested.lastName,
        );

        assert.deepEqual(second, first);
        assert.equal(first.employeeId, requested.employeeId);
        assert.equal(first.firstName, requested.firstName);
        assert.equal(first.lastName, requested.lastName);
        assert.equal(Number.isInteger(first.empNumber), true);
    } finally {
        assert.equal(await OrangeHrm.deleteOwnedEmployee(first), 'deleted');
    }
});
