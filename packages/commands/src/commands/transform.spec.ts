import {test} from 'supertape';
import {runTransform} from './transform.ts';

const plugin = 'export const report = () => "use const";\nexport const replace = () => ({ "var __x = __y": "const __x = __y" });';

const withSource = (source: string) => ({
    source,
    plugin: '',
});

test('transform: no source is an error', async (t) => {
    const result = await runTransform(plugin, withSource(''));
    const expected = {
        type: 'error',
        message: 'No source. Use source first.',
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('transform: no plugin is an error', async (t) => {
    const result = await runTransform('', withSource('var a = 1;'));
    const expected = {
        type: 'error',
        message: 'No plugin. Put the plugin on the next line.',
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('transform: returns before and after', async (t) => {
    const result = await runTransform(plugin, withSource('var a = 1;'));
    const expected = 'var a = 1;';
    
    t.equal(result.type === 'transform' && result.before, expected);
    t.end();
});

test('transform: the after is the fixed source', async (t) => {
    const result = await runTransform(plugin, withSource('var a = 1;'));
    const expected = 'const a = 1;';
    
    t.equal(result.type === 'transform' && result.after, expected);
    t.end();
});

test('transform: a broken plugin is an error', async (t) => {
    const result = await runTransform('export const = broken', withSource('var a = 1;'));
    const expected = 'error';
    
    t.equal(result.type, expected);
    t.end();
});

test('transform: an unchanged transform returns both strings equal', async (t) => {
    const result = await runTransform(plugin, withSource('const a = 1;'));
    
    t.ok(result.type === 'transform' && result.before === result.after);
    t.end();
});
