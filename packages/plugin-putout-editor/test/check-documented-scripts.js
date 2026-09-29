import {createTest} from '@putout/test';
import * as putoutEditor from '../lib/index.js';

const test = createTest(import.meta.url, {
    rules: {
        'putout-editor/check-documented-scripts': 'on',
    },
    plugins: [
        ['putout-editor', putoutEditor],
    ],
});

test('plugin-putout-editor: check-documented-scripts: report', (t) => {
    t.report('check-documented-scripts', '☝️ AGENTS.md: documents scripts that do not exist: check');
    t.end();
});
