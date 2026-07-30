import { BASE_URL, webUrl } from '../serenity.config';
import { isLocalExecutionTarget } from '../config/target-safety';
import {
    classifyEmployeeIdCreateFailure,
    classifyEmployeeLookup,
    isAuthenticationRejected,
    isEmployeeRecordIdentity,
    isInstallerRoute,
    matchesRequestedEmployeeIdentity,
    parseSetCookies,
    type Cookie,
    type EmployeeLookupDecision,
    type EmployeeRecordIdentity,
    type RequestedEmployeeIdentity,
} from './OrangeHrmApiPolicy';
import type { ScenarioUserIdentity } from '../support/ScenarioOwnership';

/**
 * Thin client over OrangeHRM's session-authenticated REST API v2, used to
 * establish test preconditions through the API rather than the UI ("API setup,
 * UI assertion" — ADR-0003).
 *
 * Auth: the Open Source edition has NO static bearer token. The REST API v2
 * authorises with the logged-in admin *session cookie*, so {@link authenticate}
 * performs the login exchange once per run (called from the BeforeAll hook):
 *
 *   1. GET the login page to obtain a session cookie and the CSRF `_token`.
 *   2. POST those plus the credentials to `auth/validate`, which establishes the
 *      authenticated session on that cookie.
 *
 * The resulting cookie is reused two ways: as the `Cookie` header on API seed
 * calls, and injected into the browser so scenarios start logged in without
 * re-driving the login form (see {@link sessionCookie} and LogInAsAdmin).
 *
 * Credentials default to the demo-parity `Admin` / `admin123` only against a
 * localhost target; any other host must supply ORANGEHRM_ADMIN_USERNAME /
 * ORANGEHRM_ADMIN_PASSWORD rather than probe a real instance with known defaults.
 */

export interface NewEmployee {
    firstName: string;
    lastName: string;
    middleName?: string;
    /** Optional explicit Employee Id; when omitted OrangeHRM auto-assigns one. */
    employeeId?: string;
}

export type SeededEmployee = EmployeeRecordIdentity;

interface SystemUser {
    id: number;
    userName: string;
    deleted: boolean;
    status: boolean;
    employee: {
        empNumber: number;
        firstName: string;
        lastName: string;
    };
}

let session: Cookie | undefined;

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;
type UrlBuilder = (path: string) => string;

const systemUsersFor = async (username: string, operation: string): Promise<SystemUser[]> => {
    if (!session) {
        throw new Error(`${operation} requires an authenticated OrangeHRM session.`);
    }
    const query = new URLSearchParams({ username, limit: '50' });
    const response = await fetch(webUrl(`api/v2/admin/users?${query.toString()}`), {
        headers: { Cookie: `${session.name}=${session.value}` },
    });
    const detail = await response.text();
    if (!response.ok) {
        throw new Error(`${operation} failed (HTTP ${response.status}): ${detail}`);
    }

    try {
        const payload = JSON.parse(detail) as { data?: unknown };
        if (!Array.isArray(payload.data)) {
            throw new Error('response data is not a system-user array');
        }
        return payload.data as SystemUser[];
    } catch (error) {
        throw new Error(
            `${operation} returned malformed system-user data: ` +
            `${error instanceof Error ? error.message : String(error)}`,
        );
    }
};

/**
 * Testable employee-fixture boundary. Transport and URL construction are
 * injected so response/error decisions can be exercised without a browser or
 * running SUT; production uses Node fetch and the configured OrangeHRM URL.
 */
export class EmployeeFixtureClient {
    constructor(
        private readonly cookie: Cookie,
        private readonly fetchImpl: FetchLike = fetch,
        private readonly urlFor: UrlBuilder = webUrl,
    ) {}

    private authHeaders(): Record<string, string> {
        return { Cookie: `${this.cookie.name}=${this.cookie.value}` };
    }

