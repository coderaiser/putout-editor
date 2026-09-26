import {test} from 'supertape';
import {
    handler,
    name,
    description,
    schema,
} from './validator.ts';

const validPlugin = 'export const report = () => "use const";\nexport const replace = () => ({ "var __x = __y": "const __x = __y" });';

test('local validate: name is validate', (t) => {
    t.equal(name, 'validate');
    t.end();
});

test('local validate: description is a string', (t) => {
    const result = typeof description;
    const expected = 'string';
    
    t.equal(result, expected);
    t.end();
});

test('local validate: schema has plugin field', (t) => {
    t.ok('plugin' in schema.shape);
    t.end();
});

test('local validate: returns ok for valid plugin', (t) => {
    const result = handler({
        plugin: validPlugin,
    });
    
    t.equal(result.content[0].text, 'ok');
    t.end();
});

test('local validate: returns error message for syntax error', (t) => {
    const result = handler({
        plugin: 'export const = broken',
    });
    
    t.ok(result.content[0].text.startsWith('plugin_syntax'));
    t.end();
});

test('local validate: error includes line and column', (t) => {
    const result = handler({
        plugin: 'export const = broken',
    });
    
    t.match(result.content[0].text, /line \d+, col \d+/);
    t.end();
});

test('local validate: does not prefix the error with "Error:"', (t) => {
    const result = handler({
        plugin: 'export const = broken',
    });
    
    t.notOk(result.content[0].text.startsWith('Error:'));
    t.end();
});

test('local validate: returns ok for a traverse plugin', (t) => {
    const result = handler({
        plugin: 'export const report = () => "remove debugger";\nexport const fix = (path) => path.remove();',
    });
    
    t.equal(result.content[0].text, 'ok');
    t.end();
});
