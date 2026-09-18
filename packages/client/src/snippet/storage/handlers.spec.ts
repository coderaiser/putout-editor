/**
 * Proves every handler in `test/msw/**` is alive.
 *
 * The specs that *use* the harness assert on `gist.ts` / `parse.ts` behaviour, so a typo in a
 * handler path (`/api/v1/gists`) would surface as a confusing failure in an unrelated spec.
 * Here each handler is exercised directly and its shaped response asserted.
 */
import {test} from 'supertape';
import '../../../test/msw/env.ts';
import {server} from '../../../test/msw/server.ts';
import {handlers} from '../../../test/msw/handlers/index.ts';
import {
    gistURL,
    gistIDURL,
    gistRevisionURL,
    makeGistHandlers,
    gistHandlers,
    gistErrorHandler,
} from '../../../test/msw/handlers/gist.ts';
import {
    parseURL,
    makeParseHandlers,
    parseHandlers,
    parseErrorHandler,
} from '../../../test/msw/handlers/parse.ts';
import {
    makeGistResponse,
    type GistResponse,
} from '../../../test/msw/fixtures/gist.ts';

const listen = () => server.listen({
    onUnhandledRequest: 'error',
});

test('msw handlers: gist URLs are under /api/v1', (t) => {
    const result = [
        gistURL,
        gistIDURL,
        gistRevisionURL,
        parseURL,
    ].every((url) => url.includes('/api/v1/'));
    
    t.ok(result);
    t.end();
});

test('msw handlers: index exports gist and parse handlers', (t) => {
    const expected = gistHandlers.length + parseHandlers.length;
    const result = handlers.length === expected;
    
    t.ok(result);
    t.end();
});

test('msw handlers: gist handler factory returns one handler per endpoint', (t) => {
    const result = makeGistHandlers().length === gistHandlers.length;
    
    t.ok(result);
    t.end();
});

test('msw handlers: gist GET returns the fixture', async (t) => {
    listen();
    server.use(...makeGistHandlers({
        id: 'handler-gist',
        version: 'handler-sha1',
    }));
    
    const response = await fetch(
        gistRevisionURL
            .replace(':id', 'handler-gist')
            .replace(':revision', 'handler-sha1'),
    );
    
    const {id} = await response.json() as GistResponse;
    
    server.close();
    
    t.equal(id, 'handler-gist');
    t.end();
});

test('msw handlers: gist POST /gist returns the fixture', async (t) => {
    listen();
    server.use(...makeGistHandlers({
        id: 'handler-created',
    }));
    
    const response = await fetch(gistURL, {
        method: 'POST',
    });
    
    const {id} = await response.json() as GistResponse;
    
    server.close();
    
    t.equal(id, 'handler-created');
    t.end();
});

test('msw handlers: gist PATCH /gist/:id returns the fixture', async (t) => {
    listen();
    server.use(...makeGistHandlers({
        id: 'handler-updated',
    }));
    
    const response = await fetch(gistIDURL.replace(':id', 'abc'), {
        method: 'PATCH',
    });
    
    const {id} = await response.json() as GistResponse;
    
    server.close();
    
    t.equal(id, 'handler-updated');
    t.end();
});

test('msw handlers: gist POST /gist/:id/:revision returns the fixture', async (t) => {
    listen();
    server.use(...makeGistHandlers({
        id: 'handler-forked',
    }));
    
    const response = await fetch(
        gistRevisionURL
            .replace(':id', 'abc')
            .replace(':revision', 'sha1'),
        {
            method: 'POST',
        },
    );
    
    const {id} = await response.json() as GistResponse;
    
    server.close();
    
    t.equal(id, 'handler-forked');
    t.end();
});

test('msw handlers: gist error handler returns the status', async (t) => {
    listen();
    server.use(...gistErrorHandler(404));
    
    const response = await fetch(
        gistRevisionURL
            .replace(':id', 'abc')
            .replace(':revision', 'sha1'),
    );
    
    server.close();
    
    t.equal(response.status, 404);
    t.end();
});

test('msw handlers: parse handler echoes the requested params', async (t) => {
    listen();
    server.use(...makeParseHandlers());
    
    const response = await fetch(
        parseURL
            .replace(':snippetId', 'abc')
            .replace(':revisionId', '3'),
    );
    
    const {snippetID, revisionID} = await response.json() as {
        snippetID: string;
        revisionID: string;
    };
    
    server.close();
    const result = `${snippetID}/${revisionID}`;
    const expected = 'abc/3';
    
    t.equal(result, expected);
    t.end();
});

test('msw handlers: parse error handler returns the status', async (t) => {
    listen();
    server.use(...parseErrorHandler(500));
    
    const response = await fetch(
        parseURL
            .replace(':snippetId', 'abc')
            .replace(':revisionId', '3'),
    );
    
    server.close();
    
    t.equal(response.status, 500);
    t.end();
});

test('msw fixtures: makeGistResponse default shape is a well-formed gist', (t) => {
    const {
        id,
        history,
        files,
    } = makeGistResponse();
    
    const result = Boolean(id && history.length && files['astexplorer.json'] && files['source.js']);
    
    t.ok(result);
    t.end();
});

test('msw fixtures: makeGistResponse v1 uses code.js', (t) => {
    const {files} = makeGistResponse({
        v: 1,
        code: 'legacy',
    });
    
    const result = files['code.js'].content === 'legacy' && !files['source.js'];
    
    t.ok(result);
    t.end();
});

test('msw fixtures: makeGistResponse can omit the config', (t) => {
    const {files} = makeGistResponse({
        noConfig: true,
    });
    
    t.notOk(files['astexplorer.json']);
    t.end();
});
