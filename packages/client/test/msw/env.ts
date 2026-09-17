/**
 * MSW harness environment.
 *
 * happy-dom (registered by @supertape/loader-dom) exposes `location` as
 * `about:blank`, which its own `URL` cannot use as a base. MSW resolves both
 * request and handler paths against `location.href`, so any relative request
 * (`api()` builds `/api/v1...` when `API_HOST` is empty) blows up with
 * `TypeError: Invalid URL`.
 *
 * Import this module **before** any `src/**` module in a spec: `api()` reads
 * `API_HOST` once at module scope, and MSW matches requests against the
 * resulting absolute URLs.
 */
export const API_HOST = 'http://localhost';

process.env.API_HOST = API_HOST;

export const apiURL = (path: string) => `${API_HOST}/api/v1${path}`;
