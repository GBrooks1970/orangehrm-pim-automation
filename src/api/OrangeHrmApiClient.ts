import { BASE_URL, webUrl } from '../serenity.config';

/**
 * Thin client over OrangeHRM's session-authenticated REST API v2, used to
 * establish test preconditions through the API rather than the UI ("API setup,
 * UI assertion" — ADR-0003).
 *
 * Auth: the Open Source edition has NO static bearer token. The REST API v2
 * authorises with the logged-in admin *session cookie*, so {@link authenticate}
 * performs the login exchange once per run (called from the BeforeAll hook):
 *
 *   1. GET the login page to obtain a session cookie and the CSRF `_token`.
 *   2. POST those plus the credentials to `auth/validate`, which establishes the
 *      authenticated session on that cookie.
 *
 * The resulting cookie is reused two ways: as the `Cookie` header on API seed
 * calls, and injected into the browser so scenarios start logged in without
 * re-driving the login form (see {@link sessionCookie} and LogInAsAdmin).
 *
 * Credentials default to the demo-parity `Admin` / `admin123` only against a
 * localhost target; any other host must supply ORANGEHRM_ADMIN_USERNAME /
 * ORANGEHRM_ADMIN_PASSWORD rather than probe a real instance with known defaults.
 */

export interface NewEmployee {
    firstName: string;
    lastName: string;
    middleName?: string;
    /** Optional explicit Employee Id; when omitted OrangeHRM auto-assigns one. */
    employeeId?: string;
}

export interface SeededEmployee {
    empNumber: number;
    employeeId: string;
    firstName: string;
    lastName: string;
}

interface Cookie { name: string; value: string }

let session: Cookie | undefined;

const targetIsLocalhost = (): boolean => {
    try {
        const host = new URL(BASE_URL).hostname.toLowerCase();
        return host === 'localhost' || host === '127.0.0.1' || host === '::1' || host === '[::1]';
    } catch {
        return false;
    }
};

/** Parse the cookies set across one or more `set-cookie` header lines. */
const parseSetCookies = (header: string | null): Cookie[] => {
    if (!header) return [];
    // Node's fetch joins multiple Set-Cookie headers with ", " — split on the
    // boundary before a `name=` pair, not on the commas inside `Expires=`.
    return header.split(/,(?=\s*[^=;,\s]+=)/).map(part => {
        const [pair] = part.trim().split(';');
        const eq = pair.indexOf('=');
        return { name: pair.slice(0, eq).trim(), value: pair.slice(eq + 1).trim() };
    }).filter(c => c.name.length > 0);
};

