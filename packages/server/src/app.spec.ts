import process from 'node:process';
import {Test} from '@nestjs/testing';
import {test} from 'supertape';
import {
    AppModule,
    getStaticModules,
    isAsset,
} from './app.module.ts';

test('application module: can compile', async (t) => {
    const module = await Test
        .createTestingModule({
            imports: [AppModule],
        })
        .compile();
    
    const app = module.createNestApplication();
    
    await app.init();
    
    await app.close();
    
    t.ok(app);
    t.end();
});

test('application module: a path naming a file is an asset, not a route', (t) => {
    const result = [
        '/chat.html',
        '/nope-xyz.js',
        '/chat/runtime-48359543fd44e134-26.js',
        '/app-a23c8c5743db5792-26.css',
        '/favicon.png',
    ].map(isAsset);
    
    const expected = [
        true,
        true,
        true,
        true,
        true,
    ];
    
    t.deepEqual(result, expected);
    t.end();
});

test('application module: a route is left to the static fallback', (t) => {
    const result = [
        '/',
        '/chat',
        '/chat/',
        '/some/route',
        '/api/v1/info',
        '/api/v1/gist/id/revision',
    ].map(isAsset);
    
    const expected: boolean[] = [
        false,
        false,
        false,
        false,
        false,
        false,
    ];
    
    t.deepEqual(result, expected);
    t.end();
});

test('application module: a query string does not hide the extension', (t) => {
    const result = [
        isAsset('/chat.html?v=2'),
        isAsset('/runtime-48359543fd44e134-26.js?cache=1'),
    ];
    
    const expected = [true, true];
    
    t.deepEqual(result, expected);
    t.end();
});

test('application module: getStaticModules returns empty when STATIC unset', (t) => {
    const prev = process.env.STATIC;
    
    delete process.env.STATIC;
    
    const result = getStaticModules();
    
    t.equal(result.length, 0);
    t.end();
    
    if (prev)
        process.env.STATIC = prev;
});

test('application module: getStaticModules returns modules when STATIC set', (t) => {
    const prev = process.env.STATIC;
    
    process.env.STATIC = '/tmp';
    
    const result = getStaticModules();
    
    t.equal(result.length, 1);
    t.end();
    
    if (prev) {
        process.env.STATIC = prev;
        return;
    }
    
    delete process.env.STATIC;
});
