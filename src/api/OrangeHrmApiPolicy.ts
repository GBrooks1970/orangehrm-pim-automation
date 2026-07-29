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

export type EmployeeLookupDecision =
    | { kind: 'found'; employee: EmployeeRecordIdentity }
    | { kind: 'absent' }
    | { kind: 'error'; status: number };

export type EmployeeIdCreateFailure = 'duplicate' | 'error';

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

/** Capture the client's current duplicate-id decision as a testable policy seam. */
export const classifyEmployeeIdCreateFailure = (
    status: number,
    detail: string,
): EmployeeIdCreateFailure =>
    status === 422 || /unique|already|exist/i.test(detail)
        ? 'duplicate'
        : 'error';
