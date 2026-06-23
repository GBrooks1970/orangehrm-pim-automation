import { Text } from '@serenity-js/web';
import { AddEmployeePage } from '../interactions/AddEmployeePage';

// The add-employee form's field-level error messages, addressed by the field the
// scenario speaks about.
export const ValidationMessage = {
    forField: (field: string) => {
        switch (field) {
            case 'last name':
                return Text.of(AddEmployeePage.nameRequiredError)
                    .describedAs('the last name validation message');
            case 'employee id':
                return Text.of(AddEmployeePage.employeeIdError)
                    .describedAs('the Employee Id validation message');
            default:
                throw new Error(`No validation message is mapped for field "${field}".`);
        }
    },
};
