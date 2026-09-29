import {createTest} from '@putout/test';
import * as applyLinkedPatternValue from './index.js';

const test = createTest(import.meta.url, {
    plugins: [
        ['apply-linked-pattern-value', applyLinkedPatternValue],
    ],
});

test('putout-editor: apply-linked-pattern-value: transform', (t) => {
    t.transform('apply-linked-pattern-value');
    t.end();
});

test('putout-editor: apply-linked-pattern-value: report', (t) => {
    t.report('apply-linked-pattern-value', '☝️ f(__a__): __a__ binds nothing, so the pattern matches 0 places');
    t.end();
});

test('putout-editor: apply-linked-pattern-value: no report: linked values', (t) => {
    t.noReport('no-double');
    t.end();
});