    private parseEmployees(detail: string, operation: string): SeededEmployee[] {
        try {
            const payload = JSON.parse(detail) as { data?: unknown };
            if (!Array.isArray(payload.data) || !payload.data.every(isEmployeeRecordIdentity)) {
                throw new Error('response data is not an employee array');
            }
            return payload.data;
        } catch (error) {
            throw new Error(
                `${operation} returned malformed employee data: ` +
                `${error instanceof Error ? error.message : String(error)}`,
            );
        }
    }

    private parseCreatedEmployee(detail: string, operation: string): SeededEmployee {
        try {
            const payload = JSON.parse(detail) as { data?: unknown };
            if (!isEmployeeRecordIdentity(payload.data)) {
                throw new Error('response data is not an employee record');
            }
            return payload.data;
        } catch (error) {
            throw new Error(
                `${operation} returned malformed employee data: ` +
                `${error instanceof Error ? error.message : String(error)}`,
            );
        }
    }

    private async getEmployees(
        parameters: Record<string, string>,
        operation: string,
    ): Promise<SeededEmployee[]> {
        const query = new URLSearchParams({ ...parameters, limit: '50' });
        const response = await this.fetchImpl(
            this.urlFor(`api/v2/pim/employees?${query.toString()}`),
            { headers: this.authHeaders() },
        );
        const detail = await response.text();

        if (!response.ok) {
            throw new Error(`${operation} failed (HTTP ${response.status}): ${detail}`);
        }

        return this.parseEmployees(detail, operation);
    }

    private async lookupEmployee(
        parameters: Record<string, string>,
        requested: RequestedEmployeeIdentity,
        operation: string,
    ): Promise<EmployeeLookupDecision> {
        return classifyEmployeeLookup(
            200,
            await this.getEmployees(parameters, operation),
            requested,
        );
    }

    private async postEmployee(employee: NewEmployee): Promise<{ response: Response; detail: string }> {
        const body: Record<string, unknown> = {
            firstName: employee.firstName,
            middleName: employee.middleName ?? '',
            lastName: employee.lastName,
            empPicture: null,
        };
        if (employee.employeeId !== undefined) body.employeeId = employee.employeeId;

        const response = await this.fetchImpl(this.urlFor('api/v2/pim/employees'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...this.authHeaders(),
            },
            body: JSON.stringify(body),
        });

