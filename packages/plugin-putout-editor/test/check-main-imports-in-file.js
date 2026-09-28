import {createTest} from '@putout/test';
import * as putoutEditor from '../lib/index.js';

const test = createTest(import.meta.url, {
    rules: {
        'putout-editor/check-main-imports-in-file': 'on',
    },
    plugins: [
        ['putout-editor', putoutEditor],
    ],
});

test('plugin-putout-editor: check-main-imports-in-file: report', (t) => {
    t.report('check-main-imports-in-file-on', 'main.css is an entry point: @import only');
    t.end();
});

test('plugin-putout-editor: check-main-imports-in-file: no report: imports only', (t) => {
    t.noReport('check-main-imports-in-file');
    t.end();
});
