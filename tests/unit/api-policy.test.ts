import assert from 'node:assert/strict';
import test from 'node:test';
import {
    classifyEmployeeIdCreateFailure,
    classifyEmployeeLookup,
    isAuthenticationRejected,
    isInstallerRoute,
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

test('authentication rejection recognises only redirects back to login', () => {
    assert.equal(isAuthenticationRejected('/web/index.php/auth/login'), true);
    assert.equal(isAuthenticationRejected('/web/index.php/dashboard/index'), false);
});

test('installer detection recognises relative and absolute installer routes', () => {
    assert.equal(isInstallerRoute('/installer/index.php'), true);
    assert.equal(isInstallerRoute('http://localhost:8080/installer'), true);
    assert.equal(isInstallerRoute('/web/index.php/auth/login'), false);
});

test('duplicate classification requires the documented parsed 5.8.1 response', () => {
    const duplicateDetail = JSON.stringify({
        error: {
            status: '422',
            message: 'Invalid Parameter',
            data: { invalidParamKeys: ['employeeId'] },
        },
    });
    assert.equal(
        classifyEmployeeIdCreateFailure(422, duplicateDetail),
        'duplicate',
    );
    assert.equal(
        classifyEmployeeIdCreateFailure(422, JSON.stringify({
            error: {
                status: '422',
                message: 'Invalid Parameter',
                data: { invalidParamKeys: ['firstName'] },
            },
        })),
        'error',
    );
    assert.equal(classifyEmployeeIdCreateFailure(422, 'not json'), 'error');
    assert.equal(classifyEmployeeIdCreateFailure(409, duplicateDetail), 'error');
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
