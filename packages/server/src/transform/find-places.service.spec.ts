import {test, stub} from 'supertape';
import {tryToCatch} from 'try-to-catch';
import {FindPlacesService} from './find-places.service.ts';

type PoolWithRun = {
    run: (...args: unknown[]) => Promise<unknown>;
};

function createServiceWithRun(run: unknown) {
    const service = new FindPlacesService();
    
    (service as unknown as {
        pool: PoolWithRun;
    }).pool = {
        run: run as () => Promise<unknown>,
    };
    
    return service;
}

test('find-places service: documentation returns PUT method', (t) => {
    const service = new FindPlacesService();
    
    t.equal(service.documentation().method, 'PUT');
    t.end();
});

test('find-places service: documentation url is /api/v1/find-places', (t) => {
    const service = new FindPlacesService();
    
    t.equal(service.documentation().url, '/api/v1/find-places');
    t.end();
});

test('find-places service: documentation has workflow string', (t) => {
    const service = new FindPlacesService();
    const result = typeof service.documentation().workflow;
    const expected = 'string';
    
    t.equal(result, expected);
    t.end();
});

test('find-places service: documentation has links.putoutScript', (t) => {
    const service = new FindPlacesService();
    
    t.ok(service.documentation().links.putoutScript);
    t.end();
});

test('find-places service: findPlaces returns places array', async (t) => {
    const run = stub().resolves({
        places: [{
            rule: 'rule',
            message: 'use const',
            position: {
                line: 1,
                column: 0,
            },
        }],
    });
    
    const service = createServiceWithRun(run);
    
    const result = await service.findPlaces({
        fixture: 'var x = 1;',
        plugin: '',
    });
    
    t.ok(Array.isArray(result.places));
    t.end();
});

test('find-places service: returns 400 on plugin_syntax error', async (t) => {
    const run = stub().rejects(Object.assign(Error('bad'), {
        structured: {
            kind: 'plugin_syntax',
            message: 'bad',
            position: {
                line: 1,
                column: 5,
            },
        },
    }));
    
    const service = createServiceWithRun(run);
    
    const [error] = await tryToCatch(service.findPlaces.bind(service), {
        fixture: 'x',
        plugin: '',
    });
    
    t.equal((error as {
        status?: number;
    }).status, 400);
    t.end();
});

test('find-places service: returns 422 on plugin_error', async (t) => {
    const run = stub().rejects(Object.assign(Error('runtime'), {
        structured: {
            kind: 'plugin_error',
            message: 'runtime',
        },
    }));
    
    const service = createServiceWithRun(run);
    
    const [error] = await tryToCatch(service.findPlaces.bind(service), {
        fixture: 'x',
        plugin: '',
    });
    
    t.equal((error as {
        status?: number;
    }).status, 422);
    t.end();
});

test('find-places service: returns structured body on error', async (t) => {
    const structured = {
        kind: 'plugin_syntax',
        message: 'bad',
        position: {
            line: 1,
            column: 5,
        },
    };
    
    const run = stub().rejects(Object.assign(Error('bad'), {
        structured,
    }));
    
    const service = createServiceWithRun(run);
    
    const [error] = await tryToCatch(service.findPlaces.bind(service), {
        fixture: 'x',
        plugin: '',
    });
    
    t.deepEqual((error as {
        response?: unknown;
    }).response, structured);
    t.end();
});

test('find-places service: returns 422 with plugin_error body on unstructured error', async (t) => {
    const run = stub().rejects(Error('boom'));
    const service = createServiceWithRun(run);
    
    const [error] = await tryToCatch(service.findPlaces.bind(service), {
        fixture: 'x',
        plugin: '',
    });
    
    t.equal((error as {
        status?: number;
    }).status, 422);
    t.end();
});

test('find-places service: returns plugin_error body on unstructured error', async (t) => {
    const run = stub().rejects(Error('boom'));
    const service = createServiceWithRun(run);
    
    const [error] = await tryToCatch(service.findPlaces.bind(service), {
        fixture: 'x',
        plugin: '',
    });
    
    t.deepEqual((error as {
        response?: unknown;
    }).response, {
        kind: 'plugin_error',
        message: 'boom',
    });
    t.end();
});

test('find-places service: constructing service does not spawn worker threads', (t) => {
    const service = new FindPlacesService();
    const {threads} = (service as unknown as {
        pool: {
            threads: readonly unknown[];
        };
    }).pool;
    
    t.equal(threads.length, 0);
    t.end();
});
