import {Buffer} from 'node:buffer';
import {readFileSync} from 'node:fs';
import {test} from 'supertape';
import putout, {print} from 'putout';
import {parseFilesystem} from '@putout/test/filesystem';
import * as applyBoxSizingToSizedElement from './index.js';

const ROOT = '/project';

const plugin = ['apply-box-sizing-to-sized-element', applyBoxSizingToSizedElement];

const fixture = (name) => readFileSync(new URL(`./fixture/${name}.css`, import.meta.url), 'utf8');

const sourceOf = (name, content) => print(parseFilesystem([
    '/',
    `${ROOT}/`,
    [`${ROOT}/${name}`, content],
]));

const run = (name, content, {fix = false} = {}) => putout(sourceOf(name, content), {
    ...fix && {
        fixCount: 1,
    },
    fix,
    plugins: [
        ['filesystem', plugin],
    ],
});

const scan = (name, content) => run(name, content).places;

const scanFixture = (name) => scan('main.css', fixture(name));

const contentOf = (source) => {
    const [, quoted] = /"content":\s*("(?:[^"\\]|\\.)*")/.exec(source);
    const value = JSON.parse(quoted);
    
    return /^[A-Za-z0-9+/=]+$/.test(value)
        ? Buffer
            .from(value, 'base64')
            .toString()
        : value;
};

test('putout-editor: apply-box-sizing-to-sized-element: report', (t) => {
    const result = scanFixture('width-and-padding')[0].message;
    const expected = 'content-box with a width and horizontal padding overflows its parent, add box-sizing: border-box';
    
    t.equal(result, expected);
    t.end();
});

test('putout-editor: apply-box-sizing-to-sized-element: report the longhand form', (t) => {
    const result = scanFixture('longhand-padding').length;
    const expected = 1;
    
    t.equal(result, expected);
    t.end();
});

test('putout-editor: apply-box-sizing-to-sized-element: report a one-value padding shorthand', (t) => {
    const result = scanFixture('single-value-padding').length;
    const expected = 1;
    
    t.equal(result, expected);
    t.end();
});

test('putout-editor: apply-box-sizing-to-sized-element: fix a one-value padding shorthand', (t) => {
    const {code} = run('main.css', fixture('single-value-padding'), {
        fix: true,
    });
    
    const result = contentOf(code);
    const expected = fixture('single-value-padding-fix');
    
    t.equal(result, expected);
    t.end();
});

test('putout-editor: apply-box-sizing-to-sized-element: no report for vertical padding only', (t) => {
    const result = scanFixture('vertical-padding-only').length;
    const expected = 0;
    
    t.equal(result, expected);
    t.end();
});

test('putout-editor: apply-box-sizing-to-sized-element: no report when box-sizing is declared', (t) => {
    const result = scanFixture('box-sizing-already-there').length;
    const expected = 0;
    
    t.equal(result, expected);
    t.end();
});

test('putout-editor: apply-box-sizing-to-sized-element: no report for content-box on purpose', (t) => {
    const result = scanFixture('box-sizing-content-box').length;
    const expected = 0;
    
    t.equal(result, expected);
    t.end();
});

test('putout-editor: apply-box-sizing-to-sized-element: no report for a width with no padding', (t) => {
    const result = scanFixture('width-only').length;
    const expected = 0;
    
    t.equal(result, expected);
    t.end();
});

test('putout-editor: apply-box-sizing-to-sized-element: no report when the width subtracts the padding itself', (t) => {
    const result = scanFixture('calc-subtracts-padding').length;
    const expected = 0;
    
    t.equal(result, expected);
    t.end();
});

test('putout-editor: apply-box-sizing-to-sized-element: report a functional width', (t) => {
    const result = scanFixture('function-width').length;
    const expected = 1;
    
    t.equal(result, expected);
    t.end();
});

test('putout-editor: apply-box-sizing-to-sized-element: no report for zero padding', (t) => {
    const result = scanFixture('zero-padding').length;
    const expected = 0;
    
    t.equal(result, expected);
    t.end();
});

test('putout-editor: apply-box-sizing-to-sized-element: no report for max-width', (t) => {
    const result = scanFixture('max-width-with-padding').length;
    const expected = 0;
    
    t.equal(result, expected);
    t.end();
});

test('putout-editor: apply-box-sizing-to-sized-element: no report for padding with no width', (t) => {
    const result = scanFixture('padding-only').length;
    const expected = 0;
    
    t.equal(result, expected);
    t.end();
});

test('putout-editor: apply-box-sizing-to-sized-element: no report in an empty file', (t) => {
    const result = scan('main.css', '').length;
    const expected = 0;
    
    t.equal(result, expected);
    t.end();
});

test('putout-editor: apply-box-sizing-to-sized-element: fix', (t) => {
    const {code} = run('main.css', fixture('width-and-padding'), {
        fix: true,
    });
    
    const result = contentOf(code);
    const expected = fixture('width-and-padding-fix');
    
    t.equal(result, expected);
    t.end();
});

test('putout-editor: apply-box-sizing-to-sized-element: fix the longhand form', (t) => {
    const {code} = run('main.css', fixture('longhand-padding'), {
        fix: true,
    });
    
    const result = contentOf(code);
    const expected = fixture('longhand-padding-fix');
    
    t.equal(result, expected);
    t.end();
});

test('putout-editor: apply-box-sizing-to-sized-element: fix leaves a clean file alone', (t) => {
    const {code} = run('main.css', fixture('width-only'), {
        fix: true,
    });
    
    const result = contentOf(code);
    const expected = fixture('width-only');
    
    t.equal(result, expected);
    t.end();
});

test('putout-editor: apply-box-sizing-to-sized-element: the fixed fixture is clean', (t) => {
    const result = scanFixture('width-and-padding-fix').length;
    const expected = 0;
    
    t.equal(result, expected);
    t.end();
});

test('putout-editor: apply-box-sizing-to-sized-element: two selectors are both fixed', (t) => {
    const {code} = run('main.css', fixture('two-selectors'), {
        fix: true,
    });
    
    const result = contentOf(code);
    const expected = fixture('two-selectors-fix');
    
    t.equal(result, expected);
    t.end();
});

test('putout-editor: apply-box-sizing-to-sized-element: one place per file', (t) => {
    const result = scanFixture('two-selectors').length;
    const expected = 1;
    
    t.equal(result, expected);
    t.end();
});
