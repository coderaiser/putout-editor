import {test} from 'supertape';
import {
    handler,
    name,
    description,
    schema,
} from './transformer.ts';

const validPlugin = 'export const report = () => "use const";\nexport const replace = () => ({ "var __x = __y": "const __x = __y" });';

test('local transform: name is transform', (t) => {
    t.equal(name, 'transform');
    t.end();
});

test('local transform: description is a string', (t) => {
    const result = typeof description;
    const expected = 'string';
    
    t.equal(result, expected);
    t.end();
});

test('local transform: schema has fixture field', (t) => {
    t.ok('fixture' in schema);
    t.end();
});

test('local transform: schema has plugin field', (t) => {
    t.ok('plugin' in schema);
    t.end();
});

test('local transform: returns transformed code', async (t) => {
    const result = await handler({
        fixture: 'var x = 1;',
        plugin: validPlugin,
    });
    
    t.equal(result.content[0].text, 'const x = 1;');
    t.end();
});

test('local transform: returns error on invalid plugin', async (t) => {
    const result = await handler({
        fixture: 'var x = 1;',
        plugin: 'export const = broken',
    });
    
    t.ok(result.content[0].text.startsWith('Error:'));
    t.end();
});

test('local transform: returns error on invalid fixture', async (t) => {
    const result = await handler({
        fixture: '{{{{ broken',
        plugin: validPlugin,
    });
    
    t.ok(result.content[0].text.startsWith('Error:'));
    t.end();
});
