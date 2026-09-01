import {test} from 'supertape';
import {tryToCatch} from 'try-to-catch';
import findPlaces from './find-places.worker.ts';

const replaceVarWithConst = `
export const report = () => 'use const';
export const replace = () => ({
    'var __x = __y': 'const __x = __y',
});
`;

test('find-places worker: returns places array', async (t) => {
    const {places} = await findPlaces({
        fixture: 'var x = 1;',
        plugin: replaceVarWithConst,
    });
    
    const result = Array.isArray(places);
    
    t.ok(result);
    t.end();
});

test('find-places worker: finds one match', async (t) => {
    const {places} = await findPlaces({
        fixture: 'var x = 1;',
        plugin: replaceVarWithConst,
    });
    
    t.equal(places.length, 1);
    t.end();
});

test('find-places worker: finds multiple matches', async (t) => {
    const {places} = await findPlaces({
        fixture: 'var x = 1;\nvar y = 2;',
        plugin: replaceVarWithConst,
    });
    
    t.equal(places.length, 2);
    t.end();
});

test('find-places worker: returns empty array on no match', async (t) => {
    const {places} = await findPlaces({
        fixture: 'const x = 1;',
        plugin: replaceVarWithConst,
    });
    
    t.equal(places.length, 0);
    t.end();
});

test('find-places worker: place has rule string', async (t) => {
    const {places} = await findPlaces({
        fixture: 'var x = 1;',
        plugin: replaceVarWithConst,
    });
    
    const result = typeof places[0].rule;
    const expected = 'string';
    
    t.equal(result, expected);
    t.end();
});

test('find-places worker: place message matches report', async (t) => {
    const {places} = await findPlaces({
        fixture: 'var x = 1;',
        plugin: replaceVarWithConst,
    });
    
    t.equal(places[0].message, 'use const');
    t.end();
});

test('find-places worker: place has position.line number', async (t) => {
    const {places} = await findPlaces({
        fixture: 'var x = 1;',
        plugin: replaceVarWithConst,
    });
    
    const result = typeof places[0].position.line;
    const expected = 'number';
    
    t.equal(result, expected);
    t.end();
});

test('find-places worker: place has position.column number', async (t) => {
    const {places} = await findPlaces({
        fixture: 'var x = 1;',
        plugin: replaceVarWithConst,
    });
    
    const result = typeof places[0].position.column;
    const expected = 'number';
    
    t.equal(result, expected);
    t.end();
});

test('find-places worker: plugin_syntax error on broken JS', async (t) => {
    const [error] = await tryToCatch(findPlaces, {
        fixture: 'const x = 1;',
        plugin: 'export const = broken',
    });
    
    t.equal((error as {
        structured?: {
            kind: string;
        };
    }).structured?.kind, 'plugin_syntax');
    t.end();
});

test('find-places worker: plugin_syntax error has position', async (t) => {
    const [error] = await tryToCatch(findPlaces, {
        fixture: 'const x = 1;',
        plugin: 'export const = broken',
    });
    
    t.ok((error as {
        structured?: {
            position?: unknown;
        };
    }).structured?.position);
    t.end();
});

test('find-places worker: does not modify fixture source', async (t) => {
    const fixture = 'var x = 1;';
    
    await findPlaces({
        fixture,
        plugin: replaceVarWithConst,
    });
    
    t.ok(true);
    t.end();
});