export const OrangeHrm = {
    /**
     * Resolve and cache the admin session for the run. Call once in BeforeAll
     * before any API task executes or any scenario logs the browser in.
     */
    authenticate: async (): Promise<void> => {
        if (session) return;

        const username = process.env.ORANGEHRM_ADMIN_USERNAME
            ?? (targetIsLocalhost() ? 'Admin' : undefined);
        const password = process.env.ORANGEHRM_ADMIN_PASSWORD
            ?? (targetIsLocalhost() ? 'admin123' : undefined);
        if (!username || !password) {
            throw new Error(
                `Refusing to authenticate against a non-localhost target (${BASE_URL}) ` +
                `with default credentials. Set ORANGEHRM_ADMIN_USERNAME and ` +
                `ORANGEHRM_ADMIN_PASSWORD for this instance. The Admin/admin123 defaults ` +
                `apply only to the local Docker test target.`,
            );
        }

        // 1. GET the login page: capture the initial session cookie and the
        //    CSRF `_token` the validate endpoint requires.
        const loginPage = await fetch(webUrl('auth/login'), { redirect: 'manual' });
        let cookie = parseSetCookies(loginPage.headers.get('set-cookie'))
            .find(c => /orangehrm/i.test(c.name));
        const html = await loginPage.text();
        const token = /name="_token"\s+value="([^"]+)"/.exec(html)?.[1]
            ?? /:token="&quot;([^&]+)&quot;"/.exec(html)?.[1];
        if (!cookie || !token) {
            throw new Error(
                `Could not begin the OrangeHRM login exchange (cookie=${!!cookie}, ` +
                `token=${!!token}). Is the app installed and reachable at ${BASE_URL}?`,
            );
        }

        // 2. POST credentials + token on that cookie to establish the session.
        const form = new URLSearchParams({ _token: token, username, password });
        const validate = await fetch(webUrl('auth/validate'), {
            method: 'POST',
            redirect: 'manual',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Cookie: `${cookie.name}=${cookie.value}`,
            },
            body: form.toString(),
        });
        // The validate response usually rotates the session cookie (session
        // fixation defence); adopt the new one when present.
        const rotated = parseSetCookies(validate.headers.get('set-cookie'))
            .find(c => /orangehrm/i.test(c.name));
        if (rotated) cookie = rotated;

        // A successful login redirects to the dashboard; a failure re-renders the
        // login page (still 302, but back to auth/login).
        const location = validate.headers.get('location') ?? '';
        if (/auth\/login/i.test(location)) {
            throw new Error(`OrangeHRM login was rejected for user "${username}" (redirected back to the login page).`);
        }
        session = cookie;
    },

    /** The admin session cookie resolved by {@link authenticate}. */
    sessionCookie: (): Cookie => {
        if (!session) {
            throw new Error(
                'OrangeHrm.authenticate() must run before the session cookie is read ' +
                '(it is called in the BeforeAll hook in src/hooks/browser.hooks.ts).',
            );
        }
        return session;
    },

    /**
     * Seed an employee through REST API v2 and return the persisted identity.
     * Backs the `an employee exists` Background steps (ADR-0003).
     */
    createEmployee: async (employee: NewEmployee): Promise<SeededEmployee> => {
        const cookie = OrangeHrm.sessionCookie();
        const body: Record<string, unknown> = {
            firstName: employee.firstName,
            middleName: employee.middleName ?? '',
            lastName: employee.lastName,
            empPicture: null,
        };
        if (employee.employeeId !== undefined) body.employeeId = employee.employeeId;

        const response = await fetch(webUrl('api/v2/pim/employees'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Cookie: `${cookie.name}=${cookie.value}`,
            },
            body: JSON.stringify(body),
        });
        if (!response.ok) {
            throw new Error(
                `Failed to seed employee "${employee.firstName} ${employee.lastName}" ` +
                `via REST API v2 (HTTP ${response.status}): ${await response.text()}`,
            );
        }
        const { data } = (await response.json()) as { data: SeededEmployee };
        return data;
    },

    /**
     * Ensure exactly one employee with the given name exists — the precondition
     * for the management scenarios. Idempotent: a scenario's Background runs once
     * per scenario, so creating unconditionally would pile up duplicate "Odis
     * Adalwin" rows across the feature (breaking the delete assertion and pushing
     * row actions below the fold). Looks the employee up first and only creates one
     * when absent.
     */
    ensureEmployeeExists: async (firstName: string, lastName: string): Promise<void> => {
        const cookie = OrangeHrm.sessionCookie();
        const query = encodeURIComponent(`${firstName} ${lastName}`);
        const lookup = await fetch(webUrl(`api/v2/pim/employees?nameOrId=${query}&limit=50`), {
            headers: { Cookie: `${cookie.name}=${cookie.value}` },
        });
        if (lookup.ok) {
            const { data } = (await lookup.json()) as { data: SeededEmployee[] };
            const exists = data.some(e =>
                e.firstName?.toLowerCase() === firstName.toLowerCase() &&
                e.lastName?.toLowerCase() === lastName.toLowerCase());
            if (exists) return;
        }
        await OrangeHrm.createEmployee({ firstName, lastName });
    },

    /**
     * Ensure an employee with the given Employee Id exists — the precondition for
     * the duplicate-id validation scenario. Idempotent: the id may already be taken
     * (the seeded admin holds `0001`), which equally satisfies "an employee with
     * this id exists", so a uniqueness conflict is treated as success rather than
     * an error.
     */
    ensureEmployeeWithId: async (employeeId: string, firstName: string, lastName: string): Promise<void> => {
        const cookie = OrangeHrm.sessionCookie();
        const response = await fetch(webUrl('api/v2/pim/employees'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Cookie: `${cookie.name}=${cookie.value}`,
            },
            body: JSON.stringify({ firstName, middleName: '', lastName, employeeId, empPicture: null }),
        });
        if (response.ok) return;

        const detail = await response.text();
        // A uniqueness clash means the id is already present — precondition met.
        if (response.status === 422 || /unique|already|exist/i.test(detail)) return;
        throw new Error(
            `Failed to ensure an employee with Employee Id "${employeeId}" exists ` +
            `(HTTP ${response.status}): ${detail}`,
        );
    },
};
