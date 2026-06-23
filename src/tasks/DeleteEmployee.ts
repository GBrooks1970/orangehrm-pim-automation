import { Duration, Task, Wait } from '@serenity-js/core';
import { isPresent, not } from '@serenity-js/assertions';
import { Click, isVisible } from '@serenity-js/web';
import { SearchForEmployee } from './SearchForEmployee';
import { EmployeeListPage } from '../interactions/EmployeeListPage';

const RENDER = Duration.ofSeconds(15);

// Find an employee, delete them from the list, and confirm in the modal. The trash
// icon can render just below the fold, so we wait for it to be present and let
// Click scroll it into view. Then wait for the confirmation dialog to close so the
// caller's "should not appear" assertion reads the settled list.
export const DeleteEmployee = {
    named: (name: string) =>
        Task.where(`#actor deletes the employee "${name}"`,
            SearchForEmployee.selecting(name),
            Wait.upTo(RENDER).until(EmployeeListPage.firstRowDeleteButton, isPresent()),
            Click.on(EmployeeListPage.firstRowDeleteButton),
            Wait.upTo(RENDER).until(EmployeeListPage.confirmDeleteButton, isVisible()),
            Click.on(EmployeeListPage.confirmDeleteButton),
            Wait.upTo(RENDER).until(EmployeeListPage.confirmDeleteButton, not(isVisible())),
        ),
};
