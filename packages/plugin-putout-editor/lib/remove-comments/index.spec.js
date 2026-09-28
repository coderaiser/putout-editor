import {createTest} from '@putout/test';
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
