import { By, PageElement } from '@serenity-js/web';

export const TopBar = {
    userName: PageElement.located(By.css('.oxd-userdropdown-name'))
        .describedAs('signed-in employee name'),
};
