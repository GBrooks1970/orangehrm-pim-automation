import { randomUUID } from 'node:crypto';
import type { EmployeeRecordIdentity } from '../api/OrangeHrmApiPolicy';

export interface ScenarioEmployeeName {
    firstName: string;
    lastName: string;
    fullName: string;
}

export interface ScenarioUserIdentity {
    id: number;
    userName: string;
    employeeEmpNumber: number;
}

const logicalName = (firstName: string, lastName: string): string =>
    `${firstName.trim()} ${lastName.trim()}`;

/**
 * Scenario-local aliases and exact records owned by the current Cucumber case.
 *
 * Cucumber currently executes this project serially. Hooks begin and end one
 * instance per scenario, so readable Gherkin names can map to collision-resistant
 * SUT identities without leaking those generated values between scenarios.
 */
export class ScenarioOwnership {
    private readonly suffix: string;
    private readonly names = new Map<string, ScenarioEmployeeName>();
    private readonly employeeIds = new Map<string, string>();
    private readonly employeesByNumber = new Map<number, EmployeeRecordIdentity>();
    private readonly usersById = new Map<number, ScenarioUserIdentity>();

    constructor(token = randomUUID().replace(/-/g, '').toUpperCase()) {
        const normalised = token.replace(/[^A-Z0-9]/gi, '').toUpperCase();
        if (normalised.length < 7) {
            throw new Error('Scenario ownership token must contain at least seven letters or digits.');
        }
        this.suffix = normalised.slice(0, 7);
    }

    employeeName(firstName: string, lastName: string): ScenarioEmployeeName {
        const key = logicalName(firstName, lastName);
        const existing = this.names.get(key);
        if (existing) return existing;

        const suffix = this.suffix.slice(0, 6);
        const physicalLastName = `${lastName.trim().slice(0, 30 - suffix.length)}${suffix}`;
        const allocated = {
            firstName: firstName.trim(),
            lastName: physicalLastName,
            fullName: logicalName(firstName, physicalLastName),
        };
        this.names.set(key, allocated);
        return allocated;
    }

    resolveEmployeeName(name: string): string {
        const normalised = name.trim().replace(/\s+/g, ' ');
        return this.names.get(normalised)?.fullName ?? normalised;
    }

    employeeId(logicalId: string): string {
        const existing = this.employeeIds.get(logicalId);
        if (existing) return existing;

        // OrangeHRM's configured Employee Id ceiling is ten characters.
        const allocated = `C10${this.suffix}`;
        this.employeeIds.set(logicalId, allocated);
        return allocated;
    }

    resolveEmployeeId(logicalId: string): string {
        return this.employeeIds.get(logicalId) ?? logicalId;
    }

    ownEmployee(employee: EmployeeRecordIdentity): void {
        const existing = this.employeesByNumber.get(employee.empNumber);
        if (existing && (
            existing.employeeId !== employee.employeeId ||
            existing.firstName !== employee.firstName ||
            existing.lastName !== employee.lastName
        )) {
            throw new Error(`Scenario ownership conflict for employee ${employee.empNumber}.`);
        }
        this.employeesByNumber.set(employee.empNumber, employee);
    }

    ownUser(user: ScenarioUserIdentity): void {
        const existing = this.usersById.get(user.id);
        if (existing && (
            existing.userName !== user.userName ||
            existing.employeeEmpNumber !== user.employeeEmpNumber
        )) {
            throw new Error(`Scenario ownership conflict for system user ${user.id}.`);
        }
        this.usersById.set(user.id, user);
    }

    ownedEmployees(): EmployeeRecordIdentity[] {
        return [...this.employeesByNumber.values()];
    }

    ownedUsers(): ScenarioUserIdentity[] {
        return [...this.usersById.values()];
    }
}

let activeScenario: ScenarioOwnership | undefined;

export const beginScenarioOwnership = (token?: string): ScenarioOwnership => {
    if (activeScenario) {
        throw new Error('The previous scenario ownership registry was not closed.');
    }
    activeScenario = new ScenarioOwnership(token);
    return activeScenario;
};

export const scenarioOwnership = (): ScenarioOwnership => {
    if (!activeScenario) {
        throw new Error('Scenario ownership is unavailable outside an active Cucumber scenario.');
    }
    return activeScenario;
};

export const endScenarioOwnership = (): void => {
    activeScenario = undefined;
};
