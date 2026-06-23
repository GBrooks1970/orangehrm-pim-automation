import { By, PageElement } from '@serenity-js/web';
import { webUrl } from '../serenity.config';

// The OrangeHRM login screen. Used only by scenarios where logging in is itself
// the behaviour; most scenarios start authenticated by reusing the API session
// cookie (see LogInAsAdmin / docs/screenplay-guide.md).
export const LoginPage = {
    url: (): string => webUrl('auth/login'),

    usernameField: PageElement.located(By.css('input[name="username"]'))
        .describedAs('username field'),

    passwordField: PageElement.located(By.css('input[name="password"]'))
        .describedAs('password field'),

    loginButton: PageElement.located(By.css('button[type="submit"]'))
        .describedAs('Login button'),
};
