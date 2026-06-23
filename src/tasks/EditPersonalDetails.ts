import { Duration, Task, Wait } from '@serenity-js/core';
import { isPresent } from '@serenity-js/assertions';
import { Click, isVisible } from '@serenity-js/web';
import { PersonalDetailsPage } from '../interactions/PersonalDetailsPage';

const RENDER = Duration.ofSeconds(15);

// Set the nationality on the open Personal Details record and save. Nationality is
// an Oxd dropdown of ~190 options; the chosen one usually renders far down the
// scrollable list, so we wait for it to be present and let Click scroll it into
// view (waiting for visibility would never settle). The save is asserted on the
// persisted value by the caller, never on the transient success toast.
export const EditPersonalDetails = {
    setNationality: (value: string) =>
        Task.where(`#actor sets the nationality to "${value}"`,
            Click.on(PersonalDetailsPage.nationalityDropdown),
            Wait.upTo(RENDER).until(PersonalDetailsPage.optionNamed(value), isPresent()),
            Click.on(PersonalDetailsPage.optionNamed(value)),
            Click.on(PersonalDetailsPage.saveButton),
            Wait.upTo(RENDER).until(PersonalDetailsPage.nationalityDropdown, isVisible()),
        ),
};
