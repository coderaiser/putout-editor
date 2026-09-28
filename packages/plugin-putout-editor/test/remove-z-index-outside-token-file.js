import {createTest} from '@putout/test';
import * as putoutEditor from '../lib/index.js';

const test = createTest(import.meta.url, {
    rules: {
        'putout-editor/remove-z-index-outside-token-file': 'on',
    },
    plugins: [
        ['putout-editor', putoutEditor],
    ],
});

test('plugin-putout-editor: remove-z-index-outside-token-file: report', (t) => {
    t.report('remove-z-index-outside-token-file', 'z-index belongs in tokens.css, reach for a var() instead');
    t.end();
});
