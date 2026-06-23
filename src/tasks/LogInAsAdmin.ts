import { Duration, Task, Wait } from '@serenity-js/core';
import { By, Cookie, Navigate, PageElement, isVisible } from '@serenity-js/web';
import { LoginPage } from '../interactions/LoginPage';
import { BASE_URL, webUrl } from '../serenity.config';
import { OrangeHrm } from '../api/OrangeHrmApiClient';

// OrangeHRM scopes its session cookie to the /web path on the target host.
const APP_HOST = new URL(BASE_URL).hostname;

// The OrangeHRM top bar, present on every authenticated page — proof the session
// took without depending on any one module's content.
const topBar = PageElement.located(By.css('.oxd-topbar-header')).describedAs('OrangeHRM top bar');

// Establish an authenticated browser session WITHOUT re-driving the login form,
// by reusing the admin session cookie the API client resolved once per run
// (ADR-0003 — "login is arranged through the API ability"). A cookie's scope
// defaults to the current document, so we first navigate to the app origin, then
// overwrite the freshly-issued anonymous session cookie (same name AND path) with
// the authenticated value, then load a protected page to confirm.
export const LogInAsAdmin = {
    now: () =>
        Task.where('#actor logs in as an HR administrator',
            Navigate.to(LoginPage.url()),
            Cookie.set({ ...OrangeHrm.sessionCookie(), domain: APP_HOST, path: '/web' }),
            Navigate.to(webUrl('dashboard/index')),
            Wait.upTo(Duration.ofSeconds(15)).until(topBar, isVisible()),
        ),
};
