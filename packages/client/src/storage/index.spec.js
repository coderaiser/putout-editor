import {test} from 'supertape';
import {tryToCatch} from 'try-to-catch';
import StorageHandler from './index.js';

test('StorageHandler: fetchFromURL: empty hash returns null', async (t) => {
    const originalHash = globalThis.location.hash;
    const handler = new StorageHandler([]);
    
    globalThis.location.hash = '';
    const result = await handler.fetchFromURL();
    
    globalThis.location.hash = originalHash;
    
    t.notOk(result);
    t.end();
});

test('StorageHandler: fetchFromURL: root hash returns null', async (t) => {
    const originalHash = globalThis.location.hash;
    const handler = new StorageHandler([]);
    
    globalThis.location.hash = '#/';
    const result = await handler.fetchFromURL();
    
    globalThis.location.hash = originalHash;
    
    t.notOk(result);
    t.end();
});

test('StorageHandler: fetchFromURL: delegates to matching backend', async (t) => {
    const originalHash = globalThis.location.hash;
    const backend = {
        matchesURL() {
            return true;
        },
        fetchFromURL() {
            return Promise.resolve('snippet');
        },
    };
    
    const handler = new StorageHandler([backend]);
    
    globalThis.location.hash = '#/gist/someid';
    const result = await handler.fetchFromURL();
    
    globalThis.location.hash = originalHash;
    
    t.equal(result, 'snippet');
    t.end();
});

test('StorageHandler: fetchFromURL: rejects for unknown URL format', async (t) => {
    const originalHash = globalThis.location.hash;
    const handler = new StorageHandler([]);
    
    globalThis.location.hash = '#/unknown/format';
    const [error] = await tryToCatch(() => handler.fetchFromURL());
    
    globalThis.location.hash = originalHash;
    
    t.equal(error.message, 'Unknown URL format.');
    t.end();
});

test('StorageHandler: updateHash: sets location hash', (t) => {
    const originalHash = globalThis.location.hash;
    const revision = {
        getPath() {
            return '/gist/abc123';
        },
    };
    
    const handler = new StorageHandler([]);
    
    handler.updateHash(revision);
    
    globalThis.location.hash = originalHash;
    
    t.equal(globalThis.location.hash, '#/gist/abc123');
    t.end();
});

test('StorageHandler: create: delegates to first backend', async (t) => {
    const backend = {
        create() {
            return Promise.resolve('created');
        },
    };
    
    const handler = new StorageHandler([backend]);
    
    const result = await handler.create({
        code: 'x',
    });
    
    t.equal(result, 'created');
    t.end();
});

test('StorageHandler: update: delegates to first backend', async (t) => {
    const backend = {
        update() {
            return Promise.resolve('updated');
        },
    };
    
    const handler = new StorageHandler([backend]);
    
    const result = await handler.update('rev1', {
        code: 'y',
    });
    
    t.equal(result, 'updated');
    t.end();
});

test('StorageHandler: fork: delegates to first backend', async (t) => {
    const backend = {
        fork() {
            return Promise.resolve('forked');
        },
    };
    
    const handler = new StorageHandler([backend]);
    
    const result = await handler.fork('rev1', {
        code: 'z',
    });
    
    t.equal(result, 'forked');
    t.end();
});

test('StorageHandler: _owns: returns backend when found', (t) => {
    const revision = {
        id: 'r1',
    };
    
    const backend = {
        owns(rev) {
            return rev.id === 'r1';
        },
    };
    
    const handler = new StorageHandler([backend]);
    
    const result = handler._owns(revision);
    
    t.equal(result, backend);
    t.end();
});

test('StorageHandler: _owns: returns null when no backend owns revision', (t) => {
    const revision = {
        id: 'r1',
    };
    
    const backend = {
        owns() {
            return false;
        },
    };
    
    const handler = new StorageHandler([backend]);
    
    const result = handler._owns(revision);
    
    t.notOk(result);
    t.end();
});