        return { response, detail: await response.text() };
    }

    private async verifyPersistedEmployee(
        created: SeededEmployee,
        requested: RequestedEmployeeIdentity,
        operation: string,
    ): Promise<SeededEmployee> {
        const exactIdentity: RequestedEmployeeIdentity = {
            ...requested,
            empNumber: created.empNumber,
            employeeId: requested.employeeId ?? created.employeeId,
        };
        if (!matchesRequestedEmployeeIdentity(created, exactIdentity)) {
            throw new Error(`${operation} returned an employee that does not match the requested identity.`);
        }

        const readBack = await this.lookupEmployee(
            { empNumber: String(created.empNumber) },
            exactIdentity,
            `${operation} read-back`,
        );
        if (readBack.kind !== 'found') {
            throw new Error(`${operation} did not persist the exact requested employee identity.`);
        }
        return readBack.employee;
    }

    /** Create an employee and prove the exact returned identity persisted. */
    async createEmployee(employee: NewEmployee): Promise<SeededEmployee> {
        const { response, detail } = await this.postEmployee(employee);
        const operation = `Creating employee "${employee.firstName} ${employee.lastName}"`;
        if (!response.ok) {
            throw new Error(`${operation} failed (HTTP ${response.status}): ${detail}`);
        }

        return this.verifyPersistedEmployee(
            this.parseCreatedEmployee(detail, operation),
            employee,
            operation,
        );
    }

    /** Require an exact UI-created employee without creating a fallback record. */
    async requireEmployee(firstName: string, lastName: string): Promise<SeededEmployee> {
        const requested = { firstName, lastName };
        const operation = `Reading UI-created employee "${firstName} ${lastName}"`;
        const lookup = await this.lookupEmployee(
            { nameOrId: `${firstName} ${lastName}` },
            requested,
            operation,
        );
        if (lookup.kind !== 'found') {
            throw new Error(`${operation} did not find the exact persisted identity.`);
        }
        return lookup.employee;
    }

    /**
     * Delete only when empNumber and every captured identity field still match.
     * An employee already removed by the scenario is a verified no-op.
     */
    async deleteOwnedEmployee(employee: SeededEmployee): Promise<'deleted' | 'already-absent'> {
        const operation = `Cleaning scenario-owned employee ${employee.empNumber}`;
        const exactName = `${employee.firstName} ${employee.lastName}`;
        const before = await this.getEmployees(
            { nameOrId: exactName },
            `${operation} pre-delete read-back`,
        );
        const persisted = before.find(candidate => candidate.empNumber === employee.empNumber);
        if (!persisted) return 'already-absent';
        if (!matchesRequestedEmployeeIdentity(persisted, employee)) {
            throw new Error(
                `${operation} refused because the persisted identity no longer matches ` +
                `the scenario-owned record.`,
            );
        }

        const response = await this.fetchImpl(this.urlFor('api/v2/pim/employees'), {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                ...this.authHeaders(),
            },
            body: JSON.stringify({ ids: [employee.empNumber] }),
        });
        const detail = await response.text();
        if (!response.ok) {
            throw new Error(`${operation} failed (HTTP ${response.status}): ${detail}`);
        }

        const after = await this.getEmployees(
            { nameOrId: exactName },
            `${operation} post-delete read-back`,
        );
        if (after.some(candidate => candidate.empNumber === employee.empNumber)) {
            throw new Error(`${operation} returned success but the exact employee is still present.`);
        }
        return 'deleted';
    }

    /** Return the exact named employee, creating and verifying it only when absent. */
    async ensureEmployeeExists(firstName: string, lastName: string): Promise<SeededEmployee> {
        const requested = { firstName, lastName };
        const operation = `Looking up employee "${firstName} ${lastName}"`;
        const lookup = await this.lookupEmployee(
            { nameOrId: `${firstName} ${lastName}` },
            requested,
            operation,
        );
        if (lookup.kind === 'found') return lookup.employee;

        return this.createEmployee(requested);
    }

    /**
     * Return an exact Employee Id fixture. A documented duplicate validation is
     * accepted only when an immediate read-back proves the same requested record.
     */
    async ensureEmployeeWithId(
        employeeId: string,
        firstName: string,
        lastName: string,
    ): Promise<SeededEmployee> {
        const requested = { employeeId, firstName, lastName };
        const operation = `Looking up Employee Id "${employeeId}"`;
        const lookup = await this.lookupEmployee(
            { employeeId },
            requested,
            operation,
        );
        if (lookup.kind === 'found') return lookup.employee;

        const { response, detail } = await this.postEmployee(requested);
        const createOperation = `Creating Employee Id "${employeeId}"`;
        if (response.ok) {
            return this.verifyPersistedEmployee(
                this.parseCreatedEmployee(detail, createOperation),
                requested,
                createOperation,
            );
        }

        if (classifyEmployeeIdCreateFailure(response.status, detail) !== 'duplicate') {
            throw new Error(`${createOperation} failed (HTTP ${response.status}): ${detail}`);
        }

        const readBack = await this.lookupEmployee(
            { employeeId },
            requested,
            `Reading back duplicate Employee Id "${employeeId}"`,
        );
        if (readBack.kind !== 'found') {
            throw new Error(
                `${createOperation} received the documented duplicate response, but ` +
                `no existing employee matched the exact requested identity.`,
            );
        }
        return readBack.employee;
    }
}

