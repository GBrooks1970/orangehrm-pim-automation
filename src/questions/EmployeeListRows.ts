import { By, PageElement } from '@serenity-js/web';

const xpathLiteral = (value: string): string => value.includes("'")
    ? `concat('${value.split("'").join(`', "'", '`)}')`
    : `'${value}'`;

// The employee list splits a name across separate first/middle/last cells, so a
// row "matches" a full name when its text contains both the first and last words.
// Returns the first matching row, so the presence assertions read naturally:
// `isPresent()` after an add, `not(isPresent())` after a delete.
export const EmployeeListRows = {
    matching: (name: string) => {
        const parts = name.trim().split(/\s+/);
        const first = parts[0];
        const last = parts[parts.length - 1];
        // Resolve the match in the browser on every poll. Filtering a captured
        // list with per-row Text reads races a refresh that removes those rows:
        // a stale indexed read can consume the entire outer wait budget.
        return PageElement.located(By.xpath(
            `(//div[contains(concat(' ', normalize-space(@class), ' '), ' oxd-table-body ')]` +
            `//div[contains(concat(' ', normalize-space(@class), ' '), ' oxd-table-row ')` +
            ` and contains(., ${xpathLiteral(first)}) and contains(., ${xpathLiteral(last)})])[1]`,
        ))
            .describedAs(`employee row matching "${name}"`);
    },
};
