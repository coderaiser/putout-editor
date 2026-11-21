import {
    mkdirSync,
    readFileSync,
    writeFileSync,
} from 'node:fs';
import process from 'node:process';
import {test} from 'supertape';
import {createSnapshot} from '@putout/editor-builder/snapshot';
import rootPackage from '../../../package.json' with {
    type: 'json',
};

const root = new URL('../../..', import.meta.url).pathname.replace(/\/$/, '');
const cacheBreaker = Number(readFileSync(new URL('../CACHE_BREAKER', import.meta.url), 'utf8'));

const options = {
    root,
    version: process.env.VERSION || rootPackage.version,
    cacheBreaker,
};

const setEnv = (name: string, value?: string) => {
    if (value) {
        process.env[name] = value;
        return;
    }
    
    delete process.env[name];
};

// The config reads these two. Other specs set them, so the spec sets them again.
const load = async (mode: string) => {
    const {NODE_ENV, API_HOST} = process.env;
    
    setEnv('NODE_ENV', mode);
    setEnv('API_HOST', '');
    
    try {
        const {default: config} = await import(`../rspack.config.js?${mode}`);
        
        return createSnapshot(config, options);
    } finally {
        setEnv('NODE_ENV', NODE_ENV);
        setEnv('API_HOST', API_HOST);
    }
};

const snapshots: Record<string, unknown> = {
    development: await load('development'),
    production: await load('production'),
};

// `UPDATE_SNAPSHOT=1` writes the fixtures. Use it only for a change that you want.
const expectedOf = (mode: string) => {
    const url = new URL(`./fixtures/rspack-${mode}.snapshot`, import.meta.url);
    
    if (process.env.UPDATE_SNAPSHOT) {
        mkdirSync(new URL('./fixtures/', import.meta.url), {
            recursive: true,
        });
        
        writeFileSync(url, JSON.stringify(snapshots[mode], null, 4) + '\n');
    }
    
    return JSON.parse(readFileSync(url, 'utf8'));
};

test('chat: config: development did not change', (t) => {
    const result = snapshots.development;
    const expected = expectedOf('development');
    
    t.deepEqual(result, expected);
    t.end();
});

test('chat: config: production did not change', (t) => {
    const result = snapshots.production;
    const expected = expectedOf('production');
    
    t.deepEqual(result, expected);
    t.end();
});
