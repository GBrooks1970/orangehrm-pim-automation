import { Duration, Interaction, Masked, notes, Task, Wait } from '@serenity-js/core';
import { Click, Cookie, Enter, Navigate, isVisible } from '@serenity-js/web';
import { OrangeHrm } from '../api/OrangeHrmApiClient';
import { LoginPage } from '../interactions/LoginPage';
import { TopBar } from '../interactions/TopBar';
import { ScenarioNotes } from '../support/ScenarioNotes';
import { scenarioOwnership } from '../support/ScenarioOwnership';

const RENDER = Duration.ofSeconds(15);

export const IssuedAccount = {
    isEnabledForItsEmployee: () =>
        Interaction.where('#actor verifies the issued account is enabled for its employee', async actor => {
            const username = await actor.answer(notes<ScenarioNotes>().get('issuedUsername'));
            const firstName = await actor.answer(notes<ScenarioNotes>().get('issuedEmployeeFirstName'));
            const lastName = await actor.answer(notes<ScenarioNotes>().get('issuedEmployeeLastName'));

            const identity = await OrangeHrm.verifyEnabledUserForEmployee(username, firstName, lastName);
            scenarioOwnership().ownUser(identity);
        }),

    signIn: () =>
        Task.where('#actor signs in with the issued employee account',
            Cookie.deleteAll(),
            Navigate.to(LoginPage.url()),
            Wait.upTo(RENDER).until(LoginPage.usernameField, isVisible()),
            Enter.theValue(notes<ScenarioNotes>().get('issuedUsername')).into(LoginPage.usernameField),
            Enter.theValue(Masked.valueOf(notes<ScenarioNotes>().get('issuedPassword')))
                .into(LoginPage.passwordField),
            Click.on(LoginPage.loginButton),
            Wait.upTo(RENDER).until(TopBar.userName, isVisible()),
        ),
};
