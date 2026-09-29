import {createTest} from '@putout/test';
import putout from 'putout';
import * as removeComments from './index.js';

const test = createTest(import.meta.url, {
    plugins: [
        ['remove-comments', removeComments],
    ],
});

test('putout-editor: remove-comments: transform', (t) => {
    t.transform('remove-comments');
    t.end();
});

test('putout-editor: remove-comments: report', (t) => {
    t.report('remove-comments', 'A rule says what the code already says');
    t.end();
});

test('putout-editor: remove-comments: no report without a comment', (t) => {
    t.noReport('no-comments');
    t.end();
});

test('putout-editor: remove-comments: a comment above a function', (t) => {
    const result = '// a comment\nfunction f() {}\n';
    const {code} = putout(result, {
        fixCount: 1,
        plugins: [
            ['remove-comments', removeComments],
        ],
    });
    
    t.equal(code, 'function f() {}\n');
    t.end();
});

test('putout-editor: remove-comments: a comment inside a function', (t) => {
    const result = 'function f() {\n    // a comment\n    return 1;\n}\n';
    const {code} = putout(result, {
        fixCount: 1,
        plugins: [
            ['remove-comments', removeComments],
        ],
    });
    
    t.equal(code, 'function f() {\n    return 1;\n}\n');
    t.end();
});

test('putout-editor: remove-comments: a comment above a class', (t) => {
    const result = '// a comment\nclass A {}\n';
    const {code} = putout(result, {
        fixCount: 1,
        plugins: [
            ['remove-comments', removeComments],
        ],
    });
    
    t.equal(code, 'class A {}\n');
    t.end();
});
