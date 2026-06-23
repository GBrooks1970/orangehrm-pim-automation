import { Given } from '@cucumber/cucumber';
import { actorCalled } from '@serenity-js/core';
import { LogInAsAdmin } from '../tasks/LogInAsAdmin';
import { OrangeHrm } from '../api/OrangeHrmApiClient';

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
    await OrangeHrm.ensureEmployeeExists(firstName, rest.join(' ') || firstName);
});

// The duplicate-id scenario needs a known Employee Id to already be in use.
Given('an employee with employee id {string} exists', async (employeeId: string) => {
    await OrangeHrm.ensureEmployeeWithId(employeeId, 'Existing', 'Employee');
});
