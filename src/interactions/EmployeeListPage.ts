import { By, PageElement, PageElements } from '@serenity-js/web';
import { webUrl } from '../serenity.config';

// The PIM "Employee List" — the search filters and the results table. The
// Employee Name filter is a debounced autocomplete; SearchForEmployee waits for
// the option to render before selecting (docs/screenplay-guide.md).
export const EmployeeListPage = {
    url: (): string => webUrl('pim/viewEmployeeList'),

    nameFilter: PageElement.located(By.xpath(
        `//label[normalize-space(.)='Employee Name']/ancestor::div[contains(@class,'oxd-input-group')]//input`))
        .describedAs('Employee Name filter'),

    // The debounced autocomplete that drops under the name filter, and its first
    // selectable option. Waiting on these lets the debounce settle before acting,
    // rather than racing it (docs/screenplay-guide.md).
    autocompleteDropdown: PageElement.located(By.css('.oxd-autocomplete-dropdown'))
        .describedAs('employee-name autocomplete dropdown'),
    firstAutocompleteOption: PageElement.located(By.css('.oxd-autocomplete-dropdown .oxd-autocomplete-option'))
        .describedAs('first employee-name autocomplete option'),

    searchButton: PageElement.located(By.xpath(`//button[normalize-space(.)='Search']`))
        .describedAs('Search button'),

    // Rows of the results table.
    resultRows: PageElements.located(By.css('.oxd-table-body .oxd-table-row'))
        .describedAs('employee list rows'),

    // Shown when a filter matches nothing — the settled "absent" state asserted
    // after a delete.
    noRecordsBanner: PageElement.located(By.xpath(
        `//div[contains(@class,'oxd-table-body')]//*[normalize-space(.)='No Records Found']`))
        .describedAs('"No Records Found" banner'),

    // Per-row actions. After filtering to a single employee, the only row carries
    // an edit (pencil) and a delete (trash) icon button — addressed by the icon
    // class via an xpath predicate (Serenity's CSS engine does not match `:has`).
    firstRowEditButton: PageElement.located(By.xpath(
        `(//div[contains(@class,'oxd-table-body')]//button[.//i[contains(@class,'bi-pencil-fill')]])[1]`))
        .describedAs('edit (open record) button on the first row'),
    firstRowDeleteButton: PageElement.located(By.xpath(
        `(//div[contains(@class,'oxd-table-body')]//button[.//i[contains(@class,'bi-trash')]])[1]`))
        .describedAs('delete button on the first row'),

    // The deletion confirmation modal.
    confirmDeleteButton: PageElement.located(By.xpath(`//button[normalize-space(.)='Yes, Delete']`))
        .describedAs('"Yes, Delete" confirmation button'),
};
