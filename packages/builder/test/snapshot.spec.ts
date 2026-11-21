import {test} from 'supertape';
import {createSnapshot} from '../lib/snapshot.js';

const options = {
    root: '/repo',
    version: '3.5.1',
    cacheBreaker: 7,
};

class Plugin {
    name = 'Plugin';
    constructor(public path: string) {}
}

test('builder: snapshot: RegExp becomes a string', (t) => {
    const result = createSnapshot({
        test: /\.tsx?$/,
    }, options);
    
    const expected = {
        test: '/\\.tsx?$/',
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('builder: snapshot: function becomes its source', (t) => {
    const chunks = (chunk: {
        name: string;
    }) => chunk.name === 'app';
    const result = createSnapshot({
        chunks,
    }, options);
    
    const expected = {
        chunks: String(chunks),
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('builder: snapshot: root path is masked', (t) => {
    const result = createSnapshot({
        path: '/repo/out',
    }, options);
    
    const expected = {
        path: '<root>/out',
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('builder: snapshot: hoisting does not change the snapshot', (t) => {
    const result = createSnapshot({
        top: '/repo/node_modules/url/',
        nested: '/repo/packages/chat/node_modules/url/',
    }, options);
    
    const expected = {
        top: '<modules>/url/',
        nested: '<modules>/url/',
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('builder: snapshot: version is masked', (t) => {
    const result = createSnapshot({
        version: '3.5.1',
    }, options);
    
    const expected = {
        version: '<version>',
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('builder: snapshot: cache breaker is masked', (t) => {
    const result = createSnapshot({
        filename: '[name]-[contenthash]-7.js',
    }, options);
    
    const expected = {
        filename: '[name]-[contenthash]-<cache>.js',
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('builder: snapshot: class instance keeps its class name', (t) => {
    const result = createSnapshot({
        item: new Plugin('/repo/a'),
    }, options);
    
    const expected = {
        item: {
            $class: 'Plugin',
            name: 'Plugin',
            path: '<root>/a',
        },
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('builder: snapshot: plugins are sorted: the order does not matter', (t) => {
    const result = createSnapshot({
        plugins: ['b', 'a'],
    }, options);
    
    const expected = {
        plugins: ['a', 'b'],
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('builder: snapshot: a cycle does not stop the snapshot', (t) => {
    const node: {
        self?: unknown;
    } = {};
    
    node.self = node;
    
    const result = createSnapshot({
        node,
    }, options);
    
    const expected = {
        node: {
            self: '<cycle>',
        },
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('builder: snapshot: a config without plugins', (t) => {
    const result = createSnapshot({
        mode: 'production',
    }, options);
    
    const expected = {
        mode: 'production',
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('builder: snapshot: an object without a prototype', (t) => {
    const bare = Object.create(null);
    
    bare.a = 1;
    
    const result = createSnapshot({
        bare,
    }, options);
    
    const expected = {
        bare: {
            a: 1,
        },
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('builder: snapshot: null and an array keep their shape', (t) => {
    const result = createSnapshot({
        empty: null,
        list: [1, /a/],
    }, options);
    
    const expected = {
        empty: null,
        list: [1, '/a/'],
    };
    
    t.deepEqual(result, expected);
    t.end();
});
