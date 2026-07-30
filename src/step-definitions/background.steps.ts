import { Given } from '@cucumber/cucumber';
import { actorCalled } from '@serenity-js/core';
import { LogInAsAdmin } from '../tasks/LogInAsAdmin';
import { OrangeHrm } from '../api/OrangeHrmApiClient';
import { scenarioOwnership } from '../support/ScenarioOwnership';

// Login is arranged through the API ability (ADR-0003): the admin session resolved
// once in BeforeAll is injected into the browser, rather than re-driving the login
// form every scenario.
Given('I am logged in as an HR administrator', async () => {
    await actorCalled('User').attemptsTo(
        LogInAsAdmin.now(),
    );
});

// Prerequisite employees are seeded through REST API v2, not by clicking the form
// (ADR-0003). The name is the Gherkin's whole identity here; the API assigns the
// empNumber and (where unspecified) leaves the Employee Id unset.
Given('an employee {string} exists', async (fullName: string) => {
    const [firstName, ...rest] = fullName.trim().split(/\s+/);
    const ownership = scenarioOwnership();
    const physical = ownership.employeeName(firstName, rest.join(' ') || firstName);
    ownership.ownEmployee(await OrangeHrm.createEmployee({
        firstName: physical.firstName,
        lastName: physical.lastName,
    }));
});

// The duplicate-id scenario needs a known Employee Id to already be in use by
// this exact fixture; the API client verifies the persisted identity before return.
Given('an employee with employee id {string} exists', async (employeeId: string) => {
    const ownership = scenarioOwnership();
    const physicalName = ownership.employeeName('Existing', 'Employee');
    ownership.ownEmployee(await OrangeHrm.createEmployee({
        employeeId: ownership.employeeId(employeeId),
        firstName: physicalName.firstName,
        lastName: physicalName.lastName,
    }));
});
