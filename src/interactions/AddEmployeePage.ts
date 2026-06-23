import { By, PageElement } from '@serenity-js/web';
import { webUrl } from '../serenity.config';

// The PIM "Add Employee" form. Selectors live here so an OrangeHRM restyle changes
// one Interaction, never a feature file or a Task. The name inputs carry stable
// `name` attributes; the rest of the Oxd form is addressed by its visible label,
// which is the durable contract for a component library that hashes its classes.
const inputByLabel = (label: string) =>
    By.xpath(`//label[normalize-space(.)='${label}']/ancestor::div[contains(@class,'oxd-input-group')]//input`);

const errorUnderLabel = (label: string) =>
    By.xpath(`//label[normalize-space(.)='${label}']/ancestor::div[contains(@class,'oxd-input-group')]` +
        `//span[contains(@class,'oxd-input-field-error-message')]`);

export const AddEmployeePage = {
    url: (): string => webUrl('pim/addEmployee'),

    firstNameField: PageElement.located(By.css('input[name="firstName"]'))
        .describedAs('first name field'),
    middleNameField: PageElement.located(By.css('input[name="middleName"]'))
        .describedAs('middle name field'),
    lastNameField: PageElement.located(By.css('input[name="lastName"]'))
        .describedAs('last name field'),

    // Auto-filled with the next sequential Employee Id; overwritten by the
    // duplicate-id scenario, which depends on a known value.
    employeeIdField: PageElement.located(inputByLabel('Employee Id'))
        .describedAs('Employee Id field'),

    // "Create Login Details" reveals the username / status / password fields.
    createLoginDetailsToggle: PageElement.located(By.css('.oxd-switch-input'))
        .describedAs('Create Login Details toggle'),
    loginUsernameField: PageElement.located(inputByLabel('Username'))
        .describedAs('login username field'),
    loginPasswordField: PageElement.located(inputByLabel('Password'))
        .describedAs('login password field'),
    loginConfirmPasswordField: PageElement.located(inputByLabel('Confirm Password'))
        .describedAs('login confirm-password field'),

    saveButton: PageElement.located(By.xpath(`//button[normalize-space(.)='Save']`))
        .describedAs('Save button'),

    // The "Required" message OrangeHRM renders under the name field when the last
    // name is missing (the first/middle/last inputs share one input group).
    nameRequiredError: PageElement.located(By.xpath(
        `//input[@name='lastName']/ancestor::div[contains(@class,'oxd-input-group')]` +
        `//span[contains(@class,'oxd-input-field-error-message')]`))
        .describedAs('name required-field message'),

    // "Employee Id already exists" under the Employee Id field on a duplicate.
    employeeIdError: PageElement.located(errorUnderLabel('Employee Id'))
        .describedAs('Employee Id error message'),

    // Any field-level validation message — a rejected submission surfaces at least
    // one, which is the behavioural signal that the form refused to save.
    anyValidationError: PageElement.located(By.css('.oxd-input-field-error-message'))
        .describedAs('a validation error message'),
};
