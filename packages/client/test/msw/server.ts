import {setupServer} from 'msw/node';
import {http, HttpResponse} from 'msw';
import {handlers} from './handlers/index.ts';

/**
 * Answer the CORS preflight. happy-dom sends an `OPTIONS` request first, and
 * msw 3 has no handler for it, so the real request fails with
 * `ECONNREFUSED`. `'*'`: a preflight has no API path.
 */
const preflight = http.options('*', () => new HttpResponse(null, {
    status: 204,
    headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': '*',
        'Access-Control-Allow-Headers': '*',
    },
}));

export const server = setupServer(preflight, ...handlers);

/**
 * The unhandled-request policy, in one place. msw 3 calls the option
 * `onUnhandledFrame`. `'error'`: a request with no handler fails the spec.
 */
export const listen = () => server.listen({
    onUnhandledFrame: 'error',
});
