import { By, PageElement } from '@serenity-js/web';

// The employee's "Personal Details" record — the page the form routes to after a
// save, and where nationality is edited. The persisted name heading and the saved
// field values are the stable facts the suite asserts on, never the success toast.
export const PersonalDetailsPage = {
    // The employee's full name, shown in the record header once it loads.
    nameHeading: PageElement.located(By.css('.orangehrm-edit-employee-name'))
        .describedAs('employee name heading'),

    // Nationality is an Oxd dropdown. The clickable control opens the option list;
    // its inner text also reports the currently selected value. Match the wrapper's
    // exact `oxd-select-text` class token, not the inner `oxd-select-text-input`
    // (a `contains` match would resolve to both).
    nationalityDropdown: PageElement.located(By.xpath(
        `//label[normalize-space(.)='Nationality']/ancestor::div[contains(@class,'oxd-input-group')]` +
        `//div[contains(concat(' ', normalize-space(@class), ' '), ' oxd-select-text ')]`))
        .describedAs('Nationality dropdown'),

    // A dropdown option by its visible text (options render in a detached list).
    optionNamed: (value: string) => PageElement.located(By.xpath(
        `//div[contains(@class,'oxd-select-option')][normalize-space(.)='${value}']`))
        .describedAs(`"${value}" option`),

    // The Save button of the personal-details form (the first Save on the page;
    // the custom-fields form below has its own).
    saveButton: PageElement.located(By.xpath(`(//button[normalize-space(.)='Save'])[1]`))
        .describedAs('Save button on the personal details form'),
};
