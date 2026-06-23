import { Duration, Task, Wait } from '@serenity-js/core';
import { isPresent } from '@serenity-js/assertions';
import { Click, isVisible } from '@serenity-js/web';
import { SearchForEmployee } from './SearchForEmployee';
import { EmployeeListPage } from '../interactions/EmployeeListPage';
import { PersonalDetailsPage } from '../interactions/PersonalDetailsPage';

const RENDER = Duration.ofSeconds(15);

// Find an employee and open their Personal Details record via the list's edit
// action, waiting for the name heading that confirms the record has loaded. The
// edit icon can render just below the fold, so we wait for it to be present (in
// the DOM) and let Click scroll it into view, rather than wait for visibility.
export const OpenEmployeeRecord = {
    named: (name: string) =>
        Task.where(`#actor opens the record for "${name}"`,
            SearchForEmployee.selecting(name),
            Wait.upTo(RENDER).until(EmployeeListPage.firstRowEditButton, isPresent()),
            Click.on(EmployeeListPage.firstRowEditButton),
            Wait.upTo(RENDER).until(PersonalDetailsPage.nameHeading, isVisible()),
        ),
};
