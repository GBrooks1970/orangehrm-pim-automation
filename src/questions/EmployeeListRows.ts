import { By, PageElements, Text } from '@serenity-js/web';
import { includes } from '@serenity-js/assertions';

// The employee list splits a name across separate first/middle/last cells, so a
// row "matches" a full name when its text contains both the first and last words.
// Returns the first matching row, so the presence assertions read naturally:
// `isPresent()` after an add, `not(isPresent())` after a delete.
export const EmployeeListRows = {
    matching: (name: string) => {
        const parts = name.trim().split(/\s+/);
        const first = parts[0];
        const last = parts[parts.length - 1];
        return PageElements.located(By.css('.oxd-table-body .oxd-table-row'))
            .where(Text, includes(first))
            .where(Text, includes(last))
            .first()
            .describedAs(`employee row matching "${name}"`);
    },
};
