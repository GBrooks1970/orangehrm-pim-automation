import assert from 'node:assert/strict';
import test from 'node:test';
import {
    classifyEmployeeIdCreateFailure,
    classifyEmployeeLookup,
    matchesRequestedEmployeeIdentity,
    parseSetCookies,
    type EmployeeRecordIdentity,
} from '../../src/api/OrangeHrmApiPolicy';
import { isLocalExecutionTarget } from '../../src/config/target-safety';

const employee: EmployeeRecordIdentity = {
    empNumber: 42,
    employeeId: '0042',
    firstName: 'Odis',
    lastName: 'Adalwin',
};

test('cookie parsing preserves Expires commas and multiple cookies', () => {
    const header =
        '_orangehrm=session-123; Path=/web; HttpOnly, ' +
        'theme=dark; Expires=Wed, 21 Oct 2026 07:28:00 GMT; Path=/';

    assert.deepEqual(parseSetCookies(header), [
        { name: '_orangehrm', value: 'session-123' },
        { name: 'theme', value: 'dark' },
    ]);
});

test('cookie parsing rejects missing and malformed cookie pairs', () => {
    assert.deepEqual(parseSetCookies(null), []);
    assert.deepEqual(parseSetCookies('Secure; HttpOnly'), []);
});

test('target safety accepts only loopback hosts', () => {
    for (const target of [
        'http://localhost:8080',
        'http://127.0.0.1:8080',
        'http://[::1]:8080',
    ]) {
        assert.equal(isLocalExecutionTarget(target), true, target);
    }

    for (const target of [
        'https://opensource-demo.orangehrmlive.com',
        'http://192.168.1.10:8080',
        'not a URL',
    ]) {
        assert.equal(isLocalExecutionTarget(target), false, target);
    }
});

test('lookup classification finds the requested fixture rather than the first row', () => {
    const other = { ...employee, empNumber: 41, employeeId: '0041', lastName: 'Other' };
    const result = classifyEmployeeLookup(200, [other, employee], {
        firstName: 'odis',
        lastName: 'ADALWIN',
        employeeId: '0042',
    });

    assert.deepEqual(result, { kind: 'found', employee });
});

test('lookup classification distinguishes absence from an API error', () => {
    assert.deepEqual(
        classifyEmployeeLookup(200, [], { firstName: 'Odis', lastName: 'Adalwin' }),
        { kind: 'absent' },
    );
    assert.deepEqual(
        classifyEmployeeLookup(401, [], { firstName: 'Odis', lastName: 'Adalwin' }),
        { kind: 'error', status: 401 },
    );
    assert.deepEqual(
        classifyEmployeeLookup(500, [employee], { firstName: 'Odis', lastName: 'Adalwin' }),
        { kind: 'error', status: 500 },
    );
});

test('duplicate classification captures status and message branches', () => {
    assert.equal(
        classifyEmployeeIdCreateFailure(422, '{"error":"Employee Id already exists"}'),
        'duplicate',
    );
    assert.equal(
        classifyEmployeeIdCreateFailure(409, 'unique constraint violation'),
        'duplicate',
    );
    assert.equal(classifyEmployeeIdCreateFailure(500, 'database unavailable'), 'error');
});

test('fixture identity requires every requested stable field to match', () => {
    assert.equal(matchesRequestedEmployeeIdentity(employee, employee), true);
    assert.equal(
        matchesRequestedEmployeeIdentity(employee, { ...employee, employeeId: '9999' }),
        false,
    );
    assert.equal(
        matchesRequestedEmployeeIdentity(employee, { ...employee, empNumber: 99 }),
        false,
    );
    assert.equal(
        matchesRequestedEmployeeIdentity(employee, { ...employee, lastName: 'Different' }),
        false,
    );
});
