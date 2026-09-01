import {test, stub} from 'supertape';
import {tryToCatch} from 'try-to-catch';
import {TransformService} from './transform.service.ts';

type PoolWithRun = {
    run: (...args: unknown[]) => Promise<unknown>;
};

function stubPool(service: TransformService, run: unknown) {
    (service as unknown as {
        pool: PoolWithRun;
    }).pool = {
        run: run as (...args: unknown[]) => Promise<unknown>,
    };
}

function createServiceWithRun(run: unknown) {
    const service = new TransformService();
    stubPool(service, run);
    
    return service;
}

test('transform service: documentation returns object with method PUT', (t) => {
    const service = new TransformService();
    const result = service.documentation();
    
    t.equal(result.method, 'PUT');
    t.end();
});

test('transform service: documentation returns correct url', (t) => {
    const service = new TransformService();
    const result = service.documentation();
    
    t.equal(result.url, '/api/v1/transform');
    t.end();
});

test('transform service: documentation returns putout link', (t) => {
    const service = new TransformService();
    const result = service.documentation();
    
    t.match(result.links.putout, 'putout');
    t.end();
});

test('transform service: documentation returns examples array', (t) => {
    const service = new TransformService();
    const result = service.documentation();
    
    t.ok(Array.isArray(result.examples));
    t.end();
});

test('transform service: documentation examples are non-empty', (t) => {
    const service = new TransformService();
    const result = service.documentation();
    
    t.ok(result.examples.length > 0);
    t.end();
});

test('transform service: transform applies replace rule to fixture', async (t) => {
    const run = stub().resolves({
        code: 'const x = 1;',
    });
    
    const service = createServiceWithRun(run);
    
    const result = await service.transform({
        fixture: 'var x = 1;',
        plugin: 'export const replace = () => ({ \'var __a\': \'const __a\' });',
    });
    
    t.equal(result, 'const x = 1;');
    t.end();
});

test('transform service: transform throws HttpException 422 for invalid plugin', async (t) => {
    const run = stub().rejects(Error('boom'));
    const service = createServiceWithRun(run);
    
    const [error] = await tryToCatch(service.transform.bind(service), {
        fixture: 'const x = 1;',
        plugin: 'export const = broken',
    });
    
    t.equal((error as Error & {
        status: number;
    }).status, 422);
    t.end();
});

test('transform service: transform throws HttpException 422 for plugin runtime error', async (t) => {
    const run = stub().rejects(Error('boom'));
    const service = createServiceWithRun(run);
    
    const [error] = await tryToCatch(service.transform.bind(service), {
        fixture: 'const x = 1;',
        plugin: 'export const report = () => \'boom\'; export const replace = () => () => {};',
    });
    
    t.equal((error as Error & {
        status: number;
    }).status, 422);
    t.end();
});

test('transform service: returns 400 when plugin has syntax error', async (t) => {
    const run = stub().rejects(Object.assign(Error('bad syntax'), {
        structured: {
            kind: 'plugin_syntax',
            message: 'bad syntax',
            position: {
                line: 1,
                column: 5,
            },
        },
    }));
    
    const service = createServiceWithRun(run);
    
    const [error] = await tryToCatch(service.transform.bind(service), {
        fixture: 'const x = 1;',
        plugin: 'export const = broken',
    });
    
    t.equal((error as {
        status?: number;
    }).status, 400);
    t.end();
});

test('transform service: returns 422 when plugin_error', async (t) => {
    const run = stub().rejects(Object.assign(Error('runtime'), {
        structured: {
            kind: 'plugin_error',
            message: 'runtime',
        },
    }));
    
    const service = createServiceWithRun(run);
    
    const [error] = await tryToCatch(service.transform.bind(service), {
        fixture: 'const x = 1;',
        plugin: 'export const replace = () => ({});',
    });
    
    t.equal((error as {
        status?: number;
    }).status, 422);
    t.end();
});

test('transform service: returns structured body on error', async (t) => {
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
    
    const [error] = await tryToCatch(service.transform.bind(service), {
        fixture: 'const x = 1;',
        plugin: 'export const = broken',
    });
    
    t.deepEqual((error as {
        response?: unknown;
    }).response, structured);
    t.end();
});
