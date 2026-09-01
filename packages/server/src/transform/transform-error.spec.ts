import {test} from 'supertape';
import {createRequire} from 'node:module';
import {compilePlugin, structuredFromPutoutError} from './transform-error.ts';

const require = createRequire(import.meta.url);

test('transform-error: compilePlugin returns compiled rule on valid plugin', (t) => {
    const [error, compiled] = compilePlugin(
        "export const report = () => 'x'; export const replace = () => ({});",
        {require},
    );
    t.notOk(error);
    t.end();
});

test('transform-error: compilePlugin compiled has replace on valid plugin', (t) => {
    const [error, compiled] = compilePlugin(
        "export const report = () => 'x'; export const replace = () => ({});",
        {require},
    );
    t.ok(compiled?.replace);
    t.end();
});

test('transform-error: compilePlugin returns error on broken syntax', (t) => {
    const [error] = compilePlugin('export const = broken', {require});
    t.ok(error);
    t.end();
});

test('transform-error: compilePlugin error has structured.kind plugin_syntax', (t) => {
    const [error] = compilePlugin('export const = broken', {require});
    t.equal(error?.structured.kind, 'plugin_syntax');
    t.end();
});

test('transform-error: compilePlugin error has structured.message string', (t) => {
    const [error] = compilePlugin('export const = broken', {require});
    t.equal(typeof error?.structured.message, 'string');
    t.end();
});

test('transform-error: compilePlugin error has structured.position with line', (t) => {
    const [error] = compilePlugin('export const = broken', {require});
    t.equal(typeof error?.structured.position?.line, 'number');
    t.end();
});

test('transform-error: compilePlugin error has structured.position with column', (t) => {
    const [error] = compilePlugin('export const = broken', {require});
    t.equal(typeof error?.structured.position?.column, 'number');
    t.end();
});

test('transform-error: structuredFromPutoutError SyntaxError returns fixture_syntax', (t) => {
    const error = Object.assign(new SyntaxError('bad'), {loc: {line: 1, column: 5}});
    const result = structuredFromPutoutError(error);
    t.equal(result.kind, 'fixture_syntax');
    t.end();
});

test('transform-error: structuredFromPutoutError SyntaxError has position', (t) => {
    const error = Object.assign(new SyntaxError('bad'), {loc: {line: 1, column: 5}});
    const result = structuredFromPutoutError(error);
    t.deepEqual(result.position, {line: 1, column: 5});
    t.end();
});

test('transform-error: structuredFromPutoutError plain Error returns plugin_error', (t) => {
    const error = new Error('runtime crash');
    const result = structuredFromPutoutError(error);
    t.equal(result.kind, 'plugin_error');
    t.end();
});

test('transform-error: structuredFromPutoutError plain Error has no position', (t) => {
    const error = new Error('runtime crash');
    const result = structuredFromPutoutError(error);
    t.notOk(result.position);
    t.end();
});

test('transform-error: structuredFromPutoutError preserves message', (t) => {
    const error = new Error('something went wrong');
    const result = structuredFromPutoutError(error);
    t.equal(result.message, 'something went wrong');
    t.end();
});
