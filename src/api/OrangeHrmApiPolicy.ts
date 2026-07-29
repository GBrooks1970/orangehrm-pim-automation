/** A parsed HTTP cookie name/value pair. */
export interface Cookie {
    name: string;
    value: string;
}

/** Employee fields used to correlate API fixtures without relying on list order. */
export interface EmployeeRecordIdentity {
    empNumber: number;
    employeeId: string | null;
    firstName: string;
    lastName: string;
}

export interface RequestedEmployeeIdentity {
    firstName: string;
    lastName: string;
    empNumber?: number;
    employeeId?: string | null;
}

/** Reject wire-format drift before identity comparison obscures the API failure. */
export const isEmployeeRecordIdentity = (value: unknown): value is EmployeeRecordIdentity => {
    if (typeof value !== 'object' || value === null) return false;

    const candidate = value as Partial<EmployeeRecordIdentity>;
    return typeof candidate.empNumber === 'number' &&
        (typeof candidate.employeeId === 'string' || candidate.employeeId === null) &&
        typeof candidate.firstName === 'string' &&
        typeof candidate.lastName === 'string';
};

export type EmployeeLookupDecision =
    | { kind: 'found'; employee: EmployeeRecordIdentity }
    | { kind: 'absent' }
    | { kind: 'error'; status: number };

export type EmployeeIdCreateFailure = 'duplicate' | 'error';

interface OrangeHrmValidationError {
    error?: {
        status?: string;
        message?: string;
        data?: {
            invalidParamKeys?: unknown;
        };
    };
}

/**
 * Parse cookies from Node fetch's combined `set-cookie` header while preserving
 * commas inside Expires attributes and ignoring malformed fragments.
 */
export const parseSetCookies = (header: string | null): Cookie[] => {
    if (!header) return [];

    return header
        .split(/,(?=\s*[^=;,\s]+=)/)
        .flatMap(part => {
            const [pair] = part.trim().split(';');
            const separator = pair.indexOf('=');
            if (separator <= 0) return [];

            const name = pair.slice(0, separator).trim();
            if (!name) return [];

            return [{ name, value: pair.slice(separator + 1).trim() }];
        });
};

/** Match every identity field supplied by the caller, never a convenient first row. */
export const matchesRequestedEmployeeIdentity = (
    candidate: EmployeeRecordIdentity,
    requested: RequestedEmployeeIdentity,
): boolean =>
    candidate.firstName.toLowerCase() === requested.firstName.toLowerCase() &&
    candidate.lastName.toLowerCase() === requested.lastName.toLowerCase() &&
    (requested.empNumber === undefined || candidate.empNumber === requested.empNumber) &&
    (requested.employeeId === undefined || candidate.employeeId === requested.employeeId);

/** Distinguish an empty successful lookup from a transport/auth/API failure. */
export const classifyEmployeeLookup = (
    status: number,
    employees: EmployeeRecordIdentity[],
    requested: RequestedEmployeeIdentity,
): EmployeeLookupDecision => {
    if (status < 200 || status >= 300) return { kind: 'error', status };

    const employee = employees.find(candidate =>
        matchesRequestedEmployeeIdentity(candidate, requested));

    return employee
        ? { kind: 'found', employee }
        : { kind: 'absent' };
};

/** A rejected login redirects back to the login route rather than the dashboard. */
export const isAuthenticationRejected = (location: string): boolean =>
    /(?:^|\/)auth\/login(?:[/?#]|$)/i.test(location);

/**
 * OrangeHRM 5.8.1 reports a duplicate Employee Id as a 422 validation error
 * whose sole invalid parameter is `employeeId`. Status alone is insufficient:
 * missing names and other validation failures also use HTTP 422.
 */
export const classifyEmployeeIdCreateFailure = (
    status: number,
    detail: string,
): EmployeeIdCreateFailure => {
    if (status !== 422) return 'error';

    try {
        const payload = JSON.parse(detail) as OrangeHrmValidationError;
        const error = payload.error;
        const invalidParamKeys = error?.data?.invalidParamKeys;

        return error?.status === '422' &&
            error.message === 'Invalid Parameter' &&
            Array.isArray(invalidParamKeys) &&
            invalidParamKeys.length === 1 &&
            invalidParamKeys[0] === 'employeeId'
            ? 'duplicate'
            : 'error';
    } catch {
        return 'error';
    }
};
