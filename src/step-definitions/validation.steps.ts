import { When, Then } from '@cucumber/cucumber';
import { actorCalled, Duration, Wait } from '@serenity-js/core';
import { Ensure, includes } from '@serenity-js/assertions';
import { isVisible } from '@serenity-js/web';
import { AddEmployee } from '../tasks/AddEmployee';
import { AddEmployeePage } from '../interactions/AddEmployeePage';
import { ValidationMessage } from '../questions/ValidationMessage';

const SETTLE = Duration.ofSeconds(15);

When('I try to add an employee with first name {string} and no last name', async (firstName: string) => {
    await actorCalled('User').attemptsTo(
        AddEmployee.withoutLastName(firstName),
    );
});

When('I try to add an employee named {string} {string} with employee id {string}',
    async (firstName: string, lastName: string, employeeId: string) => {
        await actorCalled('User').attemptsTo(
            AddEmployee.withDuplicateEmployeeId(firstName, lastName, employeeId),
        );
    });

// Rejection is shown by a field-level validation error appearing while the form
// stays put — the submission did not save.
Then('the add-employee form should reject the submission', async () => {
    await actorCalled('User').attemptsTo(
        Wait.upTo(SETTLE).until(AddEmployeePage.anyValidationError, isVisible()),
    );
});

Then('I should see a required-field message on the last name', async () => {
    await actorCalled('User').attemptsTo(
        Ensure.that(ValidationMessage.forField('last name'), includes('Required')),
    );
});

Then('I should see a message that the employee id is already in use', async () => {
    await actorCalled('User').attemptsTo(
        Ensure.that(ValidationMessage.forField('employee id'), includes('already exists')),
    );
});
