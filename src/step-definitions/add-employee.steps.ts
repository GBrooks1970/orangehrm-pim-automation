import { When, Then } from '@cucumber/cucumber';
import { actorCalled, Duration, Wait } from '@serenity-js/core';
import { Ensure, equals, isPresent } from '@serenity-js/assertions';
import { AddEmployee } from '../tasks/AddEmployee';
import { SearchForEmployee } from '../tasks/SearchForEmployee';
import { OpenEmployeeRecord } from '../tasks/OpenEmployeeRecord';
import { EmployeeListRows } from '../questions/EmployeeListRows';
import { PersonalDetails } from '../questions/PersonalDetails';

const SETTLE = Duration.ofSeconds(15);

When('I add an employee named {string} {string}', async (firstName: string, lastName: string) => {
    await actorCalled('User').attemptsTo(
        AddEmployee.named(firstName, lastName),
    );
});

When('I add an employee named {string} {string} with login details', async (firstName: string, lastName: string) => {
    await actorCalled('User').attemptsTo(
        AddEmployee.withLoginDetails(firstName, lastName),
    );
});

// Shared across add, search and delete: search the list, then assert the row has
// settled into view (the list can briefly lag a create — docs/qa-strategy.md §5).
Then('the employee {string} should appear in the employee list', async (name: string) => {
    await actorCalled('User').attemptsTo(
        SearchForEmployee.selecting(name),
        Wait.upTo(SETTLE).until(EmployeeListRows.matching(name), isPresent()),
    );
});

// Assert the persisted name on the record itself, never the success toast: open
// the saved record and read its name heading.
Then('the employee record should show the name {string}', async (name: string) => {
    await actorCalled('User').attemptsTo(
        OpenEmployeeRecord.named(name),
        Ensure.that(PersonalDetails.name(), equals(name)),
    );
});
