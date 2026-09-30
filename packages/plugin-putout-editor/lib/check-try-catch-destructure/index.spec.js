import {createTest} from '@putout/test';
import * as checkTryCatchDestructure from './index.js';

const test = createTest(import.meta.url, {
    plugins: [
        ['check-try-catch-destructure', checkTryCatchDestructure],
    ],
});

test('putout-editor: check-try-catch-destructure: report', (t) => {
    t.report('check-try-catch-destructure', 'Bind the result first: tryCatch returns a shorter array when it catches');
    t.end();
});

test('putout-editor: check-try-catch-destructure: no report: bind first', (t) => {
    t.noReport('try-catch-destructure');
    t.end();
});

test('putout-editor: check-try-catch-destructure: report: no default in the object', (t) => {
    t.report('no-default', 'Bind the result first: tryCatch returns a shorter array when it catches');
    t.end();
});
