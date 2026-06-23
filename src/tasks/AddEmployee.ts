import { Duration, Task, Wait } from '@serenity-js/core';
import { Clear, Click, Enter, Navigate, isVisible } from '@serenity-js/web';
import { AddEmployeePage } from '../interactions/AddEmployeePage';
import { PersonalDetailsPage } from '../interactions/PersonalDetailsPage';

// OrangeHRM's PIM is a Vue SPA: the form, the revealed login section and the
// post-save route to the personal-details record all re-render asynchronously, so
// every transition waits on element state with an explicit ceiling (never a timer
// or Serenity's short default). See docs/screenplay-guide.md.
const RENDER = Duration.ofSeconds(15);

const openForm = () =>
    Task.where('#actor opens the Add Employee form',
        Navigate.to(AddEmployeePage.url()),
        Wait.upTo(RENDER).until(AddEmployeePage.firstNameField, isVisible()),
    );

export const AddEmployee = {
    // Happy path: add the named employee and let the form route to their record.
    named: (firstName: string, lastName: string) =>
        Task.where(`#actor adds an employee named "${firstName} ${lastName}"`,
            openForm(),
            Enter.theValue(firstName).into(AddEmployeePage.firstNameField),
            Enter.theValue(lastName).into(AddEmployeePage.lastNameField),
            Click.on(AddEmployeePage.saveButton),
            Wait.upTo(RENDER).until(PersonalDetailsPage.nameHeading, isVisible()),
        ),

    // Add the employee and also create their login credentials. The username is
    // made unique so repeated runs against the same target do not collide on it;
    // the scenario asserts on the employee, not the username.
    withLoginDetails: (firstName: string, lastName: string) =>
        Task.where(`#actor adds an employee named "${firstName} ${lastName}" with login details`,
            openForm(),
            Enter.theValue(firstName).into(AddEmployeePage.firstNameField),
            Enter.theValue(lastName).into(AddEmployeePage.lastNameField),
            Click.on(AddEmployeePage.createLoginDetailsToggle),
            Wait.upTo(RENDER).until(AddEmployeePage.loginUsernameField, isVisible()),
            Enter.theValue(`${firstName}.${lastName}.${Date.now()}`.toLowerCase())
                .into(AddEmployeePage.loginUsernameField),
            Enter.theValue('Str0ng@Pass1').into(AddEmployeePage.loginPasswordField),
            Enter.theValue('Str0ng@Pass1').into(AddEmployeePage.loginConfirmPasswordField),
            Click.on(AddEmployeePage.saveButton),
            Wait.upTo(RENDER).until(PersonalDetailsPage.nameHeading, isVisible()),
        ),

    // Attempt to add an employee reusing an Employee Id that is already taken. The
    // form is expected to reject the submission and stay put; the validation steps
    // assert the error, so this task does not wait for a route change.
    withDuplicateEmployeeId: (firstName: string, lastName: string, employeeId: string) =>
        Task.where(`#actor tries to add "${firstName} ${lastName}" with Employee Id "${employeeId}"`,
            openForm(),
            Enter.theValue(firstName).into(AddEmployeePage.firstNameField),
            Enter.theValue(lastName).into(AddEmployeePage.lastNameField),
            Clear.theValueOf(AddEmployeePage.employeeIdField),
            Enter.theValue(employeeId).into(AddEmployeePage.employeeIdField),
            Click.on(AddEmployeePage.saveButton),
        ),

    // Attempt to add an employee with no last name — an invalid submission used by
    // the validation feature. The form stays on screen with a required-field error.
    withoutLastName: (firstName: string) =>
        Task.where(`#actor tries to add an employee with first name "${firstName}" and no last name`,
            openForm(),
            Enter.theValue(firstName).into(AddEmployeePage.firstNameField),
            Click.on(AddEmployeePage.saveButton),
        ),
};
