import assert from 'node:assert/strict';
import test from 'node:test';
import { EmployeeFixtureClient } from '../../src/api/OrangeHrmApiClient';
import type { EmployeeRecordIdentity } from '../../src/api/OrangeHrmApiPolicy';

const employee: EmployeeRecordIdentity = {
    empNumber: 42,
    employeeId: '0042',
    firstName: 'Odis',
    lastName: 'Adalwin',
};

const duplicateDetail = {
    error: {
        status: '422',
        message: 'Invalid Parameter',
        data: { invalidParamKeys: ['employeeId'] },
    },
};

const response = (status: number, body: unknown): Response => new Response(
    typeof body === 'string' ? body : JSON.stringify(body),
    { status, headers: { 'Content-Type': 'application/json' } },
);

const queuedClient = (...responses: Response[]) => {
    const calls: Array<{ input: string; init?: RequestInit }> = [];
    const fetchImpl = async (input: string, init?: RequestInit): Promise<Response> => {
        calls.push({ input, init });
        const next = responses.shift();
        if (!next) throw new Error(`Unexpected fetch call to ${input}`);
        return next;
    };
    const client = new EmployeeFixtureClient(
        { name: '_orangehrm', value: 'session' },
        fetchImpl,
        path => `http://localhost:8080/web/index.php/${path}`,
    );
    return { client, calls };
};

test('lookup failure is reported precisely and never falls through to create', async () => {
    const { client, calls } = queuedClient(response(401, { error: 'session expired' }));

    await assert.rejects(
        client.ensureEmployeeExists('Odis', 'Adalwin'),
        /Looking up employee "Odis Adalwin" failed \(HTTP 401\).*session expired/,
    );
    assert.equal(calls.length, 1);
    assert.equal(calls[0].init?.method, undefined);
});

test('successful create is read back by empNumber and returns the exact identity', async () => {
    const { client, calls } = queuedClient(
        response(200, { data: [] }),
        response(200, { data: employee }),
        response(200, { data: [employee] }),
    );

    assert.deepEqual(await client.ensureEmployeeExists('Odis', 'Adalwin'), employee);
    assert.equal(calls.length, 3);
    assert.equal(calls[1].init?.method, 'POST');
    assert.match(calls[2].input, /empNumber=42/);
});

test('expected duplicate response succeeds only after exact-id read-back', async () => {
    const { client, calls } = queuedClient(
        response(200, { data: [] }),
        response(422, duplicateDetail),
        response(200, { data: [employee] }),
    );

    assert.deepEqual(await client.ensureEmployeeWithId('0042', 'Odis', 'Adalwin'), employee);
    assert.equal(calls.length, 3);
    assert.equal(calls[1].init?.method, 'POST');
    assert.match(calls[2].input, /employeeId=0042/);
});

test('unrelated HTTP 422 remains a fixture-creation failure', async () => {
    const { client, calls } = queuedClient(
        response(200, { data: [] }),
        response(422, {
            error: {
                status: '422',
                message: 'Invalid Parameter',
                data: { invalidParamKeys: ['firstName'] },
            },
        }),
    );

    await assert.rejects(
        client.ensureEmployeeWithId('0042', 'Odis', 'Adalwin'),
        /Creating Employee Id "0042" failed \(HTTP 422\)/,
    );
    assert.equal(calls.length, 2);
});

test('exact-id verification rejects a duplicate belonging to another record', async () => {
    const other = { ...employee, firstName: 'Different' };
    const { client } = queuedClient(
        response(200, { data: [] }),
        response(422, duplicateDetail),
        response(200, { data: [other] }),
    );

    await assert.rejects(
        client.ensureEmployeeWithId('0042', 'Odis', 'Adalwin'),
        /no existing employee matched the exact requested identity/,
    );
});

test('exact identity verification rejects a mismatched create read-back', async () => {
    const { client } = queuedClient(
        response(200, { data: employee }),
        response(200, { data: [{ ...employee, employeeId: '9999' }] }),
    );

    await assert.rejects(
        client.createEmployee({ firstName: 'Odis', lastName: 'Adalwin', employeeId: '0042' }),
        /did not persist the exact requested employee identity/,
    );
});
