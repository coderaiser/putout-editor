import {setupServer} from 'msw/node';
import {http, HttpResponse} from 'msw';
import {handlers} from './handlers/index.ts';

/**
 * A CORS preflight answer, and it is load-bearing.
 *
 * happy-dom's `fetch` treats every request as cross-origin — the page is
 * `about:blank` and the API is `http://localhost` — so it sends an **`OPTIONS`
 * preflight** before the real one. msw **v3** routes that preflight through the
 * same interceptor, finds no handler for it (every handler here is a
 * `http.get`), reports `intercepted a request without a matching request
 * handler: OPTIONS …`, and lets it fall through to the network. The preflight
 * then fails and the **real** request fails with it.
 *
 * Measured, both directions, on `msw@3.0.2`:
 *
 * | handlers | result |
 * |---|---|
 * | the fixture handlers only | `NetworkError` — `ECONNREFUSED 127.0.0.1:80` |
 * | plus this one | `{"snippetID":"abc123",…}` |
 *
 * `msw@2.15.0` did not need it, which is why the `^3.0.2` bump — a one-line
 * `package.json` change with no code — took **57 tests** red.
 *
 * `'*'` because a preflight is not addressed to an API path: it carries no
 * resource path and its `Access-Control-Request-Method` is what identifies it.
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
 * The one place the unhandled-request policy is written.
 *
 * msw **v3** renamed the option: `onUnhandledRequest` became `onUnhandledFrame`,
 * and `UnhandledRequestStrategy` became `UnhandledFrameStrategy` — the three
 * strings are unchanged. It was renamed for a reason that also matters here:
 * it is no longer only about requests, it covers WebSocket frames too, and
 * `onUnhandledFrame` also accepts a **callback**,
 * `{onUnhandledFrame({frame, defaults}) { defaults.warn() }}`.
 *
 * Ten copies of this option is ten places for the next rename to break, so the
 * specs call this instead. `'error'` is kept deliberately: a request with no
 * handler should fail the spec rather than reach the network.
 */
export const listen = () => server.listen({
    onUnhandledFrame: 'error',
});
