import {createTest} from '@putout/test';
import * as putoutEditor from '../lib/index.js';

const test = createTest(import.meta.url, {
    rules: {
        'putout-editor/remove-rgb-outside-token-file': 'on',
    },
    plugins: [
        ['putout-editor', putoutEditor],
    ],
});

test('plugin-putout-editor: remove-rgb-outside-token-file: report', (t) => {
    t.report('remove-rgb-outside-token-file', 'colours belong in tokens.css, reach for a var() instead');
    t.end();
});
