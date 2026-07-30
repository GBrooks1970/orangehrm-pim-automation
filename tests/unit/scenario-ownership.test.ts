import assert from 'node:assert/strict';
import test from 'node:test';
import { ScenarioOwnership } from '../../src/support/ScenarioOwnership';

test('scenario ownership maps readable names and ids to stable unique aliases', () => {
    const ownership = new ScenarioOwnership('ABC1234');

    assert.deepEqual(ownership.employeeName('Odis', 'Adalwin'), {
        firstName: 'Odis',
        lastName: 'AdalwinABC123',
        fullName: 'Odis AdalwinABC123',
    });
    assert.equal(ownership.resolveEmployeeName('Odis Adalwin'), 'Odis AdalwinABC123');
    assert.equal(ownership.resolveEmployeeName('Odis'), 'Odis');
    assert.equal(ownership.employeeId('C07DUP01'), 'C10ABC1234');
    assert.equal(ownership.resolveEmployeeId('C07DUP01'), 'C10ABC1234');
});

test('scenario ownership retains exact employee and user identities without duplicates', () => {
    const ownership = new ScenarioOwnership('ABC1234');
    const employee = {
        empNumber: 42,
        employeeId: '0042',
        firstName: 'Odis',
        lastName: 'AdalwinABC123',
    };
    const user = { id: 7, userName: 'odis.abc1234', employeeEmpNumber: 42 };

    ownership.ownEmployee(employee);
    ownership.ownEmployee(employee);
    ownership.ownUser(user);
    ownership.ownUser(user);

    assert.deepEqual(ownership.ownedEmployees(), [employee]);
    assert.deepEqual(ownership.ownedUsers(), [user]);
});

test('scenario ownership rejects conflicting identities for the same record', () => {
    const ownership = new ScenarioOwnership('ABC1234');
    ownership.ownEmployee({
        empNumber: 42,
        employeeId: '0042',
        firstName: 'Odis',
        lastName: 'AdalwinABC123',
    });

    assert.throws(
        () => ownership.ownEmployee({
            empNumber: 42,
            employeeId: '0042',
            firstName: 'Other',
            lastName: 'Employee',
        }),
        /ownership conflict for employee 42/,
    );
});
