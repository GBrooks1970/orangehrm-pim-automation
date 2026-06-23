import { When, Then } from '@cucumber/cucumber';
import { actorCalled, Duration, Wait } from '@serenity-js/core';
import { equals, isPresent, not } from '@serenity-js/assertions';
import { SearchForEmployee } from '../tasks/SearchForEmployee';
import { OpenEmployeeRecord } from '../tasks/OpenEmployeeRecord';
import { EditPersonalDetails } from '../tasks/EditPersonalDetails';
import { DeleteEmployee } from '../tasks/DeleteEmployee';
import { EmployeeListRows } from '../questions/EmployeeListRows';
import { PersonalDetails } from '../questions/PersonalDetails';

const SETTLE = Duration.ofSeconds(15);

When('I search the employee list for {string}', async (term: string) => {
    await actorCalled('User').attemptsTo(
        SearchForEmployee.selecting(term),
    );
});

When('I open the record for {string}', async (name: string) => {
    await actorCalled('User').attemptsTo(
        OpenEmployeeRecord.named(name),
    );
});

When('I set the nationality to {string}', async (value: string) => {
    await actorCalled('User').attemptsTo(
        EditPersonalDetails.setNationality(value),
    );
});

Then('the employee record should show the nationality {string}', async (value: string) => {
    await actorCalled('User').attemptsTo(
        // Poll the persisted value rather than read once: the form re-renders after
        // the save before the dropdown settles on the stored nationality.
        Wait.upTo(SETTLE).until(PersonalDetails.nationality(), equals(value)),
    );
});

When('I delete the employee {string}', async (name: string) => {
    await actorCalled('User').attemptsTo(
        DeleteEmployee.named(name),
    );
});

// Assert the settled, post-delete state: re-search and confirm the row is gone.
Then('the employee {string} should not appear in the employee list', async (name: string) => {
    await actorCalled('User').attemptsTo(
        SearchForEmployee.byNameText(name),
        Wait.upTo(SETTLE).until(EmployeeListRows.matching(name), not(isPresent())),
    );
});
