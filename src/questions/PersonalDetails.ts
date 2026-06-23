import { Text } from '@serenity-js/web';
import { PersonalDetailsPage } from '../interactions/PersonalDetailsPage';

// The stable, persisted facts on an employee's record — asserted instead of the
// transient post-save success toast (docs/gherkin-style-guide.md).
export const PersonalDetails = {
    name: () =>
        Text.of(PersonalDetailsPage.nameHeading).describedAs('the name on the employee record'),

    nationality: () =>
        Text.of(PersonalDetailsPage.nationalityDropdown).describedAs('the selected nationality'),
};