export const OrangeHrm = {
    /**
     * Resolve and cache the admin session for the run. Call once in BeforeAll
     * before any API task executes or any scenario logs the browser in.
     */
    authenticate: async (signal?: AbortSignal): Promise<void> => {
        if (session) return;

        const username = process.env.ORANGEHRM_ADMIN_USERNAME
            ?? (isLocalExecutionTarget(BASE_URL) ? 'Admin' : undefined);
        const password = process.env.ORANGEHRM_ADMIN_PASSWORD
            ?? (isLocalExecutionTarget(BASE_URL) ? 'admin123' : undefined);
        if (!username || !password) {
            throw new Error(
                `Refusing to authenticate against a non-localhost target (${BASE_URL}) ` +
                `with default credentials. Set ORANGEHRM_ADMIN_USERNAME and ` +
                `ORANGEHRM_ADMIN_PASSWORD for this instance. The Admin/admin123 defaults ` +
                `apply only to the local Docker test target.`,
            );
        }

        // 1. GET the login page: capture the initial session cookie and the
        //    CSRF `_token` the validate endpoint requires.
        const loginPage = await fetch(webUrl('auth/login'), { redirect: 'manual', signal });
        const loginLocation = loginPage.headers.get('location') ?? '';
        if (isInstallerRoute(loginLocation)) {
            throw new Error(
                `OrangeHRM is serving its installer (${loginLocation}) instead of the installed login surface. ` +
                `Verify the mounted provisioning/Conf.php and seeded database.`,
            );
        }
        let cookie = parseSetCookies(loginPage.headers.get('set-cookie'))
            .find(c => /orangehrm/i.test(c.name));
        const html = await loginPage.text();
        if (!loginPage.ok) {
            throw new Error(
                `OrangeHRM login surface is not ready at ${BASE_URL} ` +
                `(HTTP ${loginPage.status}): ${html.slice(0, 300)}`,
            );
        }
        const token = /name="_token"\s+value="([^"]+)"/.exec(html)?.[1]
            ?? /:token="&quot;([^&]+)&quot;"/.exec(html)?.[1];
        if (!cookie || !token) {
            throw new Error(
                `Could not begin the OrangeHRM login exchange (cookie=${!!cookie}, ` +
                `token=${!!token}). Is the app installed and reachable at ${BASE_URL}?`,
            );
        }

        // 2. POST credentials + token on that cookie to establish the session.
        const form = new URLSearchParams({ _token: token, username, password });
        const validate = await fetch(webUrl('auth/validate'), {
            method: 'POST',
            redirect: 'manual',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Cookie: `${cookie.name}=${cookie.value}`,
            },
            body: form.toString(),
            signal,
        });
        // The validate response usually rotates the session cookie (session
        // fixation defence); adopt the new one when present.
        const rotated = parseSetCookies(validate.headers.get('set-cookie'))
            .find(c => /orangehrm/i.test(c.name));
        if (rotated) cookie = rotated;

        // A successful login redirects to the dashboard; a failure re-renders the
        // login page (still 302, but back to auth/login).
        const location = validate.headers.get('location') ?? '';
        if (isInstallerRoute(location)) {
            throw new Error(
                `OrangeHRM redirected authentication to its installer (${location}). ` +
                `Verify the mounted provisioning/Conf.php and seeded database.`,
            );
        }
        if (isAuthenticationRejected(location)) {
            throw new Error(`OrangeHRM login was rejected for user "${username}" (redirected back to the login page).`);
        }
        session = cookie;
    },

    /** The admin session cookie resolved by {@link authenticate}. */
    sessionCookie: (): Cookie => {
        if (!session) {
            throw new Error(
                'OrangeHrm.authenticate() must run before the session cookie is read ' +
                '(it is called in the BeforeAll hook in src/hooks/browser.hooks.ts).',
            );
        }
        return session;
    },

    /**
     * Prove the authenticated PIM API surface is available without changing data.
     * Used by the bounded readiness gate before warm-up or Cucumber begins.
     */
    verifyEmployeeApiReady: async (signal?: AbortSignal): Promise<number> => {
        const cookie = OrangeHrm.sessionCookie();
        const response = await fetch(webUrl('api/v2/pim/employees?limit=1'), {
            headers: { Cookie: `${cookie.name}=${cookie.value}` },
            signal,
        });
        const detail = await response.text();
        if (!response.ok) {
            throw new Error(
                `OrangeHRM authenticated employee API is not ready ` +
                `(HTTP ${response.status}): ${detail}`,
            );
        }

        try {
            const payload = JSON.parse(detail) as { data?: unknown };
            if (!Array.isArray(payload.data) || !payload.data.every(isEmployeeRecordIdentity)) {
                throw new Error('response data is not an employee array');
            }
            return payload.data.length;
        } catch (error) {
            throw new Error(
                `OrangeHRM authenticated employee API returned malformed data: ` +
                `${error instanceof Error ? error.message : String(error)}`,
            );
        }
    },

    /**
     * Seed an employee through REST API v2 and return the persisted identity.
     * Backs the `an employee exists` Background steps (ADR-0003).
     */
    createEmployee: async (employee: NewEmployee): Promise<SeededEmployee> => {
        return new EmployeeFixtureClient(OrangeHrm.sessionCookie()).createEmployee(employee);
    },

    /** Read back an exact UI-created employee; never creates a fallback. */
    requireEmployee: async (firstName: string, lastName: string): Promise<SeededEmployee> => {
        return new EmployeeFixtureClient(OrangeHrm.sessionCookie())
            .requireEmployee(firstName, lastName);
    },

    /** Delete an exact scenario-owned employee, or verify the UI already did so. */
    deleteOwnedEmployee: async (
        employee: SeededEmployee,
    ): Promise<'deleted' | 'already-absent'> => {
        return new EmployeeFixtureClient(OrangeHrm.sessionCookie())
            .deleteOwnedEmployee(employee);
    },

    /**
     * Verify that OrangeHRM persisted an enabled login account and associated it
     * with the employee created by the UI journey.
     */
    verifyEnabledUserForEmployee: async (
        username: string,
        firstName: string,
        lastName: string,
    ): Promise<ScenarioUserIdentity> => {
        const data = await systemUsersFor(
            username,
            `Verifying issued account "${username}" through the admin API`,
        );
        const user = data.find(candidate => candidate.userName.toLowerCase() === username.toLowerCase());
        if (!user) {
            throw new Error(`Issued account "${username}" was not created.`);
        }
        if (user.deleted || !user.status) {
            throw new Error(`Issued account "${username}" exists but is not enabled.`);
        }
        if (user.employee.firstName !== firstName || user.employee.lastName !== lastName) {
            throw new Error(
                `Issued account "${username}" is linked to ` +
                `"${user.employee.firstName} ${user.employee.lastName}", expected "${firstName} ${lastName}".`,
            );
        }
        return {
            id: user.id,
            userName: user.userName,
            employeeEmpNumber: user.employee.empNumber,
        };
    },

    /** Prove employee cleanup did not leave the exact issued account active. */
    verifyOwnedUserInactive: async (identity: ScenarioUserIdentity): Promise<void> => {
        const data = await systemUsersFor(
            identity.userName,
            `Verifying cleanup of scenario-owned user ${identity.id}`,
        );
        const exact = data.find(candidate =>
            candidate.id === identity.id &&
            candidate.userName.toLowerCase() === identity.userName.toLowerCase() &&
            candidate.employee.empNumber === identity.employeeEmpNumber,
        );
        if (exact && !exact.deleted && exact.status) {
            throw new Error(
                `Scenario-owned user ${identity.id} ("${identity.userName}") remains enabled ` +
                `after employee ${identity.employeeEmpNumber} cleanup.`,
            );
        }
    },

    /**
     * Retained idempotent lookup/create boundary for lower-level contract callers.
     * Cucumber scenarios allocate unique identities and use createEmployee so a
     * prior record can never satisfy setup accidentally.
     */
    ensureEmployeeExists: async (firstName: string, lastName: string): Promise<SeededEmployee> => {
        return new EmployeeFixtureClient(OrangeHrm.sessionCookie())
            .ensureEmployeeExists(firstName, lastName);
    },

    /**
     * Retained exact-id lookup/create boundary for lower-level contract callers.
     * A recognised uniqueness response must be followed by a matching Employee
     * Id/name read-back before setup succeeds.
     */
    ensureEmployeeWithId: async (
        employeeId: string,
        firstName: string,
        lastName: string,
    ): Promise<SeededEmployee> => {
        return new EmployeeFixtureClient(OrangeHrm.sessionCookie())
            .ensureEmployeeWithId(employeeId, firstName, lastName);
    },
};
