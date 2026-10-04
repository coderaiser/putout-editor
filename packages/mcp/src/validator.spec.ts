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

/**
 * A rule the **runner** rejects, reported as an error rather than `ok`.
 *
 * This is the most expensive gap the mcp has: `validate` compiles the plugin and
 * stops there, so it answers `ok` for a rule that answers `Looks like 'fix' is not
 * a 'function' but 'undefined'` the moment a user runs it. A tool whose stated job
 * is "call this before `find_places`" is green on exactly the plugin that breaks
 * `find_places`, and the round trip costs the user the error.
 *
 * The check is deliberately the **shape** the loader requires rather than an
 * execution: `report` plus one of `find`, `scan`, `traverse`, `replace`,
 * `include`, `exclude`, `rules`, `declare`. Anything else never reaches a user's
 * AST, and an invariant with no safe automatic fix stays a message (see
 * `docs/issues/putout-plugins.md`).
 */
test('local validate: a rule with no fix and no find is not ok', (t) => {
    const result = handler({
        plugin: 'export const report = () => "x";',
    });
    
    const expected = 'ok';
    
    t.notEqual(result.content[0].text, expected);
    t.end();
});

test('local validate: names what is missing', (t) => {
    const result = handler({
        plugin: 'export const report = () => "x";',
    });
    
    // A **string** pattern rather than `/a|b|c/`: `tape/convert-match-regexp-to-string`
    // rejects a regexp here, and the alternative is seven separate assertions for
    // what is one property — that the message lists the shapes.
    const shapes = [
        'fix',
        'find',
        'traverse',
        'replace',
        'scan',
        'include',
        'declare',
    ];
    
    const missing = shapes.filter((shape) => !result.content[0].text.includes(shape));
    
    t.deepEqual(missing, []);
    t.end();
});

/**
 * The error names the *tool* to use next, because `validate`'s own description
 * tells a caller to run `find_places` and that is what a `report`-only rule will
 * fail in.
 */
test('local validate: the error points at find_places', (t) => {
    const result = handler({
        plugin: 'export const report = () => "x";',
    });
    
    t.match(result.content[0].text, /find_places/);
    t.end();
});

/**
 * …and each of the shapes the loader accepts is still `ok`.
 *
 * The check is a list, so it can be wrong in the direction of rejecting a working
 * rule, which would be worse than the gap: the user is told their traverser is
 * broken when it is fine. One per accepted key.
 */
test('local validate: every shape the loader accepts is still ok', (t) => {
    const shapes = [
        'export const report = () => "x";\nexport const find = () => [];',
        'export const report = () => "x";\nexport const replace = () => ({});',
        'export const report = () => "x";\nexport const fix = () => {};',
        'export const report = () => "x";\nexport const include = () => {};',
        'export const report = () => "x";\nexport const exclude = () => {};',
        'export const report = () => "x";\nexport const traverse = () => {};',
        'export const declare = () => {};',
    ];
    
    const wrong = shapes.filter((plugin) => handler({plugin}).content[0].text !== 'ok');
    
    const expected: string[] = [];
    
    t.deepEqual(wrong, expected);
    t.end();
});
