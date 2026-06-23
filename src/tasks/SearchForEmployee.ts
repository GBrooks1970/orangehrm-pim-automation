import { Duration, Task, Wait } from '@serenity-js/core';
import { Click, Enter, Navigate, isVisible } from '@serenity-js/web';
import { EmployeeListPage } from '../interactions/EmployeeListPage';

const RENDER = Duration.ofSeconds(15);

// Filter the employee list by name. The Employee Name field is a debounced async
// autocomplete, so we wait on element state before searching rather than racing
// the debounce (docs/screenplay-guide.md) — never a hard wait.
export const SearchForEmployee = {
    // For an employee that exists: wait for the suggestion to render, select it
    // (which binds the filter to that exact employee), then search.
    selecting: (name: string) =>
        Task.where(`#actor searches the employee list for "${name}"`,
            Navigate.to(EmployeeListPage.url()),
            Wait.upTo(RENDER).until(EmployeeListPage.nameFilter, isVisible()),
            Enter.theValue(name).into(EmployeeListPage.nameFilter),
            Wait.upTo(RENDER).until(EmployeeListPage.firstAutocompleteOption, isVisible()),
            Click.on(EmployeeListPage.firstAutocompleteOption),
            Click.on(EmployeeListPage.searchButton),
        ),

    // For confirming an absence (e.g. after a delete): no suggestion will match, so
    // wait for the autocomplete to settle (it shows "No Records Found") and search
    // on the typed text. The caller asserts the row is gone.
    byNameText: (name: string) =>
        Task.where(`#actor searches the employee list for "${name}"`,
            Navigate.to(EmployeeListPage.url()),
            Wait.upTo(RENDER).until(EmployeeListPage.nameFilter, isVisible()),
            Enter.theValue(name).into(EmployeeListPage.nameFilter),
            Wait.upTo(RENDER).until(EmployeeListPage.autocompleteDropdown, isVisible()),
            Click.on(EmployeeListPage.searchButton),
        ),
};
