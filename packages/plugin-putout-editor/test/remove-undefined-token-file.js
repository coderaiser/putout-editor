import {createTest} from '@putout/test';
import * as putoutEditor from '../lib/index.js';

const test = createTest(import.meta.url, {
    rules: {
        'putout-editor/remove-undefined-token-file': 'on',
    },
    plugins: [
        ['putout-editor', putoutEditor],
    ],
});

test('plugin-putout-editor: remove-undefined-token-file: report', (t) => {
    t.report('remove-undefined-token-file', '☝️ /css/main.css: not in tokens.css: --color-missing');
    t.end();
});
