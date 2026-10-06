import {test} from 'supertape';
import {runFind} from './find.ts';

const plugin = 'export const report = () => "use const";\nexport const replace = () => ({ "var __x = __y": "const __x = __y" });';

const withSource = (source: string) => ({
    source,
    plugin: '',
});

test('find: no source is an error', async (t) => {
    const result = await runFind(plugin, withSource(''));
    const expected = {
        type: 'error',
        message: 'No source. Use source first.',
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('find: no plugin is an error', async (t) => {
    const result = await runFind('', withSource('var a = 1;'));
    const expected = {
        type: 'error',
        message: 'No plugin. Put the plugin on the next line.',
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('find: returns the places', async (t) => {
    const result = await runFind(plugin, withSource('var a = 1;'));
    const expected = 'places';
    
    t.equal(result.type, expected);
    t.end();
});

test('find: a plugin matching nothing reports zero places, not an error', async (t) => {
    const result = await runFind(plugin, withSource('const a = 1;'));
    const expected = 0;
    
    t.equal(result.type === 'places' && result.data.length, expected);
    t.end();
});

test('find: a broken plugin is an error', async (t) => {
    const result = await runFind('export const = broken', withSource('var a = 1;'));
    const expected = 'error';
    
    t.equal(result.type, expected);
    t.end();
});
