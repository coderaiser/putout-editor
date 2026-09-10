import {test} from 'supertape';
import {
    handler,
    name,
    description,
    schema,
} from './finder.ts';

const validPlugin = 'export const report = () => "use const";\nexport const replace = () => ({ "var __x = __y": "const __x = __y" });';

test('local find-places: name is find_places', (t) => {
    t.equal(name, 'find_places');
    t.end();
});

test('local find-places: description is a string', (t) => {
    const result = typeof description;
    const expected = 'string';
    
    t.equal(result, expected);
    t.end();
});

test('local find-places: schema has fixture field', (t) => {
    t.ok('fixture' in schema);
    t.end();
});

test('local find-places: schema has plugin field', (t) => {
    t.ok('plugin' in schema);
    t.end();
});

test('local find-places: returns places for valid plugin', async (t) => {
    const result = await handler({
        fixture: 'var x = 1;',
        plugin: validPlugin,
    });
    
    const parsed = JSON.parse(result.content[0].text);
    
    t.equal(parsed.places[0].rule, 'rule');
    t.end();
});

test('local find-places: returns error on invalid plugin', async (t) => {
    const result = await handler({
        fixture: 'var x = 1;',
        plugin: 'export const = broken',
    });
    
    t.ok(result.content[0].text.startsWith('Error:'));
    t.end();
});

test('local find-places: returns error on invalid fixture', async (t) => {
    const result = await handler({
        fixture: '{{{{ broken',
        plugin: validPlugin,
    });
    
    t.ok(result.content[0].text.startsWith('Error:'));
    t.end();
});
