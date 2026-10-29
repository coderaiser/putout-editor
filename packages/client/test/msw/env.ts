/**
 * MSW environment. happy-dom has `location` `about:blank`, which is not a
 * base URL. Import this module before any `src/**` module: `api()` reads
 * `API_HOST` once on load.
 */
export const API_HOST = 'http://localhost';

process.env.API_HOST = API_HOST;

export const apiURL = (path: string) => `${API_HOST}/api/v1${path}`;
