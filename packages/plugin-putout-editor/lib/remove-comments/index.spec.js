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
    t.reportCode(`// a comment\nconst a = 1;`, 'A rule says what the code already says');
    t.end();
});
