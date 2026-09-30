import {createTest} from '@putout/test';
import * as hoistArrowCallback from './index.js';

const test = createTest(import.meta.url, {
    plugins: [
        ['hoist-arrow-callback', hoistArrowCallback],
    ],
});

test('putout-editor: hoist-arrow-callback: report', (t) => {
    t.report('hoist-arrow-callback', 'Move the arrow callback to a top level declaration');
    t.end();
});

test('putout-editor: hoist-arrow-callback: no report: already hoisted', (t) => {
    t.noReport('named-callback');
    t.end();
});

test('putout-editor: hoist-arrow-callback: no report: a block body', (t) => {
    t.noReport('block-callback');
    t.end();
});

test('putout-editor: hoist-arrow-callback: no report: a destructured parameter', (t) => {
    t.noReport('destructured-param');
    t.end();
});
